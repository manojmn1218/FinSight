import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import os
import re
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import dotenv

# Load environment variables from the project root .env and add to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

try:
    from chatbot_service.engine.monte_carlo import run_monte_carlo_simulation
    from chatbot_service.engine.retirement import calculate_retirement_projection
    from chatbot_service.engine.statement_parser import parse_statement_file
except ImportError:
    from engine.monte_carlo import run_monte_carlo_simulation
    from engine.retirement import calculate_retirement_projection
    from engine.statement_parser import parse_statement_file

dotenv.load_dotenv(dotenv_path=ROOT_DIR / ".env")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PORT = int(os.getenv("CHATBOT_PORT", "5005"))

# Initialize Gemini Client if key is configured
genai_client = None
if GEMINI_API_KEY:
    try:
        from google import genai
        genai_client = genai.Client(api_key=GEMINI_API_KEY)
        print("[FinSight Chatbot] Gemini client initialized successfully.", flush=True)
    except Exception as e:
        print(f"[FinSight Chatbot] Warning: Failed to initialize Google GenAI client: {e}", flush=True)

def generate_dynamic_refusal(message: str) -> str:
    """Generates a natural refusal statement tailored directly to what was asked."""
    msg = message.lower().strip()
    if re.search(r"\b(weather|forecast|temperature|rain|climate)\b", msg):
        match = re.search(r"\b(?:weather|forecast|temperature|rain)\s+(?:in|for|at)?\s*([a-zA-Z\s]+)", message, re.I)
        loc = f" in {match.group(1).strip()}" if match else ""
        return f"I don't track weather forecasts{loc}. I can help you check your account balance, recent expenses, or savings goals instead."
    
    if re.search(r"\b(write\s+(?:python|java|c\+\+|javascript|typescript|code|script)|code|coding|algorithm|reverse\s+a\s+(?:string|linked|array)|bug|function)\b", msg):
        return "I can't help with coding questions. I focus on your bank statements, transactions, and budget in FinSight."
    
    if re.search(r"\b(cricket|football|fifa|ipl|olympics|sports|world cup|match|score|team|tournament)\b", msg):
        return "I don't track sports scores. I can help with your spending breakdown or account balance."
    
    if re.search(r"\b(recipe|cook|bake|ingredients|biryani|dish|cuisine|food recipe)\b", msg):
        return "I can't provide recipes. Ask me about your expenses, budgets, or savings goals."
    
    if re.search(r"\b(movie|film|actor|actress|cinema|song|lyrics|singer|album|celebrity)\b", msg):
        return "I don't cover entertainment news. I can help with your account details and budgets."
    
    if re.search(r"\b(president|prime minister|politics|election|government|parliament)\b", msg):
        return "I don't cover politics. I can help with your FinSight records and budget health."
    
    if re.search(r"\b(capital of|where is|continent|geography|country of)\b", msg):
        return "I don't cover geography questions. Ask me about your transactions, spending categories, or balance."
    
    if re.search(r"\b(joke|poem|story|riddle)\b", msg):
        return "I don't write poems or stories. I can help you review your finances, budget, or goals."

    snippet = message.strip()[:50]
    return f"I can't answer questions about '{snippet}'. I focus on your FinSight account, transactions, and budget goals."

