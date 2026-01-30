/**
 * Local Test Script for Get Top Writers Lambda
 * 
 * Usage: node test-local.js
 * 
 * Make sure to set environment variables:
 * - DB_SECRET_ARN
 * - AWS_REGION
 */

// Mock event for local testing
const mockEvent = {
  httpMethod: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  requestContext: {
    http: {
      method: 'GET',
    }
  }
};

// Import the handler
const { handler } = require('./get-writers');

// Run the test
async function test() {
  console.log('🧪 Testing Get Top Writers Lambda Locally...\n');
  console.log('📋 Mock Event:', JSON.stringify(mockEvent, null, 2));
  console.log('\n🔄 Executing handler...\n');

  try {
    const response = await handler(mockEvent);
    
    console.log('✅ Response Status:', response.statusCode);
    console.log('📤 Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\n📊 Response Body:');
    console.log(JSON.stringify(JSON.parse(response.body), null, 2));
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('\n✨ Test Summary:');
      console.log(`   - Writers found: ${data.data.count}`);
      console.log(`   - Timestamp: ${data.data.timestamp}`);
      
      if (data.data.writers && data.data.writers.length > 0) {
        console.log('\n📝 Top Writers:');
        data.data.writers.forEach((writer, index) => {
          console.log(`   ${index + 1}. ${writer.displayName} (@${writer.username})`);
          console.log(`      Articles: ${writer.articlesCount} | Readers: ${writer.readersCount}`);
        });
      }
    }
    
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Check environment variables
console.log('🔍 Checking environment variables...');
const requiredEnvVars = ['DB_SECRET_ARN', 'AWS_REGION'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.log('\n💡 Set them with:');
  console.log('   export DB_SECRET_ARN="your-secret-arn"');
  console.log('   export AWS_REGION="me-central-1"');
  process.exit(1);
}

console.log('✅ Environment variables OK\n');

// Run the test
test();
