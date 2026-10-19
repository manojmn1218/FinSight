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

# Load environment variables from the project root .env
ROOT_DIR = Path(__file__).resolve().parent.parent
dotenv.load_dotenv(dotenv_path=ROOT_DIR / ".env")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PORT = int(os.getenv("CHATBOT_PORT", "5005"))

# Initialize Gemini Client if key exists with robust timeout
genai_client = None
if GEMINI_API_KEY:
    try:
        from google import genai
        genai_client = genai.Client(api_key=GEMINI_API_KEY)
        print("[FinSight Chatbot] Gemini client initialized successfully.", flush=True)
    except Exception as e:
        print(f"[FinSight Chatbot] Warning: Failed to initialize Google GenAI client: {e}", flush=True)

def generate_dynamic_refusal(message: str) -> str:
    """Generates a polite, natural refusal statement tailored directly to what was asked."""
    msg = message.lower().strip()
    if re.search(r"\b(weather|forecast|temperature|rain|climate)\b", msg):
        match = re.search(r"\b(?:weather|forecast|temperature|rain)\s+(?:in|for|at)?\s*([a-zA-Z\s]+)", message, re.I)
        loc = f" in {match.group(1).strip()}" if match else ""
        return f"I cannot provide weather updates{loc}. As FinSight's dedicated AI assistant, I only answer questions related to the FinSight website, its features, and your personal account details. Let me know if you would like to check your balance, recent expenses, or savings goals instead!"
    
    if re.search(r"\b(write\s+(?:python|java|c\+\+|javascript|typescript|code|script)|code|coding|algorithm|reverse\s+a\s+(?:string|linked|array)|bug|function)\b", msg):
        return "I cannot assist with coding, programming, or writing software scripts. As FinSight's dedicated assistant, my role is strictly to help you manage your financial accounts, statement transactions, and budget health on FinSight. How can I help with your finances today?"
    
    if re.search(r"\b(cricket|football|fifa|ipl|olympics|sports|world cup|match|score|team|tournament)\b", msg):
        return "I don't have information on sports match scores, tournament winners, or athletic competitions. As FinSight's dedicated AI assistant, I only answer questions regarding the FinSight platform and your personal financial records. Feel free to ask about your spending breakdown or current balance!"
    
    if re.search(r"\b(recipe|cook|bake|ingredients|biryani|dish|cuisine|food recipe)\b", msg):
        return "I cannot assist with cooking recipes or culinary questions. As FinSight's financial assistant, I am designed to assist you with your bank statements, expense tracking, and savings milestones."
    
    if re.search(r"\b(movie|film|actor|actress|cinema|song|lyrics|singer|album|celebrity)\b", msg):
        return "I cannot provide information about movies, celebrities, or entertainment. As FinSight's dedicated AI co-pilot, I only answer questions related to the FinSight website and your personal financial accounts."
    
    if re.search(r"\b(president|prime minister|politics|election|government|parliament)\b", msg):
        return "I cannot answer questions regarding world politics or government officials. As FinSight's dedicated assistant, my role is strictly focused on your FinSight account and financial health."
    
    if re.search(r"\b(capital of|where is|continent|geography|country of)\b", msg):
        return "I cannot answer questions about world geography, countries, or capitals. As FinSight's dedicated AI assistant, I only answer questions related to the FinSight website, its features, and your personal account details."
    
    if re.search(r"\b(joke|poem|story|riddle)\b", msg):
        return "I cannot generate jokes, poems, or stories. As FinSight's dedicated financial assistant, I specialize in your account balances, spending breakdowns, and financial health."

    snippet = message.strip()[:50]
    return f"I cannot answer questions regarding '{snippet}'. As FinSight's dedicated AI assistant, I only answer questions related to the FinSight website, its features, and your personal account details. Let me know if you need help with your budget, transactions, or goals!"

