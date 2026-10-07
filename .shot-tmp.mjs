import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1500, height: 260 } });
await p.route('**/*', (r) => r.abort());
const svg = readFileSync(process.argv[3], 'utf-8');
await p.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`, { waitUntil: 'domcontentloaded', timeout: 20000 });
await p.screenshot({ path: process.argv[2], fullPage: true });
await b.close();
