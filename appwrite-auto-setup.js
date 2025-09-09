import { Client, Databases } from 'appwrite';

// Appwrite Auto Setup Script
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68bcdd830036700d6d5b';
const APPWRITE_API_KEY = 'standard_e1ef3d07ab6944523d973e1a2ad5e123aed130f6aae68f32cf65461ece8ce8d4d7936263d5c6da3e3c8c142866cccacbd4029be0fe74a8ba3fa02b4eea246b0b24d05df406d58a31804d6b0196831b753ec3f7d6a802c32f4e36cea7b0ea9ed30f37b6f7fdf74cc91e528fc06751b20b5462f3614ea7260893a45ed97f27efe2';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

// Schema للـ Collections
const collectionsSchema = {
  database: {
    databaseId: 'mandoub-db',
    name: 'Mandoub Database'
  },
  collections: [
    {
      collectionId: 'submissions',
      name: 'Submissions',
      attributes: [
        { key: 'villageName', type: 'string', size: 255, required: true },
        { key: 'representativeName', type: 'string', size: 255, required: true },
        { key: 'totalPeople', type: 'integer', required: true, min: 0, max: 999999 },
        { key: 'receivedMoney', type: 'integer', required: true, min: 0, max: 999999 },
        { key: 'notReceived', type: 'integer', required: true, min: 0, max: 999999 },
        { key: 'amountPerPerson', type: 'integer', required: true, min: 0, max: 999999 },
        { key: 'totalAmount', type: 'integer', required: true, min: 0, max: 999999999 },
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
        { key: 'active', type: 'boolean', required: true, default: true },
        { key: 'createdAt', type: 'string', size: 255, required: false },
        { key: 'updatedAt', type: 'string', size: 255, required: false }
      ]
    },
    {
      collectionId: 'settings',
      name: 'Settings',
      attributes: [
        { key: 'googleSheetsUrl', type: 'string', size: 500, required: false },
        { key: 'enableGoogleSheets', type: 'boolean', required: false, default: false },
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
  ]
};

// دالة إنشاء قاعدة البيانات والـ Collections تلقائياً
export async function setupAppwriteCollections() {
  try {
    console.log('🚀 بدء إعداد Appwrite تلقائياً...');

    // 1. إنشاء قاعدة البيانات
    try {
      console.log('📊 إنشاء قاعدة البيانات...');
      await databases.create(
        collectionsSchema.database.databaseId,
        collectionsSchema.database.name
      );
      console.log('✅ تم إنشاء قاعدة البيانات بنجاح');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️ قاعدة البيانات موجودة بالفعل');
      } else {
        throw error;
      }
    }

    // 2. إنشاء Collections
    for (const collection of collectionsSchema.collections) {
      try {
        console.log(`📁 إنشاء collection: ${collection.name}...`);
        
        // إنشاء Collection
        await databases.createCollection(
          collectionsSchema.database.databaseId,
          collection.collectionId,
          collection.name
        );
        
        console.log(`✅ تم إنشاء ${collection.name} collection`);

        // إضافة Attributes
        for (const attr of collection.attributes) {
          try {
            console.log(`  📝 إضافة attribute: ${attr.key}...`);
            
            if (attr.type === 'string') {
              await databases.createStringAttribute(
                collectionsSchema.database.databaseId,
                collection.collectionId,
                attr.key,
                attr.size,
                attr.required,
                attr.default || null,
                attr.array || false
              );
            } else if (attr.type === 'integer') {
              await databases.createIntegerAttribute(
                collectionsSchema.database.databaseId,
                collection.collectionId,
                attr.key,
                attr.required,
                attr.min,
                attr.max,
                attr.default || null,
                attr.array || false
              );
            } else if (attr.type === 'boolean') {
              await databases.createBooleanAttribute(
                collectionsSchema.database.databaseId,
                collection.collectionId,
                attr.key,
                attr.required,
                attr.default || null,
                attr.array || false
              );
            }
            
            console.log(`    ✅ تم إضافة ${attr.key}`);
            
            // انتظار قصير بين كل attribute
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (attrError) {
            if (attrError.code === 409) {
              console.log(`    ℹ️ ${attr.key} موجود بالفعل`);
            } else {
              console.error(`    ❌ خطأ في إضافة ${attr.key}:`, attrError.message);
            }
          }
        }

        // إعداد الصلاحيات
        console.log(`🔐 إعداد صلاحيات ${collection.name}...`);
        
        // انتظار حتى تكتمل إضافة جميع الـ attributes
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // إعداد صلاحيات Any للجميع
        await databases.updateCollection(
          collectionsSchema.database.databaseId,
          collection.collectionId,
          collection.name,
          ['any'], // permissions
          true     // documentSecurity
        );
        
        console.log(`✅ تم إعداد صلاحيات ${collection.name}`);

      } catch (collectionError) {
        if (collectionError.code === 409) {
          console.log(`ℹ️ ${collection.name} collection موجود بالفعل`);
        } else {
          console.error(`❌ خطأ في إنشاء ${collection.name}:`, collectionError.message);
        }
      }
    }

    console.log('🎉 تم إعداد Appwrite بنجاح!');
    return { success: true, message: 'تم إعداد جميع Collections بنجاح' };

  } catch (error) {
    console.error('❌ خطأ في إعداد Appwrite:', error);
    return { success: false, error: error.message };
  }
}

// تشغيل الإعداد التلقائي
if (typeof window !== 'undefined') {
  // في المتصفح - يمكن استدعاؤها يدوياً
  window.setupAppwriteCollections = setupAppwriteCollections;
  console.log('💡 لتشغيل الإعداد التلقائي، اكتب في Console: setupAppwriteCollections()');
} else {
  // في Node.js - تشغيل مباشر
  setupAppwriteCollections().then(result => {
    console.log('نتيجة الإعداد:', result);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('خطأ في التشغيل:', error);
    process.exit(1);
  });
}

export default setupAppwriteCollections;
