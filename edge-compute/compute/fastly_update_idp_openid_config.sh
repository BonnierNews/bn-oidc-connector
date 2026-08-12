#!/bin/bash

# Config
CONFIG_STORE_ID_LAB="o2G4LgVl0AnyBRgpMzmUY0" # oauth_config_lab
CONFIG_STORE_ID_PROD="" # oauth_config_prod

# Exit on error
set -e

# Check if curl, jq, and fastly are installed
if ! command -v curl &> /dev/null || ! command -v jq &> /dev/null || ! command -v fastly &> /dev/null; then
  echo "Error: curl, jq, and fastly cli tools are required but are not installed."
  exit 1
fi

# Check arguments
if [ $# -ne 1 ] || [[ ! "$1" =~ ^(lab|prod)$ ]]; then
  echo "Usage: $0 <lab|prod>"
  echo "  lab  - Use lab config store"
  echo "  prod - Use production config store"
  exit 1
fi

ENVIRONMENT=$1

# Set variables based on environment
if [ "$ENVIRONMENT" = "lab" ]; then
  CONFIG_STORE_ID=$CONFIG_STORE_ID_LAB
elif [ "$ENVIRONMENT" = "prod" ]; then
  CONFIG_STORE_ID=$CONFIG_STORE_ID_PROD
fi

OIDC_DISCOVERY_URL="https://bn-login-id-service-di-lab.bnu.bn.nr/oauth/.well-known/openid-configuration"
JWKS_URL="https://bn-login-id-service-di-lab.bnu.bn.nr/oauth/jwks"

echo "Using $ENVIRONMENT environment with config store ID: $CONFIG_STORE_ID"

# Check if CONFIG_STORE_ID or SECRET_STORE_ID is empty
if [ -z "$CONFIG_STORE_ID" ]; then
  echo "Error: CONFIG_STORE_ID variable is empty."
  echo "Check with the following command:"
  echo
  echo 'fastly config-store list'
  exit 1
fi

# Check if config store exists
echo -n "Checking if config store with ID $CONFIG_STORE_ID exists... "
if fastly config-store describe --store-id=$CONFIG_STORE_ID &> /dev/null; then
  echo "done"
else
  echo "Error: Config store with ID $CONFIG_STORE_ID does not exist."
  exit 1
fi

# Add configuration to the config store
echo "Fetching OIDC Discovery document..."
curl -s $OIDC_DISCOVERY_URL | fastly config-store-entry update --store-id=$CONFIG_STORE_ID --key="openid_configuration" --stdin
echo "Fetching JWKS document..."
curl -s $JWKS_URL | fastly config-store-entry update --store-id=$CONFIG_STORE_ID --key="jwks" --stdin

echo "Configuration has been updated."