# ═══════════════════════════════════════════════
# Comprehensive FinSight System & Financial Training Prompt
# ═══════════════════════════════════════════════
FINSIGHT_SYSTEM_KNOWLEDGE = f"""
You are FinSight AI, the premier financial intelligence co-pilot and dedicated assistant for FinSight — a sophisticated personal finance management platform.

YOUR IDENTITY & ROLE:
- You are an expert personal financial advisor, accountant, and platform guide for FinSight users.
- You have direct, real-time access to the authenticated user's financial profile, statement transactions, category breakdowns, goals, and membership status (provided in USER CONTEXT).
- Your answers must be astute, mathematically precise, empathetic, structured, and formatted with Indian Rupee (₹) currency notation and commas.

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
   - How to upload bank statements, password-protected PDFs, supported banks (SBI, HDFC, ICICI, Axis, Kotak, etc.), statement closing balance auto-sync, plans (Basic, Pro, Enterprise), and export options.

═══════════════════════════════════════════════
2. OUT-OF-SCOPE REFUSAL (MUST BE TAILORED ACCORDING TO THE QUESTION):
═══════════════════════════════════════════════
If and ONLY IF the user asks about an external topic that is completely unrelated to FinSight, their finances, money, budget, purchases, or account:
(e.g., world trivia, programming code, weather, sports, cooking recipes, movies, politics, etc.):

CRITICAL REQUIREMENT - NEVER REPEAT THE SAME CANNED GENERIC SENTENCE:
- Do NOT just output the exact same robotic sentence every time!
- Instead, give a polite, natural response tailored ACCORDING TO THE SPECIFIC QUESTION OR SUBJECT ASKED:
  1. Acknowledge what was asked (e.g. explain that you cannot check weather conditions for that city, write code/scripts, give sports tournament updates, share cooking recipes, answer geography/trivia questions, etc.).
  2. State that as FinSight's dedicated AI assistant, you only answer questions related to the FinSight platform, its features, and their personal account details.
  3. Politely invite them to ask about their balances, transactions, spending analysis, affordability checks, or savings goals instead.
  4. Prefix your refusal response with `[OUT_OF_SCOPE] ` so the application can classify the domain boundary.

═══════════════════════════════════════════════
FEW-SHOT EXAMPLES OF TAILORED REFUSALS:
═══════════════════════════════════════════════
User: "What is the weather in London today?"
Assistant: "[OUT_OF_SCOPE] I cannot check the weather conditions in London for you. As FinSight's dedicated AI assistant, I only answer questions related to the FinSight platform, its features, and your personal account details. Feel free to ask me about your current balances, spending categories, or savings targets instead!"

User: "Write a python script to reverse a linked list"
Assistant: "[OUT_OF_SCOPE] While writing Python code for data structures is a useful programming task, as FinSight's dedicated AI assistant, I cannot assist with coding or software scripts. My role is strictly to help you manage your financial accounts, statement transactions, and budget health on FinSight. How can I help with your finances today?"

User: "Who won the cricket world cup?"
Assistant: "[OUT_OF_SCOPE] I don't have information on cricket tournament winners or sports match results. As FinSight's dedicated AI co-pilot, I only answer questions regarding the FinSight platform and your personal account records. Feel free to ask about your spending breakdown or current balance!"

User: "How do I cook paneer butter masala?"
Assistant: "[OUT_OF_SCOPE] While paneer butter masala is a delicious dish, as FinSight's dedicated AI assistant, I cannot provide cooking recipes or culinary advice. My focus is entirely on your FinSight account, budgets, and financial tracking. Feel free to ask about your expenses or affordability checks instead!"

User: "What is the capital of France?"
Assistant: "[OUT_OF_SCOPE] While Paris is great for geography, as FinSight's dedicated AI assistant, I only handle questions related to your personal finances, spending, budgets, and FinSight features. Feel free to ask me about your current balance, budget health, or if you can afford a specific purchase instead!"
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
    if re.search(r"\b(plan|plans|pricing|upgrade|pro|enterprise|cost)\b", msg):
        return (
            "FinSight offers three plans:\n"
            "• **Basic (Free)**: Dashboard, charts, manual entry, up to 3 PDF uploads/month.\n"
            "• **Pro (₹349/mo)**: Unlimited PDF uploads, AI-powered Insights, recurring payment alerts, priority support.\n"
            "• **Enterprise (₹999/mo)**: All Pro features + Multi-asset portfolio tracker, live stock quotes, AI stock picks & SIP planner."
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

        candidate_models = ["gemini-3.5-flash-lite"]
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


if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print(f"[FinSight Chatbot] Server running on http://127.0.0.1:{PORT}")
    app.run(host="0.0.0.0", port=PORT, threaded=True, debug=False)
