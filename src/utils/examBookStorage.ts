// Exam Book Storage Utility
// Centralized storage management for exam books with error handling and backup

export interface ExamBookStorageResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export class ExamBookStorage {
  private static readonly STORAGE_KEY = 'examBooks_data';
  private static readonly BACKUP_KEY = 'examBooks_backup';
  private static readonly VERSION_KEY = 'examBooks_version';
  private static readonly CURRENT_VERSION = '1.0';

  /**
   * Save exam books to localStorage with backup and versioning
   */
  static save(examBooks: any[]): ExamBookStorageResult {
    try {
      // Create backup of current data
      const currentData = localStorage.getItem(this.STORAGE_KEY);
      if (currentData) {
        localStorage.setItem(this.BACKUP_KEY, currentData);
      }

      // Save new data with version
      const dataToSave = {
        version: this.CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        data: examBooks
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
      
      console.log(`ExamBookStorage: Successfully saved ${examBooks.length} exam books`);
      return { success: true, data: examBooks };
    } catch (error) {
      console.error('ExamBookStorage: Failed to save exam books:', error);
      
      // Check if it's a quota exceeded error
      if (error instanceof DOMException && error.code === 22) {
        console.error('ExamBookStorage: localStorage quota exceeded');
        this.cleanup();
        
        // Try saving again after cleanup
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
            version: this.CURRENT_VERSION,
            timestamp: new Date().toISOString(),
            data: examBooks
          }));
          return { success: true, data: examBooks };
        } catch (retryError) {
          return { success: false, error: 'Storage quota exceeded even after cleanup' };
        }
      }
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Load exam books from localStorage with fallback to backup
   */
  static load(): ExamBookStorageResult {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (!savedData) {
        console.log('ExamBookStorage: No saved data found');
        return { success: true, data: [] };
      }

      const parsedData = JSON.parse(savedData);
      
      // Handle legacy data format (direct array)
      if (Array.isArray(parsedData)) {
        console.log('ExamBookStorage: Loading legacy format data');
        return { success: true, data: parsedData };
      }

      // Handle new versioned format
      if (parsedData.version && parsedData.data) {
        if (Array.isArray(parsedData.data)) {
          console.log(`ExamBookStorage: Successfully loaded ${parsedData.data.length} exam books (version ${parsedData.version})`);
          return { success: true, data: parsedData.data };
        }
      }

      throw new Error('Invalid data format');
    } catch (error) {
      console.error('ExamBookStorage: Failed to load exam books:', error);
      
      // Try to load from backup
      return this.loadFromBackup();
    }
  }

  /**
   * Load exam books from backup storage
   */
  private static loadFromBackup(): ExamBookStorageResult {
    try {
      const backupData = localStorage.getItem(this.BACKUP_KEY);
      if (backupData) {
        const parsedBackup = JSON.parse(backupData);
        
        // Handle both legacy and versioned backup formats
        const data = Array.isArray(parsedBackup) ? parsedBackup : parsedBackup.data || [];
        
        console.log('ExamBookStorage: Loaded from backup storage');
        return { success: true, data };
      }
    } catch (error) {
      console.error('ExamBookStorage: Failed to load from backup:', error);
    }
    
    return { success: false, error: 'No valid data or backup found' };
  }

  /**
   * Clean up old data to free storage space
   */
  private static cleanup(): void {
    try {
      // Remove backup data
      localStorage.removeItem(this.BACKUP_KEY);
      
      // Remove any other old keys that might exist
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('examBooks_') && key !== this.STORAGE_KEY && key !== this.VERSION_KEY) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`ExamBookStorage: Cleaned up ${keysToRemove.length} old storage keys`);
    } catch (error) {
      console.error('ExamBookStorage: Error during cleanup:', error);
    }
  }

  /**
   * Check storage health and available space
   */
  static checkHealth(): { isHealthy: boolean; usedSpace: number; availableSpace: number } {
    try {
      const testKey = 'examBooks_health_test';
      const testData = 'x'.repeat(1024); // 1KB test
      
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
      
      // Estimate used space
      let usedSpace = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          usedSpace += localStorage[key].length + key.length;
        }
      }
      
      return {
        isHealthy: true,
        usedSpace,
        availableSpace: 5 * 1024 * 1024 - usedSpace // Assume 5MB limit
      };
    } catch (error) {
      return {
        isHealthy: false,
        usedSpace: -1,
        availableSpace: -1
      };
    }
  }

  /**
   * Export exam books as JSON file
   */
  static exportToFile(examBooks: any[]): void {
    try {
      const exportData = {
        version: this.CURRENT_VERSION,
        exportDate: new Date().toISOString(),
        examBooks: examBooks
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam_books_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      console.log('ExamBookStorage: Exam books exported successfully');
    } catch (error) {
      console.error('ExamBookStorage: Failed to export exam books:', error);
    }
  }
}