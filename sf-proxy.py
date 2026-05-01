#!/usr/bin/env python3
"""Lightweight Snowflake query proxy using your existing connection."""
import json, os, sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import snowflake.connector

conn = None

def _read_spcs_token():
    try:
        with open("/snowflake/session/token") as f:
            return f.read().strip()
    except FileNotFoundError:
        return None

def get_conn():
    global conn
    if conn:
        try:
            conn.cursor().execute("SELECT 1")
            return conn
        except Exception:
            conn = None
    print("Connecting to Snowflake...")
    spcs_token = _read_spcs_token()
    sf_host = os.getenv("SNOWFLAKE_HOST", "")
    if spcs_token and sf_host:
        account = os.getenv("SNOWFLAKE_ACCOUNT", sf_host.split(".")[0])
        conn = snowflake.connector.connect(
            account=account,
            host=sf_host,
            token=spcs_token,
            authenticator="oauth",
            database=os.getenv("SNOWFLAKE_DATABASE", "TELECOM_CX"),
            schema=os.getenv("SNOWFLAKE_SCHEMA", "DATA"),
            warehouse=os.getenv("SNOWFLAKE_WAREHOUSE", "COMPUTE_WH"),
        )
        print(f"Connected via SPCS OAuth (host={sf_host})")
    else:
        conn_name = os.getenv("SNOWFLAKE_CONNECTION_NAME", "sfsenorthamerica-jptelco_aws1")
        conn = snowflake.connector.connect(connection_name=conn_name)
        conn.cursor().execute("USE ROLE SYSADMIN")
        conn.cursor().execute("USE WAREHOUSE COMPUTE_WH")
        conn.cursor().execute("USE SCHEMA TELECOM_CX.DATA")
        print(f"Connected via named connection ({conn_name})")
    return conn

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}
        sql = body.get("sql", "")
        if not sql:
            self._send(400, {"error": "sql required"})
            return
        try:
            cur = get_conn().cursor()
            cur.execute(sql)
            cols = [d[0] for d in cur.description] if cur.description else []
            rows = [dict(zip(cols, row)) for row in cur.fetchall()]
            self._send(200, rows)
        except Exception as e:
            self._send(500, {"error": str(e)})

    def _send(self, code, data):
        body = json.dumps(data, default=str).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, fmt, *args):
        if "OPTIONS" not in str(args):
            sys.stderr.write(f"[proxy] {fmt % args}\n")

if __name__ == "__main__":
    get_conn()
    port = int(os.getenv("PROXY_PORT", "3001"))
    print(f"Snowflake proxy running on http://localhost:{port}")
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()
