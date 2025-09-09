import { Client, Databases, ID } from 'appwrite';

// Appwrite configuration
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1'; // NYC endpoint
const APPWRITE_PROJECT_ID = '68bcdd830036700d6d5b'; // ضع معرف المشروع هنا
const APPWRITE_DATABASE_ID = 'mandoub-db'; // Database created manually
// const APPWRITE_API_KEY = process.env.REACT_APP_APPWRITE_API_KEY;
const APPWRITE_SUBMISSIONS_COLLECTION = 'submissions';
const APPWRITE_REPRESENTATIVES_COLLECTION = 'representatives';
const APPWRITE_SETTINGS_COLLECTION = 'settings';
// const APPWRITE_FORM_SETTINGS_COLLECTION = 'formSettings';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Appwrite service for unlimited read/write operations
export const appwriteService = {
  // Initialize Appwrite (call this once in your app)
  async init() {
    try {
      console.log('Initializing Appwrite...');
      
      // Skip session creation and database listing to avoid CORS issues
      // Just return true since we'll handle permissions per request
      console.log('✅ Appwrite initialized (skipping connection test)');
      return true;
    } catch (error) {
      console.error('❌ Appwrite initialization failed:', error);
      return false;
    }
  },

  // Submissions Management
  async addSubmission(data) {
    try {
      console.log('Adding submission to Appwrite via proxy:', data);
      
      // Use proxy server to bypass CORS
      const response = await fetch('http://localhost:3001/api/appwrite/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Proxy server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Submission added to Appwrite via proxy:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error adding submission to Appwrite:', error);
      throw error;
    }
  },

  async getSubmissions(limit = 100, offset = 0) {
    try {
      console.log('Getting submissions from Appwrite...');
      
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SUBMISSIONS_COLLECTION,
        [
          // Query.limit(limit),
          // Query.offset(offset),
          // Query.orderDesc('$createdAt')
        ]
      );
      
      console.log(`✅ Retrieved ${response.documents.length} submissions from Appwrite`);
      return response.documents;
    } catch (error) {
      console.error('❌ Error getting submissions from Appwrite:', error);
      throw error;
    }
  },

  async deleteSubmission(documentId) {
    try {
      console.log('Deleting submission from Appwrite:', documentId);
      
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SUBMISSIONS_COLLECTION,
        documentId
      );
      
      console.log('✅ Submission deleted from Appwrite');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting submission from Appwrite:', error);
      throw error;
    }
  },

  // Settings Management
  async getSettings() {
    try {
      console.log('Getting settings from Appwrite...');
      
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SETTINGS_COLLECTION
      );
      
      if (response.documents.length > 0) {
        console.log('✅ Settings retrieved from Appwrite');
        return response.documents[0];
      }
      
      console.log('No settings found in Appwrite');
      return null;
    } catch (error) {
      console.error('❌ Error getting settings from Appwrite:', error);
      throw error;
    }
  },

  async updateSettings(settings) {
    try {
      console.log('Updating settings in Appwrite:', settings);
      
      // Check if settings document exists
      const existingSettings = await this.getSettings();
      
      if (existingSettings) {
        // Update existing document
        const document = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_SETTINGS_COLLECTION,
          existingSettings.$id,
          {
            ...settings,
            updatedAt: new Date().toISOString()
          }
        );
        
        console.log('✅ Settings updated in Appwrite');
        return { success: true, data: document };
      } else {
        // Create new document
        const document = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_SETTINGS_COLLECTION,
          ID.unique(),
          {
            ...settings,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        );
        
        console.log('✅ Settings created in Appwrite');
        return { success: true, data: document };
      }
    } catch (error) {
      console.error('❌ Error updating settings in Appwrite:', error);
      throw error;
    }
  },

  // Representatives Management
  async addRepresentative(data) {
    try {
      console.log('Adding representative to Appwrite via proxy:', data);
      
      // Use proxy server to bypass CORS
      const response = await fetch('http://localhost:3001/api/appwrite/representatives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Proxy server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Representative added to Appwrite via proxy:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error adding representative to Appwrite:', error);
      throw error;
    }
  },

  async getRepresentatives() {
    try {
      console.log('Getting representatives from Appwrite...');
      
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_REPRESENTATIVES_COLLECTION
      );
      
      console.log(`✅ Retrieved ${response.documents.length} representatives from Appwrite`);
      return response.documents;
    } catch (error) {
      console.error('❌ Error getting representatives from Appwrite:', error);
      throw error;
    }
  },

  async deleteRepresentative(documentId) {
    try {
      console.log('Deleting representative from Appwrite:', documentId);
      
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_REPRESENTATIVES_COLLECTION,
        documentId
      );
      
      console.log('✅ Representative deleted from Appwrite');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting representative from Appwrite:', error);
      throw error;
    }
  },

  async clearAllRepresentatives() {
    try {
      console.log('Clearing all representatives from Appwrite...');
      
      const representatives = await this.getRepresentatives();
      const deletePromises = representatives.map(rep => 
        this.deleteRepresentative(rep.$id)
      );
      
      await Promise.all(deletePromises);
      console.log(`✅ Cleared ${representatives.length} representatives from Appwrite`);
      return representatives.length;
    } catch (error) {
      console.error('❌ Error clearing all representatives from Appwrite:', error);
      throw error;
    }
  },

  // Statistics
  async getStatistics() {
    try {
      console.log('Getting statistics from Appwrite...');
      
      const submissions = await this.getSubmissions();
      
      const stats = {
        totalSubmissions: submissions.length,
        totalVillages: new Set(submissions.map(s => s.villageName)).size,
        totalPeople: submissions.reduce((sum, s) => sum + (s.totalPeople || 0), 0),
        totalReceived: submissions.reduce((sum, s) => sum + (s.receivedMoney || 0), 0),
        totalAmount: submissions.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      };
      
      console.log('✅ Statistics calculated from Appwrite:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting statistics from Appwrite:', error);
      throw error;
    }
  },

  // Form Settings Services
  async saveFormSettings(settings) {
    try {
      console.log('Saving form settings to Appwrite via proxy:', settings);
      
      const response = await fetch('http://localhost:3001/api/appwrite/form-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error(`Proxy server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Form settings saved to Appwrite:', result);
      return result;
    } catch (error) {
      console.error('❌ Error saving form settings to Appwrite:', error);
      throw error;
    }
  },

  async getFormSettings() {
    try {
      console.log('Getting form settings from Appwrite via proxy...');
      
      const response = await fetch('http://localhost:3001/api/appwrite/form-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Proxy server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Form settings retrieved from Appwrite:', result);
      return result.documents && result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      console.error('❌ Error getting form settings from Appwrite:', error);
      return null;
    }
  }
};

export default appwriteService;
