// Direct Performance Test using your actual dual database service
const dualDatabaseService = require('./src/services/dualDatabaseService.js');

const TEST_OPERATIONS = 1000;
const BATCH_SIZE = 20; // Smaller batches for better stability
const DELAY_BETWEEN_BATCHES = 500; // Longer delay

// Generate test data
function generateTestData(index) {
  return {
    villageName: `اختبار الأداء ${Math.floor(index / 100) + 1}`,
    representativeName: `مندوب اختبار ${index}`,
    totalPeople: Math.floor(Math.random() * 500) + 100,
    receivedMoney: Math.floor(Math.random() * 25000) + 5000,
    amountPerPerson: 50,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('ar-EG'),
    time: new Date().toLocaleTimeString('ar-EG'),
    testOperation: true,
    operationIndex: index
  };
}

// Performance metrics
const metrics = {
  firebase: { success: 0, failed: 0, times: [], errors: [] },
  appwrite: { success: 0, failed: 0, times: [], errors: [] },
  googleSheets: { success: 0, failed: 0, times: [], errors: [] }
};

// Test function
async function runDirectTest() {
  console.log('🚀 Direct Performance Test - Using Actual Services');
  console.log(`📊 Testing ${TEST_OPERATIONS} operations`);
  console.log(`📦 Batch Size: ${BATCH_SIZE}`);
  console.log(`⏱️  Delay: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log('');

  const totalStartTime = Date.now();

  for (let batch = 0; batch < Math.ceil(TEST_OPERATIONS / BATCH_SIZE); batch++) {
    const promises = [];
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TEST_OPERATIONS);

    for (let i = batchStart; i < batchEnd; i++) {
      const testData = generateTestData(i);
      const operationStart = Date.now();

      promises.push(
        dualDatabaseService.addSubmission(testData)
          .then(result => {
            const operationTime = Date.now() - operationStart;
            
            // Analyze results
            if (result.results.firebase && result.results.firebase.id) {
              metrics.firebase.success++;
              metrics.firebase.times.push(operationTime);
            } else {
              metrics.firebase.failed++;
              metrics.firebase.errors.push(result.results.firebase?.error || 'Unknown error');
            }

            if (result.results.appwrite && result.results.appwrite.success) {
              metrics.appwrite.success++;
              metrics.appwrite.times.push(operationTime);
            } else {
              metrics.appwrite.failed++;
              metrics.appwrite.errors.push(result.results.appwrite?.error || 'Unknown error');
            }
          })
          .catch(error => {
            const operationTime = Date.now() - operationStart;
            metrics.firebase.failed++;
            metrics.appwrite.failed++;
            metrics.firebase.errors.push(error.message);
            metrics.appwrite.errors.push(error.message);
          })
      );
    }

    await Promise.all(promises);

    const completed = Math.min(batchEnd, TEST_OPERATIONS);
    const progress = Math.round(completed / TEST_OPERATIONS * 100);
    console.log(`📊 Progress: ${completed}/${TEST_OPERATIONS} (${progress}%) - FB: ${metrics.firebase.success}✅ ${metrics.firebase.failed}❌ | AW: ${metrics.appwrite.success}✅ ${metrics.appwrite.failed}❌`);

    if (batch < Math.ceil(TEST_OPERATIONS / BATCH_SIZE) - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  const totalTime = Date.now() - totalStartTime;
  generateDetailedReport(totalTime);
}

function generateDetailedReport(totalTime) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIRECT PERFORMANCE TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`⏱️  Total Test Time: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
  console.log(`🔢 Total Operations: ${TEST_OPERATIONS}`);
  console.log('');

  // Firebase Results
  const fbSuccessRate = (metrics.firebase.success / TEST_OPERATIONS * 100).toFixed(2);
  const fbAvgTime = metrics.firebase.times.length > 0 ? 
    (metrics.firebase.times.reduce((a, b) => a + b, 0) / metrics.firebase.times.length).toFixed(2) : 0;

  console.log('🔥 FIREBASE RESULTS:');
  console.log(`   ✅ Success: ${metrics.firebase.success}/${TEST_OPERATIONS} (${fbSuccessRate}%)`);
  console.log(`   ❌ Failed: ${metrics.firebase.failed}`);
  console.log(`   ⚡ Average Time: ${fbAvgTime}ms`);
  
  if (metrics.firebase.times.length > 0) {
    console.log(`   🚀 Fastest: ${Math.min(...metrics.firebase.times)}ms`);
    console.log(`   🐌 Slowest: ${Math.max(...metrics.firebase.times)}ms`);
  }

  // Show common Firebase errors
  if (metrics.firebase.errors.length > 0) {
    const errorCounts = {};
    metrics.firebase.errors.forEach(error => {
      const shortError = error.substring(0, 50);
      errorCounts[shortError] = (errorCounts[shortError] || 0) + 1;
    });
    console.log('   🚨 Common Errors:');
    Object.entries(errorCounts).slice(0, 3).forEach(([error, count]) => {
      console.log(`      - ${error}... (${count} times)`);
    });
  }

  console.log('');

  // Appwrite Results
  const awSuccessRate = (metrics.appwrite.success / TEST_OPERATIONS * 100).toFixed(2);
  const awAvgTime = metrics.appwrite.times.length > 0 ? 
    (metrics.appwrite.times.reduce((a, b) => a + b, 0) / metrics.appwrite.times.length).toFixed(2) : 0;

  console.log('📱 APPWRITE RESULTS (via Proxy):');
  console.log(`   ✅ Success: ${metrics.appwrite.success}/${TEST_OPERATIONS} (${awSuccessRate}%)`);
  console.log(`   ❌ Failed: ${metrics.appwrite.failed}`);
  console.log(`   ⚡ Average Time: ${awAvgTime}ms`);
  
  if (metrics.appwrite.times.length > 0) {
    console.log(`   🚀 Fastest: ${Math.min(...metrics.appwrite.times)}ms`);
    console.log(`   🐌 Slowest: ${Math.max(...metrics.appwrite.times)}ms`);
  }

  // Show common Appwrite errors
  if (metrics.appwrite.errors.length > 0) {
    const errorCounts = {};
    metrics.appwrite.errors.forEach(error => {
      const shortError = error.substring(0, 50);
      errorCounts[shortError] = (errorCounts[shortError] || 0) + 1;
    });
    console.log('   🚨 Common Errors:');
    Object.entries(errorCounts).slice(0, 3).forEach(([error, count]) => {
      console.log(`      - ${error}... (${count} times)`);
    });
  }

  console.log('');

  // Performance Analysis
  console.log('📈 PERFORMANCE ANALYSIS:');
  
  if (parseFloat(fbSuccessRate) > parseFloat(awSuccessRate)) {
    console.log(`   🏆 Firebase is more reliable (${fbSuccessRate}% vs ${awSuccessRate}%)`);
  } else if (parseFloat(awSuccessRate) > parseFloat(fbSuccessRate)) {
    console.log(`   🏆 Appwrite is more reliable (${awSuccessRate}% vs ${fbSuccessRate}%)`);
  } else {
    console.log(`   🤝 Both databases have similar reliability`);
  }

  if (fbAvgTime && awAvgTime) {
    if (parseFloat(fbAvgTime) < parseFloat(awAvgTime)) {
      const diff = ((parseFloat(awAvgTime) - parseFloat(fbAvgTime)) / parseFloat(fbAvgTime) * 100).toFixed(2);
      console.log(`   ⚡ Firebase is ${diff}% faster on average`);
    } else {
      const diff = ((parseFloat(fbAvgTime) - parseFloat(awAvgTime)) / parseFloat(awAvgTime) * 100).toFixed(2);
      console.log(`   ⚡ Appwrite is ${diff}% faster on average`);
    }
  }

  // Recommendations
  console.log('');
  console.log('💡 RECOMMENDATIONS:');
  
  if (parseFloat(fbSuccessRate) < 90) {
    console.log('   🔧 Firebase needs optimization - success rate below 90%');
  }
  
  if (parseFloat(awSuccessRate) < 90) {
    console.log('   🔧 Appwrite proxy needs optimization - success rate below 90%');
  }
  
  if (parseFloat(fbAvgTime) > 1000) {
    console.log('   🐌 Firebase response time > 1s - check network/queries');
  }
  
  if (parseFloat(awAvgTime) > 1000) {
    console.log('   🐌 Appwrite response time > 1s - optimize proxy server');
  }

  const overallSuccess = metrics.firebase.success + metrics.appwrite.success;
  const overallRate = (overallSuccess / (TEST_OPERATIONS * 2) * 100).toFixed(2);
  console.log(`   📊 Overall System Success Rate: ${overallRate}%`);

  console.log('='.repeat(80));
}

// Run the test
runDirectTest().catch(console.error);
