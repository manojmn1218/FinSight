import mongoose from 'mongoose';
import { UserModel } from '../models/User';
import { TransactionModel } from '../models/Transaction';
import { GoalModel } from '../models/Goal';
import { AssetModel } from '../models/Asset';
import { PaymentModel } from '../models/Payment';
import { localDb } from '../storage/localDb';
import type { UserDocument, TransactionDocument, GoalDocument, PortfolioAssetDocument, PaymentDocument } from '../types';
import { getErrorMessage } from '../utils/helpers';

let isMongoConnected = false;
let mongoConnectionError: string | null = null;

export async function initDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('📌 [Database] No MONGODB_URI configured in .env');
    console.log('💾 [Database] Using Local Persistent Database at server/data/finsight_db.json');
    console.log('💡 [Database] To connect MongoDB Atlas, set MONGODB_URI=mongodb+srv://... in your .env file');
    return;
  }

  try {
    console.log('🔄 [Database] Connecting to MongoDB...');

    mongoose.connection.on('disconnected', () => {
      isMongoConnected = false;
      console.warn('⚠️ [Database] MongoDB disconnected. Falling back to Local Persistent Storage.');
    });
    mongoose.connection.on('reconnected', () => {
      isMongoConnected = true;
      console.log('✅ [Database] MongoDB reconnected.');
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    mongoConnectionError = null;
    console.log('✅ [Database] Successfully connected to MongoDB!');

    // Enforce sole administrator (finsight27@gmail.com)
    const adminEmail = (process.env.ADMIN_EMAIL || 'finsight27@gmail.com').trim().toLowerCase();

    // 1. Demote any other accounts who might have had isAdmin = true
    await UserModel.updateMany(
      { email: { $ne: adminEmail }, isAdmin: true },
      { $set: { isAdmin: false } }
    );

    // 2. Ensure finsight27@gmail.com has isAdmin = true
    const adminUser = await UserModel.findOne({ email: adminEmail });
    if (adminUser) {
      if (!adminUser.isAdmin) {
        await UserModel.updateOne({ email: adminEmail }, { $set: { isAdmin: true } });
        console.log(`👑 [Database] Assigned exclusive administrator status to ${adminEmail}`);
      }
    } else {
      // Seed admin if not yet registered
      await UserModel.create({
        email: adminEmail,
        name: 'System Administrator',
        passwordHash: '',
        monthlyIncome: 0,
        totalBalance: 0,
        expenses: [
          { name: 'Rent', amount: 0, color: '#a78bfa' },
          { name: 'Food', amount: 0, color: '#f472b6' },
          { name: 'Transport', amount: 0, color: '#60a5fa' },
          { name: 'Utilities', amount: 0, color: '#34d399' },
          { name: 'Entertainment', amount: 0, color: '#fbbf24' },
          { name: 'Other', amount: 0, color: '#94a3b8' },
        ],
        savingsPercent: 20,
        isOnboarded: false,
        isAdmin: true,
        currentPlan: 'Elite',
        statementUploaded: false,
        statementUploadsCount: 0,
      });
      console.log(`👑 [Database] Seeded exclusive administrator (${adminEmail}) into MongoDB`);
    }
  } catch (error: unknown) {
    isMongoConnected = false;
    mongoConnectionError = getErrorMessage(error, 'Connection failed');
    console.warn(`⚠️ [Database] MongoDB connection failed: ${mongoConnectionError}`);
    console.log('💾 [Database] Fallback active: Running with Local Persistent Database');
  }
}

export const db = {
  isMongoActive(): boolean {
    return isMongoConnected;
  },

  getStatus() {
    return {
      connected: isMongoConnected,
      mode: isMongoConnected ? 'MongoDB Atlas' : 'Local Persistent Storage',
      storageFile: isMongoConnected ? null : 'server/data/finsight_db.json',
      error: mongoConnectionError,
    };
  },

  // --- Users ---
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (isMongoConnected) {
      const user = await UserModel.findOne({ email: cleanEmail });
      if (!user) return null;
      return user.toJSON();
    }
    return localDb.findUserByEmail(cleanEmail);
  },

  async findUserById(id: string): Promise<UserDocument | null> {
    if (isMongoConnected) {
      const user = await UserModel.findById(id);
      if (!user) return null;
      return user.toJSON();
    }
    return localDb.findUserById(id);
  },

  async createUser(userData: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserDocument> {
    const cleanEmail = userData.email.trim().toLowerCase();
    if (isMongoConnected) {
      const created = await UserModel.create({
        ...userData,
        email: cleanEmail,
      });
      return created.toJSON();
    }
    return localDb.createUser({
      ...userData,
      email: cleanEmail,
    });
  },

  async updateUser(email: string, updates: Partial<UserDocument>): Promise<UserDocument | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (isMongoConnected) {
      const updated = await UserModel.findOneAndUpdate(
        { email: cleanEmail },
        { $set: updates },
        { returnDocument: 'after' }
      );
      return updated ? updated.toJSON() : null;
    }
    return localDb.updateUser(cleanEmail, updates);
  },

  async getAllUsers(): Promise<UserDocument[]> {
    if (isMongoConnected) {
      const users = await UserModel.find().sort({ createdAt: -1 });
      return users.map(u => u.toJSON());
    }
    return localDb.getAllUsers();
  },

  // --- Transactions ---
  async getTransactions(userEmail: string): Promise<TransactionDocument[]> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      const txns = await TransactionModel.find({ userEmail: cleanEmail }).sort({ date: -1, createdAt: -1 });
      return txns.map(t => t.toJSON());
    }
    return localDb.getTransactions(cleanEmail);
  },

  async addTransactions(
    userEmail: string,
    txns: Array<Omit<TransactionDocument, 'id' | 'userEmail' | 'createdAt'> & { id?: string }>
  ): Promise<TransactionDocument[]> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      const existing = await TransactionModel.find({ userEmail: cleanEmail }).lean();
      const existingSigs = new Set(existing.map(t => `${t.date}_${t.amount}_${t.description.slice(0, 20)}`));

      const toInsert = txns
        .filter(t => !existingSigs.has(`${t.date}_${t.amount}_${t.description.slice(0, 20)}`))
        .map(t => ({
          ...t,
          userEmail: cleanEmail,
          createdAt: new Date().toISOString(),
        }));

      if (toInsert.length === 0) return [];

      const inserted = await TransactionModel.insertMany(toInsert);
      return inserted.map(doc => (doc.toJSON ? doc.toJSON() : doc) as TransactionDocument);
    }
    return localDb.addTransactions(cleanEmail, txns);
  },

  async updateTransaction(userEmail: string, txnId: string, updates: Partial<TransactionDocument>): Promise<TransactionDocument | null> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      const updated = await TransactionModel.findOneAndUpdate(
        { _id: txnId, userEmail: cleanEmail },
        { $set: updates },
        { returnDocument: 'after' }
      );
      if (updated) return updated.toJSON();

      // Check by custom id if not ObjectId
      const updatedById = await TransactionModel.findOneAndUpdate(
        { id: txnId, userEmail: cleanEmail },
        { $set: updates },
        { returnDocument: 'after' }
      );
      return updatedById ? updatedById.toJSON() : null;
    }
    return localDb.updateTransaction(cleanEmail, txnId, updates);
  },

  async deleteTransaction(userEmail: string, txnId: string): Promise<boolean> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      let res = await TransactionModel.deleteOne({ _id: txnId, userEmail: cleanEmail });
      if (res.deletedCount === 0) {
        res = await TransactionModel.deleteOne({ id: txnId, userEmail: cleanEmail });
      }
      return (res.deletedCount || 0) > 0;
    }
    return localDb.deleteTransaction(cleanEmail, txnId);
  },

  async clearTransactions(userEmail: string): Promise<number> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      const res = await TransactionModel.deleteMany({ userEmail: cleanEmail });
      return res.deletedCount || 0;
    }
    return localDb.clearTransactions(cleanEmail);
  },

  // --- Goals ---
  async getGoals(userEmail: string): Promise<GoalDocument[]> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      const goals = await GoalModel.find({ userEmail: cleanEmail }).sort({ createdAt: -1 });
      return goals.map(g => g.toJSON());
    }
    return localDb.getGoals(cleanEmail);
  },

  async addGoal(
    userEmail: string,
    goal: Omit<GoalDocument, 'id' | 'userEmail' | 'createdAt'> & { id?: string }
  ): Promise<GoalDocument> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      const created = await GoalModel.create({
        ...goal,
        userEmail: cleanEmail,
        createdAt: new Date().toISOString(),
      });
      return created.toJSON();
    }
    return localDb.addGoal(cleanEmail, goal);
  },

  async updateGoal(userEmail: string, goalId: string, updates: Partial<GoalDocument>): Promise<GoalDocument | null> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      let updated = await GoalModel.findOneAndUpdate(
        { _id: goalId, userEmail: cleanEmail },
        { $set: updates },
        { returnDocument: 'after' }
      );
      if (!updated) {
        updated = await GoalModel.findOneAndUpdate(
          { id: goalId, userEmail: cleanEmail },
          { $set: updates },
          { returnDocument: 'after' }
        );
      }
      return updated ? updated.toJSON() : null;
    }
    return localDb.updateGoal(cleanEmail, goalId, updates);
  },

  async deleteGoal(userEmail: string, goalId: string): Promise<boolean> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      let res = await GoalModel.deleteOne({ _id: goalId, userEmail: cleanEmail });
      if (res.deletedCount === 0) {
        res = await GoalModel.deleteOne({ id: goalId, userEmail: cleanEmail });
      }
      return (res.deletedCount || 0) > 0;
    }
    return localDb.deleteGoal(cleanEmail, goalId);
  },

  // --- Portfolio Assets ---
  async getPortfolio(userEmail: string): Promise<PortfolioAssetDocument[]> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      const assets = await AssetModel.find({ userEmail: cleanEmail }).sort({ symbol: 1 });
      return assets.map(a => a.toJSON());
    }
    return localDb.getPortfolio(cleanEmail);
  },

  async savePortfolio(userEmail: string, assets: PortfolioAssetDocument[]): Promise<PortfolioAssetDocument[]> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      await AssetModel.deleteMany({ userEmail: cleanEmail });
      if (assets.length > 0) {
        const toInsert = assets.map(a => ({
          ...a,
          userEmail: cleanEmail,
        }));
        const inserted = await AssetModel.insertMany(toInsert);
        return inserted.map(doc => (doc.toJSON ? doc.toJSON() : doc) as PortfolioAssetDocument);
      }
      return [];
    }
    return localDb.savePortfolio(cleanEmail, assets);
  },

  // --- Bulk Wipe / Reset ---
  async clearAllUserData(userEmail: string): Promise<void> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      await Promise.all([
        TransactionModel.deleteMany({ userEmail: cleanEmail }),
        GoalModel.deleteMany({ userEmail: cleanEmail }),
        AssetModel.deleteMany({ userEmail: cleanEmail }),
      ]);
    }
    await localDb.clearAllUserData(cleanEmail);
  },

  // --- Payments & Invoicing ---
  async recordPayment(payment: PaymentDocument): Promise<PaymentDocument> {
    const cleanEmail = payment.userEmail.trim().toLowerCase();
    const dataToSave = { ...payment, userEmail: cleanEmail };
    if (isMongoConnected) {
      const created = await PaymentModel.create(dataToSave);
      return created.toJSON();
    }
    return localDb.recordPayment(dataToSave);
  },

  async getPayments(userEmail: string): Promise<PaymentDocument[]> {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (isMongoConnected) {
      const docs = await PaymentModel.find({ userEmail: cleanEmail }).sort({ createdAt: -1 });
      return docs.map(d => d.toJSON());
    }
    return localDb.getPayments(cleanEmail);
  },
};
