import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { storage } from '../utils/storage';

const { width, height } = Dimensions.get('window');
const LANE_WIDTH = width / 3;
const PLAYER_SIZE = 60;
const OBSTACLE_SIZE = 50;
const COIN_SIZE = 40;

export default function GameScreen({ navigation }) {
  const [gameState, setGameState] = useState('ready'); // ready, playing, gameover
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('RU');
  const [playerColor, setPlayerColor] = useState('#FF6B35'); // Default orange
  const [soundEffects, setSoundEffects] = useState({});
  
  // Use refs for mutable values that don't trigger re-renders
  const playerLaneRef = useRef(1); // 0: left, 1: center, 2: right
  const playerYRef = useRef(height - 200);
  const obstaclesRef = useRef([]);
  const coinObjectsRef = useRef([]);
  const gameLoopRef = useRef(null);
  const speedRef = useRef(5);
  const gameStateRef = useRef('ready'); // Ref for immediate access
  const scoreRef = useRef(0); // Ref for current score
  const coinsRef = useRef(0); // Ref for current coins
  const distanceRef = useRef(0); // Ref for current distance
  
  // Initialize player at center lane (lane 1)
  const initialPlayerX = LANE_WIDTH * 1 + (LANE_WIDTH - PLAYER_SIZE) / 2;
  const [playerXAnim] = useState(new Animated.Value(initialPlayerX));
  const [obstaclesState, setObstaclesState] = useState([]);
  const [coinsState, setCoinsState] = useState([]);

  // Pan responder for swipe controls
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // More sensitive detection
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderGrant: (evt, gestureState) => {
        console.log('=== SWIPE STARTED ===');
        console.log('Touch location:', evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt, gestureState) => {
        console.log('Swipe moving - dx:', gestureState.dx, 'dy:', gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log('=== SWIPE RELEASED ===');
        console.log('Final dx:', gestureState.dx, 'gameState (ref):', gameStateRef.current);
        console.log('Is playing?', gameStateRef.current === 'playing');
        
        if (gameStateRef.current !== 'playing') {
          console.log('❌ NOT PLAYING - ignoring swipe');
          return;
        }
        
        // Horizontal swipe detection
        if (Math.abs(gestureState.dx) > 20) {
          console.log('Horizontal swipe detected!');
          
          if (gestureState.dx > 20) {
            // Swipe RIGHT
            console.log('👉 SWIPE RIGHT');
            if (playerLaneRef.current < 2) {
              playerLaneRef.current++;
              console.log('New lane:', playerLaneRef.current);
              animatePlayerMove();
            } else {
              console.log('Already at rightmost lane');
            }
          } else if (gestureState.dx < -20) {
            // Swipe LEFT
            console.log('👈 SWIPE LEFT');
            if (playerLaneRef.current > 0) {
              playerLaneRef.current--;
              console.log('New lane:', playerLaneRef.current);
              animatePlayerMove();
            } else {
              console.log('Already at leftmost lane');
            }
          }
        } else {
          console.log('Swipe too small, ignoring');
        }
      },
      onPanResponderTerminate: () => {
        console.log('Swipe terminated');
      },
    })
  ).current;

  const animatePlayerMove = () => {
    const targetX = playerLaneRef.current * LANE_WIDTH + (LANE_WIDTH - PLAYER_SIZE) / 2;
    console.log('Animating to lane:', playerLaneRef.current, 'target X:', targetX);
    
    Animated.spring(playerXAnim, {
      toValue: targetX,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start(() => {
      console.log('Animation completed, player at lane:', playerLaneRef.current);
    });
  };

  const togglePause = () => {
    if (gameStateRef.current === 'playing') {
      setPauseModalVisible(true);
      // Stop game loop
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }
  };

  const resumeGame = () => {
    setPauseModalVisible(false);
    gameStateRef.current = 'playing';
    setGameState('playing');
    // Restart game loop
    gameLoopRef.current = setInterval(gameLoop, 50);
  };

  const goToMenuFromPause = () => {
    setPauseModalVisible(false);
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    navigation.navigate('Home');
  };

  const openSettings = () => {
    setPauseModalVisible(false);
    setSettingsModalVisible(true);
  };

  const closeSettings = () => {
    setSettingsModalVisible(false);
    setPauseModalVisible(true);
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

  const playSound = async (soundName) => {
    if (!soundEnabled) return; // Don't play if sound is disabled
    
    try {
      const sound = soundEffects[soundName];
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log(`Error playing ${soundName}:`, error);
    }
  };

  const startGame = () => {
    console.log('=== GAME START INITIATED ===');
    playSound('jump'); // Play start sound
    setGameState('playing');
    gameStateRef.current = 'playing'; // Update ref immediately
    
    setScore(0);
    setCoins(0);
    setDistance(0);
    scoreRef.current = 0; // Reset ref
    coinsRef.current = 0; // Reset ref
    distanceRef.current = 0; // Reset ref
    obstaclesRef.current = [];
    coinObjectsRef.current = [];
    speedRef.current = 5;
    playerLaneRef.current = 1; // Center lane
    
    // Reset player position to center
    const centerX = LANE_WIDTH * 1 + (LANE_WIDTH - PLAYER_SIZE) / 2;
    playerXAnim.setValue(centerX);
    
    console.log('Player position reset to:', centerX);
    console.log('Player lane set to:', playerLaneRef.current);
    console.log('Game state (ref):', gameStateRef.current);
    console.log('Game state (state):', gameState);
    
    // Small delay to ensure state is updated
    setTimeout(() => {
      gameLoopRef.current = setInterval(gameLoop, 50);
      console.log('Game loop started');
    }, 100);
  };

  useEffect(() => {
    loadPlayerSkin();
    loadSoundEffects();
  }, []);

  const loadPlayerSkin = async () => {
    try {
      const skin = await storage.getItem('selectedSkin');
      if (skin) {
        console.log('Loaded player skin:', skin);
        setPlayerColor(skin);
      }
    } catch (error) {
      console.error('Error loading skin:', error);
    }
  };

  const loadSoundEffects = async () => {
    try {
      // Sound effects are optional - game works without them
      // Create dummy sound objects that do nothing
      setSoundEffects({ 
        jump: { replayAsync: async () => {} }, 
        coin: { replayAsync: async () => {} }, 
        crash: { replayAsync: async () => {} } 
      });
      console.log('Sound effects initialized (silent mode)');
    } catch (error) {
      console.log('Sound effects not available, using silent mode');
    }
  };

  const gameLoop = () => {
    // Increase distance
    setDistance(prev => prev + 1);
    setScore(prev => prev + 1);
    distanceRef.current += 1; // Update ref
    scoreRef.current += 1; // Update ref
    
    // Increase speed gradually (reduced by 3x)
    if (distanceRef.current % 500 === 0) {
      speedRef.current += 0.167; // Was 0.5, now 3x slower
    }
    
    // Spawn obstacles
    if (Math.random() < 0.02) {
      spawnObstacle();
    }
    
    // Spawn coins
    if (Math.random() < 0.05) {
      spawnCoin();
    }
    
    // Update obstacles
    updateObstacles();
    
    // Update coins
    updateCoins();
    
    // Check collisions
    checkCollisions();
  };

  const spawnObstacle = () => {
    const lane = Math.floor(Math.random() * 3);
    obstaclesRef.current.push({
      id: Date.now(),
      lane,
      y: -OBSTACLE_SIZE,
    });
  };

  const spawnCoin = () => {
    const lane = Math.floor(Math.random() * 3);
    const newCoin = {
      id: Date.now() + Math.random(),
      lane,
      y: -COIN_SIZE,
    };
    coinObjectsRef.current.push(newCoin);
    console.log('🪙 Coin spawned at lane', lane);
  };

  const updateObstacles = () => {
    obstaclesRef.current.forEach(obs => {
      obs.y += speedRef.current;
    });
    
    // Remove off-screen obstacles
    const filtered = obstaclesRef.current.filter(obs => obs.y < height);
    obstaclesRef.current = [];
    obstaclesRef.current.push(...filtered);
    
    setObstaclesState([...obstaclesRef.current]);
  };

  const updateCoins = () => {
    coinObjectsRef.current.forEach(coin => {
      coin.y += speedRef.current;
    });
    
    // Remove off-screen coins
    const filtered = coinObjectsRef.current.filter(coin => coin.y < height);
    coinObjectsRef.current = [];
    coinObjectsRef.current.push(...filtered);
    
    setCoinsState([...coinObjectsRef.current]);
  };

  const checkCollisions = () => {
    const playerRect = {
      x: playerLaneRef.current * LANE_WIDTH,
      y: playerYRef.current,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
    };

    // Check obstacle collision
    for (let obs of obstaclesRef.current) {
      if (obs.lane === playerLaneRef.current) {
        const obsRect = {
          x: obs.lane * LANE_WIDTH,
          y: obs.y,
          width: OBSTACLE_SIZE,
          height: OBSTACLE_SIZE,
        };
        
        if (isColliding(playerRect, obsRect)) {
          playSound('crash'); // Play crash sound
          gameOver();
          return;
        }
      }
    }

    // Check coin collision
    for (let i = coinObjectsRef.current.length - 1; i >= 0; i--) {
      const coin = coinObjectsRef.current[i];
      if (coin.lane === playerLaneRef.current) {
        const coinRect = {
          x: coin.lane * LANE_WIDTH,
          y: coin.y,
          width: COIN_SIZE,
          height: COIN_SIZE,
        };
        
        if (isColliding(playerRect, coinRect)) {
          console.log('💰 COIN COLLECTED! Lane:', playerLaneRef.current, 'Coin Y:', coin.y);
          coinObjectsRef.current.splice(i, 1);
          setCoins(prev => prev + 1);
          setScore(prev => prev + 10);
          coinsRef.current += 1; // Update ref
          scoreRef.current += 10; // Update ref
          playSound('coin'); // Play coin collection sound
        }
      }
    }
  };

  const isColliding = (rect1, rect2) => {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect1.x > rect2.x + rect2.width ||
      rect1.y + rect1.height < rect2.y ||
      rect1.y > rect2.y + rect2.height
    );
  };

  const gameOver = () => {
    console.log('=== GAME OVER ===');
    console.log('Final score (state):', score);
    console.log('Final coins (state):', coins);
    console.log('Final distance (state):', distance);
    console.log('Final score (ref):', scoreRef.current);
    console.log('Final coins (ref):', coinsRef.current);
    console.log('Final distance (ref):', distanceRef.current);
    
    setGameState('gameover');
    gameStateRef.current = 'gameover'; // Update ref immediately
    
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    
    // Save score to server using ref values
    console.log('Calling saveScore()...');
    saveScore(scoreRef.current, coinsRef.current, distanceRef.current);
  };

  const saveScore = async (finalScore, finalCoins, finalDistance) => {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        console.log('❌ No token found, skipping score save');
        return;
      }

      console.log('💾 Saving score:', { score: finalScore, coins: finalCoins, distance: finalDistance });
      
      // Save the score - this will also update user progress on server
      const response = await fetch('http://192.168.1.160:3000/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ score: finalScore, coins: finalCoins, distance: finalDistance }),
      });

      if (response.ok) {
        console.log('✅ Score saved successfully');
        const result = await response.json();
        console.log('Server response:', result);
        console.log('🎮 Game ended - score sent to server');
      } else {
        const errorData = await response.json();
        console.error('❌ Server error:', errorData);
      }
    } catch (error) {
      console.error('❌ Error saving score:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Game background */}
      <View style={styles.gameBackground}>
        {/* Lane markers */}
        <View style={styles.lane}>
          <View style={styles.laneMarker} />
        </View>
        <View style={styles.lane}>
          <View style={styles.laneMarker} />
        </View>
        <View style={styles.lane}>
          <View style={styles.laneMarker} />
        </View>
      </View>

      {gameState === 'playing' && (
        <>
          {/* Pause Button */}
          <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
            <Text style={styles.pauseButtonText}>⏸️</Text>
          </TouchableOpacity>

          {/* Player */}
          <Animated.View
            style={[
              styles.player,
              {
                backgroundColor: playerColor,
                transform: [{ translateX: playerXAnim }],
                top: playerYRef.current,
              },
            ]}
          />

          {/* Obstacles */}
          {obstaclesState.map(obs => (
            <View
              key={obs.id}
              style={[
                styles.obstacle,
                {
                  left: obs.lane * LANE_WIDTH + (LANE_WIDTH - OBSTACLE_SIZE) / 2,
                  top: obs.y,
                },
              ]}
            />
          ))}

          {/* Coins */}
          {coinsState.map(coin => (
            <View
              key={coin.id}
              style={[
                styles.coin,
                {
                  left: coin.lane * LANE_WIDTH + (LANE_WIDTH - COIN_SIZE) / 2,
                  top: coin.y,
                },
              ]}
            />
          ))}

          {/* HUD */}
          <View style={styles.hud}>
            <Text style={styles.hudText}>Счет: {score}</Text>
            <Text style={styles.hudText}>Монеты: {coins}</Text>
          </View>

          {/* Pause Modal */}
          <Modal
            visible={pauseModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setPauseModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>ПАУЗА</Text>
                
                <TouchableOpacity style={styles.modalButton} onPress={resumeGame}>
                  <Text style={styles.modalButtonText}>▶️ Продолжить</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.modalButton} onPress={openSettings}>
                  <Text style={styles.modalButtonText}>⚙️ Настройки</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.menuButtonModal]} 
                  onPress={goToMenuFromPause}
                >
                  <Text style={styles.modalButtonText}>🏠 В главное меню</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Settings Modal */}
          <Modal
            visible={settingsModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={closeSettings}
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
                  onPress={closeSettings}
                >
                  <Text style={styles.modalButtonText}>↩️ Обратно в меню</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}

      {gameState === 'ready' && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>SUBWAY RUNNER</Text>
          <Text style={styles.overlayText}>
            Свайп влево/вправо для движения
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>НАЧАТЬ</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'gameover' && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>ИГРА ОКОНЧЕНА</Text>
          <Text style={styles.overlayText}>Счет: {score}</Text>
          <Text style={styles.overlayText}>Монеты: {coins}</Text>
          <Text style={styles.overlayText}>Дистанция: {distance}м</Text>
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>ИГРАТЬ СНОВА</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.startButton, styles.menuButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.startButtonText}>В МЕНЮ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E50',
  },
  gameBackground: {
    flex: 1,
    flexDirection: 'row',
  },
  lane: {
    flex: 1,
    borderRightWidth: 2,
    borderColor: '#34495E',
  },
  laneMarker: {
    flex: 1,
    borderStyle: 'dashed',
    borderBottomWidth: 2,
    borderBottomColor: '#7F8C8D',
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
  obstacle: {
    position: 'absolute',
    width: OBSTACLE_SIZE,
    height: OBSTACLE_SIZE,
    backgroundColor: '#E74C3C',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#C0392B',
  },
  coin: {
    position: 'absolute',
    width: COIN_SIZE,
    height: COIN_SIZE,
    backgroundColor: '#FFE66D',
    borderRadius: COIN_SIZE / 2,
    borderWidth: 3,
    borderColor: '#F39C12',
  },
  hud: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pauseButton: {
    position: 'absolute',
    top: 40,
    left: width / 2 - 25, // Center horizontally
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pauseButtonText: {
    fontSize: 28,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 20,
  },
  overlayText: {
    fontSize: 18,
    color: '#fff',
    marginVertical: 5,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  menuButton: {
    backgroundColor: '#4ECDC4',
    marginTop: 10,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
  menuButtonModal: {
    backgroundColor: '#E74C3C',
  },
  backButtonModal: {
    backgroundColor: '#95a5a6',
  },
});
