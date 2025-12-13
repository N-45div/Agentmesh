#!/bin/bash
# AgentMesh Code Review Script
# Outputs review results to markdown files

MCP_URL="http://localhost:3001/mcp"
OUTPUT_DIR="./reviews"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🤖 AgentMesh Code Review${NC}"
echo "================================"

# Check if MCP server is running
check_server() {
    curl -s -o /dev/null -w "%{http_code}" "$MCP_URL" -X POST \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' 2>/dev/null
}

echo -n "Checking MCP server... "
STATUS=$(check_server)
if [ "$STATUS" != "200" ]; then
    echo -e "${RED}OFFLINE${NC}"
    echo "Start the server with: pnpm dev"
    exit 1
fi
echo -e "${GREEN}ONLINE${NC}"

# Function to run code review
run_review() {
    local target="$1"
    local focus="${2:-security,bugs,performance}"
    local output_file="$OUTPUT_DIR/review_${TIMESTAMP}_$(basename "$target" | tr '.' '_').md"
    
    echo -e "\n${YELLOW}📝 Reviewing: $target${NC}"
    echo "Focus areas: $focus"
    
    # Create markdown header
    cat > "$output_file" << EOF
# Code Review: $target

**Date:** $(date)
**Focus Areas:** $focus

---

EOF

    # Call MCP server (simplified - just use cline directly for better output)
    echo "Running analysis..."
    
    # Use cline directly for review
    cline -y --oneshot "Review the file $target. Focus on: $focus. List the top 5 issues found with severity ratings. Be concise." 2>&1 | tee -a "$output_file"
    
    echo -e "\n${GREEN}✅ Review saved to: $output_file${NC}"
}

# Function to run security audit
run_security_audit() {
    local target="${1:-.}"
    local output_file="$OUTPUT_DIR/security_audit_${TIMESTAMP}.md"
    
    echo -e "\n${YELLOW}🔒 Security Audit: $target${NC}"
    
    cat > "$output_file" << EOF
# Security Audit Report

**Date:** $(date)
**Target:** $target

---

EOF

    cline -y --oneshot "Perform a security audit on $target. Check for: vulnerabilities, exposed secrets, dependency issues. Provide severity ratings." 2>&1 | tee -a "$output_file"
    
    echo -e "\n${GREEN}✅ Audit saved to: $output_file${NC}"
}

# Function to generate tests
run_generate_tests() {
    local target="$1"
    local output_file="$OUTPUT_DIR/tests_${TIMESTAMP}_$(basename "$target" | tr '.' '_').md"
    
    echo -e "\n${YELLOW}🧪 Generating Tests: $target${NC}"
    
    cat > "$output_file" << EOF
# Generated Tests: $target

**Date:** $(date)

---

EOF

    cline -y --oneshot "Generate unit tests for $target using vitest. Include edge cases and error handling tests." 2>&1 | tee -a "$output_file"
    
    echo -e "\n${GREEN}✅ Tests saved to: $output_file${NC}"
}

# Main menu
show_help() {
    echo ""
    echo "Usage: ./review.sh [command] [target] [options]"
    echo ""
    echo "Commands:"
    echo "  review <file>     - Code review a specific file"
    echo "  audit [dir]       - Security audit (default: current dir)"
    echo "  tests <file>      - Generate tests for a file"
    echo "  all <file>        - Run all analyses on a file"
    echo ""
    echo "Examples:"
    echo "  ./review.sh review src/lib/cline.ts"
    echo "  ./review.sh audit ."
    echo "  ./review.sh tests src/tools/security-audit.ts"
    echo "  ./review.sh all src/lib/cline.ts"
}

# Parse arguments
case "$1" in
    review)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a file to review${NC}"
            show_help
            exit 1
        fi
        run_review "$2" "$3"
        ;;
    audit)
        run_security_audit "${2:-.}"
        ;;
    tests)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a file${NC}"
            show_help
            exit 1
        fi
        run_generate_tests "$2"
        ;;
    all)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a file${NC}"
            show_help
            exit 1
        fi
        run_review "$2"
        run_security_audit "$2"
        run_generate_tests "$2"
        ;;
    *)
        show_help
        ;;
esac

echo ""
echo -e "${GREEN}📁 All reviews saved in: $OUTPUT_DIR/${NC}"
