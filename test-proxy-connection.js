// Test proxy server connection for submissions
const testData = {
  villageName: 'قرية الاختبار',
  representativeName: 'مندوب الاختبار',
  totalPeople: 100,
  receivedMoney: 80,
  notReceived: 20,
  amountPerPerson: 500,
  totalAmount: 50000,
  timestamp: new Date().toISOString()
};

async function testProxyConnection() {
  console.log('🔍 اختبار اتصال الخادم الوسيط...\n');
  
  try {
    // Test if proxy server is running
    console.log('1️⃣ فحص حالة الخادم الوسيط...');
    const healthResponse = await fetch('http://localhost:3001/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (healthResponse.ok) {
      console.log('✅ الخادم الوسيط يعمل');
    } else {
      throw new Error('الخادم الوسيط لا يستجيب');
    }
    
    // Test submissions endpoint
    console.log('\n2️⃣ اختبار إرسال البيانات...');
    const response = await fetch('http://localhost:3001/api/appwrite/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ تم إرسال البيانات بنجاح:', result.id);
      
      // Clean up - delete test data
      console.log('\n3️⃣ تنظيف البيانات التجريبية...');
      const deleteResponse = await fetch(`http://localhost:3001/api/appwrite/submissions/${result.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (deleteResponse.ok) {
        console.log('✅ تم حذف البيانات التجريبية');
      }
      
      console.log('\n🎉 الخادم الوسيط يعمل بشكل صحيح!');
    } else {
      const errorText = await response.text();
      console.error('❌ فشل إرسال البيانات:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 الحل: شغّل الخادم الوسيط أولاً:');
      console.log('   node appwrite-proxy-server.js');
    }
  }
}

testProxyConnection();
