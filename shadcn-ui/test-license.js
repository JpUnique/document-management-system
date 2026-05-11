// Test script to check localStorage
const fs = require('fs');

console.log('=== TESTING LICENSE SYSTEM ===\n');

// Simulate what happens in the browser
const mockLocalStorage = {};

// Test data
const testLicense = {
  key: 'ABC123-DEF456-GHI789-JKL012',
  clientName: 'Test Client',
  email: 'test@example.com',
  issuedDate: new Date().toISOString(),
  expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
  features: ['all']
};

console.log('1. Generated test license:');
console.log('   Key:', testLicense.key);
console.log('   Key (no hyphens):', testLicense.key.replace(/[-\s]/g, ''));
console.log('   Key (uppercase):', testLicense.key.replace(/[-\s]/g, '').toUpperCase());
console.log('   Key length:', testLicense.key.replace(/[-\s]/g, '').length);

// Simulate saving to localStorage
mockLocalStorage['docmanager_licenses_db'] = JSON.stringify([testLicense]);
console.log('\n2. Saved to mock localStorage');

// Simulate activation
const inputKey = 'ABC123-DEF456-GHI789-JKL012';
const cleanInputKey = inputKey.replace(/[-\s]/g, '').toUpperCase();

console.log('\n3. Testing activation with key:', inputKey);
console.log('   Cleaned input key:', cleanInputKey);

// Get from localStorage
const licensesStr = mockLocalStorage['docmanager_licenses_db'];
const licenses = JSON.parse(licensesStr);

console.log('\n4. Licenses in database:', licenses.length);
licenses.forEach((lic, idx) => {
  const licClean = lic.key.replace(/[-\s]/g, '').toUpperCase();
  const match = licClean === cleanInputKey;
  console.log(`   License ${idx + 1}:`);
  console.log(`     Original: "${lic.key}"`);
  console.log(`     Cleaned: "${licClean}"`);
  console.log(`     Match: ${match}`);
});

const foundLicense = licenses.find(l => l.key.replace(/[-\s]/g, '').toUpperCase() === cleanInputKey);

console.log('\n5. Result:', foundLicense ? '✅ LICENSE FOUND' : '❌ LICENSE NOT FOUND');

if (foundLicense) {
  console.log('   Client:', foundLicense.clientName);
  console.log('   Status:', foundLicense.status);
}

console.log('\n=== TEST COMPLETE ===');
