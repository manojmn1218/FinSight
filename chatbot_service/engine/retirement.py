import numpy as np
from typing import Dict, Any, List

def calculate_retirement_projection(
    current_age: int = 28,
    retirement_age: int = 58,
    life_expectancy: int = 85,
    current_savings: float = 500000.0,
    monthly_savings: float = 25000.0,
    current_monthly_expenses: float = 40000.0,
    pre_retirement_return: float = 0.11,    # 11% pre-retirement return
    post_retirement_return: float = 0.08,   # 8% post-retirement conservative return
    inflation_rate: float = 0.06,           # 6% annual inflation
    safe_withdrawal_rate: float = 0.04      # 4% safe withdrawal rate
) -> Dict[str, Any]:
    """
    Computes rigorous inflation-adjusted retirement projections across accumulation and decumulation phases.
    Calculates corpus sufficiency, capital depletion age, and required monthly SIP.
    """
    cur_age = max(18, min(80, int(current_age)))
    ret_age = max(cur_age + 1, min(90, int(retirement_age)))
    life_exp = max(ret_age + 1, min(105, int(life_expectancy)))
    
    accumulation_years = ret_age - cur_age
    decumulation_years = life_exp - ret_age
    total_years = life_exp - cur_age
    
    # 1. Project living expenses at retirement age with compounded inflation
    annual_expenses_now = current_monthly_expenses * 12.0
    future_annual_expenses_at_ret = annual_expenses_now * ((1.0 + inflation_rate) ** accumulation_years)
    
    # 2. Target Corpus needed based on Safe Withdrawal Rate (SWR) or Annuity method
    # Corpus needed = Annual expense at retirement / SWR
    swr = max(0.02, min(0.08, float(safe_withdrawal_rate)))
    target_corpus_needed = future_annual_expenses_at_ret / swr
    
    # 3. Simulate Accumulation Phase Year-by-Year
    yearly_schedule: List[Dict[str, Any]] = []
    corpus = float(current_savings)
    depletion_age = None
    
    annual_savings = monthly_savings * 12.0
    
    for yr in range(1, total_years + 1):
        age = cur_age + yr
        is_retired = age >= ret_age
        
        # Inflation-adjusted living expense for this specific year
        expense_this_year = annual_expenses_now * ((1.0 + inflation_rate) ** yr)
        
        if not is_retired:
            # Accumulation phase: earn returns + add annual savings
            # Annual return credited on average balance
            growth = corpus * pre_retirement_return
            contribution = annual_savings
            withdrawal = 0.0
            corpus = corpus + growth + contribution
        else:
            # Decumulation phase: withdraw living expenses, remaining corpus grows at post-retirement rate
            contribution = 0.0
            withdrawal = expense_this_year
            # Net portfolio growth after living expenses
            growth = max(0.0, (corpus - withdrawal)) * post_retirement_return
            corpus = (corpus - withdrawal) + growth
            
            if corpus <= 0.0 and depletion_age is None:
                depletion_age = age
                corpus = 0.0

        yearly_schedule.append({
            "year": yr,
            "age": age,
            "isRetired": is_retired,
            "portfolioValue": round(max(0.0, corpus), 2),
            "annualContribution": round(contribution, 2),
            "annualWithdrawal": round(withdrawal, 2),
            "annualLivingExpense": round(expense_this_year, 2),
            "annualGrowth": round(growth, 2)
        })

    # Corpus achieved exactly at retirement age
    corpus_at_retirement = 0.0
    for item in yearly_schedule:
        if item["age"] == ret_age:
            corpus_at_retirement = item["portfolioValue"]
            break

    # Calculate FIRE Readiness Score (0 to 100%)
    fire_score = min(100.0, max(0.0, (corpus_at_retirement / max(1.0, target_corpus_needed)) * 100.0))
    is_fully_funded = (depletion_age is None or depletion_age >= life_exp)
    
    # 4. Calculate Required Monthly SIP to hit target corpus precisely at retirement age
    # FV formula inverted: Target = CurSavings*(1+r)^n + PMT * [((1+r)^n - 1) / (r/12)]
    r_monthly = pre_retirement_return / 12.0
    n_months = accumulation_years * 12
    fv_current_savings = current_savings * ((1.0 + pre_retirement_return) ** accumulation_years)
    remaining_needed = max(0.0, target_corpus_needed - fv_current_savings)
    
    if remaining_needed > 0 and r_monthly > 0 and n_months > 0:
        annuity_factor = (((1.0 + r_monthly) ** n_months) - 1.0) / r_monthly
        required_monthly_savings = remaining_needed / annuity_factor
    else:
        required_monthly_savings = 0.0

    return {
        "summary": {
            "currentAge": cur_age,
            "retirementAge": ret_age,
            "lifeExpectancy": life_exp,
            "accumulationYears": accumulation_years,
            "decumulationYears": decumulation_years,
            "currentMonthlyExpenses": current_monthly_expenses,
            "futureMonthlyExpenseAtRetirement": round(future_annual_expenses_at_ret / 12.0, 2),
            "targetCorpusNeeded": round(target_corpus_needed, 2),
            "projectedCorpusAtRetirement": round(corpus_at_retirement, 2),
            "surplusOrShortfall": round(corpus_at_retirement - target_corpus_needed, 2),
            "fireReadinessScore": round(fire_score, 1),
            "isFullyFunded": is_fully_funded,
            "capitalDepletionAge": depletion_age if depletion_age else "Perpetual Surplus (Never Exhausts)",
            "currentMonthlySavings": monthly_savings,
            "recommendedMonthlySavings": round(required_monthly_savings, 2),
            "inflationRatePct": round(inflation_rate * 100, 2),
            "preRetirementReturnPct": round(pre_retirement_return * 100, 2),
            "postRetirementReturnPct": round(post_retirement_return * 100, 2),
        },
        "schedule": yearly_schedule
    }
