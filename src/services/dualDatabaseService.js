import { dbService } from './firebaseService';

// Database service (Firebase only)
export const dualDatabaseService = {
  // Initialize database
  async init() {
    try {
      console.log('🔄 Initializing database system...');
      
      const firebaseReady = true; // Firebase is already initialized
      
      console.log(`Database: ${firebaseReady ? '✅' : '❌'}`);
      
      return { firebase: firebaseReady };
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      return { firebase: false };
    }
  },

  // Add submission to database
  async addSubmission(data) {
    try {
      console.log('📝 Adding to database...');
      const result = await dbService.addSubmission(data);
      console.log('✅ Database: Success', result);
      
      return { success: true, results: { firebase: result } };
    } catch (error) {
      console.error('❌ Database: Failed', error);
      throw error;
    }
  },

  // Get submissions
  async getSubmissions() {
    try {
      console.log('📚 Reading submissions from database...');
      const data = await dbService.getSubmissions();
      console.log(`✅ Database: ${data.length} submissions`);
      return { source: 'firebase', data };
    } catch (error) {
      console.error('❌ Database failed:', error);
      return { source: 'error', data: [] };
    }
  },

  // Delete submission
  async deleteSubmission(id) {
    try {
      console.log('🗑️ Deleting from database...');
      const result = await dbService.deleteSubmission(id);
      console.log('✅ Database: Deleted');
      return { firebase: result };
    } catch (error) {
      console.error('❌ Database: Delete failed', error);
      throw error;
    }
  },

  // Clear all submissions
  async clearAllSubmissions() {
    try {
      console.log('🗑️ Clearing all from database...');
      const result = await dbService.clearAllSubmissions();
      console.log('✅ Database: All cleared');
      return { firebase: result };
    } catch (error) {
      console.error('❌ Database: Clear failed', error);
      throw error;
    }
  },

  // Delete person submissions
  async deletePersonSubmissions(personName) {
    try {
      console.log(`🗑️ Deleting ${personName} from database...`);
      const result = await dbService.deletePersonSubmissions(personName);
      console.log('✅ Database: Person deleted');
      return { firebase: result };
    } catch (error) {
      console.error('❌ Database: Person delete failed', error);
      throw error;
    }
  },

  // Get statistics
  async getStatistics() {
    try {
      const submissions = await this.getSubmissions();
      const stats = this.calculateStats(submissions.data);
      return { source: 'firebase', ...stats };
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

  // Add representative to database
  async addRepresentative(data) {
    const representativeData = {
      ...data,
      location: data.location || '',
      active: true,
      createdAt: new Date().toISOString()
    };
    
    try {
      console.log('👤 Adding representative to database...');
      const result = await dbService.addRepresentative(representativeData);
      console.log('✅ Database: Representative added', result);
      
      return { success: true, results: { firebase: result } };
    } catch (error) {
      console.error('❌ Database: Representative failed', error);
      throw error;
    }
  },

  // Get representatives
  async getRepresentatives() {
    try {
      console.log('📚 Reading representatives from database...');
      const data = await dbService.getRepresentatives();
      console.log(`✅ Database: ${data.length} representatives`);
      return { source: 'firebase', data };
    } catch (error) {
      console.error('❌ Database failed:', error);
      return { source: 'error', data: [] };
    }
  },

  // Delete representative
  async deleteRepresentative(id) {
    try {
      console.log('🗑️ Deleting representative from database...');
      const result = await dbService.deleteRepresentative(id);
      console.log('✅ Database: Representative deleted');
      return { firebase: result };
    } catch (error) {
      console.error('❌ Database: Representative delete failed', error);
      throw error;
    }
  },

  // Update representative
  async updateRepresentative(id, data) {
    try {
      console.log('📝 Updating representative in database...');
      const result = await dbService.updateRepresentative(id, data);
      console.log('✅ Database: Representative updated');
      return { firebase: result };
    } catch (error) {
      console.error('❌ Database: Representative update failed', error);
      throw error;
    }
  },

  // Clear all representatives
  async clearAllRepresentatives() {
    try {
      console.log('🗑️ Clearing all representatives from database...');
      const result = await dbService.clearAllRepresentatives();
      console.log('✅ Database: All representatives cleared');
      return { firebase: result };
    } catch (error) {
      console.error('❌ Database: Clear representatives failed', error);
      throw error;
    }
  },

  // Database health check
  async healthCheck() {
    try {
      console.log('🔄 Checking database health...');
      
      const firebaseData = await dbService.getSubmissions();
      
      console.log(`Database: ${firebaseData.length} records`);
      
      console.log('✅ Health check completed');
      return { success: true, firebase: firebaseData.length };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { success: false, error: error.message };
    }
  }
};

export default dualDatabaseService;
