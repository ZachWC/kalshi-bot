const crypto = require('crypto');

// Generate a 32-byte (256-bit) key for AES-256
const key = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 Encryption Key Generated:');
console.log('='.repeat(64));
console.log(key);
console.log('='.repeat(64));
console.log('\n⚠️  IMPORTANT: Add this to your .env.local file as:');
console.log(`ENCRYPTION_KEY=${key}\n`);
console.log('⚠️  Keep this key secure and never commit it to version control!\n');