# ═══════════════════════════════════════════════
# FinSight System Knowledge & Financial Training Prompt
# ═══════════════════════════════════════════════
FINSIGHT_SYSTEM_KNOWLEDGE = f"""
You are FinSight AI, the personal finance assistant for FinSight.

ROLE:
- Answer questions about the user's account records, transactions, budgets, goals, and FinSight features.
- Use the verified profile, statement transactions, category breakdown, and goals provided in USER CONTEXT.
- Format all currency in Indian Rupees (₹) with standard Indian numbering (e.g., ₹1,25,000.00).
- Give direct, factual answers without corporate filler, throat-clearing openers, or unsolicited lecturing.

═══════════════════════════════════════════════
1. IN-SCOPE QUESTIONS (YOU MUST ALWAYS ANSWER FULLY):
═══════════════════════════════════════════════
A. Account Balances & Cash Flow:
   - "What is my balance?", "How much money do I have?", "Statement balance", "Net cash flow"
   - Answer using the verified Total/Statement Balance (e.g., ₹958.62), monthly income, and surplus.

B. Affordability & Purchase Consultation (CRITICAL - ALWAYS ANSWER):
   - "Can I afford to buy [item] for ₹[amount]?", "Should I buy [item]?", "Can I spend ₹X?", "Do I have enough money for X?"
   - THESE ARE 100% IN-SCOPE ACCOUNT QUESTIONS! NEVER REFUSE THEM!
   - Answer by analyzing their liquid balance vs the cost, their monthly surplus (income - expenses), and active goals:
     * If cost > liquid balance: Explain that their current liquid balance is insufficient right now, so making the purchase immediately would cause a cash-flow deficit before next salary credit.
     * If cost <= liquid balance and <= monthly surplus: Give a green light and state remaining balance.
     * If cost <= liquid balance but > monthly surplus: Highlight that it's feasible from savings but exceeds this month's surplus.

C. Expenses, Transactions & Category Breakdowns:
   - "What was my biggest expense?", "Highest spend", "Where did I spend the most?"
     -> Answer using the Largest Single Expense on Record.
   - "How much did I spend on [Food / Shopping / Transport / etc.]?"
     -> Answer using the category breakdown. If zero or not recorded, politely clarify what categories they did spend on.
   - "Show my recent transactions", "Did I pay X?"
     -> List relevant transactions with dates, amounts, and merchants.

D. Financial Goals & Account Requirements:
   - "What are my goals?", "Tell me about my goals and deadlines"
     -> If goals exist in context: detail each goal, progress %, remaining amount, and deadline.
     -> If NO goals exist in context: do NOT say "Cannot say"! Say: "You currently have no active financial goals created in your account. You can create targets (like Emergency Fund, Vacation, Car) on the Goals page (/goals)."
   - "What are my account requirements to save ₹X by [date]?"
     -> Calculate the required monthly savings: (Target / Months remaining).

E. Subscriptions & Bills:
   - "What subscriptions do I have?", "My recurring bills"
     -> List recurring items or state none detected.

F. Budget Health & Financial Health:
   - "What is my budget health score?", "How can I improve my financial health?"
     -> Explain their score (e.g., 70/100) and give 2 concrete tips based on their actual numbers.

G. FinSight Platform Features & How-To:
   - How to upload bank statements, password-protected PDFs, supported banks (SBI, HDFC, ICICI, Axis, Kotak, etc.), statement closing balance auto-sync, plans (Basic, Pro, Wealth), and export options.

═══════════════════════════════════════════════
2. OUT-OF-SCOPE REFUSAL:
═══════════════════════════════════════════════
If the user asks about an external topic unrelated to FinSight, finances, money, budget, purchases, or account records
(e.g., world trivia, programming, weather, sports, cooking, movies, politics):

- Decline directly in 1-2 sentences without repetitive assistant preamble.
- Redirect the user to their relevant financial metrics (balances, expenses, affordability, or goals).
- Prefix your response with `[OUT_OF_SCOPE] `.

EXAMPLES:
User: "What is the weather in London today?"
Assistant: "[OUT_OF_SCOPE] I don't track weather forecasts. I can help you check your account balance, recent expenses, or savings goals instead."

User: "Write a python script to reverse a linked list"
Assistant: "[OUT_OF_SCOPE] I cannot assist with coding or software scripts. I focus on your financial accounts, statement transactions, and budget in FinSight."

User: "Who won the cricket world cup?"
Assistant: "[OUT_OF_SCOPE] I don't track sports scores. Let me know if you would like to review your spending breakdown or current account balance."

User: "How do I cook paneer butter masala?"
Assistant: "[OUT_OF_SCOPE] I don't provide recipes. I can help with your expenses, budgets, or savings goals instead."

User: "What is the capital of France?"
Assistant: "[OUT_OF_SCOPE] I don't answer general geography questions. Feel free to ask about your balance, budget health, or purchase affordability."
"""

OUT_OF_SCOPE_REGEX = re.compile(
    r"\b(write\s+(python|java|c\+\+|javascript|code|script)|who\s+is\s+the\s+president|capital\s+of|weather\s+in|recipe|cook|movie|actor|actress|poem|joke|song|cricket\s+score|fifa|olympics|translate\s+to|quantum\s+physics|solve\s+for\s+x|history\s+of)\b",
    re.IGNORECASE
)

