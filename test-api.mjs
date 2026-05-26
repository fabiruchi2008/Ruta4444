import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
});

const page = await browser.newPage();
const apiCalls = [];

page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('encuentra24.com') && !url.includes('doubleclick') && !url.includes('google') && !url.includes('.png') && !url.includes('.js') && !url.includes('.css') && !url.includes('.woff')) {
    try {
      const status = response.status();
      apiCalls.push({ url, status });
    } catch(e) {}
  }
});

await page.goto('https://www.encuentra24.com/guatemala-es/autos/carros-usados', { waitUntil: 'networkidle2', timeout: 25000 });
await new Promise(r => setTimeout(r, 3000));

console.log('Llamadas a encuentra24:');
apiCalls.forEach(c => console.log(c.status, c.url));

await browser.close();
