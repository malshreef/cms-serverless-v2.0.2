#!/bin/bash

# Lambda Environment Configuration Script
# This script helps you set up the required environment variables for your Lambda function

echo "=========================================="
echo "Lambda Environment Configuration"
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

# Get Lambda function name
read -p "Enter your Lambda function name: " FUNCTION_NAME

if [ -z "$FUNCTION_NAME" ]; then
    print_error "Function name cannot be empty"
    exit 1
fi

echo ""
echo "Choose configuration method:"
echo "  1) Use AWS Secrets Manager (Recommended for Production)"
echo "  2) Use Direct Environment Variables (Quick Setup/Testing)"
echo ""
read -p "Enter choice (1 or 2): " CONFIG_METHOD

case $CONFIG_METHOD in
    1)
        echo ""
        echo "=== AWS Secrets Manager Setup ==="
        echo ""
        
        read -p "Enter AWS Region (e.g., us-east-1): " AWS_REGION
        read -p "Enter Secret Name (e.g., db-credentials): " SECRET_NAME
        
        echo ""
        echo "Checking if secret exists..."
        
        SECRET_ARN=$(aws secretsmanager describe-secret \
            --secret-id "$SECRET_NAME" \
            --region "$AWS_REGION" \
            --query 'ARN' \
            --output text 2>/dev/null)
        
        if [ -z "$SECRET_ARN" ]; then
            print_warning "Secret '$SECRET_NAME' not found. Let's create it!"
            echo ""
            
            read -p "Database Host (e.g., mydb.xxx.rds.amazonaws.com): " DB_HOST
            read -p "Database Port (default: 3306): " DB_PORT
            DB_PORT=${DB_PORT:-3306}
            read -p "Database Name: " DB_NAME
            read -p "Database Username: " DB_USER
            read -sp "Database Password: " DB_PASSWORD
            echo ""
            
            echo ""
            echo "Creating secret..."
            
            aws secretsmanager create-secret \
                --name "$SECRET_NAME" \
                --region "$AWS_REGION" \
                --description "Database credentials for Serverless CMS" \
                --secret-string "{\"host\":\"$DB_HOST\",\"port\":$DB_PORT,\"username\":\"$DB_USER\",\"password\":\"$DB_PASSWORD\",\"database\":\"$DB_NAME\"}"
            
            if [ $? -eq 0 ]; then
                print_success "Secret created successfully"
                
                SECRET_ARN=$(aws secretsmanager describe-secret \
                    --secret-id "$SECRET_NAME" \
                    --region "$AWS_REGION" \
                    --query 'ARN' \
                    --output text)
            else
                print_error "Failed to create secret"
                exit 1
            fi
        else
            print_success "Found existing secret: $SECRET_ARN"
        fi
        
        echo ""
        echo "Updating Lambda environment variables..."
        
        aws lambda update-function-configuration \
            --function-name "$FUNCTION_NAME" \
            --region "$AWS_REGION" \
            --environment "Variables={DB_SECRET_ARN=$SECRET_ARN,AWS_REGION=$AWS_REGION}" \
            > /dev/null
        
        if [ $? -eq 0 ]; then
            print_success "Lambda environment variables configured!"
            echo ""
            echo "Configuration:"
            echo "  DB_SECRET_ARN: $SECRET_ARN"
            echo "  AWS_REGION: $AWS_REGION"
        else
            print_error "Failed to update Lambda configuration"
            exit 1
        fi
        
        echo ""
        echo "=== IAM Permissions Check ==="
        print_warning "Make sure your Lambda execution role has Secrets Manager permissions"
        echo ""
        echo "Required policy:"
        cat << 'EOF'
{
  "Effect": "Allow",
  "Action": [
    "secretsmanager:GetSecretValue",
    "secretsmanager:DescribeSecret"
  ],
  "Resource": "arn:aws:secretsmanager:*:*:secret:db-credentials-*"
}
EOF
        ;;
        
    2)
        echo ""
        echo "=== Direct Environment Variables Setup ==="
        echo ""
        print_warning "This stores credentials in plain text. Use only for testing!"
        echo ""
        
        read -p "AWS Region (e.g., us-east-1): " AWS_REGION
        read -p "Database Host: " DB_HOST
        read -p "Database Port (default: 3306): " DB_PORT
        DB_PORT=${DB_PORT:-3306}
        read -p "Database Name: " DB_NAME
        read -p "Database Username: " DB_USER
        read -sp "Database Password: " DB_PASSWORD
        echo ""
        
        echo ""
        echo "Updating Lambda environment variables..."
        
        aws lambda update-function-configuration \
            --function-name "$FUNCTION_NAME" \
            --region "$AWS_REGION" \
            --environment "Variables={AWS_REGION=$AWS_REGION,DB_HOST=$DB_HOST,DB_PORT=$DB_PORT,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASSWORD}" \
            > /dev/null
        
        if [ $? -eq 0 ]; then
            print_success "Lambda environment variables configured!"
            echo ""
            echo "Configuration:"
            echo "  AWS_REGION: $AWS_REGION"
            echo "  DB_HOST: $DB_HOST"
            echo "  DB_PORT: $DB_PORT"
            echo "  DB_NAME: $DB_NAME"
            echo "  DB_USER: $DB_USER"
            echo "  DB_PASSWORD: ********"
        else
            print_error "Failed to update Lambda configuration"
            exit 1
        fi
        
        echo ""
        print_warning "Remember: Use Secrets Manager for production!"
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Testing Lambda Function"
echo "=========================================="
echo ""

read -p "Test the Lambda function now? (y/n): " TEST_NOW

if [[ $TEST_NOW =~ ^[Yy]$ ]]; then
    echo ""
    echo "Invoking Lambda with test payload..."
    
    aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload '{"pathParameters":{"id":"999"}}' \
        --region "$AWS_REGION" \
        test-response.json
    
    echo ""
    echo "Response:"
    cat test-response.json
    echo ""
    
    rm -f test-response.json
fi

echo ""
print_success "Configuration complete!"
echo ""
echo "Next steps:"
echo "  1. Replace shared/db.js with db-with-fallback.js (supports both config methods)"
echo "  2. Deploy your Lambda function"
echo "  3. Test the delete endpoint"
echo "  4. Check CloudWatch Logs for any issues"
echo ""
