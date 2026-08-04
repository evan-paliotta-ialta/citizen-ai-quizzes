#!/bin/bash
#
# run_daily.sh — launchd wrapper for the daily convergence scan.
#
# Unlike the other crons in this workspace (which are pure Python/data
# scripts), this one needs real semantic judgment — cross-citizen title
# similarity, then full-content overlap criteria — and there is no
# standalone Anthropic Messages API key in this workspace to call out to.
# So this invokes the local `claude` CLI in non-interactive mode
# (`-p`/--print) to run the /convergence-scan skill as a real Claude Code
# session, using Evan's own authenticated Claude Code login rather than a
# separate API key.
#
# --dangerously-skip-permissions is required for a truly unattended run
# (no one is present to approve tool calls), which is exactly why this
# script should not be loaded into launchd until the Tier 3 automation
# review has happened — see compliance-api/README.md and the build plan.
#
# Driven by launchd job com.ialta.convergence-scan (once installed).

set -uo pipefail

PROJECT_DIR="/Users/evanpaliotta/Desktop/iAltA Test/Citizen AI Engineer"
LOG_DIR="${PROJECT_DIR}/compliance-api/convergence/cron_logs"
LOCK_FILE="/tmp/convergence-scan.lock"

mkdir -p "${LOG_DIR}"

if [ -e "${LOCK_FILE}" ]; then
  PID=$(cat "${LOCK_FILE}" 2>/dev/null)
  if [ -n "${PID}" ] && kill -0 "${PID}" 2>/dev/null; then
    echo "$(date): previous run (pid ${PID}) still active, skipping this run." \
      >> "${LOG_DIR}/skipped_runs.log"
    exit 0
  fi
fi
echo $$ > "${LOCK_FILE}"
trap 'rm -f "${LOCK_FILE}"' EXIT

STAMP="$(date +%Y%m%d_%H%M%S)"
LOG="${LOG_DIR}/convergence_scan_${STAMP}.log"

cd "${PROJECT_DIR}" || { echo "FATAL: cannot cd to ${PROJECT_DIR}" >&2; exit 1; }

{
  echo "=== Convergence scan — started $(date) ==="
  claude -p "/convergence-scan" \
    --permission-mode bypassPermissions \
    --allowedTools "Bash,Read,mcp__claude_ai_Slack__slack_send_message"
  code=$?
  echo "=== Convergence scan finished — exit code ${code} ==="
  exit ${code}
} >> "${LOG}" 2>&1
status=$?

# Keep the most recent 30 run logs.
ls -1t "${LOG_DIR}"/convergence_scan_*.log 2>/dev/null | tail -n +31 | while read -r old; do rm -f "$old"; done

exit ${status}
