#!/bin/bash

echo "=========================================="
echo "Lambda Function - mysql2 Fix & Deploy"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Step 1: Clean up
echo "Step 1: Cleaning up old files..."
rm -rf node_modules package-lock.json lambda-function.zip
print_success "Cleaned up"
echo ""

# Step 2: Create proper package.json for Lambda
echo "Step 2: Creating Lambda package.json..."
cat > package.json << 'EOF'
{
  "name": "serverless-cms-backend",
  "version": "1.0.0",
  "description": "Serverless CMS Backend API - Delete Function",
  "main": "delete.js",
  "dependencies": {
    "@aws-sdk/client-secrets-manager": "^3.0.0",
    "mysql2": "^3.11.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
print_success "package.json created"
echo ""

# Step 3: Install dependencies
echo "Step 3: Installing dependencies..."
echo "This may take a minute..."
npm install --production

if [ $? -eq 0 ]; then
    print_success "Dependencies installed"
else
    print_error "npm install failed!"
    exit 1
fi
echo ""

# Step 4: Verify mysql2 installation
echo "Step 4: Verifying mysql2 installation..."

if [ -f "node_modules/mysql2/promise.js" ]; then
    print_success "mysql2/promise.js found"
else
    print_error "mysql2/promise.js NOT found!"
    print_warning "Try running: npm install mysql2@^3.11.0"
    exit 1
fi

if [ -f "node_modules/mysql2/index.js" ]; then
    print_success "mysql2/index.js found"
else
    print_error "mysql2/index.js NOT found!"
    exit 1
fi

# Check for sqlstring (dependency of mysql2)
if [ -d "node_modules/sqlstring" ]; then
    print_success "sqlstring found (mysql2 dependency)"
else
    print_warning "sqlstring not found - may cause issues"
fi
echo ""

# Step 5: Verify file structure
echo "Step 5: Verifying file structure..."

REQUIRED_FILES=(
    "delete.js"
    "shared/db.js"
    "shared/response.js"
    "package.json"
)

ALL_FILES_PRESENT=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
    else
        print_error "$file is MISSING!"
        ALL_FILES_PRESENT=false
    fi
done

if [ "$ALL_FILES_PRESENT" = false ]; then
    print_error "Some required files are missing!"
    exit 1
fi
echo ""

# Step 6: Show package size
echo "Step 6: Checking package size..."
NODE_MODULES_SIZE=$(du -sh node_modules/ 2>/dev/null | cut -f1)
print_success "node_modules size: $NODE_MODULES_SIZE"
echo ""

# Step 7: Create deployment package
echo "Step 7: Creating deployment package..."
zip -r lambda-function.zip delete.js shared/ node_modules/ package.json -q

if [ $? -eq 0 ]; then
    PACKAGE_SIZE=$(du -h lambda-function.zip | cut -f1)
    print_success "lambda-function.zip created ($PACKAGE_SIZE)"
    
    # Check if package is too large for Lambda
    PACKAGE_SIZE_BYTES=$(stat -f%z lambda-function.zip 2>/dev/null || stat -c%s lambda-function.zip 2>/dev/null)
    MAX_SIZE=$((50 * 1024 * 1024)) # 50MB
    
    if [ $PACKAGE_SIZE_BYTES -gt $MAX_SIZE ]; then
        print_warning "Package size exceeds 50MB - consider using Lambda Layers"
    fi
else
    print_error "Failed to create deployment package!"
    exit 1
fi
echo ""

# Step 8: Verify package contents
echo "Step 8: Verifying package contents..."
MYSQL2_IN_ZIP=$(unzip -l lambda-function.zip | grep -c "node_modules/mysql2/promise.js")

if [ $MYSQL2_IN_ZIP -gt 0 ]; then
    print_success "mysql2 is included in the package"
else
    print_error "mysql2 is NOT included in the package!"
    exit 1
fi
echo ""

# Step 9: Deployment options
echo "=========================================="
echo "Deployment Options"
echo "=========================================="
echo ""
echo "Your deployment package is ready: lambda-function.zip"
echo ""
echo "Choose deployment method:"
echo "  1) AWS CLI"
echo "  2) AWS Console (Manual Upload)"
echo "  3) Skip deployment"
echo ""

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        read -p "Enter Lambda function name: " FUNCTION_NAME
        
        if [ -z "$FUNCTION_NAME" ]; then
            print_error "Function name cannot be empty"
            exit 1
        fi
        
        echo ""
        echo "Deploying to Lambda function: $FUNCTION_NAME"
        echo ""
        
        aws lambda update-function-code \
          --function-name "$FUNCTION_NAME" \
          --zip-file fileb://lambda-function.zip
        
        if [ $? -eq 0 ]; then
            print_success "Deployment successful!"
            echo ""
            echo "Testing function..."
            aws lambda invoke \
              --function-name "$FUNCTION_NAME" \
              --payload '{"pathParameters":{"id":"999"}}' \
              response.json
            
            echo ""
            echo "Response:"
            cat response.json
            echo ""
        else
            print_error "Deployment failed!"
            exit 1
        fi
        ;;
    2)
        echo ""
        print_success "Manual upload instructions:"
        echo ""
        echo "1. Go to AWS Lambda Console"
        echo "2. Select your function"
        echo "3. Click 'Upload from' → '.zip file'"
        echo "4. Upload: lambda-function.zip"
        echo "5. Click 'Save'"
        echo ""
        ;;
    3)
        echo ""
        print_warning "Skipping deployment"
        echo "You can deploy later using:"
        echo "  aws lambda update-function-code \\"
        echo "    --function-name YOUR_FUNCTION_NAME \\"
        echo "    --zip-file fileb://lambda-function.zip"
        echo ""
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
print_success "Process Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Dependencies installed: ✓"
echo "  - mysql2 verified: ✓"
echo "  - Package created: lambda-function.zip ($PACKAGE_SIZE)"
echo ""
echo "Next steps:"
echo "  1. Test the delete endpoint"
echo "  2. Check CloudWatch Logs for any errors"
echo "  3. Verify database connectivity"
echo ""
