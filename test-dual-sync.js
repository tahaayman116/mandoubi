// Test script for dual database synchronization (Firebase + Appwrite)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './src/firebase/config.js';
import { firebaseService } from './src/services/firebaseService.js';
import { appwriteService } from './src/services/appwriteService.js';

console.log('🔄 اختبار النظام المزدوج (Firebase + Appwrite)...\n');

// Test data
const testSubmission = {
  villageName: 'قرية الاختبار',
  representativeName: 'مندوب الاختبار',
  totalPeople: 100,
  receivedMoney: 80,
  notReceived: 20,
  amountPerPerson: 500,
  totalAmount: 50000,
  submittedBy: 'admin',
  timestamp: new Date().toISOString(),
  createdAt: new Date().toISOString()
};

const testRepresentative = {
  name: 'مندوب جديد للاختبار',
  role: 'مندوب',
  active: true,
  createdAt: new Date().toISOString()
};

async function testDualSync() {
  try {
    console.log('📋 1. اختبار إضافة البيانات للنظامين...');
    
    // Test Firebase submission
    console.log('   🔥 إضافة بيانات إلى Firebase...');
    const firebaseResult = await firebaseService.addSubmission(testSubmission);
    console.log('   ✅ Firebase: تم بنجاح');
    
    // Test Appwrite submission (this should also happen automatically via dual sync)
    console.log('   📱 إضافة بيانات إلى Appwrite...');
    const appwriteResult = await appwriteService.addSubmission(testSubmission);
    console.log('   ✅ Appwrite: تم بنجاح');
    
    console.log('\n📊 2. اختبار قراءة البيانات من النظامين...');
    
    // Test Firebase read
    console.log('   🔥 قراءة من Firebase...');
    const firebaseSubmissions = await firebaseService.getSubmissions();
    console.log(`   ✅ Firebase: ${firebaseSubmissions.length} سجل`);
    
    // Test Appwrite read
    console.log('   📱 قراءة من Appwrite...');
    const appwriteSubmissions = await appwriteService.getSubmissions();
    console.log(`   ✅ Appwrite: ${appwriteSubmissions.length} سجل`);
    
    console.log('\n👥 3. اختبار إضافة المندوبين...');
    
    // Test Firebase representative
    console.log('   🔥 إضافة مندوب إلى Firebase...');
    const firebaseRep = await firebaseService.addRepresentative(testRepresentative);
    console.log('   ✅ Firebase: تم بنجاح');
    
    // Test Appwrite representative
    console.log('   📱 إضافة مندوب إلى Appwrite...');
    const appwriteRep = await appwriteService.addRepresentative(testRepresentative);
    console.log('   ✅ Appwrite: تم بنجاح');
    
    console.log('\n📈 4. اختبار الإحصائيات...');
    
    // Test Firebase stats
    console.log('   🔥 إحصائيات Firebase...');
    const firebaseStats = await firebaseService.getStatistics();
    console.log(`   ✅ Firebase: ${firebaseStats.totalSubmissions} سجل، ${firebaseStats.totalAmount} جنيه`);
    
    // Test Appwrite stats
    console.log('   📱 إحصائيات Appwrite...');
    const appwriteStats = await appwriteService.getStatistics();
    console.log(`   ✅ Appwrite: ${appwriteStats.totalSubmissions} سجل، ${appwriteStats.totalAmount} جنيه`);
    
    console.log('\n🎉 النتيجة النهائية:');
    console.log('✅ Firebase: يعمل بشكل طبيعي');
    console.log('✅ Appwrite: يعمل بشكل طبيعي');
    console.log('✅ النظام المزدوج: جاهز للاستخدام!');
    
    return {
      firebase: { submissions: firebaseSubmissions.length, stats: firebaseStats },
      appwrite: { submissions: appwriteSubmissions.length, stats: appwriteStats },
      success: true
    };
    
  } catch (error) {
    console.error('❌ خطأ في اختبار النظام المزدوج:', error);
    
    // Try to identify which system failed
    if (error.message.includes('Firebase')) {
      console.log('🔥 المشكلة في Firebase');
    } else if (error.message.includes('Appwrite') || error.message.includes('Proxy')) {
      console.log('📱 المشكلة في Appwrite');
      console.log('💡 تأكد من تشغيل الخادم الوسيط: node appwrite-proxy-server.js');
    }
    
    return { success: false, error: error.message };
  }
}

// Run the test
testDualSync().then(result => {
  if (result.success) {
    console.log('\n🚀 النظام المزدوج جاهز للاستخدام!');
  } else {
    console.log('\n⚠️ يحتاج إصلاح قبل الاستخدام');
  }
}).catch(console.error);
