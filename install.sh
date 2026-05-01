#!/usr/bin/env bash
set -euo pipefail

#
# SnowCX — Agentic CX Intelligence
# One-click installer
#
# Usage:
#   ./install.sh                          # Interactive — prompts for connection name
#   ./install.sh --connection myconn      # Non-interactive with named connection
#   ./install.sh --skip-data              # Skip data generation (tables already exist)
#   ./install.sh --skip-infra             # Skip Snowflake infrastructure setup
#   ./install.sh --spcs                   # Also build & deploy to SPCS
#

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

SKIP_DATA=false
SKIP_INFRA=false
DEPLOY_SPCS=false
CONNECTION_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --connection)  CONNECTION_NAME="$2"; shift 2 ;;
        --skip-data)   SKIP_DATA=true; shift ;;
        --skip-infra)  SKIP_INFRA=true; shift ;;
        --spcs)        DEPLOY_SPCS=true; shift ;;
        -h|--help)
            echo "Usage: ./install.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --connection NAME   Snowflake connection name from ~/.snowflake/connections.toml"
            echo "  --skip-data         Skip data generation (use if tables already exist)"
            echo "  --skip-infra        Skip Snowflake infrastructure DDL"
            echo "  --spcs              Build container and deploy to Snowpark Container Services"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   SnowCX — Agentic CX Intelligence                      ║"
echo "║   Installer                                              ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ─── Step 0: Check prerequisites ───
echo -e "${YELLOW}[0/6] Checking prerequisites...${NC}"

check_cmd() {
    if ! command -v "$1" &>/dev/null; then
        echo -e "${RED}  ✗ $1 is required but not installed.${NC}"
        echo "    Install: $2"
        exit 1
    fi
    echo -e "${GREEN}  ✓ $1${NC}"
}

check_cmd "node"    "https://nodejs.org (v18+ required)"
check_cmd "npm"     "Comes with Node.js"
check_cmd "python3" "https://www.python.org/downloads/"

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [[ "$NODE_VER" -lt 18 ]]; then
    echo -e "${RED}  ✗ Node.js v18+ required (found v${NODE_VER})${NC}"
    exit 1
fi

# Check Python packages
echo "  Checking Python packages..."
python3 -c "import snowflake.connector" 2>/dev/null || {
    echo -e "${YELLOW}  Installing snowflake-connector-python...${NC}"
    pip3 install snowflake-connector-python pandas numpy --quiet
}

# ─── Step 1: Get Snowflake connection ───
echo ""
echo -e "${YELLOW}[1/6] Snowflake connection setup...${NC}"

if [[ -z "$CONNECTION_NAME" ]]; then
    echo ""
    echo "  Enter your Snowflake connection name from ~/.snowflake/connections.toml"
    echo "  (This connection must use a role with CREATE DATABASE privilege, e.g., ACCOUNTADMIN)"
    echo ""
    read -rp "  Connection name: " CONNECTION_NAME
fi

if [[ -z "$CONNECTION_NAME" ]]; then
    echo -e "${RED}  Connection name cannot be empty.${NC}"
    exit 1
fi

echo -e "${GREEN}  Using connection: ${CONNECTION_NAME}${NC}"
export SNOWFLAKE_CONNECTION_NAME="$CONNECTION_NAME"

# Verify connection
echo "  Verifying Snowflake connectivity..."
python3 -c "
import snowflake.connector, os
conn = snowflake.connector.connect(connection_name=os.environ['SNOWFLAKE_CONNECTION_NAME'])
cur = conn.cursor()
cur.execute('SELECT CURRENT_ACCOUNT(), CURRENT_USER()')
row = cur.fetchone()
print(f'  Connected to {row[0]} as {row[1]}')
conn.close()
" || {
    echo -e "${RED}  ✗ Failed to connect to Snowflake. Check your connection name.${NC}"
    exit 1
}

# ─── Step 2: Snowflake infrastructure ───
echo ""
echo -e "${YELLOW}[2/6] Snowflake infrastructure setup...${NC}"

if [[ "$SKIP_INFRA" == true ]]; then
    echo -e "  ${GREEN}Skipped (--skip-infra)${NC}"
else
    echo "  Creating database, schema, warehouse, roles, and compute pool..."
    python3 -c "
import snowflake.connector, os
conn = snowflake.connector.connect(connection_name=os.environ['SNOWFLAKE_CONNECTION_NAME'])
cur = conn.cursor()
with open('${PROJECT_DIR}/setup/snowflake-setup.sql') as f:
    sql = f.read()
for stmt in sql.split(';'):
    stmt = stmt.strip()
    if stmt and not stmt.startswith('--') and not stmt.startswith('/*'):
        lines = [l for l in stmt.split('\n') if not l.strip().startswith('--')]
        clean = '\n'.join(lines).strip()
        if clean:
            try:
                cur.execute(clean)
            except Exception as e:
                if 'already exists' not in str(e).lower():
                    print(f'  Warning: {e}')
conn.close()
print('  Infrastructure setup complete.')
"
    echo -e "${GREEN}  ✓ Database, schema, warehouse, and roles created${NC}"
