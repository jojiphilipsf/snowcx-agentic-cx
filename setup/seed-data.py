#!/usr/bin/env python3
"""
SnowCX — Agentic CX Intelligence
Data Generator — Creates 16 demo tables with 500 customers and related data.

Prerequisites:
  - Python 3.9+
  - pip install snowflake-connector-python pandas numpy
  - A Snowflake connection configured in ~/.snowflake/connections.toml
    OR set environment variables (see below)

Usage:
  # Using a named connection (recommended)
  SNOWFLAKE_CONNECTION_NAME=my_connection python setup/seed-data.py

  # Using environment variables
  SNOWFLAKE_ACCOUNT=xxx SNOWFLAKE_USER=yyy SNOWFLAKE_PASSWORD=zzz \\
    SNOWFLAKE_ROLE=SYSADMIN SNOWFLAKE_WAREHOUSE=COMPUTE_WH \\
    python setup/seed-data.py

Environment Variables:
  SNOWFLAKE_CONNECTION_NAME  Named connection from connections.toml (preferred)
  SNOWFLAKE_DB_SCHEMA        Target schema (default: TELECOM_CX.DATA)
  SNOWFLAKE_ROLE             Role to use (default: SYSADMIN)
  SNOWFLAKE_WAREHOUSE        Warehouse (default: TELECOM_CX_WH)
"""

import os
import random
import hashlib
from datetime import datetime, timedelta
import snowflake.connector
import pandas as pd
import numpy as np

random.seed(42)
np.random.seed(42)

CONN_NAME = os.getenv("SNOWFLAKE_CONNECTION_NAME", "")
_db_schema = os.getenv("SNOWFLAKE_DB_SCHEMA", "TELECOM_CX.DATA")
DATABASE = _db_schema.split(".")[0]
SCHEMA = _db_schema.split(".")[1] if "." in _db_schema else _db_schema
ROLE = os.getenv("SNOWFLAKE_ROLE", "SYSADMIN")
WAREHOUSE = os.getenv("SNOWFLAKE_WAREHOUSE", "TELECOM_CX_WH")
NUM_CUSTOMERS = 500
NUM_INCIDENTS = 25
NUM_CALL_RECORDINGS = 60

FIRST_NAMES = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
    "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Christopher", "Karen", "Daniel", "Lisa", "Matthew", "Nancy",
    "Anthony", "Betty", "Mark", "Margaret", "Donald", "Sandra", "Steven", "Ashley",
    "Paul", "Dorothy", "Andrew", "Kimberly", "Joshua", "Emily", "Kenneth", "Donna",
    "Kevin", "Michelle", "Brian", "Carol", "George", "Amanda", "Timothy", "Melissa",
    "Ronald", "Deborah", "Edward", "Stephanie", "Jason", "Rebecca", "Jeffrey", "Sharon",
    "Ryan", "Laura", "Jacob", "Cynthia", "Gary", "Kathleen", "Nicholas", "Amy",
    "Eric", "Angela", "Jonathan", "Shirley", "Stephen", "Anna", "Larry", "Brenda",
    "Justin", "Pamela", "Scott", "Emma", "Brandon", "Nicole", "Benjamin", "Helen",
    "Samuel", "Samantha", "Raymond", "Katherine", "Gregory", "Christine", "Frank", "Debra",
    "Alexander", "Rachel", "Patrick", "Carolyn", "Jack", "Janet", "Dennis", "Catherine",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
    "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
    "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
    "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson",
    "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes",
    "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster",
]

CITIES = [
    ("New York", "NY"), ("Los Angeles", "CA"), ("Chicago", "IL"), ("Houston", "TX"),
    ("Phoenix", "AZ"), ("Philadelphia", "PA"), ("San Antonio", "TX"), ("San Diego", "CA"),
    ("Dallas", "TX"), ("San Jose", "CA"), ("Austin", "TX"), ("Jacksonville", "FL"),
    ("Fort Worth", "TX"), ("Columbus", "OH"), ("Charlotte", "NC"), ("Indianapolis", "IN"),
    ("San Francisco", "CA"), ("Seattle", "WA"), ("Denver", "CO"), ("Nashville", "TN"),
    ("Portland", "OR"), ("Las Vegas", "NV"), ("Memphis", "TN"), ("Louisville", "KY"),
    ("Baltimore", "MD"), ("Milwaukee", "WI"), ("Albuquerque", "NM"), ("Tucson", "AZ"),
    ("Fresno", "CA"), ("Sacramento", "CA"), ("Atlanta", "GA"), ("Miami", "FL"),
]

PLANS = [
    {"name": "Basic 5GB", "price": 35.0, "data_gb": 5, "tier": "Basic"},
    {"name": "Standard 15GB", "price": 55.0, "data_gb": 15, "tier": "Standard"},
    {"name": "Premium 50GB", "price": 75.0, "data_gb": 50, "tier": "Premium"},
    {"name": "Unlimited Plus", "price": 90.0, "data_gb": 999, "tier": "Premium"},
    {"name": "Family Share 30GB", "price": 120.0, "data_gb": 30, "tier": "Family"},
    {"name": "Business Pro", "price": 65.0, "data_gb": 25, "tier": "Business"},
]

DEVICES = [
    {"model": "iPhone 15 Pro Max", "brand": "Apple", "os": "iOS 17", "age_months": 3},
    {"model": "iPhone 15 Pro", "brand": "Apple", "os": "iOS 17", "age_months": 5},
    {"model": "iPhone 14", "brand": "Apple", "os": "iOS 17", "age_months": 14},
    {"model": "iPhone 13", "brand": "Apple", "os": "iOS 16", "age_months": 26},
    {"model": "iPhone 12", "brand": "Apple", "os": "iOS 16", "age_months": 38},
    {"model": "Galaxy S24 Ultra", "brand": "Samsung", "os": "Android 14", "age_months": 2},
    {"model": "Galaxy S24", "brand": "Samsung", "os": "Android 14", "age_months": 4},
    {"model": "Galaxy S23", "brand": "Samsung", "os": "Android 14", "age_months": 14},
    {"model": "Galaxy A54", "brand": "Samsung", "os": "Android 13", "age_months": 10},
    {"model": "Pixel 8 Pro", "brand": "Google", "os": "Android 14", "age_months": 5},
    {"model": "Pixel 8", "brand": "Google", "os": "Android 14", "age_months": 6},
    {"model": "Pixel 7a", "brand": "Google", "os": "Android 13", "age_months": 12},
    {"model": "OnePlus 12", "brand": "OnePlus", "os": "Android 14", "age_months": 3},
]

CASE_CATEGORIES = [
    "Billing Dispute", "Network Issue", "Device Problem", "Plan Change",
    "Service Outage", "Roaming Issue", "Data Overage", "Account Security",
    "Port Request", "International Calling", "Voicemail Setup", "SIM Replacement",
]

CASE_SUBCATEGORIES = {
    "Billing Dispute": ["Unexpected Charge", "Double Billing", "Promo Not Applied", "Late Fee Dispute"],
    "Network Issue": ["No Signal", "Slow Data", "Dropped Calls", "5G Coverage"],
    "Device Problem": ["Battery Drain", "Screen Issue", "Software Update", "Connectivity"],
    "Plan Change": ["Upgrade", "Downgrade", "Add Line", "Remove Feature"],
    "Service Outage": ["Complete Outage", "Intermittent", "Degraded Service", "Area Specific"],
    "Roaming Issue": ["No Service Abroad", "High Charges", "Data Not Working", "Roaming Setup"],
    "Data Overage": ["Overage Charge", "Throttling", "Data Add-On", "Usage Alert"],
    "Account Security": ["Unauthorized Access", "SIM Swap Fraud", "Password Reset", "2FA Issue"],
    "Port Request": ["Port In", "Port Out", "Port Stuck", "Number Transfer"],
    "International Calling": ["Rate Inquiry", "Package Setup", "Call Quality", "Blocked Number"],
    "Voicemail Setup": ["Setup Help", "Password Reset", "Visual Voicemail", "Notification Issue"],
    "SIM Replacement": ["Lost SIM", "Damaged SIM", "eSIM Activation", "SIM Swap"],
}

SENTIMENTS = ["Frustrated", "Neutral", "Satisfied", "Angry", "Confused"]

INCIDENT_TYPES = [
    "Cell Tower Outage", "Fiber Cut", "Core Network Degradation",
    "DNS Resolution Failure", "Congestion Event", "Power Outage at Site",
    "Software Upgrade Failure", "Hardware Failure", "Capacity Exhaustion",
]

REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "West", "Northwest"]

UPSELL_OFFERS = [
    {"offer": "Upgrade to Unlimited Plus", "category": "Plan Upgrade", "monthly_value": 35.0},
    {"offer": "Add Device Protection Plus", "category": "Insurance", "monthly_value": 17.0},
    {"offer": "Add International Calling Pack", "category": "Add-On", "monthly_value": 15.0},
    {"offer": "Upgrade to 5G Home Internet Bundle", "category": "Bundle", "monthly_value": 50.0},
    {"offer": "Add Streaming Bundle (Netflix+Disney+)", "category": "Entertainment", "monthly_value": 25.0},
    {"offer": "Add Family Line", "category": "Line Add", "monthly_value": 30.0},
    {"offer": "Upgrade Device (0% APR)", "category": "Device Upgrade", "monthly_value": 40.0},
    {"offer": "Add Cloud Storage 2TB", "category": "Add-On", "monthly_value": 10.0},
    {"offer": "Business Hotspot Add-On", "category": "Add-On", "monthly_value": 20.0},
    {"offer": "Premium Tech Support", "category": "Support", "monthly_value": 12.0},
]

RETENTION_OFFERS = [
    {"offer": "Loyalty Discount — 25% off for 12 months", "category": "Retention", "monthly_value": -20.0},
    {"offer": "Free Device Upgrade (waive remaining balance)", "category": "Retention", "monthly_value": -35.0},
    {"offer": "Free Premium Features for 6 months", "category": "Retention", "monthly_value": -15.0},
    {"offer": "Service Credit — $50 account credit", "category": "Retention", "monthly_value": -50.0},
    {"offer": "Priority Support — dedicated agent for 90 days", "category": "Retention", "monthly_value": -12.0},
    {"offer": "Contract Flexibility — switch to month-to-month", "category": "Retention", "monthly_value": 0.0},
]

REPS = ["Nathan", "Ella", "Kevin", "Sarah", "Marcus", "Priya", "James", "Olivia", "Carlos", "Megan"]

CALL_INTENTS = [
    "Billing Inquiry", "Plan Change", "Network Issue", "Device Support",
    "Service Outage", "Data Overage", "Cancellation Request",
    "International Roaming", "Account Update", "Coverage Complaint",
]

CALL_INTENT_TO_CASE_CATEGORY = {
    "Billing Inquiry": "Billing Dispute",
    "Plan Change": "Plan Change",
    "Network Issue": "Network Issue",
    "Device Support": "Device Problem",
    "Service Outage": "Service Outage",
    "Data Overage": "Data Overage",
    "Cancellation Request": "Port Request",
    "International Roaming": "Roaming Issue",
    "Account Update": "Account Security",
    "Coverage Complaint": "Network Issue",
}

CALL_ISSUE_TEMPLATES = {
    "Billing Inquiry": [
        "Unexpected charge of ${amt} on latest bill that customer did not authorize",
        "Customer disputes late payment fee, claims autopay was set up",
        "Promotional discount not reflected on the bill for {months} months",
        "Double billing occurred on the last cycle, customer wants immediate credit",
    ],
    "Plan Change": [
        "Customer wants to upgrade from Basic to Unlimited plan",
        "Request to add additional line for family member",
        "Downgrade request due to reduced usage since working from home",
        "Customer inquiring about business plan options for small team",
    ],
    "Network Issue": [
        "Persistent dropped calls in {area} area for the past {days} days",
        "Slow data speeds below 5 Mbps during peak hours in downtown area",
        "No 5G connectivity despite being in advertised coverage zone",
        "Intermittent connectivity affecting work-from-home video calls",
    ],
    "Device Support": [
        "Battery draining rapidly on {device} after latest software update",
        "Screen flickering issue on {device}, device is {warranty} warranty",
        "Bluetooth connectivity problems with {device} after OS update",
        "Customer unable to activate new {device}, stuck on activation screen",
    ],
    "Service Outage": [
        "Complete service loss in {area} area since yesterday morning",
        "Intermittent outage affecting both voice and data services",
        "Customer reports area-wide outage, multiple neighbors affected",
        "Service degradation during severe weather event in region",
    ],
    "Data Overage": [
        "Customer exceeded data limit by {gb}GB, requesting overage fee waiver",
        "Throttling complaint after reaching data cap mid-billing cycle",
        "Unexpected data usage spike, customer suspects background app consumption",
        "Request for temporary data boost to get through end of billing cycle",
    ],
    "Cancellation Request": [
        "Customer considering cancellation due to persistent network issues",
        "Price comparison with competitor offering lower rate for similar service",
        "Dissatisfied with customer service experience on previous calls",
        "Contract expiring, evaluating whether to stay or switch providers",
    ],
    "International Roaming": [
        "Need to set up international roaming for upcoming trip to {country}",
        "Excessive roaming charges from recent travel, requesting review",
        "Data not working while abroad despite roaming package purchase",
        "Inquiry about international calling rates to {country}",
    ],
    "Account Update": [
        "Customer wants to update billing address after relocation",
        "Request to change account holder name after marriage",
        "Customer needs to add authorized user to account",
        "Updating payment method from credit card to bank transfer",
    ],
    "Coverage Complaint": [
        "No service at new home address in {area} area",
        "Coverage map shows 5G but customer only gets LTE signal",
        "Complete dead zone along daily commute route for {days} days",
        "Indoor coverage severely degraded after recent tower changes",
    ],
}

CALL_RESOLUTIONS = {
    "Billing Inquiry": [
        "Applied credit of ${credit} to customer account, issue resolved",
        "Identified billing system error, corrected charges and applied goodwill credit",
        "Confirmed promotional discount will appear on next billing cycle",
        "Escalated to billing department for manual review, follow-up in 48 hours",
    ],
    "Plan Change": [
        "Successfully upgraded customer to requested plan effective immediately",
        "Added new line, activation completed, customer satisfied with pricing",
        "Processed downgrade request, new rate effective next billing cycle",
        "Provided business plan details, customer will call back to finalize",
    ],
    "Network Issue": [
        "Opened engineering ticket, customer will receive update within 24 hours",
        "Identified tower maintenance in area, expected resolution in {eta}",
        "Performed remote diagnostics, recommended network settings reset",
        "Escalated to network operations team for priority investigation",
    ],
    "Device Support": [
        "Guided customer through troubleshooting steps, issue resolved",
        "Initiated warranty replacement process, new device shipping in 2-3 days",
        "Recommended factory reset, provided backup instructions first",
        "Scheduled in-store appointment for hands-on device diagnostics",
    ],
    "Service Outage": [
        "Confirmed known outage, engineering team working on restoration",
        "Applied service credit of ${credit} for outage duration",
        "Provided estimated restoration time of {eta}, customer notified",
        "Escalated to priority team given customer's business account status",
    ],
    "Data Overage": [
        "Waived overage charge as one-time courtesy, recommended data monitoring app",
        "Added temporary 5GB data boost at no charge for remainder of cycle",
        "Upgraded to unlimited data plan to prevent future overages",
        "Identified background app causing excessive usage, resolved with settings change",
    ],
    "Cancellation Request": [
        "Offered retention package: 20% discount for 12 months, customer accepted",
        "Unable to retain, processed cancellation effective end of billing period",
        "Addressed service complaints, customer agreed to trial period with credit",
        "Escalated to retention specialist for personalized offer",
    ],
    "International Roaming": [
        "Activated international roaming package for {country}, effective immediately",
        "Applied roaming charge adjustment of ${credit}, added travel pass",
        "Resolved data connectivity issue by updating APN settings manually",
        "Provided international rate breakdown, customer selected best-value option",
    ],
    "Account Update": [
        "Updated billing address and confirmed with customer",
        "Processed name change, new documentation sent for verification",
        "Added authorized user, access provisioned immediately",
        "Payment method updated, next bill will use new method",
    ],
    "Coverage Complaint": [
        "Opened coverage investigation ticket, customer will receive update in 48 hours",
        "Confirmed upcoming tower upgrade in area, expected completion in {eta}",
        "Provided signal booster offer at discounted rate",
        "Escalated to network planning team for priority review",
    ],
}

CALL_NEXT_STEPS = [
    "Follow up with customer in {days} days to confirm resolution",
    "Customer will receive email confirmation within 24 hours",
    "Escalation team will contact customer within 48 hours",
    "Customer to visit store for in-person assistance if issue persists",
    "Monitor account for {days} days to ensure no recurrence",
    "Customer will call back after reviewing options with family",
    "Schedule follow-up callback for next business day",
    "Send detailed billing breakdown to customer email on file",
]

