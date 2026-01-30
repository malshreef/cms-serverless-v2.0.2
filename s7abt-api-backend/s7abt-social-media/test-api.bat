@echo off
REM Test Tweet Generation API - Windows Version

setlocal enabledelayedexpansion

set REGION=me-central-1
set STACK_NAME=s7abt-social-media-dev

echo ==========================================
echo Testing Tweet Generation API
echo ==========================================
echo.

REM Get API URL from CloudFormation
echo Getting API URL from CloudFormation...
for /f "delims=" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %REGION% --query "Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue" --output text 2^>nul') do set API_URL=%%i

if "%API_URL%"=="" (
    echo Error: Could not get API URL from CloudFormation
    echo.
    echo Please check:
    echo   1. Stack name is correct: %STACK_NAME%
    echo   2. Stack is deployed successfully
    echo   3. AWS CLI is configured for region: %REGION%
    echo.
    pause
    exit /b 1
)

echo API URL: %API_URL%
echo.

REM Test with sample article
echo Testing tweet generation...
echo.

curl -X POST "%API_URL%/generate-tweets" -H "Content-Type: application/json" -d "{\"article_title\": \"دليل شامل لـ AWS Lambda - الحوسبة بدون خادم\", \"article_url\": \"https://s7abt.com/articles/aws-lambda-guide\", \"article_content\": \"AWS Lambda هي خدمة حوسبة بدون خادم (Serverless) تتيح لك تشغيل الكود دون الحاجة لإدارة الخوادم. في هذا المقال الشامل، سنتعرف على أساسيات Lambda وكيفية استخدامها لبناء تطبيقات serverless قابلة للتوسع.\"}"

echo.
echo.
echo ==========================================
echo Test Complete
echo ==========================================
echo.
echo If you see success response above, tweets were generated!
echo.
echo Next steps:
echo   1. View tweets in DynamoDB:
echo      aws dynamodb scan --table-name s7abt-tweet-queue-dev --region %REGION% --max-items 5
echo.
echo   2. Test tweet publisher:
echo      aws lambda invoke --function-name s7abt-tweet-publisher-dev --region %REGION% response.json
echo.
pause

