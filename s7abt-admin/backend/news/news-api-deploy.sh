#!/bin/bash

echo "=========================================="
echo "News API Lambda - Fix & Deploy"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "delete.js" ]; then
    print_error "delete.js not found! Make sure you're in the news API directory."
    exit 1
fi

print_success "Found delete.js"
echo ""

# Step 1: Backup existing files
echo "Step 1: Backing up existing files..."
if [ -d "shared" ]; then
    cp -r shared shared.backup
    print_success "Backed up shared/ folder"
fi
echo ""

# Step 2: Check if fixed files are available
echo "Step 2: Updating shared files..."

if [ ! -f "news-api-db.js" ]; then
    print_error "news-api-db.js not found!"
    echo "Please download the fixed files first."
    exit 1
fi

if [ ! -f "news-api-response.js" ]; then
    print_error "news-api-response.js not found!"
    echo "Please download the fixed files first."
    exit 1
fi

# Copy fixed files
mkdir -p shared
cp news-api-db.js shared/db.js
cp news-api-response.js shared/response.js
print_success "Updated shared/db.js"
print_success "Updated shared/response.js"
echo ""

# Step 3: Update package.json
echo "Step 3: Updating package.json..."
if [ -f "news-api-package.json" ]; then
    cp news-api-package.json package.json
    print_success "package.json updated"
else
    print_warning "news-api-package.json not found, creating new one..."
    cat > package.json << 'EOF'
{
  "name": "news-api-backend",
  "version": "1.0.0",
  "main": "delete.js",
  "dependencies": {
    "@aws-sdk/client-secrets-manager": "^3.0.0",
    "mysql2": "^3.11.0"
  }
}
EOF
    print_success "Created package.json"
fi
echo ""

# Step 4: Clean and install dependencies
echo "Step 4: Installing dependencies..."
rm -rf node_modules package-lock.json
npm install --production

if [ $? -eq 0 ]; then
    print_success "Dependencies installed"
else
    print_error "npm install failed!"
    exit 1
fi
echo ""

# Step 5: Verify critical files
echo "Step 5: Verifying installation..."

ERRORS=0

if [ -f "node_modules/mysql2/promise.js" ]; then
    print_success "mysql2/promise.js found"
else
    print_error "mysql2/promise.js NOT found!"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "node_modules/mysql2/index.js" ]; then
    print_success "mysql2/index.js found"
else
    print_error "mysql2/index.js NOT found!"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "node_modules/sqlstring" ]; then
    print_success "sqlstring found"
else
    print_error "sqlstring NOT found!"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "node_modules/@aws-sdk/client-secrets-manager" ]; then
    print_success "@aws-sdk/client-secrets-manager found"
else
    print_error "@aws-sdk/client-secrets-manager NOT found!"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -gt 0 ]; then
    print_error "$ERRORS critical files missing!"
    exit 1
fi
echo ""

# Step 6: Verify file structure
echo "Step 6: Verifying file structure..."

if [ -f "shared/db.js" ]; then
    if grep -q "queryOne" shared/db.js; then
        print_success "db.js has queryOne function"
    else
        print_error "db.js missing queryOne function!"
        ERRORS=$((ERRORS + 1))
    fi
fi

if [ -f "shared/response.js" ]; then
    if grep -q "validationError" shared/response.js; then
        print_success "response.js has validationError function"
    else
        print_error "response.js missing validationError function!"
        ERRORS=$((ERRORS + 1))
    fi
fi

if [ $ERRORS -gt 0 ]; then
    print_error "File structure verification failed!"
    exit 1
fi
echo ""

# Step 7: Create deployment package
echo "Step 7: Creating deployment package..."
rm -f news-api-lambda.zip
zip -r news-api-lambda.zip delete.js shared/ node_modules/ package.json -q

if [ $? -eq 0 ]; then
    PACKAGE_SIZE=$(du -h news-api-lambda.zip | cut -f1)
    print_success "Deployment package created: news-api-lambda.zip ($PACKAGE_SIZE)"
else
    print_error "Failed to create deployment package!"
    exit 1
fi
echo ""

# Step 8: Verify package contents
echo "Step 8: Verifying package contents..."
MYSQL2_CHECK=$(unzip -l news-api-lambda.zip | grep -c "node_modules/mysql2/promise.js")

if [ $MYSQL2_CHECK -gt 0 ]; then
    print_success "mysql2 included in package"
else
    print_error "mysql2 NOT included in package!"
    exit 1
fi
echo ""

# Step 9: Deployment
echo "=========================================="
echo "Deployment"
echo "=========================================="
echo ""
echo "Deployment package ready: news-api-lambda.zip"
echo ""
echo "Deploy using:"
echo "  1) AWS CLI"
echo "  2) AWS Console (Manual)"
echo "  3) Skip deployment"
echo ""

read -p "Enter choice (1-3): " deploy_choice

case $deploy_choice in
    1)
        echo ""
        read -p "Enter Lambda function name: " FUNCTION_NAME
        
        if [ -z "$FUNCTION_NAME" ]; then
            print_error "Function name cannot be empty"
            exit 1
        fi
        
        echo ""
        echo "Deploying to Lambda: $FUNCTION_NAME"
        
        aws lambda update-function-code \
            --function-name "$FUNCTION_NAME" \
            --zip-file fileb://news-api-lambda.zip
        
        if [ $? -eq 0 ]; then
            print_success "Deployment successful!"
            
            echo ""
            read -p "Test the function now? (y/n): " test_now
            
            if [[ $test_now =~ ^[Yy]$ ]]; then
                echo ""
                echo "Testing Lambda function..."
                aws lambda invoke \
                    --function-name "$FUNCTION_NAME" \
                    --payload '{"pathParameters":{"id":"999"}}' \
                    test-response.json
                
                echo ""
                echo "Response:"
                cat test-response.json
                echo ""
                rm -f test-response.json
            fi
        else
            print_error "Deployment failed!"
            exit 1
        fi
        ;;
    2)
        echo ""
        print_success "Manual deployment instructions:"
        echo ""
        echo "1. Go to AWS Lambda Console"
        echo "2. Select your news API function"
        echo "3. Code tab → Upload from → .zip file"
        echo "4. Select: news-api-lambda.zip"
        echo "5. Click Save"
        echo ""
        ;;
    3)
        echo ""
        print_warning "Skipping deployment"
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
echo "  - Files updated: ✓"
echo "  - Dependencies installed: ✓"
echo "  - Package created: news-api-lambda.zip ($PACKAGE_SIZE)"
echo ""
echo "Next steps:"
echo "  1. Ensure environment variables are set (DB_SECRET_ARN or direct credentials)"
echo "  2. Test the delete endpoint"
echo "  3. Check CloudWatch Logs if any issues"
echo ""
echo "Environment variables needed:"
echo "  - DB_SECRET_ARN (or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)"
echo "  - AWS_REGION is automatic, do NOT set it!"
echo ""