def is_financial_or_account_query(msg: str) -> bool:
    """Returns True if the message touches on personal finances, money, purchases, or FinSight."""
    return bool(re.search(
        r"\b(afford|buy|bought|spend|spent|spending|cost|price|budget|save|saving|savings|goal|goals|balance|balances|expense|expenses|income|salary|earn|debit|credit|cash|money|rupee|rs|inr|account|statement|pdf|upload|bank|sbi|hdfc|icici|axis|kotak|portfolio|stock|sip|net worth|subscription|bill|health score|plan|pro|enterprise|finsight|pay|paid|atm|transfer|merchant|highest|largest|biggest|food|shopping|travel|utilities|rent)\b",
        msg,
        re.IGNORECASE
    ))

def is_obviously_out_of_scope(message: str) -> bool:
    msg = message.strip()
    if is_financial_or_account_query(msg):
        return False
    if OUT_OF_SCOPE_REGEX.search(msg):
        return True
    return False

def build_user_context_str(context: dict) -> str:
    if not context:
        return "No authenticated user account details found."

    name = context.get("name", "User")
    email = context.get("email", "")
    plan = str(context.get("plan", "Basic")).capitalize()
    balance = context.get("totalBalance", 0)
    income = context.get("monthlyIncome", 0)
    expenses = context.get("monthlyExpenses", 0)
    surplus = context.get("monthlySurplus", max(0, income - expenses))
    savings_rate = context.get("savingsPercent", 0)
    health_score = context.get("budgetHealthScore", 50)
    uploads_left = context.get("uploadsRemaining", "Unlimited")
    total_debits = context.get("totalDebits", 0)
    total_credits = context.get("totalCredits", 0)
    net_cashflow = context.get("netCashFlow", 0)
    
    lines = [
        "### USER PROFILE & ACCOUNT OVERVIEW",
        f"- Name: {name}",
        f"- Email: {email}",
        f"- Membership Plan: {plan} (PDF uploads remaining this month: {uploads_left})",
        f"- Current Verified Total/Statement Balance: ₹{balance:,.2f}",
        f"- Monthly Income: ₹{income:,.2f}",
        f"- Monthly Expenses: ₹{expenses:,.2f}",
        f"- Monthly Surplus (Income - Expenses): ₹{surplus:,.2f}",
        f"- Savings Rate: {savings_rate}%",
        f"- Budget Health Score: {health_score}/100",
        f"- Total Debits Tracked: ₹{total_debits:,.2f}",
        f"- Total Credits Tracked: ₹{total_credits:,.2f}",
        f"- Net Historical Cash Flow: ₹{net_cashflow:,.2f}",
    ]

    largest = context.get("largestExpense", {})
    if largest and largest.get("amount", 0) > 0:
        lines.append(f"- Largest Single Expense on Record: ₹{largest.get('amount', 0):,.2f} on {largest.get('date', 'recent')} ({largest.get('description', 'Expense')})")

    top_cats = context.get("topCategories", [])
    if top_cats:
        lines.append("\n### SPENDING BREAKDOWN BY CATEGORY (Highest to Lowest):")
        for cat in top_cats:
            lines.append(f"  * {cat.get('category')}: ₹{cat.get('total', 0):,.2f} across {cat.get('count', 0)} transaction(s)")

    recurring = context.get("recurringSubscriptions", [])
    if recurring:
        rec_total = sum(r.get("amount", 0) for r in recurring)
        lines.append(f"\n### RECURRING SUBSCRIPTIONS & BILLS (Total: ₹{rec_total:,.2f}/mo):")
        for r in recurring:
            lines.append(f"  * {r.get('description')}: ₹{r.get('amount', 0):,.2f} [{r.get('category')}]")

    goals = context.get("goals", [])
    if goals:
        lines.append("\n### ACTIVE FINANCIAL GOALS:")
        for g in goals:
            pct = g.get('percentComplete', 0)
            rem = g.get('remaining', 0)
            lines.append(f"  * Goal '{g.get('name')}': Saved ₹{g.get('currentAmount', 0):,.2f} of ₹{g.get('targetAmount', 0):,.2f} ({pct}% complete, ₹{rem:,.2f} needed, Target Deadline: {g.get('deadline', 'N/A')})")
    else:
        lines.append("\n### ACTIVE FINANCIAL GOALS: None currently set.")

    portfolio_count = context.get("portfolioAssetsCount", 0)
    portfolio_total = context.get("portfolioAssetsTotal", 0)
    if portfolio_count > 0:
        lines.append(f"\n### PORTFOLIO & INVESTMENTS:")
        lines.append(f"  * Total Tracked Assets: {portfolio_count} asset(s) worth ₹{portfolio_total:,.2f}")

    recent_txns = context.get("recentTransactions", [])
    if recent_txns:
        lines.append("\n### RECENT STATEMENT TRANSACTIONS:")
        for t in recent_txns[:15]:
            sign = "+" if t.get('amount', 0) > 0 else ""
            bal_str = f" [Bal: ₹{t.get('balance'):,.2f}]" if t.get('balance') is not None else ""
            lines.append(f"  * {t.get('date', '')}: {t.get('description', '')} | {sign}₹{t.get('amount', 0):,.2f} | Category: {t.get('category', 'Other')}{bal_str}")

    return "\n".join(lines)

