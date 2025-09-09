// Standalone Performance Test - No module dependencies
const https = require('https');
const http = require('http');

const TEST_OPERATIONS = 1000;
const BATCH_SIZE = 20;
const DELAY_BETWEEN_BATCHES = 300;

// Test configuration
const FIREBASE_URL = 'http://localhost:3718';
const APPWRITE_PROXY_URL = 'http://localhost:3001/api/appwrite/submissions';

// Performance metrics
const metrics = {
  firebase: { success: 0, failed: 0, times: [], errors: [] },
  appwrite: { success: 0, failed: 0, times: [], errors: [] }
};

// Generate test data
function generateTestData(index) {
  return {
    villageName: `اختبار الأداء ${Math.floor(index / 100) + 1}`,
    representativeName: `مندوب اختبار ${index}`,
    totalPeople: Math.floor(Math.random() * 500) + 100,
    receivedMoney: Math.floor(Math.random() * 25000) + 5000,
    amountPerPerson: 50,
    notReceived: 0,
    totalAmount: 0,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('ar-EG'),
    time: new Date().toLocaleTimeString('ar-EG'),
    testOperation: true,
    operationIndex: index
  };
}

// Make HTTP request
function makeRequest(url, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const postData = JSON.stringify(data);
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            data: parsedData,
            responseTime: responseTime
          });
        } catch (error) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            data: responseData,
            responseTime: responseTime,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        responseTime: responseTime,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        responseTime: responseTime,
        error: 'Request timeout'
      });
    });

    req.write(postData);
    req.end();
  });
}

// Test Appwrite via proxy
async function testAppwrite() {
  console.log('📱 Testing Appwrite Performance (via Proxy)...');
  
  for (let batch = 0; batch < Math.ceil(TEST_OPERATIONS / BATCH_SIZE); batch++) {
    const promises = [];
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TEST_OPERATIONS);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const testData = generateTestData(i);
      
      promises.push(
        makeRequest(APPWRITE_PROXY_URL, testData)
          .then(result => {
            metrics.appwrite.times.push(result.responseTime);
            
            if (result.success) {
              metrics.appwrite.success++;
            } else {
              metrics.appwrite.failed++;
              metrics.appwrite.errors.push(result.error || `HTTP ${result.statusCode}`);
            }
          })
      );
    }
    
    await Promise.all(promises);
    
    const completed = Math.min(batchEnd, TEST_OPERATIONS);
    const progress = Math.round(completed / TEST_OPERATIONS * 100);
    console.log(`📊 Appwrite Progress: ${completed}/${TEST_OPERATIONS} (${progress}%) - ✅${metrics.appwrite.success} ❌${metrics.appwrite.failed}`);
    
    if (batch < Math.ceil(TEST_OPERATIONS / BATCH_SIZE) - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
}

