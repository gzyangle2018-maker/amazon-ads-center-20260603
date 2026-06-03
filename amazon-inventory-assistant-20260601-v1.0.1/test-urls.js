const https = require('https');

function testUrl(hostname) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: hostname,
      path: '/',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
      rejectUnauthorized: false
    }, (res) => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => resolve({ 
        status: res.statusCode, 
        headers: res.headers,
        size: b.length, 
        preview: b.substring(0, 200) 
      }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.end();
  });
}

async function main() {
  console.log('Testing URLs...\n');
  
  // Production (should work)
  const prod = await testUrl('amazon-stock-helper.pages.dev');
  console.log('PROD  amazon-stock-helper.pages.dev:', prod.status, prod.size, 'bytes');
  
  // Preview static-only
  const prev = await testUrl('bbc09077.amazon-stock-helper.pages.dev');
  console.log('PREV  bbc09077:', prev.status, prev.size, 'bytes', prev.error || '');
  
  // Preview with functions
  const prev2 = await testUrl('04f6af9b.amazon-stock-helper.pages.dev');
  console.log('PREV2 04f6af9b:', prev2.status, prev2.size, 'bytes', prev2.error || '');

  // Try with IP
  console.log('\nHeaders from production:');
  console.log(JSON.stringify(prod.headers, null, 2));
  
  console.log('\nHeaders from preview:');
  console.log(JSON.stringify(prev.headers, null, 2));
}

main().catch(e => console.error(e));