def fallback_rule_based_response(message: str, user_context: dict) -> str:
    """Rich rule-based financial analysis engine when Gemini is unreachable."""
    msg = message.lower().strip()

    # Out-of-scope check
    if is_obviously_out_of_scope(msg):
        return generate_dynamic_refusal(message)

    # Monte Carlo simulation trigger: "monte carlo", "forecast portfolio", "simulate wealth", "10 year projection"
    if re.search(r"\b(monte\s*carlo|forecast\s*portfolio|simulate\s*(?:wealth|portfolio|growth)|wealth\s*projection)\b", msg):
        bal = max(50000.0, float(user_context.get("totalBalance", 100000.0)))
        inc = float(user_context.get("monthlyIncome", 50000.0))
        monthly_inv = max(5000.0, inc * 0.2)
        mc = run_monte_carlo_simulation(
            initial_investment=bal,
            monthly_contribution=monthly_inv,
            time_horizon_years=15,
            expected_annual_return=0.12,
            annual_volatility=0.16,
            num_simulations=500
        )
        s = mc["summary"]
        return (
            f"🎲 **Monte Carlo 15-Year Wealth Forecast (500 Stochastic Paths)**\n\n"
            f"Based on your starting balance of **₹{s['initialInvestment']:,.2f}** and an estimated monthly contribution of **₹{s['monthlyContribution']:,.2f}** at 12% expected return (16% volatility):\n\n"
            f"• **Median Projected Wealth (50th percentile)**: **₹{s['medianFinalWealth']:,.2f}**\n"
            f"• **Total Capital Invested**: ₹{s['totalPrincipalInvested']:,.2f}\n"
            f"• **Median Compounded Gains**: +₹{s['expectedGainMedian']:,.2f}\n"
            f"• **Bear Market Scenario (10th percentile)**: ₹{s['bearMarketP10']:,.2f}\n"
            f"• **Bull Market Scenario (90th percentile)**: ₹{s['bullMarketP90']:,.2f}\n\n"
            f"💡 *Simulated via FinSight Python NumPy Engine using Geometric Brownian Motion.*"
        )

    # Retirement & FIRE Readiness trigger: "retire", "retirement", "fire score", "pension"
    if re.search(r"\b(retire|retirement|fire\s*(?:score|readiness)|can\s*i\s*retire|when\s*can\s*i\s*retire)\b", msg):
        bal = max(50000.0, float(user_context.get("totalBalance", 500000.0)))
        exp = max(20000.0, float(user_context.get("monthlyExpenses", 40000.0)))
        inc = float(user_context.get("monthlyIncome", 60000.0))
        savings = max(5000.0, inc - exp if inc > exp else 20000.0)
        ret = calculate_retirement_projection(
            current_age=28,
            retirement_age=58,
            life_expectancy=85,
            current_savings=bal,
            monthly_savings=savings,
            current_monthly_expenses=exp
        )
        s = ret["summary"]
        return (
            f"🏖️ **Inflation-Adjusted Retirement Analysis (Target Age: {s['retirementAge']})**\n\n"
            f"• **FIRE Readiness Score**: **{s['fireReadinessScore']}%** ({'Fully Funded' if s['isFullyFunded'] else 'Needs Boost'})\n"
            f"• **Target Corpus Needed (at age {s['retirementAge']})**: ₹{s['targetCorpusNeeded']:,.2f}\n"
            f"• **Projected Corpus at Retirement**: ₹{s['projectedCorpusAtRetirement']:,.2f}\n"
            f"• **Future Monthly Expenses (at 6% inflation)**: ₹{s['futureMonthlyExpenseAtRetirement']:,.2f}/mo\n"
            f"• **Capital Longevity**: {s['capitalDepletionAge']}\n"
            f"• **Recommended Monthly SIP**: **₹{s['recommendedMonthlySavings']:,.2f}** (Current: ₹{s['currentMonthlySavings']:,.2f})\n\n"
            f"💡 *Calculated using the 4% Safe Withdrawal Rule & compounding inflation models.*"
        )

    # Affordability analysis: "can I afford 5000 / buy phone for 10000"
    afford_match = re.search(r"(?:can\s+i\s+afford|should\s+i\s+buy|can\s+i\s+buy).*?(\d[\d,]*(?:\.\d+)?)", msg)
    if afford_match:
        try:
            cost = float(afford_match.group(1).replace(",", ""))
            balance = user_context.get("totalBalance", 0)
            surplus = user_context.get("monthlySurplus", 0)
            income = user_context.get("monthlyIncome", 0)
            if cost > balance:
                return (
                    f"### ❌ Caution: Exceeds Current Liquid Balance\n\n"
                    f"Your verified current liquid balance is **₹{balance:,.2f}**, which is less than **₹{cost:,.2f}**.\n\n"
                    f"Making this purchase immediately is **not recommended** as it would cause an immediate cash-flow deficit before your next salary credit (monthly income: **₹{income:,.2f}**).\n\n"
                    f"Once your next salary is credited, you have a monthly surplus of **₹{surplus:,.2f}**, which will allow you to make this purchase safely."
                )
            elif cost <= surplus * 0.5:
                return (
                    f"### ✅ Yes, Comfortably Affordable!\n\n"
                    f"• **Purchase Cost**: ₹{cost:,.2f}\n"
                    f"• **Current Balance**: ₹{balance:,.2f} (Remaining after purchase: **₹{balance - cost:,.2f}**)\n"
                    f"• **Monthly Surplus**: ₹{surplus:,.2f}\n\n"
                    f"This expense fits comfortably within your monthly discretionary surplus without impacting your active savings goals."
                )
            else:
                return (
                    f"### ⚠️ Feasible with Caution\n\n"
                    f"You have sufficient liquid balance (**₹{balance:,.2f}**) to cover **₹{cost:,.2f}**, leaving you with **₹{balance - cost:,.2f}**.\n\n"
                    f"However, it consumes a large portion of your monthly surplus (₹{surplus:,.2f}). Make sure this doesn't delay your active goal milestones."
                )
        except Exception:
            pass

    # Account Balance & Liquidity
    if re.search(r"\b(balance|current balance|statement balance|total balance|money do i have|how much.*left)\b", msg):
        bal = user_context.get("totalBalance", 0)
        surplus = user_context.get("monthlySurplus", 0)
        return (
            f"Your current verified balance is **₹{bal:,.2f}**, synchronized directly with your latest bank statement closing ledger.\n\n"
            f"• **Monthly Income**: ₹{user_context.get('monthlyIncome', 0):,.2f}\n"
            f"• **Monthly Surplus**: ₹{surplus:,.2f}"
        )

    # Highest / Largest Expense
    if re.search(r"\b(highest|largest|biggest|maximum)\b.*?\b(expense|transaction|debit|payment|spend)\b", msg) or re.search(r"\bwhere did i spend the most\b", msg):
        largest = user_context.get("largestExpense", {})
        if largest and largest.get("amount", 0) > 0:
            return (
                f"Your largest single expense on record is **₹{largest.get('amount', 0):,.2f}** at **{largest.get('description')}** on **{largest.get('date')}**."
            )
        return "No significant expense transactions recorded yet."

    # Category Specific Spending: "how much did I spend on food / shopping / travel"
    cat_match = re.search(r"(?:spend|spent|spending).*?\b(food|dining|shopping|transport|travel|fuel|utilities|bills|rent|subscriptions|health|medical|education|atm|transfer)\b", msg)
    if cat_match:
        kw = cat_match.group(1).lower()
        top_cats = user_context.get("topCategories", [])
        matched = None
        for c in top_cats:
            if kw in c.get("category", "").lower():
                matched = c
                break
        if matched:
            return (
                f"You have spent **₹{matched.get('total', 0):,.2f}** on **{matched.get('category')}** across **{matched.get('count', 0)}** transactions on record."
            )
        return f"No spending categorized under **{kw.capitalize()}** was detected in your latest transactions."

    # Top Spending Categories Overall
    if re.search(r"\b(top.*categor|spending breakdown|where.*money go|categor.*spend)\b", msg):
        top_cats = user_context.get("topCategories", [])
        if top_cats:
            lines = [f"• **{c.get('category')}**: ₹{c.get('total', 0):,.2f} ({c.get('count')} txns)" for c in top_cats[:5]]
            return "Here are your top spending categories from your bank statements:\n" + "\n".join(lines)
        return "No categorized expenses recorded yet. Upload a bank statement to see your spending breakdown."

    # Subscriptions & Recurring
    if re.search(r"\b(subscription|subscriptions|recurring|netflix|spotify|bills)\b", msg):
        recurring = user_context.get("recurringSubscriptions", [])
        if recurring:
            rec_total = sum(r.get("amount", 0) for r in recurring)
            bullets = [f"• **{r.get('description')}**: ₹{r.get('amount', 0):,.2f}/mo" for r in recurring]
            return f"You have **{len(recurring)}** recurring subscriptions totaling **₹{rec_total:,.2f}/month**:\n" + "\n".join(bullets)
        return "No recurring subscriptions detected in your transactions."

    # Budget Health Score
    if re.search(r"\b(health score|budget health|score|financial health)\b", msg):
        score = user_context.get("budgetHealthScore", 50)
        return (
            f"Your current **Budget Health Score is {score}/100**.\n\n"
            f"• **Savings Rate**: {user_context.get('savingsPercent', 0)}%\n"
            f"• **Monthly Surplus**: ₹{user_context.get('monthlySurplus', 0):,.2f}\n\n"
            f"To boost your score above 90, consider reducing spending in your top categories and contributing regularly to your active goals."
        )

    # Income / Salary
    if re.search(r"\b(income|salary|earn|credits)\b", msg):
        inc = user_context.get("monthlyIncome", 0)
        credits = user_context.get("totalCredits", 0)
        return f"Your monthly income is **₹{inc:,.2f}**, with total statement credits of **₹{credits:,.2f}**."

    # Expenses overall
    if re.search(r"\b(expense|expenses|total spend|total spent|debits)\b", msg):
        exp = user_context.get("monthlyExpenses", 0)
        debits = user_context.get("totalDebits", 0)
        return f"Your recorded monthly expenses are **₹{exp:,.2f}**, with total tracked debits of **₹{debits:,.2f}**."

    # Financial Goals
    if re.search(r"\b(goal|goals|target|savings target|deadlines)\b", msg):
        goals = user_context.get("goals", [])
        if goals:
            bullets = [
                f"• **{g.get('name')}**: Saved ₹{g.get('currentAmount', 0):,.2f} of ₹{g.get('targetAmount', 0):,.2f} ({g.get('percentComplete', 0)}% complete, ₹{g.get('remaining', 0):,.2f} needed, Target Deadline: {g.get('deadline', 'N/A')})"
                for g in goals
            ]
            return "Here are your active financial goals:\n" + "\n".join(bullets)
        return "You currently don't have any active goals saved in your FinSight account. You can set one up anytime on the **Goals** page (`/goals`) to track targets with visual progress bars."

    # Recent Transactions
    if re.search(r"\b(recent transaction|transactions|last transaction|history)\b", msg):
        recent = user_context.get("recentTransactions", [])
        if recent:
            bullets = [
                f"• {t.get('date')}: **{t.get('description')}** ({'+' if t.get('amount', 0) > 0 else ''}₹{t.get('amount', 0):,.2f}) [{t.get('category')}]"
                for t in recent[:6]
            ]
            return "Here are your recent transactions:\n" + "\n".join(bullets)
        return "No recent transactions found."

    # Uploads / Statement limit
    if re.search(r"\b(upload|statement|pdf|limit|how many uploads)\b", msg):
        plan = user_context.get("plan", "basic").capitalize()
        uploads_left = user_context.get("uploadsRemaining", "Unlimited")
        return (
            f"You are on the **{plan}** plan with **{uploads_left}** statement upload(s) remaining this month.\n\n"
            f"To upload: go to the **Transactions** page (`/transactions`), drag and drop your PDF bank statement (SBI, HDFC, ICICI, Kotak, Axis, etc.), and enter your PDF password if locked."
        )

    # Plans and pricing
    if re.search(r"\b(plan|plans|pricing|upgrade|pro|enterprise|wealth|cost)\b", msg):
        return (
            "FinSight offers three plans:\n"
            "• **Basic (Free)**: Dashboard, charts, manual entry, up to 3 PDF uploads/month.\n"
            "• **Pro (₹99/mo)**: Unlimited PDF uploads, AI-powered Insights, recurring payment alerts, priority support.\n"
            "• **Wealth (₹149/mo)**: All Pro features + Multi-asset portfolio tracker, live stock quotes, AI stock picks & SIP planner."
        )

    # Features
    if re.search(r"\b(feature|features|what can you do|how does finsight work|portfolio|analytics)\b", msg):
        return (
            "FinSight features:\n"
            "• **Dashboard**: Summary of balance, cash flow, and financial health score.\n"
            "• **Transactions**: AI-powered PDF bank statement parsing and categorization.\n"
            "• **Analytics**: Spending breakdown, trends, and recurring subscription tracking.\n"
            "• **Portfolio**: Multi-asset tracking and live equity predictions.\n"
            "• **Goals**: Target savings milestones with visual progress tracking.\n"
            "• **Reports & Export**: Download statements and reports in CSV, PDF, or JSON."
        )

    # Greetings
    if any(k in msg for k in ["hello", "hi", "hey", "help", "finsight"]):
        name = user_context.get("name", "there")
        bal = user_context.get("totalBalance", 0)
        return f"Hello {name}! I am FinSight AI. Your verified balance is **₹{bal:,.2f}**. You can ask me anything about your spending, recent transactions, goals, affordability checks, or platform features."

    return generate_dynamic_refusal(message)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "FinSight AI Chatbot Service (Python)",
        "geminiConfigured": bool(genai_client),
        "port": PORT
    })


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()
    conversation_history = data.get("conversationHistory", [])
    user_context = data.get("userContext", {})

    print(f"[FinSight Chatbot] Incoming query: '{user_message}' | User: {user_context.get('email', 'anonymous')}")

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    # 1. Immediate Pre-filter check for obvious out-of-scope requests (only when Gemini client is unavailable)
    if not genai_client and is_obviously_out_of_scope(user_message):
        return jsonify({
            "reply": generate_dynamic_refusal(user_message),
            "provider": "python-scope-guardrail",
            "isOutOfScope": True
        })

    # 2. Attempt Google Gemini Generation if client is available
    if genai_client:
        user_context_str = build_user_context_str(user_context)

        prompt = f"""{FINSIGHT_SYSTEM_KNOWLEDGE}

═══════════════════════════════════════════════
AUTHENTICATED USER CONTEXT (REAL-TIME DATA):
═══════════════════════════════════════════════
{user_context_str}

═══════════════════════════════════════════════
USER'S QUESTION:
═══════════════════════════════════════════════
{user_message}"""

        candidate_models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
        for model_name in candidate_models:
            try:
                response = genai_client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                reply_text = response.text.strip() if response and response.text else ""
                if reply_text:
                    # Clean up quotes if wrapped
                    if reply_text.startswith('"') and reply_text.endswith('"'):
                        reply_text = reply_text[1:-1]

                    is_out_of_scope = False
                    if reply_text.startswith("[OUT_OF_SCOPE]"):
                        reply_text = reply_text[len("[OUT_OF_SCOPE]"):].strip()
                        is_out_of_scope = True
                    elif any(phrase in reply_text.lower() for phrase in [
                        "as finsight's dedicated",
                        "as your finsight",
                        "only answer questions related to finsight",
                        "only answer questions related to the finsight",
                        "only handle questions related to your finsight",
                        "dedicated to helping you manage your finsight",
                        "cannot assist with coding",
                        "cannot assist with programming",
                        "cannot provide sports",
                        "cannot check the weather",
                        "cannot provide weather",
                        "cannot answer questions about world",
                        "cannot provide cooking",
                        "cannot assist with cooking"
                    ]) and not is_financial_or_account_query(user_message):
                        is_out_of_scope = True

                    return jsonify({
                        "reply": reply_text,
                        "provider": f"python-gemini ({model_name})",
                        "isOutOfScope": is_out_of_scope
                    })
            except Exception as e:
                print(f"[FinSight Chatbot] Model {model_name} error: {e}", flush=True)
                continue

    # 3. Fallback to rich rule-based financial analysis engine
    fallback_reply = fallback_rule_based_response(user_message, user_context)
    is_fallback_out = (
        fallback_reply.startswith("I cannot") or
        fallback_reply.startswith("I don't") or
        "as finsight's dedicated" in fallback_reply.lower()
    )
    return jsonify({
        "reply": fallback_reply,
        "provider": "python-knowledge-engine",
        "isOutOfScope": is_fallback_out
    })


