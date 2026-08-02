const { chromium } = require('playwright-chromium');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  page.on('console', msg => { if(msg.type() === 'error') console.log('PAGE ERROR:', msg.text()); });
  const filePath = 'file://' + path.resolve(__dirname, 'index.html');
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  await page.screenshot({ path: '/tmp/shot1_initial.png' });

  // Pan test: drag map right, then check dot alignment
  const mapBox = await page.$eval('#map-box', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const cx = mapBox.x + mapBox.w / 2;
  const cy = mapBox.y + mapBox.h / 2;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 80, cy, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/shot2_panned.png' });

  const r1 = await page.evaluate(() => {
    const chart = echarts.getInstanceByDom(document.getElementById('map'));
    const dots = document.querySelectorAll('.city-dot');
    let ok = true;
    dots.forEach((el, i) => {
      if(el.style.display === 'none') return;
      const left = parseFloat(el.style.left);
      const top = parseFloat(el.style.top);
      const exp = chart.convertToPixel({ geoIndex: 0 }, CITIES[i].coords);
      if(Math.abs(left - exp[0]) >= 1.5 || Math.abs(top - exp[1]) >= 1.5) {
        console.log('PAN MISMATCH ' + CITIES[i].city + ': dot=(' + left + ',' + top + ') exp=(' + exp[0] + ',' + exp[1] + ')');
        ok = false;
      }
    });
    return ok;
  });
  console.log(r1 ? 'ALL DOTS MATCH (after pan)' : 'SOME DOTS MISMATCHED (after pan)');

  // Zoom test: programmatic zoom
  await page.evaluate(() => {
    const c = CITIES.find(c => c.city === '北京');
    chart.setOption({ geo: { center: c.coords, zoom: 4 } });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/shot3_zoomed.png' });

  const r2 = await page.evaluate(() => {
    const chart = echarts.getInstanceByDom(document.getElementById('map'));
    const dots = document.querySelectorAll('.city-dot');
    let ok = true;
    dots.forEach((el, i) => {
      if(el.style.display === 'none') return;
      const left = parseFloat(el.style.left);
      const top = parseFloat(el.style.top);
      const exp = chart.convertToPixel({ geoIndex: 0 }, CITIES[i].coords);
      if(Math.abs(left - exp[0]) >= 1.5 || Math.abs(top - exp[1]) >= 1.5) {
        console.log('ZOOM MISMATCH ' + CITIES[i].city + ': dot=(' + left + ',' + top + ') exp=(' + exp[0] + ',' + exp[1] + ')');
        ok = false;
      }
    });
    return ok;
  });
  console.log(r2 ? 'ALL DOTS MATCH (after zoom)' : 'SOME DOTS MISMATCHED (after zoom)');

  // Pan after zoom
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx - 60, cy + 40, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(600);

  const r3 = await page.evaluate(() => {
    const chart = echarts.getInstanceByDom(document.getElementById('map'));
    const dots = document.querySelectorAll('.city-dot');
    let ok = true;
    dots.forEach((el, i) => {
      if(el.style.display === 'none') return;
      const left = parseFloat(el.style.left);
      const top = parseFloat(el.style.top);
      const exp = chart.convertToPixel({ geoIndex: 0 }, CITIES[i].coords);
      if(Math.abs(left - exp[0]) >= 1.5 || Math.abs(top - exp[1]) >= 1.5) {
        console.log('PAN2 MISMATCH ' + CITIES[i].city + ': dot=(' + left + ',' + top + ') exp=(' + exp[0] + ',' + exp[1] + ')');
        ok = false;
      }
    });
    return ok;
  });
  console.log(r3 ? 'ALL DOTS MATCH (after pan+zoom+pan)' : 'SOME DOTS MISMATCHED (after pan+zoom+pan)');

  await browser.close();
})();
