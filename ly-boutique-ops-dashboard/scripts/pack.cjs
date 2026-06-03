// pack.cjs — Package ly-boutique-ops-dashboard into a zip file
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const src = path.resolve(__dirname, '..');
const dest = path.resolve(__dirname, '..', '..', 'ly-boutique-ops-dashboard-packed.zip');

// Remove old zip if exists
try { fs.unlinkSync(dest); } catch {}

// Try PowerShell Compress-Archive
try {
  const srcAbs = src.replace(/\\/g, '/');
  const destAbs = dest.replace(/\\/g, '/');
  execSync(
    `powershell -Command "Compress-Archive -Path '${srcAbs}' -DestinationPath '${destAbs}' -Force"`,
    { stdio: 'pipe', timeout: 60000 }
  );
  const stats = fs.statSync(dest);
  console.log(`✅ 打包完成: ${destAbs}`);
  console.log(`   大小: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
} catch (e) {
  console.error('PowerShell failed:', e.message);
  // Fallback: use Node.js to create zip
  console.log('Trying Node.js fallback...');
  // Simple tar.gz via Node
}
