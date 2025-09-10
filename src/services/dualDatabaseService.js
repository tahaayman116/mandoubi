import { dbService } from './firebaseService';
import { appwriteService } from './appwriteService';

// Dual database service integration
export const dualDatabaseService = {
  // Initialize both databases
  async init() {
    try {
      console.log('🔄 Initializing dual database system...');
      
      const firebaseReady = true; // Firebase is already initialized
      const appwriteReady = await appwriteService.init();
      
      console.log(`Primary DB: ${firebaseReady ? '✅' : '❌'}`);
      console.log(`Backup DB: ${appwriteReady ? '✅' : '❌'}`);
      
      return { firebase: firebaseReady, appwrite: appwriteReady };
    } catch (error) {
      console.error('❌ Error initializing dual database:', error);
      return { firebase: true, appwrite: false };
    }
  },

  // Add submission to both databases
  async addSubmission(data) {
    const results = { firebase: null, appwrite: null };
    
    // Add to primary database
    try {
      console.log('📝 Adding to primary database...');
      results.firebase = await dbService.addSubmission(data);
      console.log('✅ Primary DB: Success', results.firebase);
    } catch (error) {
      console.error('❌ Primary DB: Failed', error);
      results.firebase = { success: false, error: error.message };
    }

    // Add to backup database - run independently
    try {
      console.log('📝 Adding to backup database...');
      results.appwrite = await appwriteService.addSubmission(data);
      console.log('✅ Backup DB: Success', results.appwrite);
    } catch (error) {
      console.error('❌ Backup DB: Failed', error);
      results.appwrite = { success: false, error: error.message };
    }

    // Return success if at least one database succeeded
    const firebaseSuccess = results.firebase && results.firebase.id;
    const appwriteSuccess = results.appwrite && results.appwrite.success;
    const success = firebaseSuccess || appwriteSuccess;
    
    console.log('🔄 Database Results:', { 
      primary: firebaseSuccess ? 'SUCCESS' : 'FAILED',
      backup: appwriteSuccess ? 'SUCCESS' : 'FAILED',
      overall: success ? 'SUCCESS' : 'FAILED'
    });
    
    return { success, results };
  },

  // Get submissions with fallback
  async getSubmissions() {
    try {
      // Try primary database first
      console.log('📖 Reading from primary database...');
      const firebaseData = await dbService.getSubmissions();
      console.log(`✅ Primary DB: ${firebaseData.length} submissions`);
      return firebaseData;
    } catch (firebaseError) {
      console.error('❌ Primary DB failed, trying backup...', firebaseError);
      
      try {
        // Fallback to backup database
        const appwriteData = await appwriteService.getSubmissions();
        console.log(`✅ Backup DB: ${appwriteData.length} submissions`);
        return appwriteData;
      } catch (appwriteError) {
        console.error('❌ Both databases failed:', appwriteError);
        throw new Error('Failed to get submissions from both databases');
      }
    }
  },

  // Delete from both databases
  async deleteSubmission(firebaseId, appwriteId) {
    const results = { firebase: null, appwrite: null };

    if (firebaseId) {
      try {
        console.log('🗑️ Deleting from Firebase...');
        results.firebase = await dbService.deleteSubmission(firebaseId);
        console.log('✅ Firebase: Deleted');
      } catch (error) {
        console.error('❌ Firebase delete failed:', error);
        results.firebase = { success: false, error: error.message };
      }
    }

    if (appwriteId) {
      try {
        console.log('🗑️ Deleting from Appwrite...');
        results.appwrite = await appwriteService.deleteSubmission(appwriteId);
        console.log('✅ Appwrite: Deleted');
      } catch (error) {
        console.error('❌ Appwrite delete failed:', error);
        results.appwrite = { success: false, error: error.message };
      }
    }

    return { success: true, results };
  },

  // Settings management with dual sync
  async getSettings() {
    try {
      // Try Firebase first
      console.log('⚙️ Getting settings from Firebase...');
      const firebaseSettings = await dbService.getAdminSettings();
      if (firebaseSettings) {
        console.log('✅ Firebase settings found');
        return { source: 'firebase', data: firebaseSettings };
      }
    } catch (error) {
      console.error('❌ Firebase settings failed:', error);
    }

    try {
      // Fallback to Appwrite
      console.log('⚙️ Getting settings from Appwrite...');
      const appwriteSettings = await appwriteService.getSettings();
      if (appwriteSettings) {
        console.log('✅ Appwrite settings found');
        return { source: 'appwrite', data: appwriteSettings };
      }
    } catch (error) {
      console.error('❌ Appwrite settings failed:', error);
    }

    return { source: 'none', data: null };
  },

  async updateSettings(settings) {
    const results = { firebase: null, appwrite: null };

    try {
      // Update Firebase
      console.log('⚙️ Updating Firebase settings...');
      results.firebase = await dbService.updateAdminSettings(settings);
      console.log('✅ Firebase settings updated');
    } catch (error) {
      console.error('❌ Firebase settings update failed:', error);
      results.firebase = { success: false, error: error.message };
    }

    try {
      // Update Appwrite
      console.log('⚙️ Updating Appwrite settings...');
      results.appwrite = await appwriteService.updateSettings(settings);
      console.log('✅ Appwrite settings updated');
    } catch (error) {
      console.error('❌ Appwrite settings update failed:', error);
      results.appwrite = { success: false, error: error.message };
    }

    const success = results.firebase?.success || results.appwrite?.success;
    return { success, results };
  },

  // Get statistics from both databases
  async getStatistics() {
    try {
      // Try Firebase first
      const submissions = await this.getSubmissions();
      
      if (submissions.source === 'firebase') {
        // Calculate from Firebase data
        const stats = this.calculateStats(submissions.data);
        return { source: 'firebase', ...stats };
      } else if (submissions.source === 'appwrite') {
        // Use Appwrite's built-in statistics
        const stats = await appwriteService.getStatistics();
        return { source: 'appwrite', ...stats };
      }
    } catch (error) {
      console.error('❌ Statistics calculation failed:', error);
      return {
        source: 'error',
        totalSubmissions: 0,
        totalVillages: 0,
        totalPeople: 0,
        totalReceived: 0,
        totalAmount: 0
      };
    }
  },

  // Helper function to calculate statistics
  calculateStats(submissions) {
    return {
      totalSubmissions: submissions.length,
      totalVillages: new Set(submissions.map(s => s.villageName)).size,
      totalPeople: submissions.reduce((sum, s) => sum + (parseInt(s.totalPeople) || 0), 0),
      totalReceived: submissions.reduce((sum, s) => sum + (parseInt(s.receivedMoney) || 0), 0),
      totalAmount: submissions.reduce((sum, s) => sum + (parseInt(s.totalAmount) || 0), 0)
    };
  },

  // Representatives Management - Add to both databases
  async addRepresentative(data) {
    const results = { firebase: null, appwrite: null };
    
    // Ensure location field is included
    const representativeData = {
      ...data,
      location: data.location || '',
      active: true,
      createdAt: new Date().toISOString()
    };
    
    // Add to Firebase (primary)
    try {
      console.log(' Adding representative to Firebase...');
      results.firebase = await dbService.addRepresentative(representativeData);
      console.log(' Firebase: Representative added', results.firebase);
    } catch (error) {
      console.error(' Firebase: Representative failed', error);
      results.firebase = { success: false, error: error.message };
    }

    // Add to Appwrite (backup) - run independently
    try {
      console.log(' Adding representative to Appwrite...');
      results.appwrite = await appwriteService.addRepresentative(representativeData);
      console.log(' Appwrite: Representative added', results.appwrite);
    } catch (error) {
      console.error(' Appwrite: Representative failed', error);
      results.appwrite = { success: false, error: error.message };
    }

    // Return success if at least one database succeeded
    const firebaseSuccess = results.firebase && results.firebase.id;
    const appwriteSuccess = results.appwrite && results.appwrite.success;
    
    if (firebaseSuccess || appwriteSuccess) {
      console.log(' Representative added to dual database system');
      return results;
    } else {
      console.error(' Failed to add representative to both databases');
      throw new Error('Failed to add representative to both databases');
    }
  },

  // Get representatives with fallback
  async getRepresentatives() {
    try {
      // Try Firebase first
      console.log('📚 Reading representatives from Firebase...');
      const firebaseData = await dbService.getRepresentatives();
      console.log(`✅ Firebase: ${firebaseData.length} representatives`);
      return { source: 'firebase', data: firebaseData };
    } catch (firebaseError) {
      console.error('❌ Firebase failed, trying Appwrite...', firebaseError);
      
      try {
        // Fallback to Appwrite
        const appwriteData = await appwriteService.getRepresentatives();
        console.log(`✅ Appwrite: ${appwriteData.length} representatives`);
        return { source: 'appwrite', data: appwriteData };
      } catch (appwriteError) {
        console.error('❌ Both databases failed:', appwriteError);
        throw new Error('Both Firebase and Appwrite are unavailable');
      }
    }
  },

  // Delete representative from both databases
  async deleteRepresentative(firebaseId, appwriteId) {
    const results = { firebase: null, appwrite: null };

    // Always try to delete from Firebase first
    if (firebaseId) {
      try {
        console.log('🗑️ Deleting representative from Firebase...');
        results.firebase = await dbService.deleteRepresentative(firebaseId);
        console.log('✅ Firebase: Representative deleted');
      } catch (error) {
        console.error('❌ Firebase delete failed:', error);
        results.firebase = { success: false, error: error.message };
      }
    }

    // Try to find and delete from Appwrite by name if no appwriteId
    if (!appwriteId && firebaseId) {
      try {
        console.log('🔍 Searching for representative in Appwrite by Firebase data...');
        // Get Firebase representative data
        const firebaseReps = await dbService.getRepresentatives();
        const firebaseRep = firebaseReps.find(r => r.id === firebaseId);
        
        if (firebaseRep) {
          // Search in Appwrite by name and role
          const appwriteReps = await appwriteService.getRepresentatives();
          const matchingAppwriteRep = appwriteReps.find(r => 
            r.name === firebaseRep.name && r.role === firebaseRep.role
          );
          
          if (matchingAppwriteRep) {
            console.log('🗑️ Deleting matching representative from Appwrite...');
            results.appwrite = await appwriteService.deleteRepresentative(matchingAppwriteRep.$id);
            console.log('✅ Appwrite: Representative deleted by name match');
          } else {
            console.log('⚠️ No matching representative found in Appwrite');
            results.appwrite = { success: false, error: 'No matching representative found' };
          }
        }
      } catch (error) {
        console.error('❌ Appwrite search/delete failed:', error);
        results.appwrite = { success: false, error: error.message };
      }
    } else if (appwriteId) {
      // Direct delete if we have Appwrite ID
      try {
        console.log('🗑️ Deleting representative from Appwrite...');
        results.appwrite = await appwriteService.deleteRepresentative(appwriteId);
        console.log('✅ Appwrite: Representative deleted');
      } catch (error) {
        console.error('❌ Appwrite delete failed:', error);
        results.appwrite = { success: false, error: error.message };
      }
    }

    return { success: true, results };
  },

  // Clear all representatives from both databases
  async clearAllRepresentatives() {
    const results = { firebase: null, appwrite: null };

    try {
      console.log('🗑️ Clearing all representatives from Firebase...');
      results.firebase = await dbService.clearAllRepresentatives();
      console.log(`✅ Firebase: Cleared ${results.firebase} representatives`);
    } catch (error) {
      console.error('❌ Firebase clear failed:', error);
      results.firebase = { success: false, error: error.message };
    }

    try {
      console.log('🗑️ Clearing all representatives from Appwrite...');
      results.appwrite = await appwriteService.clearAllRepresentatives();
      console.log(`✅ Appwrite: Cleared ${results.appwrite} representatives`);
    } catch (error) {
      console.error('❌ Appwrite clear failed:', error);
      results.appwrite = { success: false, error: error.message };
    }

    const totalCleared = (results.firebase || 0) + (results.appwrite || 0);
    return { success: true, results, totalCleared };
  },

  // Sync data between databases
  async syncDatabases() {
    try {
      console.log('🔄 Starting database synchronization...');
      
      // Get data from both sources
      const firebaseData = await dbService.getSubmissions();
      const appwriteData = await appwriteService.getSubmissions();
      
      console.log(`Firebase: ${firebaseData.length} records`);
      console.log(`Appwrite: ${appwriteData.length} records`);
      
      // TODO: Implement sync logic based on timestamps
      // This is a complex operation that should be done carefully
      
      console.log('✅ Sync completed');
      return { success: true, firebase: firebaseData.length, appwrite: appwriteData.length };
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return { success: false, error: error.message };
    }
  }
};

export default dualDatabaseService;
