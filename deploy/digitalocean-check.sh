#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DIGITALOCEAN_TOKEN:-}" || -z "${DROPLET_IP:-}" ]]; then
  echo "DigitalOcean API check skipped: DIGITALOCEAN_TOKEN or DROPLET_IP is missing."
  exit 0
fi

response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT

http_code="$(curl --silent --show-error \
  --output "$response_file" \
  --write-out "%{http_code}" \
  --header "Authorization: Bearer $DIGITALOCEAN_TOKEN" \
  "https://api.digitalocean.com/v2/droplets?per_page=200")"

if [[ "$http_code" != "200" ]]; then
  echo "DigitalOcean API check skipped: API returned HTTP $http_code. SSH deployment will continue." >&2
  exit 0
fi

matches="$(jq --arg ip "$DROPLET_IP" '[.droplets[] | select(.networks.v4[]?.ip_address == $ip)] | length' "$response_file")"

if [[ "$matches" -lt 1 ]]; then
  echo "No DigitalOcean droplet found for DROPLET_IP=$DROPLET_IP." >&2
  exit 1
fi

echo "DigitalOcean droplet verified for $DROPLET_IP."
