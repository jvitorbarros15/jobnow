const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Node.js Test'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          redirectLocation: res.headers['location'],
          body: data.substring(0, 500)
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('Testing Auth Flow...\n');

  // Test 1: Root redirect
  console.log('Test 1: GET / (should show login page or redirect)');
  const root = await makeRequest('/');
  console.log(`  Status: ${root.status}`);
  console.log(`  Contains "JobMaker": ${root.body.includes('JobMaker')}`);
  console.log(`  Contains "Continue with Google": ${root.body.includes('Google')}`);

  // Test 2: /home unauthenticated (should redirect to /login)
  console.log('\nTest 2: GET /home (unauthenticated, should redirect)');
  const home = await makeRequest('/home');
  console.log(`  Status: ${home.status}`);
  console.log(`  Location: ${home.redirectLocation}`);

  // Test 3: /login page
  console.log('\nTest 3: GET /login');
  const login = await makeRequest('/login');
  console.log(`  Status: ${login.status}`);
  console.log(`  Contains login form: ${login.body.includes('email') && login.body.includes('password')}`);

  // Test 4: /onboarding unauthenticated (should redirect)
  console.log('\nTest 4: GET /onboarding (unauthenticated, should redirect)');
  const onboarding = await makeRequest('/onboarding');
  console.log(`  Status: ${onboarding.status}`);
  console.log(`  Location: ${onboarding.redirectLocation}`);

  console.log('\n✓ Basic HTTP routing tests complete');
}

runTests().catch(console.error);
