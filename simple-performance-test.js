// Simple Performance Test for 1000 Operations
// This script tests Firebase and Appwrite directly using your existing services

const TEST_OPERATIONS = 1000;
const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 200; // ms

// Generate test data
function generateTestData(index) {
  const villages = ['اختبار القرية', 'قرية التجربة', 'القرية النموذجية'];
  const names = ['أحمد اختبار', 'محمد تجربة', 'علي نموذج'];
  
  return {
    villageName: `${villages[index % villages.length]} ${Math.floor(index / villages.length) + 1}`,
    representativeName: `${names[index % names.length]} ${index}`,
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
  firebase: { success: 0, failed: 0, times: [], totalTime: 0 },
  appwrite: { success: 0, failed: 0, times: [], totalTime: 0 }
};

// Test Firebase performance
async function testFirebase() {
  console.log('🔥 Testing Firebase Performance...');
  const startTime = Date.now();
  
  for (let batch = 0; batch < Math.ceil(TEST_OPERATIONS / BATCH_SIZE); batch++) {
    const promises = [];
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TEST_OPERATIONS);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const testData = generateTestData(i);
      const operationStart = Date.now();
      
      promises.push(
        // Simulate Firebase write using your dual database service
        fetch('http://localhost:3718', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'firebase-test',
            data: testData
          })
        })
        .then(response => {
          const operationTime = Date.now() - operationStart;
          metrics.firebase.times.push(operationTime);
          metrics.firebase.totalTime += operationTime;
          
          if (response.ok) {
            metrics.firebase.success++;
          } else {
            metrics.firebase.failed++;
          }
        })
        .catch(error => {
          const operationTime = Date.now() - operationStart;
          metrics.firebase.times.push(operationTime);
          metrics.firebase.totalTime += operationTime;
          metrics.firebase.failed++;
        })
      );
    }
    
    await Promise.all(promises);
    
    const completed = Math.min(batchEnd, TEST_OPERATIONS);
    console.log(`📊 Firebase: ${completed}/${TEST_OPERATIONS} (${Math.round(completed/TEST_OPERATIONS*100)}%)`);
    
    if (batch < Math.ceil(TEST_OPERATIONS / BATCH_SIZE) - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`✅ Firebase completed in ${totalTime}ms`);
}

// Test Appwrite performance
async function testAppwrite() {
  console.log('📱 Testing Appwrite Performance...');
  const startTime = Date.now();
  
  for (let batch = 0; batch < Math.ceil(TEST_OPERATIONS / BATCH_SIZE); batch++) {
    const promises = [];
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TEST_OPERATIONS);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const testData = generateTestData(i);
      const operationStart = Date.now();
      
      promises.push(
        // Use your proxy server
        fetch('http://localhost:3001/api/appwrite/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        })
        .then(response => {
          const operationTime = Date.now() - operationStart;
          metrics.appwrite.times.push(operationTime);
          metrics.appwrite.totalTime += operationTime;
          
          if (response.ok) {
            metrics.appwrite.success++;
          } else {
            metrics.appwrite.failed++;
          }
        })
        .catch(error => {
          const operationTime = Date.now() - operationStart;
          metrics.appwrite.times.push(operationTime);
          metrics.appwrite.totalTime += operationTime;
          metrics.appwrite.failed++;
        })
      );
    }
    
    await Promise.all(promises);
    
    const completed = Math.min(batchEnd, TEST_OPERATIONS);
    console.log(`📊 Appwrite: ${completed}/${TEST_OPERATIONS} (${Math.round(completed/TEST_OPERATIONS*100)}%)`);
    
    if (batch < Math.ceil(TEST_OPERATIONS / BATCH_SIZE) - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`✅ Appwrite completed in ${totalTime}ms`);
}

