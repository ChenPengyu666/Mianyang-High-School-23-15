const { chromium } = require('playwright-chromium');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  page.on('console', msg => console.log('PAGE:', msg.type(), msg.text()));
  const filePath = 'file://' + path.resolve(__dirname, 'index.html');
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Programmatic zoom
  await page.evaluate(() => {
    const c = CITIES.find(c => c.city === '北京');
    chart.setOption({ geo: { center: c.coords, zoom: 4 } });
  });

  // Check at various timeouts
  for (const delay of [100, 300, 500, 800, 1200, 2000]) {
    await page.waitForTimeout(delay - (delay > 100 ? delay - 100 : 0));
    const r = await page.evaluate(() => {
      const chart = echarts.getInstanceByDom(document.getElementById('map'));
      const dots = document.querySelectorAll('.city-dot');
      let mismatches = [];
      dots.forEach((el, i) => {
        if(el.style.display === 'none') return;
        const left = parseFloat(el.style.left);
        const top = parseFloat(el.style.top);
        const exp = chart.convertToPixel({ geoIndex: 0 }, CITIES[i].coords);
        const dx = Math.abs(left - exp[0]);
        const dy = Math.abs(top - exp[1]);
        if(dx >= 1.5 || dy >= 1.5) {
          mismatches.push(CITIES[i].city + ': dx=' + dx.toFixed(1) + ' dy=' + dy.toFixed(1));
        }
      });
      return mismatches;
    });
    console.log(`t=${delay}ms: ${r.length === 0 ? 'ALL MATCH' : r.join('; ')}`);
  }

  // Does georoam fire on setOption?
  const fires = await page.evaluate(() => {
    let fired = false;
    chart.on('georoam', () => { fired = true; });
    const c = CITIES.find(c => c.city === '北京');
    chart.setOption({ geo: { center: c.coords, zoom: 5 } });
    return new Promise(resolve => {
      setTimeout(() => resolve(fired), 500);
    });
  });
  console.log('georoam fires on setOption:', fires);

  await browser.close();
})();
