#\!/bin/bash
# PolarHub Middleware Log Watcher
echo "🔍 Watching logs/ for new API calls..."
echo "Press Ctrl+C to stop"
echo ""

fswatch -0 logs/ | while IFS= read -r -d "" file; do
  if [[ -f "$file" && "$file" == *.json ]]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📨 $(date +%H:%M:%S) - $(basename "$file")"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    python3 -m json.tool "$file" 2>/dev/null | head -40
  fi
done
