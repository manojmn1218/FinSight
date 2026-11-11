import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function setAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const targetEmail = 'finsight27@gmail.com';

  // 1. Demote any other users who have isAdmin = true
  const demoteRes = await mongoose.connection.collection('users').updateMany(
    { email: { $ne: targetEmail }, isAdmin: true },
    { $set: { isAdmin: false } }
  );
  console.log('Demoted other admins count:', demoteRes.modifiedCount);

  // 2. Promote finsight27@gmail.com
  const promoteRes = await mongoose.connection.collection('users').updateOne(
    { email: targetEmail },
    { $set: { isAdmin: true } }
  );
  console.log('Promoted finsight27@gmail.com matched:', promoteRes.matchedCount, 'modified:', promoteRes.modifiedCount);

  // 3. Verify
  const allUsers = await mongoose.connection.collection('users').find({}, { projection: { email: 1, name: 1, isAdmin: 1 } }).toArray();
  console.log('Current Users in MongoDB:');
  console.log(JSON.stringify(allUsers, null, 2));

  await mongoose.disconnect();
}

setAdmin().catch(console.error);

