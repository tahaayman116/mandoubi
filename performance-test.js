const { performance } = require('perf_hooks');

// Test configuration
const TEST_CONFIG = {
  totalOperations: 1000,
  batchSize: 10, // Process in batches to avoid overwhelming
  delayBetweenBatches: 100, // ms delay between batches
  testGoogleSheets: false // Set to true to test Google Sheets (be careful with rate limits)
};

// Generate test data
function generateTestData(index) {
  const villages = ['القرية الأولى', 'القرية الثانية', 'القرية الثالثة', 'القرية الرابعة', 'القرية الخامسة'];
  const representatives = ['أحمد محمد', 'محمد علي', 'علي أحمد', 'فاطمة محمد', 'عائشة علي'];
  
  return {
    villageName: villages[index % villages.length] + ` ${Math.floor(index / villages.length) + 1}`,
    representativeName: representatives[index % representatives.length],
    totalPeople: Math.floor(Math.random() * 1000) + 100,
    receivedMoney: Math.floor(Math.random() * 50000) + 5000,
    amountPerPerson: 50,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('ar-EG'),
    time: new Date().toLocaleTimeString('ar-EG'),
    testOperation: true,
    operationIndex: index
  };
}

// Firebase performance test
async function testFirebasePerformance() {
  console.log('🔥 Testing Firebase Performance...');
  const results = {
    writes: { success: 0, failed: 0, totalTime: 0, avgTime: 0 },
    reads: { success: 0, failed: 0, totalTime: 0, avgTime: 0 }
  };

  // Test writes
  console.log('📝 Testing Firebase Writes...');
  const writeStartTime = performance.now();
  
  for (let batch = 0; batch < Math.ceil(TEST_CONFIG.totalOperations / TEST_CONFIG.batchSize); batch++) {
    const batchPromises = [];
    const batchStart = batch * TEST_CONFIG.batchSize;
    const batchEnd = Math.min(batchStart + TEST_CONFIG.batchSize, TEST_CONFIG.totalOperations);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const testData = generateTestData(i);
      const operationStart = performance.now();
      
      batchPromises.push(
        fetch('http://localhost:3718/api/firebase/test-write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        })
        .then(response => {
          const operationTime = performance.now() - operationStart;
          results.writes.totalTime += operationTime;
          if (response.ok) {
            results.writes.success++;
          } else {
            results.writes.failed++;
          }
        })
        .catch(error => {
          const operationTime = performance.now() - operationStart;
          results.writes.totalTime += operationTime;
          results.writes.failed++;
          console.error(`Write ${i} failed:`, error.message);
        })
      );
    }
    
    await Promise.all(batchPromises);
    
    // Progress update
    const completed = Math.min((batch + 1) * TEST_CONFIG.batchSize, TEST_CONFIG.totalOperations);
    console.log(`📊 Firebase Writes Progress: ${completed}/${TEST_CONFIG.totalOperations} (${Math.round(completed/TEST_CONFIG.totalOperations*100)}%)`);
    
    // Delay between batches
    if (batch < Math.ceil(TEST_CONFIG.totalOperations / TEST_CONFIG.batchSize) - 1) {
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delayBetweenBatches));
    }
  }
  
  const writeEndTime = performance.now();
  results.writes.avgTime = results.writes.totalTime / TEST_CONFIG.totalOperations;
  
  console.log('✅ Firebase Write Test Completed');
  return results;
}

// Appwrite performance test
async function testAppwritePerformance() {
  console.log('📱 Testing Appwrite Performance (via Proxy)...');
  const results = {
    writes: { success: 0, failed: 0, totalTime: 0, avgTime: 0 },
    reads: { success: 0, failed: 0, totalTime: 0, avgTime: 0 }
  };

  // Test writes
  console.log('📝 Testing Appwrite Writes...');
  
  for (let batch = 0; batch < Math.ceil(TEST_CONFIG.totalOperations / TEST_CONFIG.batchSize); batch++) {
    const batchPromises = [];
    const batchStart = batch * TEST_CONFIG.batchSize;
    const batchEnd = Math.min(batchStart + TEST_CONFIG.batchSize, TEST_CONFIG.totalOperations);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const testData = generateTestData(i);
      const operationStart = performance.now();
      
      batchPromises.push(
        fetch('http://localhost:3001/api/appwrite/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        })
        .then(response => {
          const operationTime = performance.now() - operationStart;
          results.writes.totalTime += operationTime;
          if (response.ok) {
            results.writes.success++;
          } else {
            results.writes.failed++;
          }
        })
        .catch(error => {
          const operationTime = performance.now() - operationStart;
          results.writes.totalTime += operationTime;
          results.writes.failed++;
          console.error(`Appwrite Write ${i} failed:`, error.message);
        })
      );
    }
    
    await Promise.all(batchPromises);
    
    // Progress update
    const completed = Math.min((batch + 1) * TEST_CONFIG.batchSize, TEST_CONFIG.totalOperations);
    console.log(`📊 Appwrite Writes Progress: ${completed}/${TEST_CONFIG.totalOperations} (${Math.round(completed/TEST_CONFIG.totalOperations*100)}%)`);
    
    // Delay between batches
    if (batch < Math.ceil(TEST_CONFIG.totalOperations / TEST_CONFIG.batchSize) - 1) {
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delayBetweenBatches));
    }
  }
  
  results.writes.avgTime = results.writes.totalTime / TEST_CONFIG.totalOperations;
  
  console.log('✅ Appwrite Write Test Completed');
  return results;
}

