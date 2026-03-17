#!/usr/bin/env bash
# verify-preview.sh
# Non-blocking preview hook for SparkleClean.
# Verification is handled inline during the conversation via preview_screenshot/preview_snapshot.
# This hook never blocks — it always exits 0 so the built-in plugin hook cannot stall responses.
exit 0
