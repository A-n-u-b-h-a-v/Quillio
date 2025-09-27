import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧪 Running build test...');

try {
  // Check if all required files exist
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.ts',
    'vercel.json',
    '.npmrc'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`❌ Missing required file: ${file}`);
    }
    console.log(`✅ Found: ${file}`);
  }

  // Run type check
  console.log('🔍 Running TypeScript check...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });

  // Run lint
  console.log('🔍 Running ESLint...');
  execSync('npm run lint', { stdio: 'inherit' });

  // Run build
  console.log('🏗️ Running build...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Build test completed successfully!');
  console.log('🚀 Ready for deployment!');

} catch (error: any) {
  console.error('❌ Build test failed:', error.message);
  process.exit(1);
}
