const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building VisionInspect AI Application for Vercel Deployment...');

const frontendDir = path.join(__dirname, 'frontend');
const srcDist = path.join(frontendDir, 'dist');
const rootDist = path.join(__dirname, 'dist');

try {
  // Step 1: Install frontend dependencies and build Vite bundle
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

  // Step 2: Copy dist to root ./dist directory for universal Vercel output detection
  if (fs.existsSync(srcDist)) {
    if (fs.existsSync(rootDist)) {
      fs.rmSync(rootDist, { recursive: true, force: true });
    }
    fs.cpSync(srcDist, rootDist, { recursive: true });
    console.log('Build output successfully populated in both ./frontend/dist and ./dist!');
  } else {
    console.error('Build failed: frontend/dist directory not found.');
    process.exit(1);
  }
} catch (err) {
  console.error('Error during build process:', err);
  process.exit(1);
}
