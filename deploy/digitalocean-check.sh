#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DIGITALOCEAN_TOKEN:-}" || -z "${DROPLET_IP:-}" ]]; then
  echo "DigitalOcean API check skipped: DIGITALOCEAN_TOKEN or DROPLET_IP is missing."
  exit 0
fi

matches="$(curl --fail --silent --show-error \
  --header "Authorization: Bearer $DIGITALOCEAN_TOKEN" \
  "https://api.digitalocean.com/v2/droplets?per_page=200" \
  | jq --arg ip "$DROPLET_IP" '[.droplets[] | select(.networks.v4[]?.ip_address == $ip)] | length')"

if [[ "$matches" -lt 1 ]]; then
  echo "No DigitalOcean droplet found for DROPLET_IP=$DROPLET_IP." >&2
  exit 1
fi

echo "DigitalOcean droplet verified for $DROPLET_IP."
