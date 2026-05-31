const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔄 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Check if we need to log in
    const loginButton = await page.$('button:has-text("Sign in")') || await page.$('a:has-text("Sign in")');
    if (loginButton) {
      console.log('⚠️  Login page detected. Checking for stored session...');
      // Wait a moment for auth to potentially redirect
      await page.waitForTimeout(2000);
    }
    
    // Try to navigate to tracker
    const trackerLink = await page.$('a:has-text("Tracker")');
    if (trackerLink) {
      console.log('✅ Found Tracker link, clicking...');
      await trackerLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      console.log('⚠️  Tracker link not found. Current URL:', page.url());
    }
    
    // Look for "Run Search" button
    const runSearchBtn = await page.$('button:has-text("Run Search")');
    if (runSearchBtn) {
      console.log('✅ Found "Run Search" button');
      console.log('🔄 Clicking "Run Search" button...');
      await runSearchBtn.click();
      
      // Wait for the request to complete (up to 2 minutes)
      console.log('⏳ Waiting for search to complete...');
      await page.waitForTimeout(5000); // Initial wait
      
      // Check for success toast or results
      const successToast = await page.$('text="Search complete"', { timeout: 120000 }).catch(() => null);
      const errorToast = await page.$('[role="alert"]').catch(() => null);
      
      if (successToast) {
        console.log('✅ SUCCESS TOAST DETECTED: "Search complete! Check the picks on the right."');
      } else {
        console.log('📋 No success toast found yet, checking page content...');
      }
      
      // Take screenshot
      const screenshotPath = 'C:\Users\jvito\OneDrive\Desktop\jobnow\tracker_screenshot.png';
      await page.screenshot({ path: screenshotPath });
      console.log('📸 Screenshot saved to:', screenshotPath);
      
      // Get current URL and page state
      console.log('📍 Current URL:', page.url());
    } else {
      console.log('❌ "Run Search" button not found');
      const screenshotPath = 'C:\Users\jvito\OneDrive\Desktop\jobnow\tracker_no_button.png';
      await page.screenshot({ path: screenshotPath });
      console.log('📸 Screenshot saved to:', screenshotPath);
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    // Keep browser open for manual inspection if needed
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();
