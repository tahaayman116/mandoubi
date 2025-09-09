// Simple Appwrite Setup using fetch API
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68bcdd830036700d6d5b';
const APPWRITE_API_KEY = 'standard_e1ef3d07ab6944523d973e1a2ad5e123aed130f6aae68f32cf65461ece8ce8d4d7936263d5c6da3e3c8c142866cccacbd4029be0fe74a8ba3fa02b4eea246b0b24d05df406d58a31804d6b0196831b753ec3f7d6a802c32f4e36cea7b0ea9ed30f37b6f7fdf74cc91e528fc06751b20b5462f3614ea7260893a45ed97f27efe2';

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

// Setup function
async function setupAppwrite() {
  try {
    console.log('🚀 بدء إعداد Appwrite...');

    // 1. Create Database
    try {
      console.log('📊 إنشاء قاعدة البيانات...');
      await appwriteAPI('/databases', 'POST', {
        databaseId: 'mandoub-db',
        name: 'Mandoub Database'
      });
      console.log('✅ تم إنشاء قاعدة البيانات');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('409')) {
        console.log('ℹ️ قاعدة البيانات موجودة بالفعل');
      } else {
        throw error;
      }
    }

    // 2. Create Collections
    const collections = [
      {
        collectionId: 'submissions',
        name: 'Submissions',
        attributes: [
          { key: 'villageName', type: 'string', size: 255, required: true },
          { key: 'representativeName', type: 'string', size: 255, required: true },
          { key: 'totalPeople', type: 'integer', required: true },
          { key: 'receivedMoney', type: 'integer', required: true },
          { key: 'notReceived', type: 'integer', required: true },
          { key: 'amountPerPerson', type: 'integer', required: true },
          { key: 'totalAmount', type: 'integer', required: true },
          { key: 'submittedBy', type: 'string', size: 255, required: false },
          { key: 'representativeId', type: 'string', size: 255, required: false },
          { key: 'timestamp', type: 'string', size: 255, required: false },
          { key: 'createdAt', type: 'string', size: 255, required: false }
        ]
      },
      {
        collectionId: 'representatives',
        name: 'Representatives',
        attributes: [
          { key: 'name', type: 'string', size: 255, required: true },
          { key: 'role', type: 'string', size: 100, required: true },
          { key: 'username', type: 'string', size: 100, required: false },
          { key: 'password', type: 'string', size: 255, required: false },
          { key: 'email', type: 'string', size: 255, required: false },
          { key: 'active', type: 'boolean', required: true },
          { key: 'createdAt', type: 'string', size: 255, required: false },
          { key: 'updatedAt', type: 'string', size: 255, required: false }
        ]
      },
      {
        collectionId: 'settings',
        name: 'Settings',
        attributes: [
          { key: 'googleSheetsUrl', type: 'string', size: 500, required: false },
          { key: 'enableGoogleSheets', type: 'boolean', required: false },
          { key: 'passwordNotificationUrl', type: 'string', size: 500, required: false },
          { key: 'adminPassword', type: 'string', size: 255, required: false },
          { key: 'passwordLastChanged', type: 'string', size: 255, required: false },
          { key: 'createdAt', type: 'string', size: 255, required: false },
          { key: 'updatedAt', type: 'string', size: 255, required: false }
        ]
      },
      {
        collectionId: 'formSettings',
        name: 'Form Settings',
        attributes: [
          { key: 'username', type: 'string', size: 100, required: true },
          { key: 'password', type: 'string', size: 255, required: true },
          { key: 'googleSheetsUrl', type: 'string', size: 500, required: false },
          { key: 'updatedAt', type: 'string', size: 255, required: false },
          { key: 'updatedBy', type: 'string', size: 255, required: false }
        ]
      }
    ];

    for (const collection of collections) {
      try {
        console.log(`📁 إنشاء collection: ${collection.name}...`);
        
        // Create collection
        await appwriteAPI('/databases/mandoub-db/collections', 'POST', {
          collectionId: collection.collectionId,
          name: collection.name,
          permissions: ['read("any")', 'write("any")'],
          documentSecurity: false
        });
        
        console.log(`✅ تم إنشاء ${collection.name}`);

        // Add attributes
        for (const attr of collection.attributes) {
          try {
            console.log(`  📝 إضافة ${attr.key}...`);
            
            let endpoint = `/databases/mandoub-db/collections/${collection.collectionId}/attributes/`;
            let payload = {
              key: attr.key,
              required: attr.required
            };

            if (attr.type === 'string') {
              endpoint += 'string';
              payload.size = attr.size;
            } else if (attr.type === 'integer') {
              endpoint += 'integer';
              payload.min = 0;
              payload.max = 999999999;
            } else if (attr.type === 'boolean') {
              endpoint += 'boolean';
              payload.default = attr.required ? true : false;
            }

            await appwriteAPI(endpoint, 'POST', payload);
            console.log(`    ✅ تم إضافة ${attr.key}`);
            
            // Wait between attributes
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (attrError) {
            if (attrError.message.includes('already exists') || attrError.message.includes('409')) {
              console.log(`    ℹ️ ${attr.key} موجود بالفعل`);
            } else {
              console.error(`    ❌ خطأ في ${attr.key}:`, attrError.message);
            }
          }
        }

      } catch (collError) {
        if (collError.message.includes('already exists') || collError.message.includes('409')) {
          console.log(`ℹ️ ${collection.name} موجود بالفعل`);
        } else {
          console.error(`❌ خطأ في ${collection.name}:`, collError.message);
        }
      }
    }

    console.log('🎉 تم إعداد Appwrite بنجاح!');
    console.log('📋 تم إنشاء:');
    console.log('  ✅ قاعدة البيانات: mandoub-db');
    console.log('  ✅ مجموعة الإرسالات: submissions');
    console.log('  ✅ مجموعة المندوبين: representatives');
    console.log('  ✅ مجموعة الإعدادات: settings');
    console.log('  ✅ مجموعة إعدادات الفورم: formSettings');
    
    return { success: true };

  } catch (error) {
    console.error('❌ خطأ في الإعداد:', error.message);
    return { success: false, error: error.message };
  }
}

// Run setup
setupAppwrite().then(result => {
  if (result.success) {
    console.log('\n🚀 يمكنك الآن استخدام النظام المزدوج (Firebase + Appwrite)');
    process.exit(0);
  } else {
    console.error('\n💥 فشل في الإعداد');
    process.exit(1);
  }
}).catch(error => {
  console.error('خطأ:', error);
  process.exit(1);
});
