import numpy as np
from typing import Dict, Any, List

def run_monte_carlo_simulation(
    initial_investment: float = 100000.0,
    monthly_contribution: float = 15000.0,
    time_horizon_years: int = 15,
    expected_annual_return: float = 0.12,  # 12% annual return
    annual_volatility: float = 0.16,      # 16% volatility (standard deviation)
    num_simulations: int = 500,
    target_goal: float = 5000000.0,       # Optional target wealth
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Simulates portfolio trajectories using vectorized Geometric Brownian Motion (GBM).
    Returns percentiles (10th, 25th, 50th, 75th, 90th), risk metrics, and probability of goal achievement.
    """
    years = max(1, min(40, int(time_horizon_years)))
    months = years * 12
    num_sims = max(50, min(2000, int(num_simulations)))
    
    # Monthly parameters
    # Ito's drift adjustment for log-normal returns
    dt = 1.0 / 12.0
    drift = (expected_annual_return - 0.5 * (annual_volatility ** 2)) * dt
    shock_std = annual_volatility * np.sqrt(dt)
    
    # Generate random shocks for all simulations and months: shape (num_sims, months)
    random_shocks = np.random.normal(0, 1, size=(num_sims, months))
    monthly_multipliers = np.exp(drift + shock_std * random_shocks)
    
    # Array to track portfolio value across time
    # Column 0 is month 0 (initial investment)
    portfolio_paths = np.zeros((num_sims, months + 1))
    portfolio_paths[:, 0] = initial_investment
    
    # Accumulate month-by-month compounding with systematic monthly contribution
    for m in range(1, months + 1):
        portfolio_paths[:, m] = (portfolio_paths[:, m - 1] * monthly_multipliers[:, m - 1]) + monthly_contribution
        # Prevent negative balance from extreme stochastic tails
        portfolio_paths[:, m] = np.maximum(portfolio_paths[:, m], 0.0)

    # Calculate final wealth distribution
    final_wealths = portfolio_paths[:, -1]
    
    # Total capital contributed by the user
    total_principal_invested = initial_investment + (monthly_contribution * months)
    
    # Percentiles of final wealth
    p10 = float(np.percentile(final_wealths, 10))
    p25 = float(np.percentile(final_wealths, 25))
    p50 = float(np.percentile(final_wealths, 50))  # Median
    p75 = float(np.percentile(final_wealths, 75))
    p90 = float(np.percentile(final_wealths, 90))
    mean_wealth = float(np.mean(final_wealths))
    
    # Probability of achieving target goal
    prob_success = 0.0
    if target_goal > 0:
        prob_success = float(np.mean(final_wealths >= target_goal) * 100.0)
    
    # Value at Risk (VaR 95%) and Conditional VaR (CVaR)
    # Relative to total invested principal
    returns_on_principal = (final_wealths - total_principal_invested) / max(1.0, total_principal_invested)
    alpha = (1.0 - confidence_level) * 100.0
    var_threshold = float(np.percentile(returns_on_principal, alpha))
    cvar_tail = returns_on_principal[returns_on_principal <= var_threshold]
    cvar = float(np.mean(cvar_tail)) if len(cvar_tail) > 0 else var_threshold
    
    # Downsample trajectory data for clean visualization (e.g., 1 sample per year)
    step = 12 if months >= 24 else max(1, months // 10)
    sampled_months = list(range(0, months + 1, step))
    if sampled_months[-1] != months:
        sampled_months.append(months)
        
    trajectory_points: List[Dict[str, Any]] = []
    for m in sampled_months:
        col = portfolio_paths[:, m]
        yr = round(m / 12, 1)
        contributed_so_far = initial_investment + (monthly_contribution * m)
        trajectory_points.append({
            "year": yr,
            "month": m,
            "contributed": round(contributed_so_far, 2),
            "p10": round(float(np.percentile(col, 10)), 2),
            "p25": round(float(np.percentile(col, 25)), 2),
            "p50": round(float(np.percentile(col, 50)), 2),
            "p75": round(float(np.percentile(col, 75)), 2),
            "p90": round(float(np.percentile(col, 90)), 2),
        })

    return {
        "summary": {
            "initialInvestment": initial_investment,
            "monthlyContribution": monthly_contribution,
            "timeHorizonYears": years,
            "expectedAnnualReturnPct": round(expected_annual_return * 100, 2),
            "annualVolatilityPct": round(annual_volatility * 100, 2),
            "totalPrincipalInvested": round(total_principal_invested, 2),
            "medianFinalWealth": round(p50, 2),
            "expectedGainMedian": round(max(0, p50 - total_principal_invested), 2),
            "bearMarketP10": round(p10, 2),
            "bullMarketP90": round(p90, 2),
            "targetGoal": target_goal,
            "probabilityOfSuccessPct": round(prob_success, 1),
            "var95Pct": round(var_threshold * 100, 2),
            "cvar95Pct": round(cvar * 100, 2),
            "simulationRuns": num_sims,
        },
        "trajectory": trajectory_points
    }

