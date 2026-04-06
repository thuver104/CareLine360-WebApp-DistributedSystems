/**
 * Setup script for patient-service
 * Creates folder structure and initial files
 * Run: node setup.js
 */

const fs = require('fs');
const path = require('path');

const directories = [
  'src',
  'src/config',
  'src/models',
  'src/controllers',
  'src/services',
  'src/routes',
  'src/middleware',
  'src/consumers',
  'src/publishers',
  'src/validators',
  'src/utils',
  'logs',
  'tests'
];

console.log('🏥 Setting up patient-service directory structure...\n');

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created: ${dir}/`);
  } else {
    console.log(`⏭️  Exists: ${dir}/`);
  }
});

// Create .gitkeep in logs
const gitkeepPath = path.join(__dirname, 'logs', '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, '');
  console.log('✅ Created: logs/.gitkeep');
}

console.log('\n✅ Setup complete!');
console.log('\nNext steps:');
console.log('1. Run: npm install');
console.log('2. Copy .env.example to .env and configure');
console.log('3. Run: npm run dev');
