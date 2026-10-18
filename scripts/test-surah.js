const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/classroom/test-surah?role=teacher', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const initial = await page.evaluate(() => {
    const sel = document.querySelector('select');
    return {
      value: sel ? sel.value : null,
      disabled: sel ? sel.disabled : null
    };
  });
  console.log('INITIAL SELECT:', initial);

  await page.select('select', '18');
  await new Promise(r => setTimeout(r, 1000));

  const afterSelect = await page.evaluate(() => {
    const sel = document.querySelector('select');
    const header = document.querySelector('.quran-frame h3')?.innerText;
    const pageInput = document.querySelector('input[type="number"]')?.value;
    return {
      selectValue: sel ? sel.value : null,
      header,
      pageInput
    };
  });
  console.log('AFTER SELECT 18:', afterSelect);

  // Wait 3 seconds to see if polling reverts it!
  await new Promise(r => setTimeout(r, 3000));

  const after3s = await page.evaluate(() => {
    const sel = document.querySelector('select');
    const pageInput = document.querySelector('input[type="number"]')?.value;
    return {
      selectValue: sel ? sel.value : null,
      pageInput
    };
  });
  console.log('AFTER 3 SECONDS (POLLING CHECK):', after3s);

  await browser.close();
})();