// Performance report
function generateReport(firebaseResults, appwriteResults) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE TEST REPORT');
  console.log('='.repeat(60));
  console.log(`🔢 Total Operations Tested: ${TEST_CONFIG.totalOperations}`);
  console.log(`⏱️  Batch Size: ${TEST_CONFIG.batchSize}`);
  console.log(`⏳ Delay Between Batches: ${TEST_CONFIG.delayBetweenBatches}ms`);
  console.log('');
  
  // Firebase Results
  console.log('🔥 FIREBASE RESULTS:');
  console.log(`   ✅ Successful Writes: ${firebaseResults.writes.success}`);
  console.log(`   ❌ Failed Writes: ${firebaseResults.writes.failed}`);
  console.log(`   ⚡ Average Write Time: ${firebaseResults.writes.avgTime.toFixed(2)}ms`);
  console.log(`   📈 Success Rate: ${((firebaseResults.writes.success / TEST_CONFIG.totalOperations) * 100).toFixed(2)}%`);
  console.log('');
  
  // Appwrite Results
  console.log('📱 APPWRITE RESULTS (via Proxy):');
  console.log(`   ✅ Successful Writes: ${appwriteResults.writes.success}`);
  console.log(`   ❌ Failed Writes: ${appwriteResults.writes.failed}`);
  console.log(`   ⚡ Average Write Time: ${appwriteResults.writes.avgTime.toFixed(2)}ms`);
  console.log(`   📈 Success Rate: ${((appwriteResults.writes.success / TEST_CONFIG.totalOperations) * 100).toFixed(2)}%`);
  console.log('');
  
  // Comparison
  console.log('🆚 COMPARISON:');
  const firebaseSpeed = firebaseResults.writes.avgTime;
  const appwriteSpeed = appwriteResults.writes.avgTime;
  
  if (firebaseSpeed < appwriteSpeed) {
    const diff = ((appwriteSpeed - firebaseSpeed) / firebaseSpeed * 100).toFixed(2);
    console.log(`   🏆 Firebase is ${diff}% faster than Appwrite`);
  } else {
    const diff = ((firebaseSpeed - appwriteSpeed) / appwriteSpeed * 100).toFixed(2);
    console.log(`   🏆 Appwrite is ${diff}% faster than Firebase`);
  }
  
  console.log('');
  console.log('💡 RECOMMENDATIONS:');
  
  if (firebaseResults.writes.success < TEST_CONFIG.totalOperations * 0.95) {
    console.log('   ⚠️  Firebase success rate below 95% - check connection stability');
  }
  
  if (appwriteResults.writes.success < TEST_CONFIG.totalOperations * 0.95) {
    console.log('   ⚠️  Appwrite success rate below 95% - check proxy server stability');
  }
  
  if (firebaseSpeed > 1000) {
    console.log('   🐌 Firebase write speed > 1s - consider optimizing queries');
  }
  
  if (appwriteSpeed > 1000) {
    console.log('   🐌 Appwrite write speed > 1s - consider proxy optimization');
  }
  
  console.log('='.repeat(60));
}

// Main test function
async function runPerformanceTest() {
  console.log('🚀 Starting Performance Test...');
  console.log(`📊 Testing ${TEST_CONFIG.totalOperations} operations on each database`);
  console.log('');
  
  try {
    // Test Firebase
    const firebaseResults = await testFirebasePerformance();
    
    // Small delay between tests
    console.log('⏳ Waiting 2 seconds before Appwrite test...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test Appwrite
    const appwriteResults = await testAppwritePerformance();
    
    // Generate report
    generateReport(firebaseResults, appwriteResults);
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
}

// Run the test
runPerformanceTest();
