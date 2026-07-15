#!/bin/bash
# Dump database to .sql file
# Usage: npm run db:dump (dev) or npm run db:dump:prod (production)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

# Parse .env
get_env() {
  grep "^$1=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '\r\n'
}

if [ "$1" = "production" ]; then
  HOST=$(get_env "DB_HOST_PROD")
  NAME=$(get_env "DB_NAME_PROD")
  USER=$(get_env "DB_USER_PROD")
  PASS=$(get_env "DB_PASSWORD_PROD")
  OUTPUT="$SCRIPT_DIR/../database-prod-$(date +%Y%m%d_%H%M%S).sql"
else
  HOST=$(get_env "DB_HOST")
  NAME=$(get_env "DB_NAME")
  USER=$(get_env "DB_USER")
  PASS=$(get_env "DB_PASSWORD")
  OUTPUT="$SCRIPT_DIR/../database-$(date +%Y%m%d_%H%M%S).sql"
fi

echo "Dumping database '$NAME' to $OUTPUT ..."

mysqldump -h"$HOST" -u"$USER" -p"$PASS" "$NAME" > "$OUTPUT" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Database dumped to $OUTPUT"
else
  echo "❌ Dump failed. Make sure mysqldump is available and credentials are correct."
  exit 1
fi
