import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
} from 'react-native';

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('Игрок');
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('RU');

  useEffect(() => {
    // Load user info (simplified for demo)
    setUserName('Игрок');
  }, []);

  const handleSettings = () => {
    setSettingsModalVisible(true);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    Alert.alert('Звук', !soundEnabled ? 'Звук включен' : 'Звук выключен');
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    Alert.alert('Уведомления', !notificationsEnabled ? 'Уведомления включены' : 'Уведомления выключены');
  };

  const changeLanguage = () => {
    const newLang = language === 'RU' ? 'EN' : 'RU';
    setLanguage(newLang);
    Alert.alert('Язык', `Язык изменен на ${newLang === 'RU' ? 'Русский' : 'English'}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Привет, {userName}!</Text>
      </View>

      <View style={styles.logoContainer}>
        <Text style={styles.gameTitle}>SUBWAY</Text>
        <Text style={styles.gameTitle2}>RUNNER</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={[styles.menuButton, styles.playButton]}
          onPress={() => navigation.navigate('Game')}
        >
          <Text style={styles.menuButtonText}>ИГРАТЬ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.leaderboardButton]}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.menuButtonText}>ТАБЛИЦА ЛИДЕРОВ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.profileButton]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.menuButtonText}>ПРОФИЛЬ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.settingsButton]}
          onPress={handleSettings}
        >
          <Text style={styles.menuButtonText}>НАСТРОЙКИ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>НАСТРОЙКИ</Text>
            
            <TouchableOpacity style={styles.modalButton} onPress={toggleSound}>
              <Text style={styles.modalButtonText}>
                🔊 Звук: {soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalButton} onPress={toggleNotifications}>
              <Text style={styles.modalButtonText}>
                🔔 Уведомления: {notificationsEnabled ? 'ВКЛ' : 'ВЫКЛ'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalButton} onPress={changeLanguage}>
              <Text style={styles.modalButtonText}>
                🌐 Язык: {language === 'RU' ? 'Русский' : 'English'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.backButtonModal]} 
              onPress={() => setSettingsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>↩️ Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  gameTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  gameTitle2: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4ECDC4',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginTop: -10,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  menuButton: {
    width: '70%',
    padding: 20,
    marginVertical: 10,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  playButton: {
    backgroundColor: '#FFE66D',
  },
  leaderboardButton: {
    backgroundColor: '#4ECDC4',
  },
  profileButton: {
    backgroundColor: '#F7FFF7',
  },
  settingsButton: {
    backgroundColor: '#9B59B6',
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 12,
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
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 30,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#FF6B35',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButtonModal: {
    backgroundColor: '#95a5a6',
  },
});
