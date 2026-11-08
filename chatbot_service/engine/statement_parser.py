import io
import re
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

# Standard FinSight 12-category regex mapping rules
CATEGORY_RULES = [
    (r"\b(salary|payroll|dividend|interest\s*credit|neft\s*cr|imps\s*cr|cashback|refund|stipend)\b", "Income"),
    (r"\b(zomato|swiggy|mcdonald|starbucks|kfc|burger|pizza|restaurant|cafe|bakery|diner|eats|food|grocery|blinkit|zepto|instamart|bigbasket)\b", "Food"),
    (r"\b(amazon|flipkart|myntra|zara|h&m|ajio|meesho|retail|mall|store|apparel|shopping|electronics|croma|reliance\s*digital)\b", "Shopping"),
    (r"\b(uber|ola|rapido|metro|petrol|diesel|fuel|shell|hpcl|bpcl|ioc|irctc|flight|indigo|air\s*india|toll|fastag|parking|auto)\b", "Transport"),
    (r"\b(electricity|water|gas|broadband|wifi|jio|airtel|vi\s*bill|bescom|tneb|recharge|dth|tata\s*play|billdesk)\b", "Utilities"),
    (r"\b(netflix|spotify|prime|hotstar|youtube|cinema|pvr|inox|movie|gaming|steam|playstation|disney)\b", "Entertainment"),
    (r"\b(rent|maintenance|society|housing|mortgage|lease|urban\s*company|home\s*depot|ikea)\b", "Housing"),
    (r"\b(hospital|clinic|pharmacy|apollo|medplus|1mg|doctor|dental|lab|diagnostic|health|insurance|max\s*bupa|star\s*health)\b", "Health"),
    (r"\b(school|college|university|tuition|udemy|coursera|books|exam|fees|coaching|allen|byju)\b", "Education"),
    (r"\b(zerodha|groww|upstox|mutual\s*fund|sip|etf|gold|nps|ppf|crypto|coinbase|binance|angel\s*one)\b", "Investment"),
    (r"\b(upi/|upi-|transfer\s*to|transfer\s*from|neft\s*dr|imps\s*dr|rtgs|fund\s*transfer|p2p|self\s*transfer)\b", "Transfer"),
]

def auto_categorize(narration: str, amount: float) -> str:
    """Categorizes a transaction narration based on keyword rules."""
    text = str(narration).lower()
    if amount > 0 and re.search(r"\b(salary|dividend|stipend|interest)\b", text):
        return "Income"
        
    for pattern, category in CATEGORY_RULES:
        if re.search(pattern, text):
            return category
            
    if amount > 0:
        return "Income"
    return "Other"

def clean_merchant_name(narration: str) -> str:
    """Extracts a clean merchant or recipient name from bank narrations and UPI tags."""
    raw = str(narration).strip()
    
    # UPI formats e.g., UPI/2312414/Swiggy/swiggy@icici/CR
    upi_match = re.search(r"upi(?:/|-)(?:cr|dr)?(?:/|-)?(?:\d+)?(?:/|-)?([a-zA-Z0-9\s._-]+)", raw, re.I)
    if upi_match:
        cand = upi_match.group(1).replace("/", " ").replace("-", " ").strip()
        # Remove trailing transaction ref numbers
        cand = re.sub(r"\b\d{6,}\b", "", cand).strip()
        if len(cand) >= 3 and not cand.isdigit():
            return cand.title()
            
    # POS/Card formats e.g., POS 401241 STARBUCKS BANGALORE
    pos_match = re.search(r"(?:pos|e-com|inb|card)\s*(?:\d+)?\s*([a-zA-Z\s]+)", raw, re.I)
    if pos_match:
        cand = pos_match.group(1).strip()
        if len(cand) >= 3:
            return cand.title()
            
    # Fallback to cleaned original narration
    cleaned = re.sub(r"[\t\r\n]+", " ", raw)
    cleaned = re.sub(r"[^a-zA-Z0-9\s./-]", "", cleaned)
    return cleaned[:40].strip().title()

