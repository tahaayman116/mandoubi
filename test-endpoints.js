const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const app = express();
const PORT = 3719;
const APPWRITE_API_KEY = '1e073f48d9cf466b68a2d3b633d38f4933ec5592b755c15ad1d93d3528c87df243b2693501cca12175863de5e8dae054e4b617dd52651d3c7b46b430a9935bb84ffb017cc1ec03e31943d71dfebf194c4892d299831351df149bed248921bb88ef7445d5115b626cb6cf603d4d3c02aad2097807cee6b7a5d9e017c387c7873a';

app.use(cors());
app.use(express.json());

// Firebase configuration (same as your main app)
const firebaseConfig = {
  apiKey: "AIzaSyDwlELQqGvQHwQHwQHwQHwQHwQHwQHwQHw",
  authDomain: "mandoub-system.firebaseapp.com",
  projectId: "mandoub-system",
  storageBucket: "mandoub-system.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Test endpoint for Firebase writes
app.post('/api/firebase/test-write', async (req, res) => {
  try {
    const data = req.body;
    const docRef = await addDoc(collection(db, 'performance-test'), {
      ...data,
      createdAt: new Date(),
      testType: 'performance'
    });
    
    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Firebase test write error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint for Firebase reads
app.get('/api/firebase/test-read/:limit', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    // Add read logic here if needed
    res.json({ success: true, message: `Read ${limit} documents` });
  } catch (error) {
    console.error('Firebase test read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test endpoints server running' });
});

app.listen(PORT, () => {
  console.log(`🧪 Test endpoints server running on http://localhost:${PORT}`);
});
