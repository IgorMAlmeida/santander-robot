import cron from 'node-cron';
import { cleanupExpiredTokens } from './tokenDatabase.js';

/**
 * Initializes a scheduled task to clean up expired tokens from the database
 * Runs once per day at midnight
 */
export function initTokenCleanup() {
  // Schedule cleanup to run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running scheduled token cleanup...');
      await cleanupExpiredTokens();
      console.log('Token cleanup completed successfully');
    } catch (error) {
      console.error('Error during token cleanup:', error);
    }
  });
  
  console.log('Token cleanup scheduler initialized');
} 