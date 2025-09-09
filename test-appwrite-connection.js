// Test Appwrite connection with new API key
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68bcdd830036700d6d5b';
const APPWRITE_API_KEY = '1e073f48d9cf466b68a2d3b633d38f4933ec5592b755c15ad1d93d3528c87df243b2693501cca12175863de5e8dae054e4b617dd52651d3c7b46b430a9935bb84ffb017cc1ec03e31943d71dfebf194c4892d299831351df149bed248921bb88ef7445d5115b626cb6cf603d4d3c02aad2097807cee6b7a5d9e017c387c7873a';

// Helper function for API calls
async function appwriteAPI(endpoint, method = 'GET', data = null) {
    const url = `${APPWRITE_ENDPOINT}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': APPWRITE_PROJECT_ID,
            'X-Appwrite-Key': APPWRITE_API_KEY
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
        throw new Error(`API Error: ${result.message || response.statusText}`);
    }
    
    return result;
}

async function testConnection() {
    try {
        console.log('🔍 اختبار اتصال Appwrite...');
        
        // 1. Test project access
        console.log('📡 اختبار الوصول للمشروع...');
        
        // 2. List databases
        const databases = await appwriteAPI('/databases');
        console.log('✅ تم الاتصال بنجاح!');
        console.log('📊 قواعد البيانات الموجودة:', databases.databases.length);
        
        // Check if mandoub-db exists
        const mandoubDb = databases.databases.find(db => db.$id === 'mandoub-db');
        if (mandoubDb) {
            console.log('✅ قاعدة البيانات mandoub-db موجودة');
            
            // List collections
            const collections = await appwriteAPI('/databases/mandoub-db/collections');
            console.log('📁 المجموعات الموجودة:', collections.collections.length);
            
            collections.collections.forEach(collection => {
                console.log(`  - ${collection.name} (${collection.$id})`);
            });
            
            // Test adding a sample document
            try {
                console.log('🧪 اختبار إضافة بيانات تجريبية...');
                const testDoc = await appwriteAPI('/databases/mandoub-db/collections/submissions/documents', 'POST', {
                    documentId: 'unique()',
                    data: {
                        villageName: 'قرية الاختبار',
                        representativeName: 'مندوب الاختبار',
                        totalPeople: 10,
                        receivedMoney: 8,
                        notReceived: 2,
                        amountPerPerson: 50,
                        totalAmount: 400,
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                    }
                });
                console.log('✅ تم إضافة البيانات التجريبية بنجاح');
                console.log('📄 معرف المستند:', testDoc.$id);
                
                // Delete test document
                await appwriteAPI(`/databases/mandoub-db/collections/submissions/documents/${testDoc.$id}`, 'DELETE');
                console.log('🗑️ تم حذف البيانات التجريبية');
                
            } catch (testError) {
                console.log('⚠️ لم يتم إنشاء المجموعات بعد:', testError.message);
            }
            
        } else {
            console.log('⚠️ قاعدة البيانات mandoub-db غير موجودة - يجب إنشاؤها يدوياً');
        }
        
        console.log('\n🎉 النظام جاهز للاستخدام!');
        
    } catch (error) {
        console.error('❌ خطأ في الاتصال:', error.message);
        
        if (error.message.includes('401')) {
            console.log('🔑 تحقق من صحة API Key');
        } else if (error.message.includes('404')) {
            console.log('📋 تحقق من معرف المشروع أو قاعدة البيانات');
        } else if (error.message.includes('CORS')) {
            console.log('🌐 مشكلة CORS - استخدم الإعداد اليدوي');
        }
    }
}

// Run test
testConnection();
