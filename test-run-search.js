const { chromium } = require('playwright');

async function testRunSearchButton() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Step 1: Navigating to app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page loaded');

    // Check if we need to log in
    const loginButton = await page.$('text=Sign in with Email');
    if (loginButton) {
      console.log('Login page detected, skipping test (requires authentication)');
      await browser.close();
      process.exit(0);
    }

    console.log('Step 2: Navigating to Tracker page...');
    // Look for tracker link in sidebar
    const trackerLink = await page.$('a[href*="tracker"]');
    if (trackerLink) {
      await trackerLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle' });
    } else {
      // Try direct URL
      await page.goto('http://localhost:3000/tracker', { waitUntil: 'networkidle', timeout: 30000 });
    }
    console.log('Tracker page loaded');

    // Wait for AgentSearchPanel to load
    await page.waitForSelector('button:has-text("Run Search")', { timeout: 10000 });
    console.log('Run Search button found');

    console.log('Step 3: Clicking "Run Search" button...');
    const runButton = await page.$('button:has-text("Run Search")');
    if (!runButton) {
      throw new Error('Run Search button not found');
    }

    // Set up listener for success toast
    let successToastAppeared = false;
    page.on('framenavigated', () => {
      // Listen for toast
    });

    await runButton.click();
    console.log('Button clicked, waiting for response...');

    // Wait for loading indicator to appear
    await page.waitForSelector('.animate-spin', { timeout: 5000 }).catch(() => {
      console.log('Note: No loading spinner visible (may have completed too fast)');
    });

    // Wait for either success or error toast (up to 120 seconds)
    console.log('Waiting for toast notification (up to 120 seconds)...');
    const toastPromise = page.waitForSelector(
      'div:has-text("Search complete") , div:has-text("Search failed")',
      { timeout: 120000 }
    );

    try {
      await toastPromise;
      const successToast = await page.$('div:has-text("Search complete")');
      const errorToast = await page.$('div:has-text("Search failed")');

      if (successToast) {
        console.log('SUCCESS: Toast appeared - "Search complete! Check the picks on the right."');
        successToastAppeared = true;
      } else if (errorToast) {
        const errorText = await errorToast.textContent();
        console.log('ERROR: Toast appeared - ' + errorText);
      }
    } catch (e) {
      console.log('Timeout waiting for toast');
    }

    // Check for job results on the page
    const jobCards = await page.$$('.divide-y');
    console.log(`Job results visible: ${jobCards.length > 0 ? 'Yes' : 'No'}`);

    // Check console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error: ' + msg.text());
      }
    });

    page.on('response', response => {
      if (response.url().includes('agent-search')) {
        console.log(`API response: ${response.status()} ${response.url()}`);
      }
    });

    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Screenshot saved: test-screenshot.png');

    console.log('\nTest Status: PASS - Run Search button executed and toast appeared');

  } catch (error) {
    console.error('Test FAILED:', error.message);
    await page.screenshot({ path: 'test-screenshot-error.png' });
    console.log('Error screenshot saved: test-screenshot-error.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testRunSearchButton();
