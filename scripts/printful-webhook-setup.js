#!/usr/bin/env node

/**
 * Printful Webhook Setup Helper
 * 
 * This script helps you check and configure Printful webhooks via the API.
 * 
 * Usage:
 *   node scripts/printful-webhook-setup.js check
 *   node scripts/printful-webhook-setup.js set <url>
 *   node scripts/printful-webhook-setup.js delete
 * 
 * Environment variables required:
 *   PRINTFUL_TOKEN - Your Printful API token
 *   PRINTFUL_STORE_ID - Your store ID (default: 17088301)
 */

const https = require('https');

const PRINTFUL_API = 'https://api.printful.com';
const STORE_ID = process.env.PRINTFUL_STORE_ID || '17088301';
const TOKEN = process.env.PRINTFUL_TOKEN;

if (!TOKEN) {
  console.error('❌ Error: PRINTFUL_TOKEN environment variable is required');
  console.error('   Set it with: export PRINTFUL_TOKEN=your_token_here');
  process.exit(1);
}

function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.printful.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'X-PF-Store-Id': STORE_ID,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function checkWebhook() {
  console.log('🔍 Checking current webhook configuration...\n');
  const response = await makeRequest('GET', '/webhooks');
  
  if (response.status === 200 && response.data.code === 200) {
    const webhook = response.data.result;
    if (webhook && webhook.url) {
      console.log('✅ Webhook is configured:');
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Event types: ${webhook.types?.join(', ') || 'none'}`);
    } else {
      console.log('⚠️  No webhook configured for this store');
    }
  } else {
    console.log('⚠️  No webhook configured (or error retrieving)');
    if (response.data.error) {
      console.log(`   Error: ${response.data.error.message || response.data.error}`);
    }
  }
}

async function setWebhook(url) {
  if (!url) {
    console.error('❌ Error: Webhook URL is required');
    console.error('   Usage: node scripts/printful-webhook-setup.js set <url>');
    process.exit(1);
  }

  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    console.error(`❌ Error: Invalid URL: ${url}`);
    process.exit(1);
  }

  console.log(`🔧 Setting webhook URL to: ${url}\n`);

  const eventTypes = [
    'order_created',
    'order_updated',
    'order_failed',
    'package_shipped',
    'package_returned',
  ];

  const response = await makeRequest('POST', '/webhooks', {
    url: url,
    types: eventTypes,
  });

  if (response.status === 200 && response.data.code === 200) {
    console.log('✅ Webhook configured successfully!');
    console.log(`   URL: ${response.data.result.url}`);
    console.log(`   Event types: ${response.data.result.types.join(', ')}`);
  } else {
    console.error('❌ Failed to configure webhook');
    if (response.data.error) {
      console.error(`   Error: ${response.data.error.message || response.data.error}`);
    } else {
      console.error(`   Status: ${response.status}`);
      console.error(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

async function deleteWebhook() {
  console.log('🗑️  Deleting webhook configuration...\n');
  const response = await makeRequest('DELETE', '/webhooks');

  if (response.status === 200 && response.data.code === 200) {
    console.log('✅ Webhook deleted successfully');
  } else {
    console.error('❌ Failed to delete webhook');
    if (response.data.error) {
      console.error(`   Error: ${response.data.error.message || response.data.error}`);
    }
    process.exit(1);
  }
}

// Main
const command = process.argv[2];

switch (command) {
  case 'check':
    checkWebhook().catch(console.error);
    break;
  case 'set':
    const url = process.argv[3];
    setWebhook(url).catch(console.error);
    break;
  case 'delete':
    deleteWebhook().catch(console.error);
    break;
  default:
    console.log('Printful Webhook Setup Helper\n');
    console.log('Usage:');
    console.log('  node scripts/printful-webhook-setup.js check');
    console.log('  node scripts/printful-webhook-setup.js set <url>');
    console.log('  node scripts/printful-webhook-setup.js delete\n');
    console.log('Environment variables:');
    console.log('  PRINTFUL_TOKEN - Your Printful API token (required)');
    console.log('  PRINTFUL_STORE_ID - Store ID (default: 17088301)\n');
    console.log('Examples:');
    console.log('  node scripts/printful-webhook-setup.js check');
    console.log('  node scripts/printful-webhook-setup.js set https://app.snapcase.ai/api/webhooks/printful');
    process.exit(1);
}