# ═════════════════════════════════════════════════════════════════════
# PANDAS & NUMPY FINANCIAL SIMULATION SUITE
# ═════════════════════════════════════════════════════════════════════

@app.route("/api/simulations/status", methods=["GET"])
def simulation_status():
    import numpy as np
    import pandas as pd
    import openpyxl
    return jsonify({
        "status": "healthy",
        "service": "FinSight Python Analytics Engine",
        "libraries": {
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "openpyxl": openpyxl.__version__,
        },
        "capabilities": [
            "monte_carlo_simulation",
            "inflation_adjusted_retirement_projection",
            "automated_csv_excel_bank_statement_parsing"
        ]
    })


@app.route("/api/simulations/monte-carlo", methods=["POST"])
def monte_carlo_api():
    data = request.get_json(silent=True) or {}
    try:
        initial_investment = float(data.get("initialInvestment", 100000.0))
        monthly_contribution = float(data.get("monthlyContribution", 15000.0))
        time_horizon_years = int(data.get("timeHorizonYears", 15))
        expected_annual_return = float(data.get("expectedAnnualReturn", 0.12))
        annual_volatility = float(data.get("annualVolatility", 0.16))
        num_simulations = int(data.get("numSimulations", 500))
        target_goal = float(data.get("targetGoal", 5000000.0))
        
        result = run_monte_carlo_simulation(
            initial_investment=initial_investment,
            monthly_contribution=monthly_contribution,
            time_horizon_years=time_horizon_years,
            expected_annual_return=expected_annual_return,
            annual_volatility=annual_volatility,
            num_simulations=num_simulations,
            target_goal=target_goal
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Monte Carlo simulation failed: {str(e)}"}), 400


@app.route("/api/simulations/retirement", methods=["POST"])
def retirement_api():
    data = request.get_json(silent=True) or {}
    try:
        current_age = int(data.get("currentAge", 28))
        retirement_age = int(data.get("retirementAge", 58))
        life_expectancy = int(data.get("lifeExpectancy", 85))
        current_savings = float(data.get("currentSavings", 500000.0))
        monthly_savings = float(data.get("monthlySavings", 25000.0))
        current_monthly_expenses = float(data.get("currentMonthlyExpenses", 40000.0))
        pre_retirement_return = float(data.get("preRetirementReturn", 0.11))
        post_retirement_return = float(data.get("postRetirementReturn", 0.08))
        inflation_rate = float(data.get("inflationRate", 0.06))
        safe_withdrawal_rate = float(data.get("safeWithdrawalRate", 0.04))
        
        result = calculate_retirement_projection(
            current_age=current_age,
            retirement_age=retirement_age,
            life_expectancy=life_expectancy,
            current_savings=current_savings,
            monthly_savings=monthly_savings,
            current_monthly_expenses=current_monthly_expenses,
            pre_retirement_return=pre_retirement_return,
            post_retirement_return=post_retirement_return,
            inflation_rate=inflation_rate,
            safe_withdrawal_rate=safe_withdrawal_rate
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Retirement calculation failed: {str(e)}"}), 400


@app.route("/api/simulations/parse-statement", methods=["POST"])
def parse_statement_api():
    file = request.files.get("statement") or request.files.get("file")
    if file:
        filename = file.filename or "statement.csv"
        file_bytes = file.read()
    else:
        data = request.get_json(silent=True) or {}
        raw_content = data.get("content", "")
        filename = data.get("filename", "statement.csv")
        if not raw_content:
            return jsonify({"error": "No statement file or content provided"}), 400
        file_bytes = raw_content.encode("utf-8")
        
    try:
        result = parse_statement_file(file_bytes=file_bytes, filename=filename)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Statement parsing failed: {str(e)}"}), 400


if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print(f"[FinSight Chatbot] Server running on http://127.0.0.1:{PORT}")
    app.run(host="0.0.0.0", port=PORT, threaded=True, debug=False)
