#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${HOSTINGER_TOKEN:-}" || -z "${DOMAIN_NAME:-}" || -z "${DROPLET_IP:-}" ]]; then
  echo "Hostinger DNS update skipped: HOSTINGER_TOKEN, DOMAIN_NAME or DROPLET_IP is missing."
  exit 0
fi

HOSTINGER_API_BASE="${HOSTINGER_API_BASE:-https://developers.hostinger.com}"
DNS_TTL="${DNS_TTL:-14400}"

payload="$(jq -n \
  --arg ip "$DROPLET_IP" \
  --argjson ttl "$DNS_TTL" \
  '{
    overwrite: true,
    zone: [
      {name: "@", type: "A", ttl: $ttl, records: [{content: $ip}]},
      {name: "www", type: "A", ttl: $ttl, records: [{content: $ip}]}
    ]
  }')"

curl --fail --silent --show-error \
  --request PUT "$HOSTINGER_API_BASE/api/dns/v1/zones/$DOMAIN_NAME" \
  --header "Authorization: Bearer $HOSTINGER_TOKEN" \
  --header "Content-Type: application/json" \
  --header "Accept: application/json" \
  --data "$payload" >/dev/null

echo "Hostinger DNS records updated for $DOMAIN_NAME -> $DROPLET_IP."