CALL_DEVICES = ["iPhone 15 Pro", "Galaxy S24 Ultra", "Pixel 8 Pro", "iPhone 14", "Galaxy S23", "OnePlus 12"]
CALL_AREAS = ["downtown", "suburban", "rural", "highway corridor", "midtown", "industrial district"]
CALL_COUNTRIES = ["Mexico", "Canada", "UK", "Japan", "Germany", "France", "India", "Brazil", "Australia"]


def generate_customer_id(i):
    return f"CUST-{100000 + i}"


def generate_phone():
    return f"+1{random.randint(200,999)}{random.randint(100,999)}{random.randint(1000,9999)}"


def generate_customers():
    rows = []
    today = datetime.now()
    for i in range(NUM_CUSTOMERS):
        cid = generate_customer_id(i)
        city, state = random.choice(CITIES)
        plan = random.choice(PLANS)
        tenure_months = random.randint(1, 120)
        signup_date = today - timedelta(days=tenure_months * 30)
        contract_end = signup_date + timedelta(days=random.choice([365, 730, 365 * 3]))
        if contract_end < today:
            contract_end = today + timedelta(days=random.randint(30, 365))
        is_churned = random.random() < 0.08
        churn_risk = round(random.uniform(0.6, 0.95), 3) if is_churned else round(random.uniform(0.01, 0.85), 3)
        nps = random.randint(-2, 5) if churn_risk > 0.5 else random.randint(4, 10)
        csat = round(random.uniform(1.0, 3.5), 1) if churn_risk > 0.6 else round(random.uniform(3.0, 5.0), 1)
        lifetime_value = round(plan["price"] * tenure_months * random.uniform(0.8, 1.3), 2)
        segment = "High Value" if lifetime_value > 5000 else ("Mid Value" if lifetime_value > 1500 else "Low Value")
        rows.append({
            "CUSTOMER_ID": cid,
            "FIRST_NAME": random.choice(FIRST_NAMES),
            "LAST_NAME": random.choice(LAST_NAMES),
            "EMAIL": f"{cid.lower().replace('-', '')}@email.com",
            "PHONE": generate_phone(),
            "CITY": city,
            "STATE": state,
            "REGION": random.choice(REGIONS),
            "PLAN_NAME": plan["name"],
            "PLAN_TIER": plan["tier"],
            "MONTHLY_CHARGE": plan["price"],
            "TENURE_MONTHS": tenure_months,
            "SIGNUP_DATE": signup_date.strftime("%Y-%m-%d"),
            "CONTRACT_END_DATE": contract_end.strftime("%Y-%m-%d"),
            "IS_CHURNED": is_churned,
            "CHURN_RISK_SCORE": churn_risk,
            "NPS_SCORE": nps,
            "CSAT_SCORE": csat,
            "LIFETIME_VALUE": lifetime_value,
            "SEGMENT": segment,
            "NUM_LINES": random.randint(1, 5),
            "AUTOPAY_ENABLED": random.random() > 0.3,
            "PAPERLESS_BILLING": random.random() > 0.4,
        })
    return pd.DataFrame(rows)


def generate_devices(customers_df):
    rows = []
    for _, cust in customers_df.iterrows():
        device = random.choice(DEVICES)
        rows.append({
            "CUSTOMER_ID": cust["CUSTOMER_ID"],
            "DEVICE_MODEL": device["model"],
            "DEVICE_BRAND": device["brand"],
            "DEVICE_OS": device["os"],
            "DEVICE_AGE_MONTHS": device["age_months"] + random.randint(-2, 6),
            "IS_5G_CAPABLE": "5G" in device["model"] or device["age_months"] < 18,
            "IMEI": hashlib.md5(f"{cust['CUSTOMER_ID']}_device".encode()).hexdigest()[:15].upper(),
            "SIM_TYPE": random.choice(["Physical SIM", "eSIM", "Physical SIM"]),
            "DEVICE_PAYMENT_REMAINING": round(random.choice([0, 0, 0, random.uniform(50, 800)]), 2),
            "WARRANTY_STATUS": random.choice(["Active", "Active", "Expired", "Extended"]),
        })
    return pd.DataFrame(rows)


def generate_usage(customers_df):
    rows = []
    today = datetime.now()
    for _, cust in customers_df.iterrows():
        for month_offset in range(6):
            period = (today - timedelta(days=month_offset * 30)).strftime("%Y-%m-01")
            plan = next((p for p in PLANS if p["name"] == cust["PLAN_NAME"]), PLANS[0])
            base_data = plan["data_gb"] * random.uniform(0.4, 1.2)
            rows.append({
                "CUSTOMER_ID": cust["CUSTOMER_ID"],
                "USAGE_PERIOD": period,
                "VOICE_MINUTES": random.randint(50, 1500),
                "SMS_COUNT": random.randint(20, 800),
                "DATA_USED_GB": round(base_data, 2),
                "DATA_LIMIT_GB": plan["data_gb"],
                "DATA_OVERAGE_GB": round(max(0, base_data - plan["data_gb"]), 2),
                "INTERNATIONAL_MINUTES": random.randint(0, 60),
                "ROAMING_DATA_MB": random.randint(0, 500),
                "HOTSPOT_DATA_GB": round(random.uniform(0, 5), 2),
                "PEAK_HOUR_DATA_PCT": round(random.uniform(0.2, 0.8), 2),
            })
    return pd.DataFrame(rows)


def generate_billing(customers_df):
    rows = []
    today = datetime.now()
    for _, cust in customers_df.iterrows():
        for month_offset in range(6):
            bill_date = (today - timedelta(days=month_offset * 30)).strftime("%Y-%m-%d")
            base = cust["MONTHLY_CHARGE"]
            taxes = round(base * 0.12, 2)
            fees = round(random.uniform(2, 8), 2)
            overage = round(random.choice([0, 0, 0, random.uniform(5, 50)]), 2)
            total = round(base + taxes + fees + overage, 2)
            payment_status = random.choices(["Paid", "Paid", "Paid", "Past Due", "Pending"], weights=[60, 20, 10, 5, 5])[0]
            rows.append({
                "CUSTOMER_ID": cust["CUSTOMER_ID"],
                "BILL_DATE": bill_date,
                "BASE_CHARGE": base,
                "TAXES": taxes,
                "FEES": fees,
                "OVERAGE_CHARGES": overage,
                "TOTAL_AMOUNT": total,
                "PAYMENT_STATUS": payment_status,
                "PAYMENT_METHOD": random.choice(["Credit Card", "Debit Card", "Bank Transfer", "AutoPay"]),
                "DAYS_PAST_DUE": random.randint(1, 45) if payment_status == "Past Due" else 0,
            })
    return pd.DataFrame(rows)


def generate_engagement(customers_df):
    rows = []
    today = datetime.now()
    for _, cust in customers_df.iterrows():
        for month_offset in range(6):
            period = (today - timedelta(days=month_offset * 30)).strftime("%Y-%m-01")
            is_engaged = random.random() > 0.3
            rows.append({
                "CUSTOMER_ID": cust["CUSTOMER_ID"],
                "PERIOD": period,
                "APP_LOGINS": random.randint(0, 30) if is_engaged else random.randint(0, 3),
                "WEB_VISITS": random.randint(0, 15) if is_engaged else random.randint(0, 2),
                "CHAT_INTERACTIONS": random.randint(0, 5),
                "CALL_CENTER_CONTACTS": random.randint(0, 3),
                "STORE_VISITS": random.randint(0, 2),
                "EMAIL_OPENS": random.randint(0, 10),
                "EMAIL_CLICKS": random.randint(0, 5),
                "PUSH_NOTIFICATION_OPENS": random.randint(0, 8),
                "SELF_SERVICE_ACTIONS": random.randint(0, 12) if is_engaged else 0,
                "LAST_CONTACT_CHANNEL": random.choice(["App", "Web", "Call", "Chat", "Store", "Email"]),
            })
    return pd.DataFrame(rows)


