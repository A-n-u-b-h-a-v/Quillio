// scripts/test-api.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

const testEndpoints = [
  { method: 'GET', path: '/api/health', expectedStatus: 200 },
  { method: 'POST', path: '/api/auth/login', expectedStatus: 400 }, // Should fail without body
  { method: 'GET', path: '/api/notes', expectedStatus: 401 }, // Should fail without auth
];

async function testEndpoint(method: string, path: string, expectedStatus: number) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === expectedStatus) {
      console.log(`✅ ${method} ${path} - Status: ${response.status}`);
      return true;
    } else {
      console.log(`❌ ${method} ${path} - Expected: ${expectedStatus}, Got: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${method} ${path} - Error: ${error}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing API Endpoints...\n');
  
  let allPassed = true;
  
  for (const test of testEndpoints) {
    const passed = await testEndpoint(test.method, test.path, test.expectedStatus);
    if (!passed) allPassed = false;
  }
  
  if (allPassed) {
    console.log('\n✅ All API tests passed!');
  } else {
    console.log('\n❌ Some API tests failed!');
    process.exit(1);
  }
}

runTests();
