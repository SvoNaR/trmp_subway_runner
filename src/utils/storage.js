import * as SecureStore from 'expo-secure-store';

// Storage wrapper for Expo
export const storage = {
  async setItem(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },

  async getItem(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },

  async removeItem(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },

  async clear() {
    try {
      // Clear specific keys we use
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

export default storage;
