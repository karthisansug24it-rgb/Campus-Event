const webpush = require('web-push');

/**
 * Utility script to generate a new VAPID keypair for Web Push notifications.
 * Run via: node src/scripts/generateVapidKeys.js
 */
function generateKeys() {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('=======================================================');
  console.log('  FXEC Campus Events - VAPID Keypair Generated');
  console.log('=======================================================');
  console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  console.log('VAPID_SUBJECT=mailto:admin@francisxavier.ac.in');
  console.log('=======================================================');
  console.log('Add these to your .env and server/.env files.');
}

if (require.main === module) {
  generateKeys();
}

module.exports = { generateKeys };
