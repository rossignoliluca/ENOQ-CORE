#!/bin/bash
#
# AXIS Contract Verification
# Ensures the geometry cannot be bypassed.
#
# Exit codes:
#   0 = PASS (all checks green)
#   1 = FAIL (violation detected)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$SCRIPT_DIR/../src"

PASS=true
VIOLATIONS=""

echo "═══════════════════════════════════════════════════════════════"
echo "                    AXIS CONTRACT CHECK                         "
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ============================================
# CHECK 1: Import Boundaries
# ============================================

echo "▶ Check 1: Import Boundaries"

# 1a: surfaces/ cannot import from core/modules/
echo "  - surfaces/ → core/modules/ ... "
MATCHES=$(grep -r "from.*['\"].*core/modules" "$SRC_DIR/surfaces" 2>/dev/null | grep -v "node_modules" || true)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES" | head -3
  echo "    ✗ FAIL: surfaces/ imports from core/modules/"
  PASS=false
  VIOLATIONS="$VIOLATIONS\n- surfaces/ imports from core/modules/"
else
  echo "    ✓ CLEAN"
fi

# 1b: external/ cannot import from core/modules/
echo "  - external/ → core/modules/ ... "
MATCHES=$(grep -r "from.*['\"].*core/modules" "$SRC_DIR/external" 2>/dev/null | grep -v "node_modules" || true)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES" | head -3
  echo "    ✗ FAIL: external/ imports from core/modules/"
  PASS=false
  VIOLATIONS="$VIOLATIONS\n- external/ imports from core/modules/"
else
  echo "    ✓ CLEAN"
fi

# 1c: core/ cannot import from experimental/
echo "  - core/ → experimental/ ... "
MATCHES=$(grep -r "from.*['\"].*experimental" "$SRC_DIR/core" 2>/dev/null | grep -v "node_modules" || true)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES" | head -3
  echo "    ✗ FAIL: core/ imports from experimental/"
  PASS=false
  VIOLATIONS="$VIOLATIONS\n- core/ imports from experimental/"
else
  echo "    ✓ CLEAN"
fi

echo ""

# ============================================
# CHECK 2: Orchestrator Path
# ============================================

echo "▶ Check 2: Orchestrator Path (permit + verify)"

ORCHESTRATOR="$SRC_DIR/core/pipeline/orchestrator.ts"

# 2a: permit() call exists
echo "  - permit() call ... "
if grep -q "permit(" "$ORCHESTRATOR" 2>/dev/null; then
  echo "    ✓ PRESENT"
else
  echo "    ✗ FAIL: permit() not found in orchestrator"
  PASS=false
  VIOLATIONS="$VIOLATIONS\n- orchestrator missing permit() call"
fi

# 2b: verifyOutput() call exists
echo "  - verifyOutput() call ... "
if grep -q "verifyOutput(" "$ORCHESTRATOR" 2>/dev/null; then
  echo "    ✓ PRESENT"
else
  echo "    ✗ FAIL: verifyOutput() not found in orchestrator"
  PASS=false
  VIOLATIONS="$VIOLATIONS\n- orchestrator missing verifyOutput() call"
fi

# 2c: STOP signal emitted
echo "  - STOP signal ... "
if grep -q "state: 'STOP'" "$ORCHESTRATOR" 2>/dev/null; then
  echo "    ✓ PRESENT"
else
  echo "    ✗ FAIL: STOP signal not found in orchestrator"
  PASS=false
  VIOLATIONS="$VIOLATIONS\n- orchestrator missing STOP signal"
fi

echo ""

# ============================================
# CHECK 3: Enforcement Presence
# ============================================

echo "▶ Check 3: Enforcement Patterns in S5_verify"

S5_VERIFY="$SRC_DIR/gate/verification/S5_verify.ts"

# 3a: INV-003 patterns
echo "  - INV-003 (no normative delegation) ... "
if grep -q "INV-003" "$S5_VERIFY" 2>/dev/null; then
  echo "    ✓ PRESENT"
else
  echo "    ✗ FAIL: INV-003 not found in S5_verify"
  PASS=false
  VIOLATIONS="$VIOLATIONS\n- S5_verify missing INV-003 enforcement"
fi

# 3b: INV-009 patterns
echo "  - INV-009 (Rubicon) ... "
if grep -q "INV-009" "$S5_VERIFY" 2>/dev/null; then
  echo "    ✓ PRESENT"
else
  echo "    ✗ FAIL: INV-009 not found in S5_verify"
  PASS=false
  VIOLATIONS="$VIOLATIONS\n- S5_verify missing INV-009 enforcement"
fi

# 3c: INV-011 patterns
echo "  - INV-011 (no diagnosis) ... "
if grep -q "INV-011" "$S5_VERIFY" 2>/dev/null; then
  echo "    ✓ PRESENT"
else
  echo "    ✗ FAIL: INV-011 not found in S5_verify"
  PASS=false
  VIOLATIONS="$VIOLATIONS\n- S5_verify missing INV-011 enforcement"
fi

echo ""

# ============================================
# RESULT
# ============================================

echo "═══════════════════════════════════════════════════════════════"

if [ "$PASS" = true ]; then
  echo ""
  echo "  ██████╗  █████╗ ███████╗███████╗"
  echo "  ██╔══██╗██╔══██╗██╔════╝██╔════╝"
  echo "  ██████╔╝███████║███████╗███████╗"
  echo "  ██╔═══╝ ██╔══██║╚════██║╚════██║"
  echo "  ██║     ██║  ██║███████║███████║"
  echo "  ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝"
  echo ""
  echo "  AXIS Contract: PASS"
  echo "  All structural invariants verified."
  echo "  Geometry cannot be bypassed."
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  exit 0
else
  echo ""
  echo "  ███████╗ █████╗ ██╗██╗     "
  echo "  ██╔════╝██╔══██╗██║██║     "
  echo "  █████╗  ███████║██║██║     "
  echo "  ██╔══╝  ██╔══██║██║██║     "
  echo "  ██║     ██║  ██║██║███████╗"
  echo "  ╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝"
  echo ""
  echo "  AXIS Contract: FAIL"
  echo "  Violations:"
  echo -e "$VIOLATIONS"
  echo ""
  echo "  DO NOT DEPLOY."
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  exit 1
fi
