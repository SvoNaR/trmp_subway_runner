const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'subway_runner_secret_key_2025';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./subway_runner.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    coins INTEGER NOT NULL,
    distance INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    level INTEGER DEFAULT 1,
    total_coins INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    high_score INTEGER DEFAULT 0,
    unlocked_characters TEXT DEFAULT '["default"]',
    last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  console.log('Database tables initialized');
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// API Routes

// Registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }

        // Create initial user progress
        db.run(
          'INSERT INTO user_progress (user_id) VALUES (?)',
          [this.lastID]
        );

        res.status(201).json({ 
          message: 'Registration successful',
          userId: this.lastID 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        SECRET_KEY,
        { expiresIn: '24h' }
      );

      res.json({ 
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Save game score
app.post('/api/scores', authenticateToken, (req, res) => {
  try {
    const { score, coins, distance } = req.body;
    const userId = req.user.id;

    console.log('💾 Saving score for user', userId, ':', { score, coins, distance });

    db.run(
      'INSERT INTO game_scores (user_id, score, coins, distance) VALUES (?, ?, ?, ?)',
      [userId, score, coins, distance],
      function(err) {
        if (err) {
          console.error('❌ Error inserting score:', err);
          return res.status(500).json({ error: 'Failed to save score' });
        }

        console.log('✅ Score inserted with ID:', this.lastID);

        // Update user progress
        db.run(
          `UPDATE user_progress 
           SET total_coins = total_coins + ?, 
               total_games = total_games + 1,
               high_score = CASE WHEN ? > high_score THEN ? ELSE high_score END,
               level = 1 + FLOOR(total_games / 10),
               last_played = CURRENT_TIMESTAMP 
           WHERE user_id = ?`,
          [coins, score, score, userId],
          function(err) {
            if (err) {
              console.error('❌ Error updating progress:', err);
              return res.status(500).json({ error: 'Failed to update progress' });
            }
            
            console.log('✅ Progress updated for user', userId);
            console.log('   - Coins added:', coins);
            console.log('   - Total games:', this.changes);
          }
        );

        res.status(201).json({ 
          message: 'Score saved successfully',
          scoreId: this.lastID 
        });
      }
    );
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user scores
app.get('/api/scores', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    db.all(
      'SELECT * FROM game_scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId],
      (err, scores) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to retrieve scores' });
        }
        res.json(scores);
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  try {
    db.all(
      `SELECT u.username, 
              MAX(gs.score) as high_score, 
              COALESCE(SUM(gs.coins), 0) as total_coins,
              COUNT(gs.id) as games_played
       FROM users u
       LEFT JOIN game_scores gs ON u.id = gs.user_id
       GROUP BY u.id, u.username
       HAVING MAX(gs.score) IS NOT NULL
       ORDER BY high_score DESC
       LIMIT 10`,
      (err, leaderboard) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to retrieve leaderboard' });
        }
        console.log('Leaderboard results:', leaderboard);
        res.json(leaderboard);
      }
    );
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user progress
app.get('/api/progress', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    console.log('📡 Getting progress for user', userId);

    db.get('SELECT * FROM user_progress WHERE user_id = ?', [userId], (err, progress) => {
      if (err) {
        console.error('❌ Error getting progress:', err);
        return res.status(500).json({ error: 'Failed to retrieve progress' });
      }
      
      console.log('💾 Progress data:', progress);
      res.json(progress || {});
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;
