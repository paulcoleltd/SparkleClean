#!/usr/bin/env bash
# verify-preview.sh
# Smart preview verification hook for SparkleClean.
# Only requires preview check when UI-affecting files have been changed.
# Non-UI files (prisma/, e2e/, config, scripts) are skipped silently.

UI_PATTERNS=(
  "src/app/"
  "src/components/"
  "src/styles/"
  "src/emails/"
  "tailwind.config"
  "postcss.config"
  "public/"
)

# Files passed by Claude Code via CLAUDE_CHANGED_FILES env var (colon-separated)
# Fall back to checking git diff if not set
if [ -n "$CLAUDE_CHANGED_FILES" ]; then
  CHANGED="$CLAUDE_CHANGED_FILES"
else
  CHANGED=$(git diff --name-only HEAD 2>/dev/null | tr '\n' ':')
fi

# Check if any changed file matches a UI pattern
needs_preview=false
for pattern in "${UI_PATTERNS[@]}"; do
  if echo "$CHANGED" | grep -q "$pattern"; then
    needs_preview=true
    break
  fi
done

if [ "$needs_preview" = "false" ]; then
  # Non-UI change — no preview verification needed
  exit 0
fi

# UI file changed — ensure preview server is up
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null | grep -q "200\|304\|307"; then
  echo "[Preview Required] UI files were edited but dev server is not responding on port 3001. Run preview_start first."
  exit 1
fi

# Server is up — verification passed
exit 0
