import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

async function scrapeMarketPrice(make, model) {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    let finalUrl = '';
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) finalUrl = frame.url();
    });

    await page.goto('https://www.encuentra24.com/guatemala-es/autos-usados', { waitUntil: 'networkidle2', timeout: 25000 });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Abrir dropdown de Marca
    const comboboxes = await page.$$('div[role="combobox"]');
    if (comboboxes.length === 0) throw new Error('No se encontraron dropdowns');
    
    await comboboxes[0].click();
    await new Promise(r => setTimeout(r, 1500));

    // 2. Seleccionar la marca
    const makeClicked = await page.evaluate((targetMake) => {
      const allDivs = document.querySelectorAll('div');
      for (const div of allDivs) {
        const text = div.textContent.trim();
        if (text.toLowerCase() === targetMake.toLowerCase() && div.children.length === 0) {
          div.click();
          return text;
        }
      }
      return null;
    }, make);
    console.log('Marca seleccionada:', makeClicked);
    await new Promise(r => setTimeout(r, 2000));

    if (!makeClicked) return null;

    // 3. Abrir dropdown de Modelo
    const comboboxes2 = await page.$$('div[role="combobox"]');
    if (comboboxes2.length > 1) {
      await comboboxes2[1].click();
      await new Promise(r => setTimeout(r, 1500));

      // 4. Seleccionar el modelo (buscar coincidencia parcial)
      const modelClicked = await page.evaluate((targetModel) => {
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
          const text = div.textContent.trim();
          if (text.toLowerCase().includes(targetModel.toLowerCase()) && div.children.length === 0) {
            div.click();
            return text;
          }
        }
        return null;
      }, model);
      console.log('Modelo seleccionado:', modelClicked);
      await new Promise(r => setTimeout(r, 2000));
    }

    // 5. Esperar a que carguen los resultados
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    console.log('URL final:', page.url());

    // 6. Extraer precios de los listados
    const listings = await page.evaluate(() => {
      const cards = document.querySelectorAll('a[href*="/autos-usados/"]');
      const results = [];
      
      cards.forEach(card => {
        const text = card.textContent || '';
        const priceMatch = text.match(/Q\s*([\d,]+)/);
        if (priceMatch) {
          const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          if (price > 5000 && price < 2000000) {
            results.push({ price, title: text.substring(0, 80).trim() });
          }
        }
      });
      
      return results;
    });

    console.log(`\nListados encontrados: ${listings.length}`);
    listings.forEach(l => console.log(` - Q${l.price.toLocaleString()} | ${l.title.substring(0, 60)}`));

    if (listings.length === 0) return null;

    const prices = listings.map(l => l.price);
    const sorted = [...prices].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / sorted.length);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];

    return { prices: sorted, averagePrice: avg, medianPrice: median, sampleSize: sorted.length };
  } catch (e) {
    console.error('Error:', e.message);
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

const result = await scrapeMarketPrice('Dodge', 'Caravan');
console.log('\n=== RESULTADO FINAL ===');
console.log(JSON.stringify(result, null, 2));