def parse_statement_file(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Ingests CSV or Excel bytes using Pandas with multi-bank header auto-discovery.
    Standardizes records and extracts deep accounting statistics.
    """
    name_lower = filename.lower()
    df: Optional[pd.DataFrame] = None
    
    # 1. Read into Pandas with header discovery
    if name_lower.endswith(".csv"):
        # Detect delimiter and skiprows
        for sep in [",", ";", "\t", "|"]:
            try:
                # Try reading top 40 rows to detect header
                sample = pd.read_csv(io.BytesIO(file_bytes), sep=sep, nrows=40, header=None, dtype=str)
                # Find row with keywords like 'date', 'amount', 'narration', 'debit', 'balance'
                header_idx = 0
                for idx, row in sample.iterrows():
                    row_str = " ".join([str(val).lower() for val in row.values if pd.notna(val)])
                    if ("date" in row_str or "txn" in row_str) and ("amount" in row_str or "debit" in row_str or "particulars" in row_str or "narration" in row_str or "description" in row_str):
                        header_idx = idx
                        break
                
                df = pd.read_csv(io.BytesIO(file_bytes), sep=sep, skiprows=header_idx, dtype=str)
                if len(df.columns) >= 3:
                    break
            except Exception:
                continue
                
    elif name_lower.endswith((".xlsx", ".xls")):
        try:
            excel_file = pd.ExcelFile(io.BytesIO(file_bytes))
            first_sheet = excel_file.sheet_names[0]
            sample = excel_file.parse(first_sheet, nrows=40, header=None, dtype=str)
            
            header_idx = 0
            for idx, row in sample.iterrows():
                row_str = " ".join([str(val).lower() for val in row.values if pd.notna(val)])
                if ("date" in row_str or "txn" in row_str) and ("amount" in row_str or "debit" in row_str or "particulars" in row_str or "description" in row_str):
                    header_idx = idx
                    break
                    
            df = excel_file.parse(first_sheet, skiprows=header_idx, dtype=str)
        except Exception as e:
            raise ValueError(f"Failed to read Excel workbook: {str(e)}")
    else:
        raise ValueError("Unsupported format. Please upload a CSV (.csv) or Excel (.xlsx, .xls) bank statement.")

    if df is None or df.empty or len(df.columns) < 2:
        raise ValueError("Could not parse columns from the uploaded bank statement file.")

    # Clean column headers
    df.columns = [re.sub(r"[^a-zA-Z0-9_]", "", str(c).strip().lower()) for c in df.columns]
    
    # 2. Map Columns to Standard Canonical Schema
    col_date = None
    col_desc = None
    col_debit = None
    col_credit = None
    col_amount = None
    col_balance = None
    
    for c in df.columns:
        if not col_date and any(k in c for k in ["date", "txndate", "valdate", "valuedate", "posting"]):
            col_date = c
        elif not col_desc and any(k in c for k in ["desc", "narration", "particular", "detail", "remark", "transaction"]):
            col_desc = c
        elif not col_debit and any(k in c for k in ["debit", "withdrawal", "dr", "paidout", "expense"]):
            col_debit = c
        elif not col_credit and any(k in c for k in ["credit", "deposit", "cr", "paidin", "income"]):
            col_credit = c
        elif not col_amount and any(k in c for k in ["amount", "txn衝", "sum", "total"]):
            col_amount = c
        elif not col_balance and any(k in c for k in ["balance", "bal", "runningbal", "net"]):
            col_balance = c

    # Fallback to column index if names weren't matched
    if not col_date and len(df.columns) > 0:
        col_date = df.columns[0]
    if not col_desc and len(df.columns) > 1:
        col_desc = df.columns[1]
    if not col_amount and not col_debit and len(df.columns) > 2:
        col_amount = df.columns[2]

    # 3. Clean and Extract Row Records
    records: List[Dict[str, Any]] = []
    
    def clean_num(val: Any) -> float:
        if pd.isna(val):
            return 0.0
        s = str(val).replace(",", "").replace("$", "").replace("₹", "").replace(" ", "").strip()
        # Handle trailing negative sign or parenthesis e.g. (100.00) or 100.00-
        if s.startswith("(") and s.endswith(")"):
            s = "-" + s[1:-1]
        elif s.endswith("-"):
            s = "-" + s[:-1]
        try:
            return float(s)
        except ValueError:
            return 0.0

    for idx, row in df.iterrows():
        raw_date = str(row.get(col_date, "")).strip() if col_date else ""
        raw_desc = str(row.get(col_desc, "")).strip() if col_desc else "Transaction"
        
        # Skip completely empty filler rows
        if not raw_date or raw_date.lower() in ["nan", "none", "", "date"]:
            continue

        # Determine Amount
        amount = 0.0
        txn_type = "expense"
        
        if col_debit and col_credit:
            dr = abs(clean_num(row.get(col_debit, 0)))
            cr = abs(clean_num(row.get(col_credit, 0)))
            if cr > 0:
                amount = cr
                txn_type = "income"
            else:
                amount = -dr
                txn_type = "expense"
        elif col_amount:
            val = clean_num(row.get(col_amount, 0))
            if val > 0:
                amount = val
                txn_type = "income"
            else:
                amount = val
                txn_type = "expense"
        elif col_debit:
            dr = abs(clean_num(row.get(col_debit, 0)))
            amount = -dr
            txn_type = "expense"

        if amount == 0.0:
            continue
            
        balance = clean_num(row.get(col_balance, 0)) if col_balance else None
        category = auto_categorize(raw_desc, amount)
        merchant = clean_merchant_name(raw_desc)
        
        records.append({
            "id": f"csv-tx-{idx + 1}",
            "date": raw_date,
            "description": merchant,
            "originalNarration": raw_desc[:120],
            "amount": round(amount, 2),
            "type": txn_type,
            "category": category,
            "balance": round(balance, 2) if balance is not None else None,
        })

    if not records:
        raise ValueError("No valid transaction rows found in the parsed statement.")

    # 4. Compute Aggregate Data Science Statistics
    amounts = [r["amount"] for r in records]
    inflows = [a for a in amounts if a > 0]
    outflows = [abs(a) for a in amounts if a < 0]
    
    total_income = float(sum(inflows))
    total_expenses = float(sum(outflows))
    net_cashflow = total_income - total_expenses
    
    # Category totals
    cat_distribution: Dict[str, float] = {}
    for r in records:
        c = r["category"]
        cat_distribution[c] = round(cat_distribution.get(c, 0.0) + abs(r["amount"]), 2)

    return {
        "status": "success",
        "filename": filename,
        "totalTransactions": len(records),
        "summary": {
            "totalIncome": round(total_income, 2),
            "totalExpenses": round(total_expenses, 2),
            "netCashFlow": round(net_cashflow, 2),
            "savingsRatePct": round((net_cashflow / total_income * 100), 1) if total_income > 0 else 0.0,
            "averageTransaction": round(float(np.mean(np.abs(amounts))), 2),
            "largestExpense": round(max(outflows) if outflows else 0.0, 2),
            "categoryBreakdown": cat_distribution,
        },
        "transactions": records
    }

