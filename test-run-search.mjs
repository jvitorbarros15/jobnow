import { chromium } from 'playwright';

async function testRunSearchButton() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Step 1: Navigating to app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page loaded');

    // Check if we need to log in
    const loginButton = await page.$('text=Sign in with Email').catch(() => null);
    if (loginButton) {
      console.log('BLOCKED: Login page detected - requires authentication to test');
      await browser.close();
      process.exit(0);
    }

    console.log('Step 2: Navigating to Tracker page...');
    // Try to find tracker in sidebar
    const trackerLink = await page.$('a[href*="/tracker"]').catch(() => null);
    if (trackerLink) {
      await trackerLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle' });
    } else {
      // Try direct URL
      await page.goto('http://localhost:3000/tracker', { waitUntil: 'networkidle', timeout: 30000 });
    }
    console.log('Tracker page loaded');

    // Wait for AgentSearchPanel to load and find button
    console.log('Step 3: Looking for Run Search button...');
    await page.waitForTimeout(2000); // Give page time to render

    // Get all buttons on page
    const buttons = await page.$$('button');
    let runButton = null;

    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && text.includes('Run Search')) {
        runButton = btn;
        break;
      }
    }

    if (!runButton) {
      console.log('BLOCKED: Run Search button not found on page');
      await page.screenshot({ path: 'test-screenshot-nobutton.png' });
      console.log('Screenshot saved: test-screenshot-nobutton.png');
      await browser.close();
      process.exit(1);
    }

    console.log('Run Search button found');

    // Click the button
    console.log('Step 4: Clicking Run Search button...');
    await runButton.click();
    console.log('Button clicked, waiting for response...');

    // Monitor network activity
    let apiCompleted = false;
    let apiError = null;

    page.on('response', async response => {
      if (response.url().includes('/api/jobs/agent-search')) {
        console.log(`API Response: ${response.status()} - ${response.url()}`);
        if (!response.ok()) {
          const text = await response.text().catch(() => '');
          apiError = `HTTP ${response.status()}: ${text}`;
        } else {
          apiCompleted = true;
        }
      }
    });

    // Wait for success or error toast
    console.log('Step 5: Waiting for completion (up to 180 seconds)...');

    let toastFound = false;
    let startTime = Date.now();

    while (Date.now() - startTime < 180000) {
      const successToast = await page.$('text=Search complete').catch(() => null);
      const errorToast = await page.$('text=Search failed').catch(() => null);

      if (successToast) {
        console.log('SUCCESS TOAST: Search complete! Check the picks on the right.');
        toastFound = true;
        break;
      } else if (errorToast) {
        const errorElement = await errorToast.textContent();
        console.log('ERROR TOAST: ' + errorElement);
        toastFound = true;
        break;
      }

      await page.waitForTimeout(5000);
    }

    if (!toastFound && !apiCompleted) {
      console.log('BLOCKED: Timeout waiting for response (no toast appeared)');
      await page.screenshot({ path: 'test-screenshot-timeout.png' });
      console.log('Screenshot saved: test-screenshot-timeout.png');
      await browser.close();
      process.exit(1);
    }

    if (apiError) {
      console.log('BLOCKED: API Error - ' + apiError);
      await page.screenshot({ path: 'test-screenshot-apierror.png' });
      console.log('Screenshot saved: test-screenshot-apierror.png');
      await browser.close();
      process.exit(1);
    }

    // Check job results
    const resultsText = await page.textContent('');
    const hasResults = resultsText && resultsText.includes('AI Job Picks');

    console.log(`Job results visible: ${hasResults ? 'Yes' : 'No'}`);

    await page.screenshot({ path: 'test-screenshot-success.png' });
    console.log('Screenshot saved: test-screenshot-success.png');

    console.log('\n=== VERIFICATION COMPLETE ===');
    console.log('Status: PASS');

  } catch (error) {
    console.error('BLOCKED: ' + error.message);
    await page.screenshot({ path: 'test-screenshot-exception.png' }).catch(() => {});
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testRunSearchButton().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
