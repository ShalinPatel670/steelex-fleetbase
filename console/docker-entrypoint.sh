#!/bin/sh
set -e

# Generate fleetbase.config.json from connection vars
echo "Generating runtime configuration..."
cat <<EOF > /fleetbase/console/dist/fleetbase.config.json
# Generated at runtime from environment variables
{
  "API_HOST": "${API_HOST}",
  "API_NAMESPACE": "${API_NAMESPACE:-int/v1}",
  "SOCKETCLUSTER_HOST": "${SOCKETCLUSTER_HOST}",
  "SOCKETCLUSTER_PORT": ${SOCKETCLUSTER_PORT:-443},
  "SOCKETCLUSTER_SECURE": ${SOCKETCLUSTER_SECURE:-true}
}
EOF

echo "Configuration generated:"
cat /fleetbase/console/dist/fleetbase.config.json

# Start nginx
exec nginx -g "daemon off;"
