// Run with Node.js and Playwright available through NODE_PATH.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const home = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
    const expectedProjects = [
      '[Video Game Demo] Tales from the Animal City', 'IIIS AI Safety Lunch',
      'IIIS Squash', 'Spine Tutorial', 'Xiongan Vlog',
      '[Video Game Demo] Little Witch Garden'
    ];
    for (const width of [1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(home);
      const research = page.locator('#research-tab');
      const indie = page.locator('#indie-tab');
      assert.equal(await research.getAttribute('aria-selected'), 'true');
      assert.equal(await page.locator('#indie-projects').isVisible(), false);
      assert.equal(await page.locator('#research-papers papertitle').count(), 38);
      await indie.click();
      assert.equal(await indie.getAttribute('aria-selected'), 'true');
      assert.equal(await page.locator('#research-papers').isVisible(), false);
      assert.deepEqual(await page.locator('#indie-projects papertitle').allTextContents(), expectedProjects);
      assert.equal(await page.locator('#indie-projects tr').filter({ hasText: 'IIIS Squash' }).locator('a').count(), 0);
      assert.equal(await page.getByRole('link', { name: 'Spine Tutorial', exact: true }).getAttribute('href'), 'https://www.bilibili.com/video/BV1NFuc6vEnJ/');
      assert.equal(await page.getByRole('link', { name: 'Xiongan Vlog', exact: true }).getAttribute('href'), 'https://www.bilibili.com/video/BV1zxK16yERK/');
      for (const tab of [research, indie]) {
        await tab.click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(await page.locator('.project-panel:not([hidden]) img').evaluateAll(images => images.filter(i => !i.complete || !i.naturalWidth).map(i => i.src)), []);
      }
      await indie.focus();
      await page.keyboard.press('ArrowLeft');
      assert.equal(await research.getAttribute('aria-selected'), 'true');
      await page.keyboard.press('End');
      assert.equal(await indie.getAttribute('aria-selected'), 'true');
      await page.keyboard.press('Home');
      assert.equal(await research.getAttribute('aria-selected'), 'true');
      await page.keyboard.press('ArrowLeft');
      assert.equal(await indie.getAttribute('aria-selected'), 'true');
      await page.keyboard.press('ArrowRight');
      assert.equal(await research.getAttribute('aria-selected'), 'true');
      console.log(`Passed: ${width}px, content, links, images, keyboard, overflow`);
    }
    await page.locator('#indie-tab').click();
    await page.getByRole('link', { name: 'IIIS AI Safety Lunch', exact: true }).last().click();
    assert(page.url().endsWith('/ai_safety_lunch.html'));
    await page.getByRole('link', { name: 'Back to Homepage' }).click();
    assert.equal(page.url(), home);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
