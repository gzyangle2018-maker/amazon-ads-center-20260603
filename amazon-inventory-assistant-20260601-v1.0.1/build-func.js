const fs = require('fs');
const path = require('path');

// Read the worker code
const workerCode = fs.readFileSync(
  'amazon-inventory-assistant-20260601-v1.0.1/src/index.js', 
  'utf8'
);

// Extract everything before "export default {"
const exportStart = workerCode.indexOf('\nexport default {');
const bodyCode = workerCode.substring(0, exportStart);

// Extract the fetch function body (everything inside fetch method)
const fetchStart = workerCode.indexOf('async fetch(request, env, ctx) {');
const fetchBodyStart = workerCode.indexOf('{', fetchStart) + 1;
// Find the matching closing brace for the fetch method
// after the try/catch block
const tryCatchEnd = workerCode.lastIndexOf('return errorResponse(e.message || \'Internal error\', 500);');
const fetchMethodEnd = workerCode.indexOf('}', tryCatchEnd) + 1;

const fetchBody = workerCode.substring(fetchBodyStart, fetchMethodEnd);

// Build self-contained function file
const selfContained = `${bodyCode}

// ========== Pages Functions Handler (self-contained, no imports needed) ==========

export async function onRequest(context) {
  const { request, env } = context;
  ${fetchBody.trim()}
}
`;

// Write it
fs.writeFileSync(
  'amazon-inventory-assistant-20260601-v1.0.1/functions/api/[[path]].js',
  selfContained,
  'utf8'
);

console.log('Self-contained function written!');
console.log('Size:', selfContained.length, 'bytes');
console.log('First 100 chars:', selfContained.substring(0, 100));
console.log('Last 100 chars:', selfContained.substring(selfContained.length - 100));
