// Storage utility functions for question management
export class QuestionStorage {
  private static readonly STORAGE_KEY = 'questionBank_questions';
  private static readonly BACKUP_KEY = 'questionBank_questions_backup';

  /**
   * Save questions to localStorage with error handling and backup
   */
  static saveQuestions(questions: any[]): boolean {
    try {
      // Create backup of current data
      const currentData = localStorage.getItem(this.STORAGE_KEY);
      if (currentData) {
        localStorage.setItem(this.BACKUP_KEY, currentData);
      }

      // Save new data
      const dataToSave = JSON.stringify(questions);
      localStorage.setItem(this.STORAGE_KEY, dataToSave);
      
      console.log(`Successfully saved ${questions.length} questions to localStorage`);
      return true;
    } catch (error) {
      console.error('Failed to save questions to localStorage:', error);
      
      // Check if it's a quota exceeded error
      if (error instanceof DOMException && error.code === 22) {
        console.error('localStorage quota exceeded. Attempting cleanup...');
        this.cleanupOldData();
        
        // Try saving again after cleanup
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(questions));
          return true;
        } catch (retryError) {
          console.error('Failed to save even after cleanup:', retryError);
        }
      }
      
      return false;
    }
  }

  /**
   * Load questions from localStorage with validation
   */
  static loadQuestions(): any[] | null {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (!savedData) {
        console.log('No saved questions found in localStorage');
        return null;
      }

      const parsedData = JSON.parse(savedData);
      
      // Validate data structure
      if (!Array.isArray(parsedData)) {
        console.error('Invalid data structure in localStorage - not an array');
        return null;
      }

      // Validate each question has required fields
      const validQuestions = parsedData.filter(q => 
        q && 
        typeof q === 'object' && 
        q.id && 
        q.clinicalVignette && 
        q.leadQuestion
      );

      if (validQuestions.length !== parsedData.length) {
        console.warn(`Filtered out ${parsedData.length - validQuestions.length} invalid questions`);
      }

      console.log(`Successfully loaded ${validQuestions.length} questions from localStorage`);
      return validQuestions;
    } catch (error) {
      console.error('Failed to load questions from localStorage:', error);
      
      // Try to load from backup
      return this.loadFromBackup();
    }
  }

  /**
   * Load questions from backup storage
   */
  private static loadFromBackup(): any[] | null {
    try {
      const backupData = localStorage.getItem(this.BACKUP_KEY);
      if (backupData) {
        const parsedBackup = JSON.parse(backupData);
        console.log('Loaded questions from backup storage');
        return Array.isArray(parsedBackup) ? parsedBackup : null;
      }
    } catch (error) {
      console.error('Failed to load from backup:', error);
    }
    return null;
  }

  /**
   * Clean up old data to free storage space
   */
  private static cleanupOldData(): void {
    try {
      // Remove backup data
      localStorage.removeItem(this.BACKUP_KEY);
      
      // Remove any other old keys that might exist
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('questionBank_') && key !== this.STORAGE_KEY) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleaned up ${keysToRemove.length} old storage keys`);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Check storage health and available space
   */
  static checkStorageHealth(): { isHealthy: boolean; usedSpace: number; availableSpace: number } {
    try {
      const testKey = 'storage_test';
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
   * Export questions as JSON file
   */
  static exportQuestions(questions: any[]): void {
    try {
      const dataStr = JSON.stringify(questions, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `questions_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      console.log('Questions exported successfully');
    } catch (error) {
      console.error('Failed to export questions:', error);
    }
  }
}