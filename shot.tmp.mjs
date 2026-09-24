import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const [,, out, ...rest] = process.argv;
for (const spec of rest) {
  const [nome, path, w] = spec.split('|');
  const p = await b.newPage({ viewport: { width: +w, height: 900 } });
  await p.goto('http://localhost:4399' + path); await p.waitForTimeout(900);
  await p.addStyleTag({ content: '.main-frame{height:auto!important;overflow:visible!important}' });
  await p.screenshot({ path: `${out}/${nome}.png`, fullPage: true }); await p.close();
}
await b.close();
