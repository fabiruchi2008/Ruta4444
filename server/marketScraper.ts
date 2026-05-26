import puppeteer from 'puppeteer';

export interface MarketListing {
  price: number;
  year: number | null;
  title: string;
}

export interface MarketResult {
  prices: number[];
  averagePrice: number;
  medianPrice: number;
  sampleSize: number;
  source: string;
  url: string;
  yearMatched: boolean;
}

/**
 * Busca precios de mercado en encuentra24.com para un vehículo específico.
 * Filtra por año (±1 año). Si no hay coincidencias del mismo año, retorna null.
 * Precios en GTQ (quetzales).
 */
export async function scrapeMarketPrice(
  make: string,
  model: string,
  year?: number | null
): Promise<MarketResult | null> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto('https://www.encuentra24.com/guatemala-es/autos-usados', {
      waitUntil: 'networkidle2',
      timeout: 25000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // 1. Abrir dropdown de Marca
    const comboboxes = await page.$$('div[role="combobox"]');
    if (comboboxes.length === 0) return null;

    await comboboxes[0].click();
    await new Promise((r) => setTimeout(r, 1500));

    // 2. Seleccionar la marca
    const makeClicked = await page.evaluate((targetMake: string) => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      for (const div of allDivs) {
        const text = div.textContent?.trim() ?? '';
        if (text.toLowerCase() === targetMake.toLowerCase() && div.children.length === 0) {
          (div as HTMLElement).click();
          return text;
        }
      }
      return null;
    }, make);

    if (!makeClicked) return null;
    await new Promise((r) => setTimeout(r, 2000));

    // 3. Abrir dropdown de Modelo
    const comboboxes2 = await page.$$('div[role="combobox"]');
    if (comboboxes2.length > 1) {
      await comboboxes2[1].click();
      await new Promise((r) => setTimeout(r, 1500));

      // 4. Seleccionar el modelo (coincidencia parcial)
      await page.evaluate((targetModel: string) => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        for (const div of allDivs) {
          const text = div.textContent?.trim() ?? '';
          if (
            text.toLowerCase().includes(targetModel.toLowerCase()) &&
            div.children.length === 0
          ) {
            (div as HTMLElement).click();
            return text;
          }
        }
        return null;
      }, model);

      await new Promise((r) => setTimeout(r, 2000));
    }

    // 5. Esperar navegación
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));

    const finalUrl = page.url();

    // 6. Extraer listados con precio y año
    const listings: MarketListing[] = await page.evaluate(() => {
      const cards = document.querySelectorAll('a[href*="/autos-usados/"]');
      const results: MarketListing[] = [];

      cards.forEach((card) => {
        const text = card.textContent ?? '';
        const priceMatch = text.match(/Q\s*([\d,]+)/);
        const yearMatch = text.match(/\b(19|20)\d{2}\b/);

        if (priceMatch) {
          const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          const yr = yearMatch ? parseInt(yearMatch[0], 10) : null;
          if (price > 5000 && price < 2000000) {
            results.push({ price, year: yr, title: text.substring(0, 80).trim() });
          }
        }
      });

      return results;
    });

    if (listings.length === 0) return null;

    // 7. Filtrar por año si se proporcionó
    let filteredListings = listings;
    let yearMatched = false;

    if (year) {
      // Buscar coincidencias dentro de ±1 año
      const yearFiltered = listings.filter(
        (l) => l.year !== null && Math.abs(l.year - year) <= 1
      );

      if (yearFiltered.length > 0) {
        filteredListings = yearFiltered;
        yearMatched = true;
      } else {
        // No hay coincidencias del mismo año — retornar null para usar Q10,000 mínimo
        return null;
      }
    }

    const prices = filteredListings.map((l) => l.price);
    const sorted = Array.from(new Set(prices)).sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / sorted.length);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid];

    return {
      prices: sorted,
      averagePrice: avg,
      medianPrice: median,
      sampleSize: sorted.length,
      source: 'encuentra24.com',
      url: finalUrl,
      yearMatched,
    };
  } catch (error) {
    console.error('[marketScraper] Error:', error);
    return null;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