// Test using your actual form submission
async function testViaForm() {
  console.log('📝 Testing via Form Submission Simulation...');
  
  // This simulates what happens when someone submits the form
  const formData = {
    villageName: 'اختبار الأداء الشامل',
    representativeName: 'مندوب الاختبار',
    totalPeople: '500',
    receivedMoney: '15000',
    amountPerPerson: 50
  };

  const testUrl = `${FIREBASE_URL}/submit`; // Adjust based on your actual endpoint
  
  for (let i = 0; i < 10; i++) { // Test 10 form submissions
    const testData = {
      ...formData,
      villageName: `${formData.villageName} ${i + 1}`,
      timestamp: new Date().toISOString()
    };
    
    try {
      const result = await makeRequest(testUrl, testData);
      console.log(`Form Test ${i + 1}: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
    } catch (error) {
      console.log(`Form Test ${i + 1}: ❌ Error - ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Generate detailed report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 STANDALONE PERFORMANCE TEST RESULTS');
  console.log('='.repeat(80));
  
  // Appwrite Results
  const awSuccessRate = (metrics.appwrite.success / TEST_OPERATIONS * 100).toFixed(2);
  const awAvgTime = metrics.appwrite.times.length > 0 ? 
    (metrics.appwrite.times.reduce((a, b) => a + b, 0) / metrics.appwrite.times.length).toFixed(2) : 0;
  const awMinTime = metrics.appwrite.times.length > 0 ? Math.min(...metrics.appwrite.times) : 0;
  const awMaxTime = metrics.appwrite.times.length > 0 ? Math.max(...metrics.appwrite.times) : 0;

  console.log('📱 APPWRITE RESULTS (via Proxy):');
  console.log(`   ✅ Success: ${metrics.appwrite.success}/${TEST_OPERATIONS} (${awSuccessRate}%)`);
  console.log(`   ❌ Failed: ${metrics.appwrite.failed}`);
  console.log(`   ⚡ Average Time: ${awAvgTime}ms`);
  console.log(`   🚀 Fastest: ${awMinTime}ms`);
  console.log(`   🐌 Slowest: ${awMaxTime}ms`);
  
  // Show error breakdown
  if (metrics.appwrite.errors.length > 0) {
    const errorCounts = {};
    metrics.appwrite.errors.forEach(error => {
      const shortError = error.substring(0, 30);
      errorCounts[shortError] = (errorCounts[shortError] || 0) + 1;
    });
    
    console.log('   🚨 Error Breakdown:');
    Object.entries(errorCounts).slice(0, 5).forEach(([error, count]) => {
      console.log(`      - ${error}... (${count}x)`);
    });
  }
  
  console.log('');
  console.log('💡 PERFORMANCE ANALYSIS:');
  
  if (parseFloat(awSuccessRate) > 90) {
    console.log('   🎉 Excellent! Appwrite success rate > 90%');
  } else if (parseFloat(awSuccessRate) > 70) {
    console.log('   ⚠️  Good but needs improvement - success rate 70-90%');
  } else {
    console.log('   🚨 Poor performance - success rate < 70%');
  }
  
  if (parseFloat(awAvgTime) < 500) {
    console.log('   ⚡ Fast response times - average < 500ms');
  } else if (parseFloat(awAvgTime) < 1000) {
    console.log('   🐌 Moderate response times - average 500-1000ms');
  } else {
    console.log('   🚨 Slow response times - average > 1000ms');
  }
  
  // Recommendations
  console.log('');
  console.log('🔧 RECOMMENDATIONS:');
  
  if (parseFloat(awSuccessRate) < 95) {
    console.log('   - Optimize proxy server for better reliability');
    console.log('   - Consider connection pooling');
    console.log('   - Check Appwrite server capacity');
  }
  
  if (parseFloat(awAvgTime) > 1000) {
    console.log('   - Reduce proxy server overhead');
    console.log('   - Optimize network configuration');
    console.log('   - Consider caching strategies');
  }
  
  console.log('='.repeat(80));
}

// Main test runner
async function runTest() {
  console.log('🚀 Starting Standalone Performance Test');
  console.log(`📊 Testing ${TEST_OPERATIONS} operations on Appwrite`);
  console.log(`📦 Batch Size: ${BATCH_SIZE}`);
  console.log(`⏱️  Delay: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log('');
  
  const totalStartTime = Date.now();
  
  try {
    // Test Appwrite
    await testAppwrite();
    
    console.log('');
    console.log('⏳ Running form submission test...');
    await testViaForm();
    
    const totalTime = Date.now() - totalStartTime;
    console.log(`\n⏱️  Total test time: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
    
    generateReport();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if servers are running
async function checkServers() {
  console.log('🔍 Checking server availability...');
  
  try {
    const proxyCheck = await makeRequest('http://localhost:3001/api/health', {}, 'GET');
    console.log(`📡 Proxy Server: ${proxyCheck.success ? '✅ Running' : '❌ Not responding'}`);
  } catch (error) {
    console.log('📡 Proxy Server: ❌ Not running');
  }
  
  console.log('');
}

// Start the test
checkServers().then(() => {
  runTest();
});
