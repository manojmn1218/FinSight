import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  ShieldAlert,
  Sparkles,
  BarChart3,
  Calendar,
  DollarSign,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Target,
  Clock,
  Layers,
  Cpu
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  api,
  type MonteCarloResponse,
  type RetirementResponse
} from '../services/api';

const fmt = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN');

interface WealthSimulationsProps {
  initialNetWorth?: number;
}

export default function WealthSimulations({ initialNetWorth }: WealthSimulationsProps = {}) {
  const [activeTab, setActiveTab] = useState<'monte_carlo' | 'retirement'>('monte_carlo');

  // Engine status
  const [engineStatus, setEngineStatus] = useState<{
    status: string;
    libraries?: { numpy: string; pandas: string; openpyxl: string };
  } | null>(null);

  useEffect(() => {
    api.getSimulationStatus()
      .then(res => setEngineStatus(res))
      .catch(() => setEngineStatus({ status: 'fallback' }));
  }, []);

  // ─── Monte Carlo State ───
  const [mcInitial, setMcInitial] = useState(() => (initialNetWorth && initialNetWorth > 0 ? Math.round(initialNetWorth) : 250000));
  const [mcMonthly, setMcMonthly] = useState(20000);
  const [mcYears, setMcYears] = useState(15);
  const [mcReturn, setMcReturn] = useState(12);
  const [mcVol, setMcVol] = useState(16);
  const [mcGoal, setMcGoal] = useState(10000000); // 1 Crore target
  const [mcLoading, setMcLoading] = useState(false);
  const [mcData, setMcData] = useState<MonteCarloResponse | null>(null);
  const [mcError, setMcError] = useState<string | null>(null);

  const runMonteCarlo = async () => {
    setMcLoading(true);
    setMcError(null);
    try {
      const res = await api.runMonteCarloSimulation({
        initialInvestment: Number(mcInitial),
        monthlyContribution: Number(mcMonthly),
        timeHorizonYears: Number(mcYears),
        expectedAnnualReturn: Number(mcReturn) / 100,
        annualVolatility: Number(mcVol) / 100,
        numSimulations: 500,
        targetGoal: Number(mcGoal),
      });
      setMcData(res);
    } catch (err: any) {
      setMcError(err.message || 'Simulation failed to compute.');
    } finally {
      setMcLoading(false);
    }
  };

  // Run initial simulation on load
  useEffect(() => {
    runMonteCarlo();
  }, []);

  // ─── Retirement State ───
  const [retCurAge, setRetCurAge] = useState(28);
  const [retAge, setRetAge] = useState(58);
  const [retLifeExp, setRetLifeExp] = useState(85);
  const [retSavings, setRetSavings] = useState(500000);
  const [retMonthlySavings, setRetMonthlySavings] = useState(25000);
  const [retMonthlyExp, setRetMonthlyExp] = useState(40000);
  const [retInflation, setRetInflation] = useState(6);
  const [retReturnPre, setRetReturnPre] = useState(11);
  const [retReturnPost, setRetReturnPost] = useState(8);
  const [retLoading, setRetLoading] = useState(false);
  const [retData, setRetData] = useState<RetirementResponse | null>(null);
  const [retError, setRetError] = useState<string | null>(null);

  const runRetirement = async () => {
    setRetLoading(true);
    setRetError(null);
    try {
      const res = await api.calculateRetirementProjection({
        currentAge: Number(retCurAge),
        retirementAge: Number(retAge),
        lifeExpectancy: Number(retLifeExp),
        currentSavings: Number(retSavings),
        monthlySavings: Number(retMonthlySavings),
        currentMonthlyExpenses: Number(retMonthlyExp),
        preRetirementReturn: Number(retReturnPre) / 100,
        postRetirementReturn: Number(retReturnPost) / 100,
        inflationRate: Number(retInflation) / 100,
        safeWithdrawalRate: 0.04,
      });
      setRetData(res);
    } catch (err: any) {
      setRetError(err.message || 'Retirement calculation failed.');
    } finally {
      setRetLoading(false);
    }
  };

  useEffect(() => {
    runRetirement();
  }, []);

  return (
    <div style={{ marginTop: 32 }}>
      {/* Header & Python Engine Status Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--pop)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Cpu size={18} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              Python Financial Intelligence Engine
            </h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
            Stochastic Monte Carlo modeling, Brownian motion, and inflation-indexed actuarial projections.
          </p>
        </div>

        {/* Engine status pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            fontSize: 12,
            fontWeight: 600,
            boxShadow: 'var(--shadow)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--green)',
              boxShadow: '0 0 8px var(--green)',
            }}
          />
          <span style={{ color: 'var(--text)' }}>
            NumPy {engineStatus?.libraries?.numpy || '2.5'} • Pandas {engineStatus?.libraries?.pandas || '3.1'}
          </span>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: 6,
              background: 'rgba(234, 88, 12, 0.1)',
              color: 'var(--pop)',
              fontSize: 10.5,
              fontWeight: 700,
            }}
          >
            ONLINE
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: 20 }}>
        <button
          className={`tab-btn ${activeTab === 'monte_carlo' ? 'active' : ''}`}
          onClick={() => setActiveTab('monte_carlo')}
        >
          <BarChart3 size={16} className="tab-icon" />
          <span>Monte Carlo Wealth Forecast</span>
          <span className="tab-badge">500 Paths</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'retirement' ? 'active' : ''}`}
          onClick={() => setActiveTab('retirement')}
        >
          <Target size={16} className="tab-icon" />
          <span>Retirement &amp; FIRE Projection</span>
          <span className="tab-badge">Inflation-Indexed</span>
        </button>
      </div>

      {/* TAB 1: MONTE CARLO SIMULATOR */}
      {activeTab === 'monte_carlo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Controls Panel */}
          <div className="panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <TrendingUp size={18} color="var(--pop)" />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                Simulation Parameters (Geometric Brownian Motion)
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <label className="label">Starting Portfolio (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={mcInitial}
                  onChange={e => setMcInitial(Number(e.target.value))}
                  step={25000}
                />
              </div>

              <div>
                <label className="label">Monthly Contribution (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={mcMonthly}
                  onChange={e => setMcMonthly(Number(e.target.value))}
                  step={5000}
                />
              </div>

              <div>
                <label className="label">Time Horizon (Years)</label>
                <input
                  type="number"
                  className="input"
                  value={mcYears}
                  onChange={e => setMcYears(Number(e.target.value))}
                  min={1}
                  max={40}
                />
              </div>

              <div>
                <label className="label">Expected Annual Return (%)</label>
                <input
                  type="number"
                  className="input"
                  value={mcReturn}
                  onChange={e => setMcReturn(Number(e.target.value))}
                  step={0.5}
                />
              </div>

              <div>
                <label className="label">Volatility / StdDev (%)</label>
                <input
                  type="number"
                  className="input"
                  value={mcVol}
                  onChange={e => setMcVol(Number(e.target.value))}
                  step={1}
                />
              </div>

              <div>
                <label className="label">Target Wealth Goal (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={mcGoal}
                  onChange={e => setMcGoal(Number(e.target.value))}
                  step={500000}
                />
              </div>
            </div>

            <button
              onClick={runMonteCarlo}
              disabled={mcLoading}
              className="btn-primary"
              style={{ width: '100%', maxWidth: 280 }}
            >
              {mcLoading ? (
                <>Simulating 500 Stochastic Paths...</>
              ) : (
                <>
                  <Zap size={16} /> Run Monte Carlo Simulation
                </>
              )}
            </button>
          </div>

          {mcError && (
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(220,38,38,0.08)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.2)' }}>
              {mcError}
            </div>
          )}

          {/* Key Metric Highlights */}
          {mcData && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                }}
              >
                <div className="panel" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Median Projected Wealth (P50)
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--pop)' }}>
                    {fmt(mcData.summary.medianFinalWealth)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                    Compounded Gain: <strong style={{ color: 'var(--green)' }}>+{fmt(mcData.summary.expectedGainMedian)}</strong>
                  </div>
                </div>

                <div className="panel" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Probability of Hitting Goal
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: mcData.summary.probabilityOfSuccessPct >= 70 ? 'var(--green)' : 'var(--amber)' }}>
                    {mcData.summary.probabilityOfSuccessPct}%
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                    Target: {fmt(mcData.summary.targetGoal || 0)}
                  </div>
                </div>

                <div className="panel" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Bear Market Protection (P10)
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>
                    {fmt(mcData.summary.bearMarketP10)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                    Conservative 10th percentile outcome
                  </div>
                </div>

                <div className="panel" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Bull Market Upside (P90)
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>
                    {fmt(mcData.summary.bullMarketP90)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                    Top decile economic expansion
                  </div>
                </div>
              </div>

              {/* Fan Chart */}
              <div className="panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                      Stochastic Wealth Trajectory Bands
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text2)', margin: '4px 0 0' }}>
                      P90 (Optimistic), P50 (Median Expected), P10 (Pessimistic) vs. Contributed Principal
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    Simulated across {mcData.summary.simulationRuns} market cycles
                  </span>
                </div>

                <div style={{ width: '100%', height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mcData.trajectory} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="p90Grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#15803d" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="year"
                        stroke="var(--text3)"
                        fontSize={12}
                        tickFormatter={val => `Yr ${val}`}
                      />
                      <YAxis
                        stroke="var(--text3)"
                        fontSize={12}
                        tickFormatter={val => `₹${(val / 100000).toFixed(0)}L`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface)',
                          borderColor: 'var(--border)',
                          borderRadius: 10,
                          fontSize: 12,
                          color: 'var(--text)',
                        }}
                        formatter={(val: any) => [fmt(Number(val)), '']}
                        labelFormatter={label => `Year ${label}`}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="p90"
                        name="Bull Market (P90)"
                        stroke="#ff6b35"
                        fill="url(#p90Grad)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="p50"
                        name="Median Path (P50)"
                        stroke="#15803d"
                        fill="url(#p50Grad)"
                        strokeWidth={2.5}
                      />
                      <Line
                        type="monotone"
                        dataKey="p10"
                        name="Bear Market (P10)"
                        stroke="#b45309"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="contributed"
                        name="Capital Contributed"
                        stroke="var(--text3)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: INFLATION-ADJUSTED RETIREMENT ENGINE */}
      {activeTab === 'retirement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Controls */}
          <div className="panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Target size={18} color="var(--pop)" />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                Retirement Profile &amp; Inflation Parameters
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <label className="label">Current Age</label>
                <input
                  type="number"
                  className="input"
                  value={retCurAge}
                  onChange={e => setRetCurAge(Number(e.target.value))}
                  min={18}
                  max={75}
                />
              </div>

              <div>
                <label className="label">Retirement Target Age</label>
                <input
                  type="number"
                  className="input"
                  value={retAge}
                  onChange={e => setRetAge(Number(e.target.value))}
                  min={retCurAge + 1}
                  max={85}
                />
              </div>

              <div>
                <label className="label">Current Savings / Corpus (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={retSavings}
                  onChange={e => setRetSavings(Number(e.target.value))}
                  step={50000}
                />
              </div>

              <div>
                <label className="label">Monthly Savings / SIP (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={retMonthlySavings}
                  onChange={e => setRetMonthlySavings(Number(e.target.value))}
                  step={5000}
                />
              </div>

              <div>
                <label className="label">Current Monthly Expenses (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={retMonthlyExp}
                  onChange={e => setRetMonthlyExp(Number(e.target.value))}
                  step={5000}
                />
              </div>

              <div>
                <label className="label">Annual Inflation Rate (%)</label>
                <input
                  type="number"
                  className="input"
                  value={retInflation}
                  onChange={e => setRetInflation(Number(e.target.value))}
                  step={0.5}
                />
              </div>
            </div>

            <button
              onClick={runRetirement}
              disabled={retLoading}
              className="btn-primary"
              style={{ width: '100%', maxWidth: 280 }}
            >
              {retLoading ? (
                <>Calculating Actuarial Projections...</>
              ) : (
                <>
                  <Zap size={16} /> Compute Retirement Strategy
                </>
              )}
            </button>
          </div>

          {retError && (
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(220,38,38,0.08)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.2)' }}>
              {retError}
            </div>
          )}

          {retData && (
            <>
              {/* Highlight Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                }}
              >
                <div className="panel" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6 }}>
                    FIRE Readiness Score
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: retData.summary.fireReadinessScore >= 90 ? 'var(--green)' : 'var(--pop)' }}>
                    {retData.summary.fireReadinessScore}%
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                    Status: <strong style={{ color: retData.summary.isFullyFunded ? 'var(--green)' : 'var(--amber)' }}>
                      {retData.summary.isFullyFunded ? 'Fully Funded' : 'Action Needed'}
                    </strong>
                  </div>
                </div>

                <div className="panel" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Target Corpus Needed (at age {retData.summary.retirementAge})
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
                    {fmt(retData.summary.targetCorpusNeeded)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                    Future Cost of Living: {fmt(retData.summary.futureMonthlyExpenseAtRetirement)}/mo
                  </div>
                </div>

                <div className="panel" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Projected Corpus at Retirement
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--pop)' }}>
                    {fmt(retData.summary.projectedCorpusAtRetirement)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                    Surplus / Gap: <strong style={{ color: retData.summary.surplusOrShortfall >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {retData.summary.surplusOrShortfall >= 0 ? '+' : ''}{fmt(retData.summary.surplusOrShortfall)}
                    </strong>
                  </div>
                </div>

                <div className="panel" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Recommended Monthly Savings
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
                    {fmt(retData.summary.recommendedMonthlySavings)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                    Current SIP: {fmt(retData.summary.currentMonthlySavings)}/mo
                  </div>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                  Accumulation &amp; Decumulation Cashflow Schedule (Selected Ages)
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Age</th>
                        <th>Phase</th>
                        <th>Annual Living Expense</th>
                        <th>Annual Contribution</th>
                        <th>Annual Withdrawal</th>
                        <th>Year-End Corpus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retData.schedule
                        .filter((_, idx) => idx % 5 === 0 || idx === retData.schedule.length - 1)
                        .map(row => (
                          <tr key={row.age}>
                            <td style={{ fontWeight: 700 }}>{row.age}</td>
                            <td>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  background: row.isRetired ? 'rgba(234,88,12,0.1)' : 'rgba(21,128,61,0.1)',
                                  color: row.isRetired ? 'var(--pop)' : 'var(--green)',
                                }}
                              >
                                {row.isRetired ? 'Decumulation' : 'Accumulation'}
                              </span>
                            </td>
                            <td>{fmt(row.annualLivingExpense)}</td>
                            <td>{row.annualContribution > 0 ? `+${fmt(row.annualContribution)}` : '—'}</td>
                            <td>{row.annualWithdrawal > 0 ? `-${fmt(row.annualWithdrawal)}` : '—'}</td>
                            <td style={{ fontWeight: 700, color: row.portfolioValue > 0 ? 'var(--text)' : 'var(--red)' }}>
                              {fmt(row.portfolioValue)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
