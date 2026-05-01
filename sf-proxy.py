#!/usr/bin/env python3
"""Lightweight Snowflake query proxy using your existing connection."""
import json, os, sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import snowflake.connector

conn = None

def get_conn():
    global conn
    if conn:
        try:
            conn.cursor().execute("SELECT 1")
            return conn
        except Exception:
            conn = None
    print("Connecting to Snowflake...")
    conn = snowflake.connector.connect(
        connection_name=os.getenv("SNOWFLAKE_CONNECTION_NAME", "sfsenorthamerica-jptelco_aws1")
    )
    conn.cursor().execute("USE ROLE SYSADMIN")
    conn.cursor().execute("USE WAREHOUSE COMPUTE_WH")
    conn.cursor().execute("USE SCHEMA TELECOM_CX.DATA")
    print("Connected!")
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