def generate_qoe(customers_df):
    rows = []
    today = datetime.now()
    for _, cust in customers_df.iterrows():
        for month_offset in range(3):
            period = (today - timedelta(days=month_offset * 30)).strftime("%Y-%m-01")
            good_network = random.random() > 0.2
            rows.append({
                "CUSTOMER_ID": cust["CUSTOMER_ID"],
                "PERIOD": period,
                "AVG_DOWNLOAD_MBPS": round(random.uniform(50, 300) if good_network else random.uniform(5, 50), 1),
                "AVG_UPLOAD_MBPS": round(random.uniform(10, 80) if good_network else random.uniform(1, 15), 1),
                "AVG_LATENCY_MS": round(random.uniform(10, 40) if good_network else random.uniform(40, 150), 1),
                "DROPPED_CALL_RATE": round(random.uniform(0, 0.02) if good_network else random.uniform(0.02, 0.15), 4),
                "CALL_SETUP_SUCCESS_RATE": round(random.uniform(0.95, 0.999) if good_network else random.uniform(0.8, 0.95), 4),
                "VIDEO_STREAM_QUALITY": random.choice(["4K", "HD", "HD"]) if good_network else random.choice(["SD", "HD", "Buffering"]),
                "COVERAGE_SCORE": round(random.uniform(0.85, 1.0) if good_network else random.uniform(0.5, 0.85), 3),
                "SIGNAL_STRENGTH_DBM": random.randint(-75, -50) if good_network else random.randint(-110, -80),
                "NUM_TROUBLE_TICKETS": random.randint(0, 1) if good_network else random.randint(1, 5),
                "NETWORK_TYPE": random.choice(["5G", "5G", "LTE"]) if good_network else random.choice(["LTE", "3G", "5G"]),
            })
    return pd.DataFrame(rows)


def generate_conversation(rep, customer_name, intent, issue, resolution, sentiment):
    if sentiment == "Positive":
        cust_reactions = [
            "I understand, thank you for explaining that.",
            "That sounds great, I appreciate your help.",
            "Perfect, that works for me.",
            "Thank you so much, you've been very helpful.",
        ]
    else:
        cust_reactions = [
            "This is really frustrating, I've been dealing with this for weeks.",
            "I'm not satisfied with that answer, can I speak to a supervisor?",
            "This shouldn't be this complicated.",
            "I expected better service from your company.",
        ]

    first = customer_name.split()[0]
    lines = [
        f"Representative ({rep}): Thank you for calling TeleCom Wireless, my name is {rep}. How can I help you today?",
        f"Customer ({customer_name}): Hi {rep}, I'm calling about {issue.lower().split(',')[0]}.",
        f"Representative ({rep}): I'm sorry to hear about that, {first}. Let me pull up your account and take a look.",
        f"Customer ({customer_name}): {random.choice(cust_reactions)}",
        f"Representative ({rep}): I can see the issue on your account. Let me check a few things for you.",
        f"Customer ({customer_name}): {random.choice(cust_reactions)}",
        f"Representative ({rep}): Great news — {resolution.lower()}",
        f"Customer ({customer_name}): {random.choice(['Okay, thank you.', 'Alright, I appreciate that.', 'Thanks for your help.', 'I hope this gets resolved quickly.'])}",
        f"Representative ({rep}): Is there anything else I can help you with today?",
        f"Customer ({customer_name}): No, that will be all. Thank you.",
        f"Representative ({rep}): Thank you for calling TeleCom Wireless, {first}. Have a great day!",
    ]
    return "\n".join(lines)


def generate_call_recordings(customers_df, num_records=NUM_CALL_RECORDINGS):
    rows = []
    base_date = datetime(2025, 11, 1)
    call_customer_ids = random.sample(list(customers_df.index), min(num_records, len(customers_df)))
    if len(call_customer_ids) < num_records:
        call_customer_ids += random.choices(list(customers_df.index), k=num_records - len(call_customer_ids))
    neg_count = int(num_records * 0.40)
    sentiments_pool = ["Negative"] * neg_count + ["Positive"] * (num_records - neg_count)
    random.shuffle(sentiments_pool)

    for i in range(num_records):
        cust_row = customers_df.iloc[call_customer_ids[i]]
        cid = cust_row["CUSTOMER_ID"]
        customer_name = f"{cust_row['FIRST_NAME']} {cust_row['LAST_NAME']}"
        rep = random.choice(REPS)
        intent = random.choice(CALL_INTENTS)
        issue_template = random.choice(CALL_ISSUE_TEMPLATES[intent])
        issue = issue_template.format(
            amt=random.randint(15, 200), months=random.randint(1, 6),
            area=random.choice(CALL_AREAS), days=random.randint(1, 14),
            device=random.choice(CALL_DEVICES), warranty=random.choice(["under", "out of"]),
            gb=random.randint(1, 10), country=random.choice(CALL_COUNTRIES),
        )
        resolution_template = random.choice(CALL_RESOLUTIONS.get(intent, CALL_RESOLUTIONS["Billing Inquiry"]))
        resolution = resolution_template.format(
            credit=random.randint(10, 75),
            eta=random.choice(["2 hours", "4 hours", "24 hours", "end of day"]),
            country=random.choice(CALL_COUNTRIES), days=random.randint(3, 14),
        )
        sentiment = sentiments_pool[i]
        fcr = "Yes" if random.random() > 0.5 else "No"
        if sentiment == "Negative":
            fcr = random.choices(["Yes", "No"], weights=[30, 70])[0]
            call_quality = random.choices(["Good", "Average", "Poor"], weights=[10, 40, 50])[0]
            nps = random.randint(10, 40)
        else:
            fcr = random.choices(["Yes", "No"], weights=[75, 25])[0]
            call_quality = random.choices(["Good", "Average", "Poor"], weights=[60, 30, 10])[0]
            nps = random.randint(55, 100)
        duration = round(random.uniform(45, 300), 2)
        call_date = base_date + timedelta(
            days=random.randint(0, 120), hours=random.randint(8, 18), minutes=random.randint(0, 59),
        )
        next_steps = random.choice(CALL_NEXT_STEPS).format(days=random.randint(2, 7))
        purpose = f"{intent} - {issue[:80]}"
        audio_file = f"audiofile{i + 1}.mp3"
        conversation = generate_conversation(rep, customer_name, intent, issue, resolution, sentiment)
        summary = f"{customer_name} called regarding {intent.lower()}. The issue was: {issue.lower()}. {rep} assisted the customer and the outcome was: {resolution.lower()}"
        rows.append({
            "AUDIO_FILE": audio_file, "CUSTOMER_ID": cid,
            "CALL_DATE": call_date.strftime("%Y-%m-%d"),
            "CALL_TIMESTAMP": call_date.strftime("%Y-%m-%d %H:%M:%S"),
            "CALL_DURATION_SECONDS": duration, "REPRESENTATIVE": rep,
            "CUSTOMER_NAME": customer_name, "CALL_INTENT": intent,
            "ISSUE": issue, "RESOLUTION": resolution, "NEXT_STEPS": next_steps,
            "PURPOSE_OF_CALL": purpose,
            "RESPONSE_MODE": random.choice(["Phone", "Email", "Phone call", "Chat"]),
            "MODE_OF_UPDATE": random.choice(["Email", "Phone", "Portal", "SMS"]),
            "CALL_TO_ACTION": issue[:60], "CONVERSATION_SENTIMENT": sentiment,
            "FIRST_CALL_RESOLUTION": fcr, "CALL_QUALITY": call_quality,
            "NET_PROMOTER_SCORE": nps, "CONVERSATION_SUMMARY": summary,
            "CONVERSATION_STRUCTURED": conversation,
        })
    return pd.DataFrame(rows)


