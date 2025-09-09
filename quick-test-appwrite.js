// Quick test for Appwrite connection using direct API calls
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68bcdd830036700d6d5b';
const APPWRITE_DATABASE_ID = 'mandoub-db';
const APPWRITE_API_KEY = '1e073f48d9cf466b68a2d3b633d38f4933ec5592b755c15ad1d93d3528c87df243b2693501cca12175863de5e8dae054e4b617dd52651d3c7b46b430a9935bb84ffb017cc1ec03e31943d71dfebf194c4892d299831351df149bed248921bb88ef7445d5115b626cb6cf603d4d3c02aad2097807cee6b7a5d9e017c387c7873a';

async function testAppwriteConnection() {
  console.log('🔍 اختبار اتصال Appwrite المباشر...\n');
  
  try {
    // Test 1: Check project access
    console.log('1️⃣ اختبار الوصول للمشروع...');
    const projectResponse = await fetch(`${APPWRITE_ENDPOINT}/projects/${APPWRITE_PROJECT_ID}`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (projectResponse.ok) {
      const project = await projectResponse.json();
      console.log(`✅ المشروع: ${project.name}`);
    } else {
      throw new Error(`Project access failed: ${projectResponse.status}`);
    }
    
    // Test 2: Check database
    console.log('\n2️⃣ اختبار قاعدة البيانات...');
    const dbResponse = await fetch(`${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (dbResponse.ok) {
      const database = await dbResponse.json();
      console.log(`✅ قاعدة البيانات: ${database.name}`);
    } else {
      throw new Error(`Database access failed: ${dbResponse.status}`);
    }
    
    // Test 3: List collections
    console.log('\n3️⃣ اختبار المجموعات...');
    const collectionsResponse = await fetch(`${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (collectionsResponse.ok) {
      const collections = await collectionsResponse.json();
      console.log(`✅ المجموعات الموجودة: ${collections.total}`);
      collections.collections.forEach(col => {
        console.log(`   - ${col.name} (${col.$id})`);
      });
      
      // Check if we have the required collections
      const requiredCollections = ['submissions', 'representatives', 'settings', 'formSettings'];
      const existingCollections = collections.collections.map(c => c.$id);
      const missingCollections = requiredCollections.filter(c => !existingCollections.includes(c));
      
      if (missingCollections.length === 0) {
        console.log('✅ جميع المجموعات المطلوبة موجودة!');
      } else {
        console.log(`⚠️ مجموعات مفقودة: ${missingCollections.join(', ')}`);
      }
    } else {
      throw new Error(`Collections access failed: ${collectionsResponse.status}`);
    }
    
    // Test 4: Try to add a test document
    console.log('\n4️⃣ اختبار إضافة وثيقة تجريبية...');
    const testDoc = {
      villageName: 'اختبار الاتصال',
      representativeName: 'مندوب الاختبار',
      totalPeople: 1,
      receivedMoney: 1,
      notReceived: 0,
      amountPerPerson: 100,
      totalAmount: 100,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    const addResponse = await fetch(`${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections/submissions/documents`, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId: 'unique()',
        data: testDoc
      })
    });
    
    console.log('📊 حالة الاستجابة:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ نجح الإرسال! معرف الوثيقة:', result.id);
      console.log('📊 البيانات المحفوظة:', result.data);
      
      console.log('\n🎉 Appwrite يعمل بشكل صحيح!');
    } else {
      const errorText = await response.text();
      console.error('❌ فشل الإرسال:', response.status);
      console.error('📝 تفاصيل الخطأ:', errorText);
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 تأكد من تشغيل الخادم الوسيط:');
      console.log('   node appwrite-proxy-server.js');
    }
  }
}

// Run the test
testAppwriteConnection();
