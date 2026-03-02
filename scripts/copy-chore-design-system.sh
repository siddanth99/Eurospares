#!/usr/bin/env bash
# Copy design system from chore-app to eurospares. READ-ONLY from chore-app.
set -e

CHORE_APP="/Users/siddanthmacherla/chore-app"
EUROSPARES="/Users/siddanthmacherla/eurospares"

if [[ ! -d "$CHORE_APP" ]]; then
  echo "Error: chore-app not found at $CHORE_APP"
  exit 1
fi
if [[ ! -d "$EUROSPARES" ]]; then
  echo "Error: eurospares not found at $EUROSPARES"
  exit 1
fi

echo "Copying design system from chore-app to eurospares..."

# 1. globals.css
mkdir -p "$EUROSPARES/src/app"
cp "$CHORE_APP/app/globals.css" "$EUROSPARES/src/app/globals.css"
echo "  [OK] app/globals.css -> src/app/globals.css"

# 2. components/ui/
mkdir -p "$EUROSPARES/src/components/ui"
for f in "$CHORE_APP/components/ui"/*; do
  [[ -e "$f" ]] || continue
  name=$(basename "$f")
  cp "$f" "$EUROSPARES/src/components/ui/$name"
  echo "  [OK] components/ui/$name -> src/components/ui/$name"
done

# 3. components/theme/
mkdir -p "$EUROSPARES/src/components/theme"
for f in "$CHORE_APP/components/theme"/*; do
  [[ -e "$f" ]] || continue
  name=$(basename "$f")
  cp "$f" "$EUROSPARES/src/components/theme/$name"
  echo "  [OK] components/theme/$name -> src/components/theme/$name"
done

# 4. lib/utils.ts
mkdir -p "$EUROSPARES/src/lib"
cp "$CHORE_APP/lib/utils.ts" "$EUROSPARES/src/lib/utils.ts"
echo "  [OK] lib/utils.ts -> src/lib/utils.ts"

# Fix imports in copied files so they resolve in eurospares (@/* -> ./*)
# @/lib/ -> @/src/lib/, @/components/ -> @/src/components/, @/hooks/ -> @/src/hooks/
echo ""
echo "Updating import paths in copied files for eurospares (@/src/)..."
for dir in "$EUROSPARES/src/components/ui" "$EUROSPARES/src/components/theme"; do
  for f in "$dir"/*.tsx; do
    [[ -f "$f" ]] || continue
    if grep -qE 'from ["'\''"]@/lib/' "$f"; then
      sed -i '' 's|from "@/lib/|from "@/src/lib/|g; s|from '\''@/lib/|from '\''@/src/lib/|g' "$f"
      echo "  [PATH] $(basename "$f")"
    fi
    if grep -qE 'from ["'\''"]@/components/' "$f"; then
      sed -i '' 's|from "@/components/|from "@/src/components/|g; s|from '\''@/components/|from '\''@/src/components/|g' "$f"
      echo "  [PATH] $(basename "$f")"
    fi
    if grep -qE 'from ["'\''"]@/hooks/' "$f"; then
      sed -i '' 's|from "@/hooks/|from "@/src/hooks/|g; s|from '\''@/hooks/|from '\''@/src/hooks/|g' "$f"
      echo "  [PATH] $(basename "$f")"
    fi
  done
done

echo ""
echo "Done. Summary below."
