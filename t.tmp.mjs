import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const out=process.argv[2];
for (const [n,u,w,y] of [['home2','/',1280,700],['homem2','/',390,1400],['art2','/blog/fatores-de-riscos-cognitivos/',1280,4600],['exp','/explorar/',390,0]]) {
const p = await b.newPage({ viewport: { width: w, height: 900 } });
await p.goto('http://localhost:4399'+u); await p.waitForTimeout(800);
await p.evaluate((y)=>document.querySelector('.main-frame').scrollTo(0,y), y); await p.waitForTimeout(700);
await p.screenshot({ path: `${out}/${n}.png` }); await p.close(); }
await b.close();
