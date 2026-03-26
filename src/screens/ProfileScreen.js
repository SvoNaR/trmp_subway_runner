import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../utils/storage';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalGames: 0,
    highScore: 0,
    totalCoins: 0,
    level: 1,
  });
  const [selectedSkin, setSelectedSkin] = useState('#FF6B35'); // Default orange
  const [skinsModalVisible, setSkinsModalVisible] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSelectedSkin();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Profile screen focused - reloading data...');
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      console.log('🔄 Loading user data...');
      
      // Load user info from storage
      const userStr = await storage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log('👤 Loaded user:', userData.username, '(ID:', userData.id + ')');
        setUser(userData);
      } else {
        console.log('⚠️ No user found in storage');
      }
      
      // Load stats from server if available
      const token = await storage.getItem('token');
      if (token) {
        console.log('🔑 Token found, loading stats from server...');
        try {
          const response = await fetch('http://192.168.1.160:3000/api/progress', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          console.log('📡 Server response status:', response.status);
          
          if (response.ok) {
            const progress = await response.json();
            console.log('💾 Progress data:', progress);
            
            if (progress) {
              const newStats = {
                totalGames: progress.total_games || 0,
                highScore: progress.high_score || 0,
                totalCoins: progress.total_coins || 0,
                level: progress.level || 1,
              };
              console.log('✅ New stats:', newStats);
              setStats(newStats);
            } else {
              console.log('⚠️ No progress data returned');
            }
          } else {
            const errorData = await response.json();
            console.error('❌ Failed to load progress, status:', response.status, errorData);
          }
        } catch (error) {
          console.error('❌ Error loading stats:', error);
        }
      } else {
        console.log('⚠️ No token found, cannot load stats');
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  };

  const loadSelectedSkin = async () => {
    try {
      const skin = await storage.getItem('selectedSkin');
      if (skin) {
        setSelectedSkin(skin);
      }
    } catch (error) {
      console.error('Error loading skin:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await storage.clear();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleSettings = () => {
    Alert.alert(
      'Настройки',
      'Выберите действие:',
      [
        {
          text: 'Звук',
          onPress: () => Alert.alert('Звук', 'Настройки звука будут доступны в следующей версии')
        },
        {
          text: 'Уведомления',
          onPress: () => Alert.alert('Уведомления', 'Настройки уведомлений будут доступны в следующей версии')
        },
        {
          text: 'Язык',
          onPress: () => Alert.alert('Язык', 'Настройки языка будут доступны в следующей версии')
        },
        {
          text: 'Отмена',
          style: 'cancel'
        }
      ]
    );
  };

  const handleAchievements = () => {
    Alert.alert(
      'Достижения',
      'Ваши достижения:',
      [
        {
          text: '🏆 Новичок',
          onPress: () => Alert.alert('Новичок', 'Сыграйте свою первую игру!')
        },
        {
          text: '💰 Коллекционер',
          onPress: () => Alert.alert('Коллекционер', 'Соберите 50 монет за одну игру!')
        },
        {
          text: '🏃 Спринтер',
          onPress: () => Alert.alert('Спринтер', 'Пробежите 1000 метров без падения!')
        },
        {
          text: '⭐ Мастер',
          onPress: () => Alert.alert('Мастер', 'Наберите 5000 очков!')
        },
        {
          text: '🎯 Профессионал',
          onPress: () => Alert.alert('Профессионал', 'Сыграйте 100 игр!')
        },
        {
          text: 'Закрыть',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Помощь и Поддержка',
      'Если у вас возникли вопросы или проблемы, обратитесь в службу поддержки:',
      [
        {
          text: 'Email',
          onPress: () => Alert.alert('Email для связи', 'alfalegolas@yandex.ru')
        },
        {
          text: 'Telegram',
          onPress: () => Alert.alert('Telegram для связи', '@smirnofforever')
        },
        {
          text: 'Закрыть',
          style: 'cancel'
        }
      ]
    );
  };

  const handleSkins = () => {
    setSkinsModalVisible(true);
  };

  const selectSkin = async (color) => {
    try {
      await storage.setItem('selectedSkin', color);
      setSelectedSkin(color);
      setSkinsModalVisible(false);
      Alert.alert('Скин выбран!', 'Цвет вашего кубика изменен');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить скин');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatarContainer, { borderColor: selectedSkin }]}>
          <Text style={[styles.avatarText, { color: selectedSkin }]}>
            {user?.username?.charAt(0) || 'И'}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username || 'Гость'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Статистика</Text>
        
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalGames}</Text>
            <Text style={styles.statLabel}>Игр</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.highScore}</Text>
            <Text style={styles.statLabel}>Рекорд</Text>
          </View>
        </View>
        
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalCoins}</Text>
            <Text style={styles.statLabel}>Монет</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.level}</Text>
            <Text style={styles.statLabel}>Уровень</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={handleSkins}>
          <Text style={styles.menuItemText}>Скины</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleAchievements}>
          <Text style={styles.menuItemText}>Достижения</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
          <Text style={styles.menuItemText}>Помощь</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
      </TouchableOpacity>

      {/* Skins Modal */}
      <Modal
        visible={skinsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSkinsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите цвет кубика</Text>
            
            <View style={styles.colorsGrid}>
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#FF6B35' }]}
                onPress={() => selectSkin('#FF6B35')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#4ECDC4' }]}
                onPress={() => selectSkin('#4ECDC4')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#FFE66D' }]}
                onPress={() => selectSkin('#FFE66D')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#E74C3C' }]}
                onPress={() => selectSkin('#E74C3C')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#9B59B6' }]}
                onPress={() => selectSkin('#9B59B6')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#3498DB' }]}
                onPress={() => selectSkin('#3498DB')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#2ECC71' }]}
                onPress={() => selectSkin('#2ECC71')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#1ABC9C' }]}
                onPress={() => selectSkin('#1ABC9C')}
              />
            </View>
            
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setSkinsModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: '#FF6B35',
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#FFE66D',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  statsContainer: {
    marginTop: -30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginLeft: 5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  menuContainer: {
    flex: 1,
    marginTop: 30,
    paddingHorizontal: 20,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    margin: 20,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  colorOption: {
    width: 70,
    height: 70,
    borderRadius: 15,
    margin: 8,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  closeModalButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