fi

# ─── Step 3: Seed data ───
echo ""
echo -e "${YELLOW}[3/6] Loading demo data (16 tables, ~500 customers)...${NC}"

if [[ "$SKIP_DATA" == true ]]; then
    echo -e "  ${GREEN}Skipped (--skip-data)${NC}"
else
    python3 "${PROJECT_DIR}/setup/seed-data.py"
    echo -e "${GREEN}  ✓ All 16 tables created and populated${NC}"
fi

# ─── Step 4: Install Node.js dependencies ───
echo ""
echo -e "${YELLOW}[4/6] Installing Node.js dependencies...${NC}"

cd "$PROJECT_DIR"
npm ci --loglevel=warn
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# ─── Step 5: Build the app ───
echo ""
echo -e "${YELLOW}[5/6] Building Next.js application...${NC}"

npm run build
echo -e "${GREEN}  ✓ Build complete${NC}"

# ─── Step 6: SPCS deployment (optional) ───
echo ""
if [[ "$DEPLOY_SPCS" == true ]]; then
    echo -e "${YELLOW}[6/6] Deploying to Snowpark Container Services...${NC}"

    CONTAINER_CMD="docker"
    if command -v podman &>/dev/null && ! command -v docker &>/dev/null; then
        CONTAINER_CMD="podman"
    fi

    REGISTRY=$(python3 -c "
import snowflake.connector, os
conn = snowflake.connector.connect(connection_name=os.environ['SNOWFLAKE_CONNECTION_NAME'])
cur = conn.cursor()
cur.execute('SHOW IMAGE REPOSITORIES IN SCHEMA TELECOM_CX.DATA')
rows = cur.fetchall()
for r in rows:
    if 'TELECOM_CX_REPO' in str(r):
        print(r[4])  # repository_url column
        break
conn.close()
")

    if [[ -z "$REGISTRY" ]]; then
        echo -e "${RED}  ✗ Could not find image repository. Run setup/snowflake-setup.sql first.${NC}"
        exit 1
    fi

    IMAGE="${REGISTRY}/snowcx-react:latest"
    echo "  Building container image..."
    $CONTAINER_CMD build --platform linux/amd64 -t "$IMAGE" .

    echo "  Logging in to Snowflake registry..."
    $CONTAINER_CMD login "$REGISTRY" -u "\$SNOWFLAKE_USER" --password-stdin <<< "$(python3 -c "
import snowflake.connector, os
conn = snowflake.connector.connect(connection_name=os.environ['SNOWFLAKE_CONNECTION_NAME'])
print(conn.rest.token)
conn.close()
")" 2>/dev/null || {
        echo -e "${YELLOW}  Manual login required: $CONTAINER_CMD login $REGISTRY${NC}"
    }

    echo "  Pushing image..."
    $CONTAINER_CMD push "$IMAGE"

    echo "  Creating SPCS service..."
    python3 -c "
import snowflake.connector, os
conn = snowflake.connector.connect(connection_name=os.environ['SNOWFLAKE_CONNECTION_NAME'])
cur = conn.cursor()
cur.execute('USE ROLE SYSADMIN')
with open('${PROJECT_DIR}/service-spec.yaml') as f:
    spec = f.read()
cur.execute('''
CREATE SERVICE IF NOT EXISTS TELECOM_CX.DATA.SNOWCX_SERVICE
  IN COMPUTE POOL TELECOM_CX_POOL
  FROM SPECIFICATION \$\$
''' + spec + '''
\$\$
  MIN_INSTANCES = 1
  MAX_INSTANCES = 1
''')
cur.execute(\"GRANT USAGE ON SERVICE TELECOM_CX.DATA.SNOWCX_SERVICE TO ROLE TELECOM_CX_DEMO_RL\")
cur.execute('SHOW ENDPOINTS IN SERVICE TELECOM_CX.DATA.SNOWCX_SERVICE')
for row in cur.fetchall():
    print(f'  Endpoint: {row}')
conn.close()
"
    echo -e "${GREEN}  ✓ SPCS service deployed${NC}"
else
    echo -e "${YELLOW}[6/6] SPCS deployment skipped (use --spcs to deploy)${NC}"
fi

# ─── Done! ───
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                          ║${NC}"
echo -e "${CYAN}║   ${GREEN}Installation complete!${CYAN}                                 ║${NC}"
echo -e "${CYAN}║                                                          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${YELLOW}To start the app locally:${NC}"
echo ""
echo "    1. Start the Snowflake proxy (in a separate terminal):"
echo "       SNOWFLAKE_CONNECTION_NAME=${CONNECTION_NAME} python3 sf-proxy.py"
echo ""
echo "    2. Start the Next.js dev server:"
echo "       npm run dev"
echo ""
echo "    3. Open http://localhost:3000 in your browser"
echo ""
echo -e "  ${YELLOW}For production (SPCS):${NC}"
echo "    ./install.sh --connection ${CONNECTION_NAME} --skip-data --skip-infra --spcs"
echo ""