// Generate performance report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 PERFORMANCE TEST RESULTS - 1000 OPERATIONS');
  console.log('='.repeat(80));
  
  // Firebase stats
  const fbAvg = metrics.firebase.totalTime / metrics.firebase.times.length;
  const fbMin = Math.min(...metrics.firebase.times);
  const fbMax = Math.max(...metrics.firebase.times);
  const fbSuccessRate = (metrics.firebase.success / TEST_OPERATIONS * 100).toFixed(2);
  
  console.log('🔥 FIREBASE RESULTS:');
  console.log(`   ✅ Success: ${metrics.firebase.success}/${TEST_OPERATIONS} (${fbSuccessRate}%)`);
  console.log(`   ❌ Failed: ${metrics.firebase.failed}`);
  console.log(`   ⚡ Average Time: ${fbAvg.toFixed(2)}ms`);
  console.log(`   🚀 Fastest: ${fbMin}ms`);
  console.log(`   🐌 Slowest: ${fbMax}ms`);
  console.log(`   📊 Total Time: ${metrics.firebase.totalTime}ms`);
  
  console.log('');
  
  // Appwrite stats
  const awAvg = metrics.appwrite.totalTime / metrics.appwrite.times.length;
  const awMin = Math.min(...metrics.appwrite.times);
  const awMax = Math.max(...metrics.appwrite.times);
  const awSuccessRate = (metrics.appwrite.success / TEST_OPERATIONS * 100).toFixed(2);
  
  console.log('📱 APPWRITE RESULTS (via Proxy):');
  console.log(`   ✅ Success: ${metrics.appwrite.success}/${TEST_OPERATIONS} (${awSuccessRate}%)`);
  console.log(`   ❌ Failed: ${metrics.appwrite.failed}`);
  console.log(`   ⚡ Average Time: ${awAvg.toFixed(2)}ms`);
  console.log(`   🚀 Fastest: ${awMin}ms`);
  console.log(`   🐌 Slowest: ${awMax}ms`);
  console.log(`   📊 Total Time: ${metrics.appwrite.totalTime}ms`);
  
  console.log('');
  console.log('🆚 COMPARISON:');
  
  if (fbAvg < awAvg) {
    const diff = ((awAvg - fbAvg) / fbAvg * 100).toFixed(2);
    console.log(`   🏆 Firebase is ${diff}% faster on average`);
  } else {
    const diff = ((fbAvg - awAvg) / awAvg * 100).toFixed(2);
    console.log(`   🏆 Appwrite is ${diff}% faster on average`);
  }
  
  console.log(`   📈 Firebase Success Rate: ${fbSuccessRate}%`);
  console.log(`   📈 Appwrite Success Rate: ${awSuccessRate}%`);
  
  // Performance recommendations
  console.log('');
  console.log('💡 RECOMMENDATIONS:');
  
  if (fbAvg > 500) {
    console.log('   ⚠️  Firebase average response time > 500ms - consider optimization');
  }
  
  if (awAvg > 500) {
    console.log('   ⚠️  Appwrite average response time > 500ms - proxy may need optimization');
  }
  
  if (parseFloat(fbSuccessRate) < 95) {
    console.log('   🚨 Firebase success rate < 95% - check connection stability');
  }
  
  if (parseFloat(awSuccessRate) < 95) {
    console.log('   🚨 Appwrite success rate < 95% - check proxy server stability');
  }
  
  console.log('='.repeat(80));
}

// Main test runner
async function runTest() {
  console.log('🚀 Starting Performance Test for 1000 Operations');
  console.log(`📦 Batch Size: ${BATCH_SIZE}`);
  console.log(`⏱️  Delay Between Batches: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log('');
  
  try {
    // Test Firebase
    await testFirebase();
    
    console.log('⏳ Waiting 3 seconds before Appwrite test...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test Appwrite
    await testAppwrite();
    
    // Generate report
    generateReport();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Start the test
console.log('🔧 Make sure both servers are running:');
console.log('   - Main app: http://localhost:3718');
console.log('   - Proxy server: http://localhost:3001');
console.log('');

runTest();
