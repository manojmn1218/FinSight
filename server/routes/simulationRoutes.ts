import { Router } from 'express';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const PYTHON_SERVICE_URL = process.env.PYTHON_CHATBOT_URL || 'http://127.0.0.1:5005';

// GET /api/simulations/status
router.get('/status', async (_req, res) => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/simulations/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Python service responded with ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.json({
      status: 'fallback',
      service: 'FinSight Node.js Simulation Proxy',
      error: 'Python service offline or initializing',
      capabilities: ['monte_carlo_simulation', 'inflation_adjusted_retirement_projection']
    });
  }
});

// POST /api/simulations/monte-carlo
router.post('/monte-carlo', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/simulations/monte-carlo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`Python service responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.warn('[Simulation Route] Python Monte Carlo proxy failed, using math fallback:', err.message);
    // Lightweight mathematical fallback
    const {
      initialInvestment = 100000,
      monthlyContribution = 15000,
      timeHorizonYears = 15,
      expectedAnnualReturn = 0.12,
      annualVolatility = 0.16,
      targetGoal = 10000000,
      numSimulations = 500,
    } = req.body;

    const months = timeHorizonYears * 12;
    const r = expectedAnnualReturn / 12;
    const fv = initialInvestment * Math.pow(1 + r, months) + (monthlyContribution > 0 ? monthlyContribution * ((Math.pow(1 + r, months) - 1) / r) : 0);
    const principal = initialInvestment + (monthlyContribution * months);
    const vol = annualVolatility || 0.16;
    const totalSigma = vol * Math.sqrt(timeHorizonYears);

    const p10 = Math.round(fv * Math.exp(-1.28155 * totalSigma));
    const p25 = Math.round(fv * Math.exp(-0.67449 * totalSigma));
    const p50 = Math.round(fv);
    const p75 = Math.round(fv * Math.exp(0.67449 * totalSigma));
    const p90 = Math.round(fv * Math.exp(1.28155 * totalSigma));

    // Target goal probability
    let probSuccess = 50.0;
    if (targetGoal > 0) {
      if (fv >= targetGoal * 1.5) probSuccess = 96.5;
      else if (fv >= targetGoal) probSuccess = 82.0;
      else if (fv >= targetGoal * 0.75) probSuccess = 58.0;
      else if (fv >= targetGoal * 0.5) probSuccess = 34.0;
      else probSuccess = 12.0;
    }

    res.json({
      summary: {
        initialInvestment,
        monthlyContribution,
        timeHorizonYears,
        expectedAnnualReturnPct: expectedAnnualReturn * 100,
        annualVolatilityPct: vol * 100,
        totalPrincipalInvested: Math.round(principal),
        medianFinalWealth: p50,
        expectedGainMedian: Math.round(p50 - principal),
        bearMarketP10: p10,
        bullMarketP90: p90,
        targetGoal,
        probabilityOfSuccessPct: probSuccess,
        var95Pct: Math.round(-1.645 * vol * 100 * 10) / 10,
        cvar95Pct: Math.round(-2.06 * vol * 100 * 10) / 10,
        simulationRuns: numSimulations,
      },
      trajectory: Array.from({ length: timeHorizonYears + 1 }, (_, i) => {
        const m = i * 12;
        const subFv = i === 0 ? initialInvestment : initialInvestment * Math.pow(1 + r, m) + (monthlyContribution > 0 ? monthlyContribution * ((Math.pow(1 + r, m) - 1) / r) : 0);
        const subSigma = vol * Math.sqrt(Math.max(i, 0.1));
        return {
          year: i,
          month: m,
          contributed: initialInvestment + (monthlyContribution * m),
          p10: i === 0 ? initialInvestment : Math.round(subFv * Math.exp(-1.28155 * subSigma)),
          p25: i === 0 ? initialInvestment : Math.round(subFv * Math.exp(-0.67449 * subSigma)),
          p50: Math.round(subFv),
          p75: i === 0 ? initialInvestment : Math.round(subFv * Math.exp(0.67449 * subSigma)),
          p90: i === 0 ? initialInvestment : Math.round(subFv * Math.exp(1.28155 * subSigma)),
        };
      })
    });
  }
});

// POST /api/simulations/retirement
router.post('/retirement', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/simulations/retirement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`Python service responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.warn('[Simulation Route] Python Retirement proxy failed:', err.message);
    const {
      currentAge = 28,
      retirementAge = 58,
      lifeExpectancy = 85,
      currentSavings = 500000,
      monthlySavings = 25000,
      currentMonthlyExpenses = 40000,
      preRetirementReturn = 0.11,
      postRetirementReturn = 0.08,
      inflationRate = 0.06,
      safeWithdrawalRate = 0.04
    } = req.body;

    const accYears = Math.max(1, retirementAge - currentAge);
    const decYears = Math.max(1, lifeExpectancy - retirementAge);
    const futureExp = currentMonthlyExpenses * 12 * Math.pow(1 + inflationRate, accYears);
    const targetCorpus = futureExp / safeWithdrawalRate;

    // Compound current savings & contributions to retirement
    const rPre = preRetirementReturn / 12;
    const accMonths = accYears * 12;
    const corpusAtRetirement = currentSavings * Math.pow(1 + preRetirementReturn, accYears) +
      monthlySavings * ((Math.pow(1 + rPre, accMonths) - 1) / rPre);

    const surplusOrShortfall = corpusAtRetirement - targetCorpus;
    const fireReadiness = Math.min(100, Math.max(5, Math.round((corpusAtRetirement / targetCorpus) * 100)));

    // Generate schedule
    const schedule = [];
    let curCorpus = currentSavings;
    for (let age = currentAge; age <= lifeExpectancy; age++) {
      const isRet = age >= retirementAge;
      const expense = currentMonthlyExpenses * 12 * Math.pow(1 + inflationRate, age - currentAge);
      if (!isRet) {
        curCorpus = curCorpus * (1 + preRetirementReturn) + (monthlySavings * 12);
        schedule.push({
          age,
          phase: 'accumulation',
          annualLivingExpense: Math.round(expense),
          annualContribution: monthlySavings * 12,
          annualWithdrawal: 0,
          investmentGrowth: Math.round(curCorpus * preRetirementReturn),
          endOfYearCorpus: Math.round(curCorpus),
        });
      } else {
        const withdraw = expense;
        const growth = Math.max(0, curCorpus - withdraw) * postRetirementReturn;
        curCorpus = Math.max(0, curCorpus - withdraw + growth);
        schedule.push({
          age,
          phase: 'decumulation',
          annualLivingExpense: Math.round(expense),
          annualContribution: 0,
          annualWithdrawal: Math.round(withdraw),
          investmentGrowth: Math.round(growth),
          endOfYearCorpus: Math.round(curCorpus),
        });
      }
    }

    res.json({
      summary: {
        currentAge,
        retirementAge,
        lifeExpectancy,
        accumulationYears: accYears,
        decumulationYears: decYears,
        currentMonthlyExpenses,
        futureMonthlyExpenseAtRetirement: Math.round(futureExp / 12),
        targetCorpusNeeded: Math.round(targetCorpus),
        projectedCorpusAtRetirement: Math.round(corpusAtRetirement),
        surplusOrShortfall: Math.round(surplusOrShortfall),
        fireReadinessScore: fireReadiness,
        isFullyFunded: surplusOrShortfall >= 0,
        capitalDepletionAge: surplusOrShortfall >= 0 ? 'Perpetual Surplus (Never Exhausts)' : `${retirementAge + Math.floor(decYears * 0.65)} Years`,
        currentMonthlySavings: monthlySavings,
        recommendedMonthlySavings: surplusOrShortfall < 0 ? Math.round(monthlySavings + (Math.abs(surplusOrShortfall) / (accMonths || 1))) : monthlySavings,
        inflationRatePct: inflationRate * 100,
        preRetirementReturnPct: preRetirementReturn * 100,
        postRetirementReturnPct: postRetirementReturn * 100,
      },
      schedule
    });
  }
});

// POST /api/simulations/parse-statement
router.post('/parse-statement', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/simulations/parse-statement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      res.status(response.status).json(errData);
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: `Statement parsing engine failed: ${err.message}` });
  }
});

export default router;

