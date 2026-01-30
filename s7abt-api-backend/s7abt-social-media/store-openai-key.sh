#!/bin/bash

# Store OpenAI API Key in AWS Secrets Manager

REGION="me-central-1"
SECRET_NAME="s7abt/openai/credentials"
OPENAI_KEY="YOUR_OPENAI_API_KEY_HERE"

echo "=========================================="
echo "Storing OpenAI API Key"
echo "=========================================="
echo ""
echo "Region: $REGION"
echo "Secret Name: $SECRET_NAME"
echo ""

# Create the secret JSON
SECRET_JSON="{\"api_key\": \"$OPENAI_KEY\"}"

# Check if secret already exists
echo "Checking if secret already exists..."
aws secretsmanager describe-secret \
  --secret-id "$SECRET_NAME" \
  --region "$REGION" >/dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "Secret already exists. Updating..."
  aws secretsmanager update-secret \
    --secret-id "$SECRET_NAME" \
    --secret-string "$SECRET_JSON" \
    --region "$REGION"
  
  if [ $? -eq 0 ]; then
    echo "✅ Secret updated successfully!"
  else
    echo "❌ Failed to update secret"
    exit 1
  fi
else
  echo "Secret does not exist. Creating..."
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --description "OpenAI API key for S7abt tweet generation" \
    --secret-string "$SECRET_JSON" \
    --region "$REGION"
  
  if [ $? -eq 0 ]; then
    echo "✅ Secret created successfully!"
  else
    echo "❌ Failed to create secret"
    exit 1
  fi
fi

echo ""
echo "=========================================="
echo "OpenAI credentials stored securely!"
echo "=========================================="
echo ""
echo "Secret ARN:"
aws secretsmanager describe-secret \
  --secret-id "$SECRET_NAME" \
  --region "$REGION" \
  --query 'ARN' \
  --output text

echo ""
echo "Cost: $0.40/month for this secret"
echo ""
echo "Next step: Run ./deploy.sh to deploy the system"
echo ""

