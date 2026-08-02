const { chromium } = require('playwright-chromium');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  page.on('console', msg => console.log('PAGE:', msg.type(), msg.text()));
  const filePath = 'file://' + path.resolve(__dirname, 'index.html');
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Test 1: programmatic zoom, check dots converge
  await page.evaluate(() => {
    const c = CITIES.find(c => c.city === '北京');
    chart.setOption({ geo: { center: c.coords, zoom: 4 } });
  });

  // Wait long enough for animation + finished handler
  await page.waitForTimeout(1500);
  const t1 = await page.evaluate(() => {
    const chart = echarts.getInstanceByDom(document.getElementById('map'));
    const dots = document.querySelectorAll('.city-dot');
    let ok = true;
    dots.forEach((el, i) => {
      if(el.style.display === 'none') return;
      const left = parseFloat(el.style.left);
      const top = parseFloat(el.style.top);
      const exp = chart.convertToPixel({ geoIndex: 0 }, CITIES[i].coords);
      if(Math.abs(left - exp[0]) >= 1.5 || Math.abs(top - exp[1]) >= 1.5) ok = false;
    });
    return ok;
  });
  console.log('After setOption zoom (1.5s wait):', t1 ? 'ALL MATCH' : 'MISMATCH');

  // Test 2: pan after zoom
  const mapBox = await page.$eval('#map-box', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const cx = mapBox.x + mapBox.w / 2;
  const cy = mapBox.y + mapBox.h / 2;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx - 50, cy + 30, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  const t2 = await page.evaluate(() => {
    const chart = echarts.getInstanceByDom(document.getElementById('map'));
    const dots = document.querySelectorAll('.city-dot');
    let ok = true;
    dots.forEach((el, i) => {
      if(el.style.display === 'none') return;
      const left = parseFloat(el.style.left);
      const top = parseFloat(el.style.top);
      const exp = chart.convertToPixel({ geoIndex: 0 }, CITIES[i].coords);
      if(Math.abs(left - exp[0]) >= 1.5 || Math.abs(top - exp[1]) >= 1.5) ok = false;
    });
    return ok;
  });
  console.log('After pan (post-zoom):', t2 ? 'ALL MATCH' : 'MISMATCH');

  // Test 3: another programmatic zoom
  await page.evaluate(() => {
    const c = CITIES.find(c => c.city === '成都');
    chart.setOption({ geo: { center: c.coords, zoom: 3.5 } });
  });
  await page.waitForTimeout(1500);
  const t3 = await page.evaluate(() => {
    const chart = echarts.getInstanceByDom(document.getElementById('map'));
    const dots = document.querySelectorAll('.city-dot');
    let ok = true;
    dots.forEach((el, i) => {
      if(el.style.display === 'none') return;
      const left = parseFloat(el.style.left);
      const top = parseFloat(el.style.top);
      const exp = chart.convertToPixel({ geoIndex: 0 }, CITIES[i].coords);
      if(Math.abs(left - exp[0]) >= 1.5 || Math.abs(top - exp[1]) >= 1.5) ok = false;
    });
    return ok;
  });
  console.log('After 2nd setOption zoom:', t3 ? 'ALL MATCH' : 'MISMATCH');

  // Screenshot final state
  await page.screenshot({ path: '/tmp/shot_final.png' });

  await browser.close();
})();
