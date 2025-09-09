// Script to clean up duplicate entries in Appwrite
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68bcdd830036700d6d5b';
const APPWRITE_DATABASE_ID = 'mandoub-db';
const APPWRITE_API_KEY = '1e073f48d9cf466b68a2d3b633d38f4933ec5592b755c15ad1d93d3528c87df243b2693501cca12175863de5e8dae054e4b617dd52651d3c7b46b430a9935bb84ffb017cc1ec03e31943d71dfebf194c4892d299831351df149bed248921bb88ef7445d5115b626cb6cf603d4d3c02aad2097807cee6b7a5d9e017c387c7873a';

async function cleanupDuplicates() {
  console.log('🧹 بدء تنظيف البيانات المكررة في Appwrite...\n');
  
  const collections = ['representatives', 'submissions', 'settings', 'formSettings'];
  
  for (const collectionId of collections) {
    try {
      console.log(`📋 معالجة مجموعة: ${collectionId}`);
      
      // Get all documents
      const response = await fetch(`${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections/${collectionId}/documents`, {
        method: 'GET',
        headers: {
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': APPWRITE_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${collectionId}: ${response.status}`);
      }
      
      const data = await response.json();
      const documents = data.documents;
      
      console.log(`   📊 العدد الإجمالي: ${documents.length}`);
      
      if (documents.length === 0) {
        console.log('   ✅ لا توجد بيانات للمعالجة\n');
        continue;
      }
      
      // Find duplicates based on name or other identifying fields
      const duplicates = [];
      const seen = new Map();
      
      documents.forEach(doc => {
        let key;
        if (collectionId === 'representatives') {
          key = `${doc.name}-${doc.role}`;
        } else if (collectionId === 'submissions') {
          key = `${doc.villageName}-${doc.representativeName}-${doc.totalPeople}`;
        } else if (collectionId === 'settings' || collectionId === 'formSettings') {
          key = doc.username || doc.adminPassword || 'settings';
        }
        
        if (seen.has(key)) {
          duplicates.push(doc);
        } else {
          seen.set(key, doc);
        }
      });
      
      console.log(`   🔍 البيانات المكررة: ${duplicates.length}`);
      
      if (duplicates.length === 0) {
        console.log('   ✅ لا توجد بيانات مكررة\n');
        continue;
      }
      
      // Delete duplicates
      let deletedCount = 0;
      for (const duplicate of duplicates) {
        try {
          const deleteResponse = await fetch(`${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections/${collectionId}/documents/${duplicate.$id}`, {
            method: 'DELETE',
            headers: {
              'X-Appwrite-Project': APPWRITE_PROJECT_ID,
              'X-Appwrite-Key': APPWRITE_API_KEY,
              'Content-Type': 'application/json'
            }
          });
          
          if (deleteResponse.ok) {
            deletedCount++;
            console.log(`   🗑️ تم حذف: ${duplicate.$id}`);
          } else {
            console.log(`   ❌ فشل حذف: ${duplicate.$id}`);
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`   ❌ خطأ في حذف ${duplicate.$id}:`, error.message);
        }
      }
      
      console.log(`   ✅ تم حذف ${deletedCount} من ${duplicates.length} عنصر مكرر\n`);
      
    } catch (error) {
      console.error(`❌ خطأ في معالجة ${collectionId}:`, error.message);
    }
  }
  
  console.log('🎉 انتهى تنظيف البيانات المكررة!');
  
  // Show final counts
  console.log('\n📊 العدد النهائي للبيانات:');
  for (const collectionId of collections) {
    try {
      const response = await fetch(`${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections/${collectionId}/documents`, {
        method: 'GET',
        headers: {
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': APPWRITE_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ${collectionId}: ${data.documents.length} عنصر`);
      }
    } catch (error) {
      console.log(`   ${collectionId}: خطأ في العد`);
    }
  }
}

// Run cleanup
cleanupDuplicates().catch(console.error);
