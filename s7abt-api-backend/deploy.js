const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: options.stdio || 'pipe' });
    return result ? result.trim() : '';
  } catch (error) {
    if (options.ignoreError) return null;
    throw error;
  }
}

function getArg(argName) {
  const index = process.argv.indexOf(argName);
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return null;
}

async function main() {
  console.log('🚀 Starting deployment automation...');

  let vpcId = getArg('--vpc');
  let subnetIds = getArg('--subnets');
  const stackName = getArg('--stack') || 'S7abt-bh';
  const region = getArg('--region') || 'me-south-1';
  const environment = getArg('--env') || 'production';

  // 1. Auto-discover VPC if not provided
  if (!vpcId) {
    console.log('🔍 Attempting to discover default VPC...');
    try {
      const vpcOutput = runCommand(`aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --region ${region} --query "Vpcs[0].VpcId" --output text`);
      if (vpcOutput && vpcOutput !== 'None') {
        vpcId = vpcOutput;
        console.log(`✅ Found Default VPC: ${vpcId}`);
      } else {
        console.log('⚠️ No default VPC found.');
      }
    } catch (e) {
      console.error('⚠️ Failed to query AWS for VPCs:', e.message);
    }
  }

  // 2. Auto-discover Subnets if VPC is found but Subnets are not provided
  if (vpcId && !subnetIds) {
    console.log(`🔍 Discovering subnets for VPC ${vpcId}...`);
    try {
      // Get all subnets for the VPC
      const subnetsOutput = runCommand(`aws ec2 describe-subnets --filters "Name=vpc-id,Values=${vpcId}" --region ${region} --query "Subnets[].SubnetId" --output text`);
      if (subnetsOutput) {
        // subnetsOutput comes as tab-separated or newlines
        subnetIds = subnetsOutput.split(/\s+/).join(',');
        console.log(`✅ Found Subnets: ${subnetIds}`);
      }
    } catch (e) {
      console.error('⚠️ Failed to query AWS for Subnets:', e.message);
    }
  }

  // 3. Validation
  if (!vpcId || !subnetIds) {
    console.error('\n❌ Error: Could not determine VPC and Subnet IDs.');
    console.error('Please ensure you have a default VPC, or provide them manually:');
    console.error('  node deploy.js --vpc <vpc-id> --subnets <subnet-id-1>,<subnet-id-2> ...');
    process.exit(1);
  }

  console.log('\n📋 Deployment Configuration:');
  console.log(`  Stack Name:  ${stackName}`);
  console.log(`  Region:      ${region}`);
  console.log(`  Environment: ${environment}`);
  console.log(`  VPC ID:      ${vpcId}`);
  console.log(`  Subnet IDs:  ${subnetIds}`);
  console.log(`  Template:    api-stack-expanded.yaml`);

  // 4. Build
  console.log('\n🏗️  Building SAM application...');
  const buildDir = 's7build';
  runCommand(`sam build -t api-stack-expanded.yaml --build-dir ${buildDir}`, { stdio: 'inherit' });

  // 5. Deploy (Auto-Package)
  console.log('\n🚀 Deploying to AWS...');
  const deployCmd = `sam deploy --template-file ${buildDir}/template.yaml --stack-name ${stackName} --region ${region} --resolve-s3 --capabilities CAPABILITY_NAMED_IAM --parameter-overrides Environment="${environment}" VpcId="${vpcId}" SubnetIds="${subnetIds}" --no-confirm-changeset`;

  try {
    runCommand(deployCmd, { stdio: 'inherit' });
    console.log('\n✅ Deployment successful!');
  } catch (e) {
    console.error('\n❌ Deployment failed.');
    process.exit(1);
  }
}

main();