def generate_case_notes(case_id, category, sentiment):
    note_templates = {
        "Billing Dispute": [
            "Customer called regarding unexpected charge of ${amt} on their latest bill.",
            "Reviewed billing history. Found {detail}. Customer has been on the same plan for {months} months.",
            "Escalated to billing team for review. Applied temporary credit of ${credit} while investigating.",
        ],
        "Network Issue": [
            "Customer reports {detail} in {area} area for the past {days} days.",
            "Checked network status in customer's area. {detail}. Opened engineering ticket #{ticket}.",
            "Offered temporary data add-on at no charge. Customer {reaction}. Will follow up in 48 hours.",
        ],
        "Device Problem": [
            "Customer experiencing {detail} with their {device}. Device is {warranty} warranty.",
            "Ran remote diagnostics. {detail}. Recommended {action}.",
            "Offered {resolution}. Customer {reaction}.",
        ],
        "Service Outage": [
            "Customer impacted by service outage in {area}. {detail}.",
            "Confirmed known outage ticket #{ticket}. {detail}. ETA for resolution: {eta}.",
            "Applied service credit of ${credit} for outage duration. Customer {reaction}.",
        ],
    }
    templates = note_templates.get(category, note_templates["Billing Dispute"])
    notes = []
    for i, tmpl in enumerate(templates[:random.randint(2, 3)]):
        note = tmpl.format(
            amt=random.randint(15, 200),
            detail=random.choice(["inconsistency in charges", "promo expired last month", "intermittent connectivity", "slow data speeds reported", "battery draining faster than normal", "tower maintenance scheduled", "software update pending"]),
            months=random.randint(3, 36), credit=random.randint(10, 50),
            area=random.choice(["downtown", "suburban", "rural", "highway corridor"]),
            days=random.randint(1, 14), ticket=random.randint(10000, 99999),
            reaction=random.choice(["accepted", "was still frustrated", "requested supervisor", "agreed to wait", "appreciated the help"]),
            device=random.choice(["iPhone 15 Pro", "Galaxy S24", "Pixel 8"]),
            warranty=random.choice(["under", "out of"]),
            action=random.choice(["factory reset", "software update", "device replacement", "SIM replacement"]),
            resolution=random.choice(["device replacement", "repair at service center", "warranty exchange", "troubleshooting steps"]),
            hours=random.randint(1, 12), eta=random.choice(["2 hours", "4 hours", "end of day", "24 hours"]),
        )
        notes.append({
            "CASE_ID": case_id, "NOTE_SEQUENCE": i + 1, "NOTE_TEXT": note,
            "AGENT_ID": f"AGT-{random.randint(1000, 9999)}",
            "NOTE_TIMESTAMP": (datetime.now() - timedelta(hours=random.randint(1, 72))).strftime("%Y-%m-%d %H:%M:%S"),
            "CHANNEL": random.choice(["Phone", "Chat", "Email", "Phone"]),
        })
    return notes


def generate_cases(customers_df, call_recordings_df):
    case_rows, note_rows = [], []
    today = datetime.now()
    case_id_counter = 0
    neg_calls = call_recordings_df[call_recordings_df["CONVERSATION_SENTIMENT"] == "Negative"]
    call_customer_case_ids = set()
    for _, call in neg_calls.iterrows():
        case_id_counter += 1
        cid_str = f"CASE-{200000 + case_id_counter}"
        cust_id = call["CUSTOMER_ID"]
        call_customer_case_ids.add(cust_id)
        call_intent = call["CALL_INTENT"]
        cat = CALL_INTENT_TO_CASE_CATEGORY.get(call_intent, "Network Issue")
        subcat = random.choice(CASE_SUBCATEGORIES[cat])
        sentiment = random.choice(["Frustrated", "Angry", "Confused"])
        status = random.choice(["Open", "In Progress", "Escalated", "Open"])
        priority = random.choices(["Critical", "High", "Medium"], weights=[30, 50, 20])[0]
        created = today - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        case_rows.append({
            "CASE_ID": cid_str, "CUSTOMER_ID": cust_id, "CATEGORY": cat,
            "SUBCATEGORY": subcat, "STATUS": status, "PRIORITY": priority,
            "SENTIMENT": sentiment, "CREATED_AT": created.strftime("%Y-%m-%d %H:%M:%S"),
            "RESOLVED_AT": None, "RESOLUTION_HOURS": None,
            "FIRST_RESPONSE_MINUTES": random.randint(2, 120), "CHANNEL": "Phone",
            "ASSIGNED_AGENT": f"AGT-{random.randint(1000, 9999)}",
            "ESCALATED": status == "Escalated", "FCR": False,
            "CALL_AUDIO_FILE": call["AUDIO_FILE"], "CALL_INTENT": call_intent, "CALL_ISSUE": call["ISSUE"],
        })
        note_rows.extend(generate_case_notes(cid_str, cat, sentiment))
    remaining_customers = customers_df[~customers_df["CUSTOMER_ID"].isin(call_customer_case_ids)]
    for _, cust in remaining_customers.iterrows():
        num_cases = random.choices([0, 1, 2, 3, 4], weights=[30, 35, 20, 10, 5])[0]
        for _ in range(num_cases):
            case_id_counter += 1
            cid_str = f"CASE-{200000 + case_id_counter}"
            cat = random.choice(CASE_CATEGORIES)
            subcat = random.choice(CASE_SUBCATEGORIES[cat])
            sentiment = random.choice(SENTIMENTS)
            status = random.choice(["Open", "In Progress", "Resolved", "Resolved", "Escalated", "Closed"])
            priority = random.choice(["Low", "Medium", "Medium", "High", "Critical"])
            created = today - timedelta(days=random.randint(0, 90), hours=random.randint(0, 23))
            resolved = created + timedelta(hours=random.randint(1, 168)) if status in ("Resolved", "Closed") else None
            case_rows.append({
                "CASE_ID": cid_str, "CUSTOMER_ID": cust["CUSTOMER_ID"], "CATEGORY": cat,
                "SUBCATEGORY": subcat, "STATUS": status, "PRIORITY": priority,
                "SENTIMENT": sentiment, "CREATED_AT": created.strftime("%Y-%m-%d %H:%M:%S"),
                "RESOLVED_AT": resolved.strftime("%Y-%m-%d %H:%M:%S") if resolved else None,
                "RESOLUTION_HOURS": round((resolved - created).total_seconds() / 3600, 1) if resolved else None,
                "FIRST_RESPONSE_MINUTES": random.randint(2, 120),
                "CHANNEL": random.choice(["Phone", "Chat", "Email", "App", "Store"]),
                "ASSIGNED_AGENT": f"AGT-{random.randint(1000, 9999)}",
                "ESCALATED": status == "Escalated",
                "FCR": random.random() > 0.4 and status in ("Resolved", "Closed"),
                "CALL_AUDIO_FILE": None, "CALL_INTENT": None, "CALL_ISSUE": None,
            })
            note_rows.extend(generate_case_notes(cid_str, cat, sentiment))
    return pd.DataFrame(case_rows), pd.DataFrame(note_rows)


def generate_incidents(customers_df):
    incident_rows, impact_rows = [], []
    today = datetime.now()
    for i in range(NUM_INCIDENTS):
        iid = f"INC-{300000 + i}"
        itype = random.choice(INCIDENT_TYPES)
        region = random.choice(REGIONS)
        severity = random.choice(["Critical", "Major", "Minor", "Critical", "Major"])
        start = today - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        duration_hrs = random.uniform(0.5, 24)
        end = start + timedelta(hours=duration_hrs)
        status = "Resolved" if end < today else "Active"
        affected_area = f"{random.choice(['Downtown', 'Midtown', 'Suburb', 'Highway', 'Industrial'])} {random.choice(CITIES)[0]}"
        incident_rows.append({
            "INCIDENT_ID": iid, "INCIDENT_TYPE": itype, "SEVERITY": severity,
            "REGION": region, "AFFECTED_AREA": affected_area, "STATUS": status,
            "STARTED_AT": start.strftime("%Y-%m-%d %H:%M:%S"),
            "RESOLVED_AT": end.strftime("%Y-%m-%d %H:%M:%S") if status == "Resolved" else None,
            "DURATION_HOURS": round(duration_hrs, 1),
            "ROOT_CAUSE": random.choice(["Hardware Failure", "Software Bug", "Weather Damage", "Capacity Overload", "Third Party", "Power Issue", "Fiber Cut"]),
            "AFFECTED_SERVICES": random.choice(["Voice + Data", "Data Only", "Voice Only", "All Services", "Data + SMS"]),
            "ESTIMATED_CUSTOMERS_AFFECTED": random.randint(100, 5000),
        })
        region_customers = customers_df[customers_df["REGION"] == region]
        impacted = region_customers.sample(min(len(region_customers), random.randint(10, 80)))
        for _, cust in impacted.iterrows():
            impact_rows.append({
                "INCIDENT_ID": iid, "CUSTOMER_ID": cust["CUSTOMER_ID"],
                "IMPACT_LEVEL": random.choice(["No Service", "Degraded", "Intermittent", "Minor Impact"]),
                "SERVICE_AFFECTED": random.choice(["Voice", "Data", "SMS", "All"]),
                "NOTIFIED": random.random() > 0.4,
                "NOTIFICATION_CHANNEL": random.choice(["SMS", "Push", "Email", "None"]),
                "CREDIT_APPLIED": random.random() > 0.6,
                "CREDIT_AMOUNT": round(random.uniform(5, 25), 2) if random.random() > 0.6 else 0,
            })
    return pd.DataFrame(incident_rows), pd.DataFrame(impact_rows)


