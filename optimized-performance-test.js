// Optimized Performance Test with Smaller Batches and Better Rate Limiting
const https = require('https');
const http = require('http');

const TEST_OPERATIONS = 1000; // Full scale test
const BATCH_SIZE = 5; // Keep small batches for stability
const DELAY_BETWEEN_BATCHES = 500; // Reduced delay for faster completion
const DELAY_BETWEEN_REQUESTS = 50; // Reduced delay between requests

const APPWRITE_PROXY_URL = 'http://localhost:3001/api/appwrite/submissions';

// Performance metrics
const metrics = {
  appwrite: { success: 0, failed: 0, times: [], errors: [] }
};

// Generate test data
function generateTestData(index) {
  return {
    villageName: `قرية الاختبار ${Math.floor(index / 10) + 1}`,
    representativeName: `مندوب ${index}`,
    totalPeople: Math.floor(Math.random() * 200) + 50,
    receivedMoney: Math.floor(Math.random() * 10000) + 2000,
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

// Make HTTP request with better error handling
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
        'Content-Length': Buffer.byteLength(postData),
        'Connection': 'keep-alive'
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
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            data: parsedData,
            responseTime: responseTime,
            error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
          });
        } catch (error) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            data: responseData,
            responseTime: responseTime,
            error: `Parse error: ${error.message}`
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
        error: `Network error: ${error.message}`
      });
    });

    req.setTimeout(20000, () => {
      req.destroy();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        responseTime: responseTime,
        error: 'Request timeout (20s)'
      });
    });

    req.write(postData);
    req.end();
  });
}

