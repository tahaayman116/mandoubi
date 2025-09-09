const express = require('express');
const cors = require('cors');
const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting and connection management
const activeConnections = new Map();
const MAX_CONCURRENT_REQUESTS = 10;
const REQUEST_TIMEOUT = 15000; // 15 seconds

// Request queue for rate limiting
const requestQueue = [];
let processingQueue = false;

// Appwrite configuration
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68bcdd830036700d6d5b';
const APPWRITE_DATABASE_ID = 'mandoub-db';
const APPWRITE_API_KEY = '1e073f48d9cf466b68a2d3b633d38f4933ec5592b755c15ad1d93d3528c87df243b2693501cca12175863de5e8dae054e4b617dd52651d3c7b46b430a9935bb84ffb017cc1ec03e31943d71dfebf194c4892d299831351df149bed248921bb88ef7445d5115b626cb6cf603d4d3c02aad2097807cee6b7a5d9e017c387c7873a';
const APPWRITE_SUBMISSIONS_COLLECTION = 'submissions';
const APPWRITE_REPRESENTATIVES_COLLECTION = 'representatives';

// Initialize Appwrite client (server-side)
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

// Queue processing function
async function processQueue() {
  if (processingQueue || requestQueue.length === 0) return;
  
  processingQueue = true;
  
  while (requestQueue.length > 0 && activeConnections.size < MAX_CONCURRENT_REQUESTS) {
    const { req, res, resolve } = requestQueue.shift();
    const requestId = Date.now() + Math.random();
    activeConnections.set(requestId, Date.now());
    
    processRequest(req, res, requestId).finally(() => {
      activeConnections.delete(requestId);
      resolve();
    });
  }
  
  processingQueue = false;
}

// Process individual request with timeout and error handling
async function processRequest(req, res, requestId) {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ success: false, error: 'Request timeout' });
    }
  }, REQUEST_TIMEOUT);

  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.villageName || !data.representativeName) {
      clearTimeout(timeout);
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: villageName, representativeName' 
      });
    }

    const document = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_SUBMISSIONS_COLLECTION,
      ID.unique(),
      {
        villageName: String(data.villageName).substring(0, 100),
        representativeName: String(data.representativeName).substring(0, 100),
        totalPeople: parseInt(data.totalPeople) || 0,
        receivedMoney: parseInt(data.receivedMoney) || 0,
        notReceived: parseInt(data.notReceived) || 0,
        amountPerPerson: parseInt(data.amountPerPerson) || 50,
        totalAmount: parseInt(data.totalAmount) || 0,
        timestamp: data.timestamp || new Date().toISOString(),
        date: data.date || new Date().toLocaleDateString('ar-EG'),
        time: data.time || new Date().toLocaleTimeString('ar-EG')
      },
      [Permission.read(Role.any()), Permission.write(Role.any())]
    );
    
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.json({ success: true, id: document.$id, data: document });
    }
  } catch (error) {
    clearTimeout(timeout);
    console.error(`❌ Proxy Error [${requestId}]:`, error.message);
    
    if (!res.headersSent) {
      // Handle specific Appwrite errors
      if (error.message.includes('rate limit')) {
        res.status(429).json({ success: false, error: 'Rate limit exceeded' });
      } else if (error.message.includes('network')) {
        res.status(503).json({ success: false, error: 'Network error' });
      } else {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  }
}

// Process representatives request
async function processRepresentativeRequest(req, res, requestId) {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ success: false, error: 'Request timeout' });
    }
  }, REQUEST_TIMEOUT);

  try {
    const data = req.body;
    
    // Validate required fields for representatives
    if (!data.name || !data.role) {
      clearTimeout(timeout);
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, role' 
      });
    }

    const document = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_REPRESENTATIVES_COLLECTION,
      ID.unique(),
      {
        name: String(data.name).substring(0, 100),
        role: String(data.role),
        active: true,
        createdAt: new Date().toISOString()
      },
      [Permission.read(Role.any()), Permission.write(Role.any())]
    );
    
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.json({ success: true, id: document.$id, data: document });
    }
  } catch (error) {
    clearTimeout(timeout);
    console.error(`❌ Representative Proxy Error [${requestId}]:`, error.message);
    
    if (!res.headersSent) {
      if (error.message.includes('rate limit')) {
        res.status(429).json({ success: false, error: 'Rate limit exceeded' });
      } else if (error.message.includes('network')) {
        res.status(503).json({ success: false, error: 'Network error' });
      } else {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  }
}

// Rate-limited proxy endpoints
app.post('/api/appwrite/submissions', (req, res) => {
  return new Promise((resolve) => {
    requestQueue.push({ req, res, resolve });
    processQueue();
  });
});

app.post('/api/appwrite/representatives', (req, res) => {
  return new Promise((resolve) => {
    const requestId = Date.now() + Math.random();
    activeConnections.set(requestId, Date.now());
    
    processRepresentativeRequest(req, res, requestId).finally(() => {
      activeConnections.delete(requestId);
      resolve();
    });
  });
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Appwrite proxy server is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Appwrite proxy server is running' });
});

// Process form settings request
async function processFormSettingsRequest(req, res, requestId) {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ success: false, error: 'Request timeout' });
    }
  }, REQUEST_TIMEOUT);

  try {
    const data = req.body;
    
    const document = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      'formSettings',
      ID.unique(),
      data,
      [Permission.read(Role.any()), Permission.write(Role.any())]
    );
    
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.json({ success: true, id: document.$id, data: document });
    }
  } catch (error) {
    clearTimeout(timeout);
    console.error(`❌ Form Settings Proxy Error [${requestId}]:`, error.message);
    
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

// Get form settings request
async function getFormSettingsRequest(req, res, requestId) {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ success: false, error: 'Request timeout' });
    }
  }, REQUEST_TIMEOUT);

  try {
    const documents = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'formSettings'
    );
    
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.json({ success: true, data: documents.documents });
    }
  } catch (error) {
    clearTimeout(timeout);
    console.error(`❌ Get Form Settings Proxy Error [${requestId}]:`, error.message);
    
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

// Add missing endpoints for form settings
app.post('/api/appwrite/form-settings', (req, res) => {
  return new Promise((resolve) => {
    const requestId = Date.now() + Math.random();
    activeConnections.set(requestId, Date.now());
    
    processFormSettingsRequest(req, res, requestId).finally(() => {
      activeConnections.delete(requestId);
      resolve();
    });
  });
});

app.get('/api/appwrite/form-settings', (req, res) => {
  return new Promise((resolve) => {
    const requestId = Date.now() + Math.random();
    activeConnections.set(requestId, Date.now());
    
    getFormSettingsRequest(req, res, requestId).finally(() => {
      activeConnections.delete(requestId);
      resolve();
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Appwrite proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to: ${APPWRITE_ENDPOINT}`);
});
