// scripts/check-env.ts
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET'
];

const optionalEnvVars = [
  'NEXTAUTH_URL',
  'NODE_ENV'
];

console.log('🔍 Checking Environment Variables...\n');

let hasErrors = false;

// Check required variables
console.log('✅ Required Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✓ ${varName}: ${varName === 'JWT_SECRET' ? '***hidden***' : 'Set'}`);
  } else {
    console.log(`  ❌ ${varName}: Missing`);
    hasErrors = true;
  }
});

// Check optional variables
console.log('\n📋 Optional Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✓ ${varName}: ${value}`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (optional)`);
  }
});

// Check JWT_SECRET strength
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret && jwtSecret.length < 32) {
  console.log('\n⚠️  Warning: JWT_SECRET should be at least 32 characters long');
  hasErrors = true;
}

if (hasErrors) {
  console.log('\n❌ Environment check failed!');
  process.exit(1);
} else {
  console.log('\n✅ Environment check passed!');
  process.exit(0);
}