def generate_churn_scores(customers_df, call_recordings_df):
    neg_calls = call_recordings_df[call_recordings_df["CONVERSATION_SENTIMENT"] == "Negative"]
    neg_customer_ids = set(neg_calls["CUSTOMER_ID"].unique())
    repeat_callers = call_recordings_df.groupby("CUSTOMER_ID").size()
    repeat_caller_ids = set(repeat_callers[repeat_callers > 1].index)
    rows = []
    for _, cust in customers_df.iterrows():
        cust_id = cust["CUSTOMER_ID"]
        base_risk = cust["CHURN_RISK_SCORE"]
        if cust_id in neg_customer_ids:
            risk = round(min(0.98, max(0.65, base_risk + random.uniform(0.15, 0.35))), 3)
            factors = []
            neg_cust_calls = neg_calls[neg_calls["CUSTOMER_ID"] == cust_id]
            intents = neg_cust_calls["CALL_INTENT"].tolist()
            factors.append(f"Negative call sentiment ({', '.join(intents[:2])})")
            if cust["NPS_SCORE"] <= 3: factors.append("Low NPS score")
            if cust["TENURE_MONTHS"] < 12: factors.append("Short tenure (<12 months)")
            factors.append("Open support case from call center")
            if cust["CONTRACT_END_DATE"] and datetime.strptime(cust["CONTRACT_END_DATE"], "%Y-%m-%d") < datetime.now() + timedelta(days=90):
                factors.append("Contract expiring soon")
        elif cust_id in repeat_caller_ids:
            risk = round(min(0.90, max(0.45, base_risk + random.uniform(0.05, 0.20))), 3)
            factors = ["Multiple call center contacts"]
            if cust["NPS_SCORE"] <= 5: factors.append("Below-average NPS")
            if cust["CSAT_SCORE"] < 3.5: factors.append("Low CSAT")
            factors.append("Repeat caller pattern")
        else:
            risk = base_risk
            factors = []
            if cust["TENURE_MONTHS"] < 12: factors.append("Short tenure (<12 months)")
            if cust["NPS_SCORE"] <= 3: factors.append("Low NPS score")
            if cust["CSAT_SCORE"] < 3.0: factors.append("Low CSAT")
            if risk > 0.5: factors.append("High complaint frequency")
            if cust["CONTRACT_END_DATE"] and datetime.strptime(cust["CONTRACT_END_DATE"], "%Y-%m-%d") < datetime.now() + timedelta(days=90):
                factors.append("Contract expiring soon")
            if not factors: factors.append("Stable account")
        rows.append({
            "CUSTOMER_ID": cust_id, "CHURN_RISK_SCORE": risk,
            "CHURN_RISK_LEVEL": "Critical" if risk > 0.7 else ("High" if risk > 0.5 else ("Medium" if risk > 0.3 else "Low")),
            "PRIMARY_RISK_FACTORS": "; ".join(factors[:3]),
            "PREDICTED_CHURN_DATE": (datetime.now() + timedelta(days=random.randint(15, 90))).strftime("%Y-%m-%d") if risk > 0.5 else None,
            "RETENTION_PROBABILITY": round(1 - risk, 3), "MODEL_VERSION": "v2.3",
            "SCORED_AT": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })
    return pd.DataFrame(rows)


def generate_nba_recommendations(customers_df, call_recordings_df):
    neg_calls = call_recordings_df[call_recordings_df["CONVERSATION_SENTIMENT"] == "Negative"]
    neg_customer_ids = set(neg_calls["CUSTOMER_ID"].unique())
    rows = []
    for _, cust in customers_df.iterrows():
        cust_id = cust["CUSTOMER_ID"]
        if cust_id in neg_customer_ids:
            retention_pool = random.sample(RETENTION_OFFERS, min(2, len(RETENTION_OFFERS)))
            upsell_pool = random.sample(UPSELL_OFFERS, 1)
            selected = retention_pool + upsell_pool
            neg_cust_calls = neg_calls[neg_calls["CUSTOMER_ID"] == cust_id]
            call_intent = neg_cust_calls.iloc[0]["CALL_INTENT"]
            call_issue = neg_cust_calls.iloc[0]["ISSUE"]
            for rank, offer in enumerate(selected, 1):
                propensity = round(random.uniform(0.60, 0.95), 3)
                reason = f"Negative call sentiment ({call_intent}): {call_issue[:60]}. Retention action recommended." if offer["category"] == "Retention" else f"Post-resolution upsell opportunity based on {cust['PLAN_TIER']} tier and call history"
                rows.append({
                    "CUSTOMER_ID": cust_id, "RECOMMENDATION_RANK": rank,
                    "OFFER_NAME": offer["offer"], "OFFER_CATEGORY": offer["category"],
                    "ESTIMATED_MONTHLY_VALUE": offer["monthly_value"],
                    "PROPENSITY_SCORE": propensity, "REASON": reason,
                    "CHANNEL_PREFERENCE": random.choice(["Agent Call", "SMS", "Email"]),
                    "VALID_UNTIL": (datetime.now() + timedelta(days=random.randint(14, 60))).strftime("%Y-%m-%d"),
                })
        else:
            num_recs = random.randint(1, 3)
            selected = random.sample(UPSELL_OFFERS, min(num_recs, len(UPSELL_OFFERS)))
            for rank, offer in enumerate(selected, 1):
                rows.append({
                    "CUSTOMER_ID": cust_id, "RECOMMENDATION_RANK": rank,
                    "OFFER_NAME": offer["offer"], "OFFER_CATEGORY": offer["category"],
                    "ESTIMATED_MONTHLY_VALUE": offer["monthly_value"],
                    "PROPENSITY_SCORE": round(random.uniform(0.3, 0.95), 3),
                    "REASON": random.choice([
                        f"Based on usage patterns and {cust['PLAN_TIER']} tier",
                        f"Peer customers in {cust['SEGMENT']} segment adopted this offer",
                        f"Contract ending {cust['CONTRACT_END_DATE']} - retention offer",
                        f"High engagement with related features",
                        f"Complement to current {cust['PLAN_NAME']} plan",
                    ]),
                    "CHANNEL_PREFERENCE": random.choice(["App Push", "Email", "SMS", "Agent Call", "Web Banner"]),
                    "VALID_UNTIL": (datetime.now() + timedelta(days=random.randint(14, 60))).strftime("%Y-%m-%d"),
                })
    return pd.DataFrame(rows)


def generate_conversation_memory(customers_df, call_recordings_df, cases_df, incidents_df, churn_df, nba_df):
    call_counts = call_recordings_df.groupby("CUSTOMER_ID").size().to_dict()
    negative_calls = call_recordings_df[call_recordings_df["CONVERSATION_SENTIMENT"] == "Negative"].groupby("CUSTOMER_ID").size().to_dict()
    open_cases = cases_df[cases_df["STATUS"].isin(["Open", "In Progress", "Escalated"])].groupby("CUSTOMER_ID").size().to_dict()
    churn_map = churn_df.set_index("CUSTOMER_ID")
    nba_map = nba_df.groupby("CUSTOMER_ID").first().reset_index().set_index("CUSTOMER_ID")
    channels = ["Mobile App", "Web", "Voice", "Messaging"]
    specialists = ["Upgrade specialist", "Billing specialist", "Technical support specialist", "Plan optimization specialist", "Retention specialist"]
    intents = ["upgrade", "billing_help", "network_support", "plan_optimization", "retention"]
    escalation_states = ["Contained", "Watch", "Escalate if unresolved"]
    rows = []
    for idx, (_, cust) in enumerate(customers_df.iterrows(), 1):
        cust_id = cust["CUSTOMER_ID"]
        churn_row = churn_map.loc[cust_id]
        top_offer = nba_map.loc[cust_id] if cust_id in nba_map.index else None
        neg = int(negative_calls.get(cust_id, 0))
        open_case_count = int(open_cases.get(cust_id, 0))
        active_specialist = "Retention specialist" if churn_row["CHURN_RISK_LEVEL"] in ["Critical", "High"] else random.choice(specialists)
        last_intent = "retention" if active_specialist == "Retention specialist" else random.choice(intents)
        escalation = "Escalated" if open_case_count > 1 and neg > 0 else random.choice(escalation_states)
        next_action = top_offer["OFFER_NAME"] if top_offer is not None else "No offer available"
        rows.append({
            "MEMORY_ID": f"MEM-{idx:06d}", "CUSTOMER_ID": cust_id,
            "CHANNEL": random.choice(channels), "LANGUAGE": random.choice(["English", "Spanish", "French"]),
            "LAST_INTENT": last_intent, "ACTIVE_SPECIALIST": active_specialist,
            "LAST_SUMMARY": f"Customer contacted support regarding {last_intent.replace('_', ' ')}. Current risk is {churn_row['CHURN_RISK_LEVEL']} with {neg} negative calls and {open_case_count} open cases.",
            "OPEN_ACTIONS": f"Review {active_specialist.lower()} recommendation; confirm next action for {cust['PLAN_NAME']} subscriber.",
            "NEXT_BEST_ACTION": next_action,
            "LAST_CONTACT_AT": (datetime.now() - timedelta(days=random.randint(0, 12), hours=random.randint(1, 23))).strftime("%Y-%m-%d %H:%M:%S"),
            "ESCALATION_STATUS": escalation,
            "REP_ASSIST_BRIEF": f"Lead with acknowledgment of {neg} negative interactions, confirm current issue, and use {active_specialist.lower()} workflow. Mention any active case before presenting {next_action}.",
        })
    return pd.DataFrame(rows)


