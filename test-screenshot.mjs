import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
});

const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
await page.setViewport({ width: 1280, height: 800 });

page.on('framenavigated', frame => {
  if (frame === page.mainFrame()) {
    console.log('Navegó a:', frame.url());
  }
});

await page.goto('https://www.encuentra24.com/guatemala-es/autos-usados', { waitUntil: 'networkidle2', timeout: 25000 });
await new Promise(r => setTimeout(r, 2000));

// Hacer clic en el dropdown de Marca
const marcaDiv = await page.$('div[role="combobox"]');
await marcaDiv.click();
await new Promise(r => setTimeout(r, 1500));

// Hacer clic en "Dodge" directamente
const clicked = await page.evaluate(() => {
  const allDivs = document.querySelectorAll('div');
  for (const div of allDivs) {
    if (div.textContent.trim() === 'Dodge' && div.children.length === 0) {
      div.click();
      return true;
    }
  }
  return false;
});
console.log('Clic en Dodge:', clicked);
await new Promise(r => setTimeout(r, 2000));

console.log('URL actual:', page.url());

// Ahora buscar el modelo Caravan
const modelDiv = await page.$('div[role="combobox"]:nth-of-type(2)');
const allComboboxes = await page.$$('div[role="combobox"]');
console.log('Comboboxes disponibles:', allComboboxes.length);

if (allComboboxes.length > 1) {
  await allComboboxes[1].click();
  await new Promise(r => setTimeout(r, 1500));
  
  const modelOptions = await page.evaluate(() => {
    const allDivs = document.querySelectorAll('div');
    const opts = [];
    for (const div of allDivs) {
      if (div.textContent.trim().toLowerCase().includes('caravan') && div.children.length === 0) {
        opts.push(div.textContent.trim());
      }
    }
    return opts;
  });
  console.log('Opciones de modelo con Caravan:', modelOptions);
}

await browser.close();
