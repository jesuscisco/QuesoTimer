// Export HTML quote to PDF using Puppeteer
const path = require('path');
const fs = require('fs');

(async () => {
  const inFile = path.resolve(__dirname, '../docs/cotizacion-queso-timer.html');
  const outFile = path.resolve(__dirname, '../docs/cotizacion-queso-timer.pdf');

  if (!fs.existsSync(inFile)) {
    console.error('Input HTML not found:', inFile);
    process.exit(1);
  }

  // Lazy import to avoid requiring puppeteer unless needed
  const puppeteer = require('puppeteer');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + inFile.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.pdf({
      path: outFile,
      format: 'A4',
      printBackground: true,
      margin: { top: '22mm', right: '22mm', bottom: '22mm', left: '22mm' },
    });
    console.log('PDF generated at', outFile);
  } finally {
    await browser.close();
  }
})();