def generate_action_audit(customers_df, memory_df, nba_df):
    nba_lookup = nba_df.groupby("CUSTOMER_ID").head(1).set_index("CUSTOMER_ID")
    rows = []
    action_counter = 1
    for _, cust in customers_df.iterrows():
        cust_id = cust["CUSTOMER_ID"]
        mem = memory_df[memory_df["CUSTOMER_ID"] == cust_id].iloc[0]
        offer_name = nba_lookup.loc[cust_id]["OFFER_NAME"] if cust_id in nba_lookup.index else "General service follow-up"
        event_time = datetime.now() - timedelta(days=random.randint(0, 10), hours=random.randint(0, 23))
        rows.append({
            "ACTION_ID": f"ACT-{action_counter:06d}", "CUSTOMER_ID": cust_id,
            "ACTION_CATEGORY": "Recommendation Review",
            "ACTION_NAME": f"Review next best action: {offer_name}",
            "AUTONOMY_LEVEL": "Autonomous", "CONFIRMATION_REQUIRED": False,
            "CONFIRMATION_CAPTURED": False, "APPROVAL_STATUS": "Not Required",
            "EXECUTION_STATUS": random.choice(["Completed", "Completed", "Pending"]),
            "ROLLBACK_ELIGIBLE": False, "ROLLBACK_BY": None,
            "AGENT_NAME": mem["ACTIVE_SPECIALIST"],
            "CUSTOMER_VISIBLE_SUMMARY": f"Prepared recommendation summary for {offer_name}",
            "EVENT_TS": event_time.strftime("%Y-%m-%d %H:%M:%S"),
        })
        action_counter += 1
        if random.random() < 0.55:
            needs_approval = mem["ACTIVE_SPECIALIST"] == "Retention specialist" and random.random() < 0.35
            rows.append({
                "ACTION_ID": f"ACT-{action_counter:06d}", "CUSTOMER_ID": cust_id,
                "ACTION_CATEGORY": "Customer Change", "ACTION_NAME": offer_name,
                "AUTONOMY_LEVEL": "Confirmation Required" if not needs_approval else "Human Approval Required",
                "CONFIRMATION_REQUIRED": True, "CONFIRMATION_CAPTURED": True,
                "APPROVAL_STATUS": "Approved" if needs_approval else "Not Required",
                "EXECUTION_STATUS": random.choice(["Completed", "Pending", "Ready"]),
                "ROLLBACK_ELIGIBLE": True,
                "ROLLBACK_BY": (event_time + timedelta(days=7)).strftime("%Y-%m-%d") if not needs_approval else (event_time + timedelta(days=3)).strftime("%Y-%m-%d"),
                "AGENT_NAME": "Transaction / action agent",
                "CUSTOMER_VISIBLE_SUMMARY": f"Prepared action package for {offer_name} with explicit consent and rollback window.",
                "EVENT_TS": (event_time + timedelta(minutes=20)).strftime("%Y-%m-%d %H:%M:%S"),
            })
            action_counter += 1
    return pd.DataFrame(rows)


def generate_agent_recommendations(customers_df, memory_df, churn_df, nba_df, incidents_df, cases_df, qoe_df, billing_df):
    churn_map = churn_df.set_index("CUSTOMER_ID")
    nba_group = nba_df.groupby("CUSTOMER_ID")
    open_cases = cases_df[cases_df["STATUS"].isin(["Open", "In Progress", "Escalated"])].groupby("CUSTOMER_ID").size().to_dict()
    qoe_latest = qoe_df.sort_values("PERIOD").groupby("CUSTOMER_ID").tail(1).set_index("CUSTOMER_ID")
    bill_latest = billing_df.sort_values("BILL_DATE").groupby("CUSTOMER_ID").tail(1).set_index("CUSTOMER_ID")
    active_areas = incidents_df[incidents_df["STATUS"] == "Active"]["AFFECTED_AREA"].tolist()
    rows = []
    rec_counter = 1
    for _, cust in customers_df.iterrows():
        cust_id = cust["CUSTOMER_ID"]
        mem = memory_df[memory_df["CUSTOMER_ID"] == cust_id].iloc[0]
        churn_row = churn_map.loc[cust_id]
        latest_qoe = qoe_latest.loc[cust_id] if cust_id in qoe_latest.index else None
        latest_bill = bill_latest.loc[cust_id] if cust_id in bill_latest.index else None
        offers = nba_group.get_group(cust_id).sort_values("RECOMMENDATION_RANK") if cust_id in nba_group.groups else pd.DataFrame()
        top_offer = offers.iloc[0] if not offers.empty else None
        open_case_count = int(open_cases.get(cust_id, 0))
        rows.append({
            "RECOMMENDATION_ID": f"REC-{rec_counter:06d}", "CUSTOMER_ID": cust_id,
            "AGENT_NAME": "Intent router", "INTENT": mem["LAST_INTENT"],
            "SUB_INTENT": mem["ACTIVE_SPECIALIST"].replace(" specialist", "").replace(" / action agent", ""),
            "RECOMMENDATION_TITLE": f"Route customer to {mem['ACTIVE_SPECIALIST']}",
            "RECOMMENDATION_DETAIL": f"Current evidence suggests the next step belongs in the {mem['ACTIVE_SPECIALIST'].lower()} workflow based on recent interaction history and account context.",
            "CONFIDENCE_SCORE": round(random.uniform(0.76, 0.95), 3), "ACTION_TIER": "Route",
            "REQUIRES_CONFIRMATION": False, "HUMAN_APPROVAL_REQUIRED": False,
            "EXPECTED_OUTCOME": "Reduce time to correct workflow and improve containment",
            "PRIMARY_SIGNAL": f"Last intent: {mem['LAST_INTENT']}",
            "SUPPORTING_SIGNALS": f"Open cases: {open_case_count}; Escalation status: {mem['ESCALATION_STATUS']}",
        })
        rec_counter += 1
        if top_offer is not None:
            action_tier = "Confirm" if top_offer["OFFER_CATEGORY"] != "Retention" else "Approve"
            rows.append({
                "RECOMMENDATION_ID": f"REC-{rec_counter:06d}", "CUSTOMER_ID": cust_id,
                "AGENT_NAME": mem["ACTIVE_SPECIALIST"], "INTENT": mem["LAST_INTENT"],
                "SUB_INTENT": top_offer["OFFER_CATEGORY"],
                "RECOMMENDATION_TITLE": top_offer["OFFER_NAME"],
                "RECOMMENDATION_DETAIL": f"{top_offer['REASON']} Recommended channel is {top_offer['CHANNEL_PREFERENCE']} and offer remains valid until {top_offer['VALID_UNTIL']}.",
                "CONFIDENCE_SCORE": min(0.99, max(0.55, float(top_offer["PROPENSITY_SCORE"]))),
                "ACTION_TIER": action_tier, "REQUIRES_CONFIRMATION": True,
                "HUMAN_APPROVAL_REQUIRED": top_offer["OFFER_CATEGORY"] == "Retention" and churn_row["CHURN_RISK_LEVEL"] == "Critical",
                "EXPECTED_OUTCOME": "Increase conversion or save probability",
                "PRIMARY_SIGNAL": top_offer["REASON"],
                "SUPPORTING_SIGNALS": f"Risk level: {churn_row['CHURN_RISK_LEVEL']}; Segment: {cust['SEGMENT']}",
            })
            rec_counter += 1
        if latest_qoe is not None and (float(latest_qoe["AVG_LATENCY_MS"]) > 95 or float(latest_qoe["DROPPED_CALL_RATE"]) > 0.03):
            rows.append({
                "RECOMMENDATION_ID": f"REC-{rec_counter:06d}", "CUSTOMER_ID": cust_id,
                "AGENT_NAME": "Diagnostics & personalization agent", "INTENT": "network_support",
                "SUB_INTENT": "service_quality_review",
                "RECOMMENDATION_TITLE": "Run technical support specialist workflow",
                "RECOMMENDATION_DETAIL": "Service quality signals are degraded. Recommend guided diagnostics or proactive outreach before presenting commercial offers.",
                "CONFIDENCE_SCORE": round(random.uniform(0.70, 0.92), 3), "ACTION_TIER": "Diagnose",
                "REQUIRES_CONFIRMATION": False, "HUMAN_APPROVAL_REQUIRED": False,
                "EXPECTED_OUTCOME": "Reduce avoidable support calls and improve trust",
                "PRIMARY_SIGNAL": f"Latency {latest_qoe['AVG_LATENCY_MS']} ms / dropped calls {latest_qoe['DROPPED_CALL_RATE']:.1%}",
                "SUPPORTING_SIGNALS": f"Active incident areas available: {len(active_areas)}; Current specialist: {mem['ACTIVE_SPECIALIST']}",
            })
            rec_counter += 1
        if latest_bill is not None and float(latest_bill["OVERAGE_CHARGES"]) > 15:
            rows.append({
                "RECOMMENDATION_ID": f"REC-{rec_counter:06d}", "CUSTOMER_ID": cust_id,
                "AGENT_NAME": "Billing specialist", "INTENT": "billing_help",
                "SUB_INTENT": "overage_review",
                "RECOMMENDATION_TITLE": "Explain overage and compare right-sized plan",
                "RECOMMENDATION_DETAIL": "Recent bill shows meaningful overage charges. Pair bill explanation with a plan optimization quote and explicit confirmation step.",
                "CONFIDENCE_SCORE": round(random.uniform(0.65, 0.90), 3), "ACTION_TIER": "Review",
                "REQUIRES_CONFIRMATION": False, "HUMAN_APPROVAL_REQUIRED": False,
                "EXPECTED_OUTCOME": "Reduce future overage complaints and improve plan fit",
                "PRIMARY_SIGNAL": f"Latest overage charge ${latest_bill['OVERAGE_CHARGES']:.2f}",
                "SUPPORTING_SIGNALS": f"Plan: {cust['PLAN_NAME']}; Usage segment: {cust['SEGMENT']}",
            })
            rec_counter += 1
    return pd.DataFrame(rows)


