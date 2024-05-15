import { readFileSync, writeFileSync } from 'fs';

const manifestPath = './manifest.json';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

manifest.browser_specific_settings = {
  gecko: {
    id: 'andrew@awalsh.io'
  }
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Manifest updated for Firefox.');
