// check-config.js
const config = require('./config/config.json');
const env = process.env.NODE_ENV || 'development';
console.log('📊 Current config:');
console.log(`   Environment: ${env}`);
console.log(`   Host: ${config[env].host}`);
console.log(`   Database: ${config[env].database}`);