def upload_to_snowflake(dataframes_dict):
    if CONN_NAME:
        conn = snowflake.connector.connect(connection_name=CONN_NAME)
    else:
        conn = snowflake.connector.connect(
            account=os.environ["SNOWFLAKE_ACCOUNT"],
            user=os.environ["SNOWFLAKE_USER"],
            password=os.environ["SNOWFLAKE_PASSWORD"],
        )
    cur = conn.cursor()
    cur.execute(f"USE ROLE {ROLE}")
    cur.execute(f"USE WAREHOUSE {WAREHOUSE}")
    cur.execute(f"CREATE DATABASE IF NOT EXISTS {DATABASE}")
    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {DATABASE}.{SCHEMA}")
    cur.execute(f"USE SCHEMA {DATABASE}.{SCHEMA}")

    for table_name, df in dataframes_dict.items():
        full_name = f"{DATABASE}.{SCHEMA}.{table_name}"
        print(f"  Uploading {table_name} ({len(df)} rows)...")
        cols = []
        for col in df.columns:
            dtype = df[col].dtype
            if dtype == "bool":
                cols.append(f'"{col}" BOOLEAN')
            elif dtype in ("int64", "int32"):
                cols.append(f'"{col}" NUMBER')
            elif dtype == "float64":
                cols.append(f'"{col}" FLOAT')
            else:
                cols.append(f'"{col}" VARCHAR')
        cur.execute(f"DROP TABLE IF EXISTS {full_name}")
        cur.execute(f"CREATE TABLE {full_name} ({', '.join(cols)})")
        df = df.where(pd.notnull(df), None)
        placeholders = ", ".join(["%s"] * len(df.columns))
        insert_sql = f'INSERT INTO {full_name} ({", ".join([f"{c}" for c in df.columns])}) VALUES ({placeholders})'
        batch_size = 500
        data = [tuple(None if pd.isna(v) else v for v in row) for row in df.itertuples(index=False, name=None)]
        for i in range(0, len(data), batch_size):
            cur.executemany(insert_sql, data[i:i + batch_size])
        print(f"    -> {len(df)} rows uploaded")
    cur.close()
    conn.close()
    print("\nAll 16 tables uploaded successfully!")


def main():
    print("=" * 60)
    print("SnowCX — Agentic CX Intelligence — Data Generator")
    print("=" * 60)
    print(f"Target: {DATABASE}.{SCHEMA}")
    print(f"Connection: {CONN_NAME or 'environment variables'}")
    print()

    print("[1/14] Generating customers...")
    customers = generate_customers()
    print(f"        {len(customers)} customers")

    print("[2/14] Generating devices...")
    devices = generate_devices(customers)
    print(f"        {len(devices)} devices")

    print("[3/14] Generating usage data...")
    usage = generate_usage(customers)
    print(f"        {len(usage)} usage records (6 months)")

    print("[4/14] Generating billing data...")
    billing = generate_billing(customers)
    print(f"        {len(billing)} billing records")

    print("[5/14] Generating engagement data...")
    engagement = generate_engagement(customers)
    print(f"        {len(engagement)} engagement records")

    print("[6/14] Generating QoE data...")
    qoe = generate_qoe(customers)
    print(f"        {len(qoe)} quality-of-experience records")

    print("[7/14] Generating call recordings...")
    call_recordings = generate_call_recordings(customers)
    neg_count = len(call_recordings[call_recordings["CONVERSATION_SENTIMENT"] == "Negative"])
    print(f"        {len(call_recordings)} recordings ({neg_count} negative sentiment)")

    print("[8/14] Generating support cases...")
    cases, case_notes = generate_cases(customers, call_recordings)
    print(f"        {len(cases)} cases, {len(case_notes)} notes")

    print("[9/14] Generating network incidents...")
    incidents, incident_impact = generate_incidents(customers)
    print(f"        {len(incidents)} incidents, {len(incident_impact)} impact records")

    print("[10/14] Generating churn scores...")
    churn_scores = generate_churn_scores(customers, call_recordings)
    high_risk = len(churn_scores[churn_scores["CHURN_RISK_LEVEL"].isin(["Critical", "High"])])
    print(f"         {len(churn_scores)} scores ({high_risk} Critical/High)")

    print("[11/14] Generating NBA recommendations...")
    nba_recs = generate_nba_recommendations(customers, call_recordings)
    print(f"         {len(nba_recs)} recommendations")

    print("[12/14] Generating conversation memory...")
    conversation_memory = generate_conversation_memory(customers, call_recordings, cases, incidents, churn_scores, nba_recs)
    print(f"         {len(conversation_memory)} memory records")

    print("[13/14] Generating action audit log...")
    action_audit = generate_action_audit(customers, conversation_memory, nba_recs)
    print(f"         {len(action_audit)} audit records")

    print("[14/14] Generating agent recommendations...")
    agent_recommendations = generate_agent_recommendations(customers, conversation_memory, churn_scores, nba_recs, incidents, cases, qoe, billing)
    print(f"         {len(agent_recommendations)} agent recommendations")

    print("\n" + "=" * 60)
    print("Uploading to Snowflake...")
    print("=" * 60)
    upload_to_snowflake({
        "TELECOM_CUSTOMERS": customers,
        "TELECOM_DEVICES": devices,
        "TELECOM_USAGE": usage,
        "TELECOM_BILLING": billing,
        "TELECOM_ENGAGEMENT": engagement,
        "TELECOM_QOE": qoe,
        "TELECOM_CALL_RECORDINGS": call_recordings,
        "TELECOM_CASES": cases,
        "TELECOM_CASE_NOTES": case_notes,
        "TELECOM_INCIDENTS": incidents,
        "TELECOM_INCIDENT_IMPACT": incident_impact,
        "TELECOM_CHURN_SCORES": churn_scores,
        "TELECOM_NBA_RECOMMENDATIONS": nba_recs,
        "TELECOM_CONVERSATION_MEMORY": conversation_memory,
        "TELECOM_ACTION_AUDIT": action_audit,
        "TELECOM_AGENT_RECOMMENDATIONS": agent_recommendations,
    })
    print("\nDone! You can now start the SnowCX app.")


if __name__ == "__main__":
    main()