// Test Appwrite with sequential requests (no parallel overload)
async function testAppwriteSequential() {
  console.log('📱 Testing Appwrite Performance (Sequential)...');
  
  for (let i = 0; i < TEST_OPERATIONS; i++) {
    const testData = generateTestData(i);
    
    try {
      const result = await makeRequest(APPWRITE_PROXY_URL, testData);
      metrics.appwrite.times.push(result.responseTime);
      
      if (result.success) {
        metrics.appwrite.success++;
        console.log(`✅ ${i + 1}/${TEST_OPERATIONS}: Success (${result.responseTime}ms)`);
      } else {
        metrics.appwrite.failed++;
        metrics.appwrite.errors.push(result.error || `HTTP ${result.statusCode}`);
        console.log(`❌ ${i + 1}/${TEST_OPERATIONS}: Failed - ${result.error} (${result.responseTime}ms)`);
      }
    } catch (error) {
      metrics.appwrite.failed++;
      metrics.appwrite.errors.push(error.message);
      console.log(`❌ ${i + 1}/${TEST_OPERATIONS}: Exception - ${error.message}`);
    }
    
    // Progress update every 50 requests for 1000 operations
    if ((i + 1) % 50 === 0) {
      const progress = Math.round((i + 1) / TEST_OPERATIONS * 100);
      console.log(`📊 Progress: ${i + 1}/${TEST_OPERATIONS} (${progress}%) - ✅${metrics.appwrite.success} ❌${metrics.appwrite.failed}`);
    }
    
    // Delay between requests to avoid overwhelming
    if (i < TEST_OPERATIONS - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
  }
}

// Test with small batches
async function testAppwriteBatched() {
  console.log('📱 Testing Appwrite Performance (Small Batches)...');
  
  for (let batch = 0; batch < Math.ceil(TEST_OPERATIONS / BATCH_SIZE); batch++) {
    const promises = [];
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TEST_OPERATIONS);
    
    console.log(`📦 Batch ${batch + 1}: Processing requests ${batchStart + 1}-${batchEnd}`);
    
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
            
            return { index: i, result };
          })
      );
    }
    
    const results = await Promise.all(promises);
    
    // Log batch results
    results.forEach(({ index, result }) => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} Request ${index + 1}: ${result.success ? 'Success' : result.error} (${result.responseTime}ms)`);
    });
    
    const completed = Math.min(batchEnd, TEST_OPERATIONS);
    const progress = Math.round(completed / TEST_OPERATIONS * 100);
    console.log(`📊 Progress: ${completed}/${TEST_OPERATIONS} (${progress}%) - ✅${metrics.appwrite.success} ❌${metrics.appwrite.failed}`);
    
    // Longer delay between batches
    if (batch < Math.ceil(TEST_OPERATIONS / BATCH_SIZE) - 1) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
}

// Generate detailed report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 OPTIMIZED PERFORMANCE TEST RESULTS');
  console.log('='.repeat(80));
  
  const awSuccessRate = (metrics.appwrite.success / TEST_OPERATIONS * 100).toFixed(2);
  const awAvgTime = metrics.appwrite.times.length > 0 ? 
    (metrics.appwrite.times.reduce((a, b) => a + b, 0) / metrics.appwrite.times.length).toFixed(2) : 0;
  const awMinTime = metrics.appwrite.times.length > 0 ? Math.min(...metrics.appwrite.times) : 0;
  const awMaxTime = metrics.appwrite.times.length > 0 ? Math.max(...metrics.appwrite.times) : 0;

  console.log('📱 APPWRITE RESULTS (Optimized):');
  console.log(`   ✅ Success: ${metrics.appwrite.success}/${TEST_OPERATIONS} (${awSuccessRate}%)`);
  console.log(`   ❌ Failed: ${metrics.appwrite.failed}`);
  console.log(`   ⚡ Average Time: ${awAvgTime}ms`);
  console.log(`   🚀 Fastest: ${awMinTime}ms`);
  console.log(`   🐌 Slowest: ${awMaxTime}ms`);
  
  // Detailed error analysis
  if (metrics.appwrite.errors.length > 0) {
    const errorCounts = {};
    metrics.appwrite.errors.forEach(error => {
      const errorType = error.includes('HTTP 500') ? 'Server Error (500)' :
                       error.includes('HTTP 429') ? 'Rate Limited (429)' :
                       error.includes('timeout') ? 'Timeout' :
                       error.includes('Network') ? 'Network Error' : 'Other';
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });
    
    console.log('   🚨 Error Analysis:');
    Object.entries(errorCounts).forEach(([error, count]) => {
      const percentage = (count / metrics.appwrite.failed * 100).toFixed(1);
      console.log(`      - ${error}: ${count} (${percentage}% of failures)`);
    });
  }
  
  console.log('');
  console.log('💡 PERFORMANCE ANALYSIS:');
  
  if (parseFloat(awSuccessRate) > 80) {
    console.log('   🎉 Excellent! Success rate > 80%');
  } else if (parseFloat(awSuccessRate) > 60) {
    console.log('   ✅ Good performance - success rate 60-80%');
  } else if (parseFloat(awSuccessRate) > 40) {
    console.log('   ⚠️  Moderate performance - success rate 40-60%');
  } else {
    console.log('   🚨 Poor performance - success rate < 40%');
  }
  
  if (parseFloat(awAvgTime) < 500) {
    console.log('   ⚡ Fast response times - average < 500ms');
  } else if (parseFloat(awAvgTime) < 1000) {
    console.log('   🐌 Moderate response times - average 500-1000ms');
  } else {
    console.log('   🚨 Slow response times - average > 1000ms');
  }
  
  console.log('');
  console.log('🔧 RECOMMENDATIONS:');
  
  if (parseFloat(awSuccessRate) < 80) {
    console.log('   - Reduce batch size further (try 2-3 requests per batch)');
    console.log('   - Increase delays between requests');
    console.log('   - Check Appwrite rate limits and quotas');
  }
  
  if (parseFloat(awAvgTime) > 1000) {
    console.log('   - Optimize proxy server configuration');
    console.log('   - Consider using Appwrite SDK directly');
    console.log('   - Check network latency to Appwrite servers');
  }
  
  console.log('='.repeat(80));
}

// Main test runner
async function runOptimizedTest() {
  console.log('🚀 Starting Optimized Performance Test');
  console.log(`📊 Testing ${TEST_OPERATIONS} operations (reduced for stability)`);
  console.log(`📦 Batch Size: ${BATCH_SIZE}`);
  console.log(`⏱️  Delay Between Batches: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log(`⏱️  Delay Between Requests: ${DELAY_BETWEEN_REQUESTS}ms`);
  console.log('');
  
  // Reset metrics
  metrics.appwrite = { success: 0, failed: 0, times: [], errors: [] };
  
  const totalStartTime = Date.now();
  
  try {
    // Choose test method
    console.log('Choose test method:');
    console.log('Running batched test (recommended)...');
    await testAppwriteBatched();
    
    const totalTime = Date.now() - totalStartTime;
    console.log(`\n⏱️  Total test time: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
    
    generateReport();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check server availability
async function checkServer() {
  console.log('🔍 Checking proxy server...');
  
  try {
    const result = await makeRequest('http://localhost:3001/api/health', {}, 'GET');
    console.log(`📡 Proxy Server: ${result.success ? '✅ Running' : '❌ Not responding'}`);
    return result.success;
  } catch (error) {
    console.log('📡 Proxy Server: ❌ Not running');
    return false;
  }
}

// Start the test
checkServer().then(isRunning => {
  if (isRunning) {
    console.log('');
    runOptimizedTest();
  } else {
    console.log('❌ Please start the proxy server first: node appwrite-proxy-server.js');
  }
});
