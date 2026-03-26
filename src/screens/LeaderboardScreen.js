import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('http://192.168.1.160:3000/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Set empty array if server is not reachable
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const renderLeaderboardItem = ({ item, index }) => (
    <View style={[styles.playerCard, index === 0 && styles.firstPlace]}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, index === 0 && styles.firstRank]}>
          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
        </Text>
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.username}</Text>
        <Text style={styles.playerStats}>
          Монет: {item.total_coins || 0}
        </Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={styles.highScore}>{item.high_score}</Text>
        <Text style={styles.scoreLabel}>очков</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Загрузка таблицы лидеров...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item, index) => index.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Таблица лидеров пуста</Text>
            <Text style={styles.emptySubtext}>
              Будьте первыми!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstPlace: {
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#FFE66D',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
  },
  firstRank: {
    fontSize: 32,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  playerStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  highScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
  },
});
