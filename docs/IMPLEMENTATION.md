# РЕАЛИЗАЦИЯ ПРОТОТИПА ИС "SUBWAY RUNNER"

## 1. ИНТЕРФЕЙС РАЗРАБАТЫВАЕМОЙ ИС

### 1.1 Проектирование дизайн-системы

#### Цветовая гамма
Приложение использует яркую, контрастную цветовую палитру:

- **Основной оранжевый**: `#FF6B35` - энергия, движение
- **Бирюзовый**: `#4ECDC4` - свежесть, современность
- **Желтый**: `#FFE66D` - монеты, акценты
- **Темно-синий**: `#2C3E50` - фон игры
- **Красный**: `#E74C3C` - препятствия, опасность
- **Белый**: `#FFFFFF` - текст, элементы UI

#### Шрифты
- Системные шрифты платформы (San Francisco для iOS, Roboto для Android)
- Жирное начертание для заголовков
- Обычное для основного текста

#### Логотип
Текстовый логотип "SUBWAY RUNNER" с использованием двух цветов:
- SUBWAY - белый с тенью
- RUNNER - бирюзовый с тенью

#### Использование дизайн-систем
- Собственная дизайн-система на основе Material Design принципов
- Кнопки с тенями и скруглениями (border-radius: 10-15px)
- Карточки с elevation для Android и shadow для iOS

### 1.2 Макеты интерфейса системы (Wireframes)

**Метод:** Low-fidelity wireframes для быстрой итерации

**Инструмент:** Скетчи от руки → цифровые макеты в Figma

**Основные экраны:**
1. Экран входа/регистрации
2. Главное меню
3. Игровой экран
4. Таблица лидеров
5. Профиль пользователя

### 1.3 Макеты дизайна интерфейса (Figma)

**Ссылка на макет:** (предполагается наличие Figma файла)

**Ключевые визуальные элементы:**
- Градиентные фоны
- Объемные кнопки с тенями
- Анимированные переходы между экранами
- Иконки достижений и статистики

---

## 2. РАЗРАБОТКА СЕРВЕРНОЙ ЧАСТИ ИС

### 2.1 Структура проекта

```
SubwayRunner/
├── server/
│   ├── server.js          # Основной файл сервера
│   ├── package.json       # Зависимости Node.js
│   └── subway_runner.db   # База данных SQLite
├── src/
│   ├── screens/           # Экраны приложения
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   ├── GameScreen.js
│   │   ├── LeaderboardScreen.js
│   │   └── ProfileScreen.js
│   ├── services/          # API сервисы
│   │   └── api.js
│   ├── components/        # Переиспользуемые компоненты
│   └── utils/             # Утилиты
├── docs/                  # Документация
└── App.js                 # Точка входа
```

### 2.2 Управление базой данных

#### Диаграмма базы данных
```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│     USERS       │       │   GAME_SCORES    │       │  USER_PROGRESS  │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ id (PK)          │       │ id (PK)         │
│ username        │       │ user_id (FK)     │       │ user_id (FK)    │
│ email           │       │ score            │       │ level           │
│ password        │       │ coins            │       │ total_coins     │
│ created_at      │       │ distance         │       │ unlocked_chars  │
└─────────────────┘       │ created_at       │       │ last_played     │
                          └──────────────────┘       └─────────────────┘
```

#### Пример создания таблиц

```sql
-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица игровых счетов
CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  coins INTEGER NOT NULL,
  distance INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Таблица прогресса
CREATE TABLE IF NOT EXISTS user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  total_coins INTEGER DEFAULT 0,
  unlocked_characters TEXT DEFAULT '["default"]',
  last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Примеры запросов

**Запрос 1: Получить топ-10 игроков**
```sql
SELECT u.username, MAX(gs.score) as high_score, 
       SUM(gs.coins) as total_coins
FROM game_scores gs
JOIN users u ON gs.user_id = u.id
GROUP BY gs.user_id
ORDER BY high_score DESC
LIMIT 10;
```

**Запрос 2: Сохранить результат игры**
```sql
INSERT INTO game_scores (user_id, score, coins, distance) 
VALUES (?, ?, ?, ?);
```

**Запрос 3: Обновить прогресс пользователя**
```sql
UPDATE user_progress 
SET total_coins = total_coins + ?, 
    last_played = CURRENT_TIMESTAMP 
WHERE user_id = ?;
```

### 2.3 Спецификация API

| Название | Получить список товаров |
|----------|------------------------|
| Описание | Возвращает полный список товаров каталога |
| Тип запроса | GET |
| Endpoint | /getProducts |
| Тело запроса | - |

**Реальные эндпоинты нашего API:**

#### 1. Регистрация пользователя
| Название | Регистрация пользователя |
|----------|-------------------------|
| Описание | Создание нового аккаунта |
| Тип запроса | POST |
| Endpoint | /api/register |
| Тело запроса | `{"username": "string", "email": "string", "password": "string"}` |

#### 2. Вход в систему
| Название | Аутентификация пользователя |
|----------|----------------------------|
| Описание | Проверка учетных данных и выдача токена |
| Тип запроса | POST |
| Endpoint | /api/login |
| Тело запроса | `{"email": "string", "password": "string"}` |

#### 3. Сохранение результата
| Название | Сохранение результата игры |
|----------|---------------------------|
| Описание | Запись результатов игровой сессии |
| Тип запроса | POST |
| Endpoint | /api/scores |
| Тело запроса | `{"score": number, "coins": number, "distance": number}` |

#### 4. Получение таблицы лидеров
| Название | Получить таблицу лидеров |
|----------|-------------------------|
| Описание | Возвращает топ-10 игроков |
| Тип запроса | GET |
| Endpoint | /api/leaderboard |
| Тело запроса | - |

#### 5. Получение прогресса пользователя
| Название | Получить прогресс пользователя |
|----------|-------------------------------|
| Описание | Возвращает статистику и прогресс |
| Тип запроса | GET |
| Endpoint | /api/progress |
| Тело запроса | - |

### 2.4 Разработка кодовой базы

#### Пример ответа на запрос по эндпоинту

**POST /api/login - успешный ответ:**
```javascript
{
  message: 'Login successful',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  user: {
    id: 1,
    username: 'TestUser',
    email: 'test@example.com'
  }
}
```

#### Модели данных

**Модель User:**
```javascript
{
  id: 1,
  username: "TestUser",
  email: "test@example.com",
  password: "$2a$10$N9qo8uLOickgx2ZMRZoMye...", // хешированный
  created_at: "2025-03-26T12:00:00.000Z"
}
```

**Модель GameScore:**
```javascript
{
  id: 1,
  user_id: 1,
  score: 1500,
  coins: 25,
  distance: 500,
  created_at: "2025-03-26T12:30:00.000Z"
}
```

#### Пример подключения к базе данных

```javascript
const sqlite3 = require('sqlite3').verbose();

// Подключение к БД
const db = new sqlite3.Database('./subway_runner.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Инициализация таблиц
function initializeDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS users (...);`);
  db.run(`CREATE TABLE IF NOT EXISTS game_scores (...);`);
  db.run(`CREATE TABLE IF NOT EXISTS user_progress (...);`);
}
```

### 2.5 Тестирование серверной части

#### Таблица тест-кейсов для API

| № | Эндпоинт | Метод | Описание | Ожидаемый статус |
|---|----------|-------|----------|------------------|
| 1 | /api/register | POST | Успешная регистрация | 201 |
| 2 | /api/register | POST | Существующий email | 400 |
| 3 | /api/login | POST | Верные данные | 200 |
| 4 | /api/login | POST | Неверный пароль | 401 |
| 5 | /api/scores | POST | Сохранение счета (с токеном) | 201 |
| 6 | /api/scores | POST | Без токена | 401 |
| 7 | /api/leaderboard | GET | Получение лидеров | 200 |
| 8 | /api/progress | GET | Прогресс пользователя | 200 |

#### Результаты тестирования в Postman

**Пример запроса регистрации:**
```bash
POST http://localhost:3000/api/register
Content-Type: application/json

{
  "username": "TestUser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Результат:** ✅ Статус 201 Created

**Пример запроса входа:**
```bash
POST http://localhost:3000/api/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Результат:** ✅ Статус 200 OK, получен токен

### 2.6 Инструкция по развертыванию серверной части

**Шаг 1:** Установите Node.js (если не установлен)
- Скачайте с https://nodejs.org
- Версия 14.x или выше

**Шаг 2:** Перейдите в директорию сервера
```bash
cd SubwayRunner/server
```

**Шаг 3:** Установите зависимости
```bash
npm install
```

**Шаг 4:** Запустите сервер
```bash
npm start
```

**Шаг 5:** Проверьте работу
Откройте браузер: http://localhost:3000/api

**Сервер запущен!** 🟢

---

## 3. РАЗРАБОТКА КЛИЕНТСКОЙ ЧАСТИ ИС

### 3.1 Структура проекта клиентской части

```
src/
├── screens/
│   ├── LoginScreen.js      # Экран входа
│   ├── RegisterScreen.js   # Экран регистрации
│   ├── HomeScreen.js       # Главное меню
│   ├── GameScreen.js       # Игровой экран
│   ├── LeaderboardScreen.js# Таблица лидеров
│   └── ProfileScreen.js    # Профиль
├── services/
│   └── api.js              # API клиент
├── components/             # Компоненты
└── utils/                  # Утилиты
```

### 3.2 Применение дизайн-системы

**Использованные принципы:**
- Material Design гайдлайны
- Flat design с элементами skeuomorphism
- Яркие акценты для интерактивных элементов

**Примеры реализованных элементов:**

**Кнопка с тенью:**
```javascript
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, // для Android
  },
});
```

**Карточка игрока:**
```javascript
playerCard: {
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
}
```

### 3.3 Интеграция с серверной частью

**Описание подключения:**
- REST API через HTTP/HTTPS
- Axios для HTTP запросов
- JWT токены в заголовках Authorization
- JSON формат данных

**Пример запроса к серверу:**

```javascript
// Сохранение результата игры
const saveScore = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const response = await fetch('http://192.168.1.129:3000/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        score: 1500, 
        coins: 25, 
        distance: 500 
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Score saved successfully');
    }
  } catch (error) {
    console.error('Error saving score:', error);
  }
};
```

**Пример обработки ответа:**

```javascript
// Обработка ответа от API login
const handleLogin = async () => {
  const response = await fetch('http://192.168.1.129:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Сохраняем токен и пользователя
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    
    // Переходим на главный экран
    navigation.replace('Home');
  } else {
    // Показываем ошибку
    Alert.alert('Ошибка', data.error || 'Не удалось войти');
  }
};
```

### 3.4 Тестирование клиентской части

#### Таблица тест-кейсов

| № | Экран | Действие | Ожидаемый результат |
|---|-------|----------|---------------------|
| 1 | Login | Ввод верных данных | Переход на Home |
| 2 | Login | Ввод неверных данных | Сообщение об ошибке |
| 3 | Register | Все поля заполнены | Успешная регистрация |
| 4 | Register | Пароли не совпадают | Ошибка валидации |
| 5 | Home | Нажатие "ИГРАТЬ" | Переход на GameScreen |
| 6 | Game | Свайп влево | Перемещение влево |
| 7 | Game | Столкновение | Экран GameOver |
| 8 | Leaderboard | Открытие | Список игроков |

#### Результаты тестирования

**Тест-кейс: Сбор монеты**
- Предусловие: Игра активна
- Действие: Персонаж достигает монеты
- Результат: ✅ Монета исчезает, счет увеличивается

**Тест-кейс: Препятствие**
- Предусловие: Игра активна
- Действие: Столкновение с препятствием
- Результат: ✅ Игра окончена, показан финальный счет

### 3.5 Инструкция по развёртыванию клиентской части

**Шаг 1:** Установите Expo CLI
```bash
npm install -g expo-cli
```

**Шаг 2:** Перейдите в корень проекта
```bash
cd SubwayRunner
```

**Шаг 3:** Установите зависимости
```bash
npm install
```

**Шаг 4:** Настройте IP-адрес сервера
В файлах `src/services/api.js` и экранах замените IP на ваш:
```javascript
const API_BASE_URL = 'http://192.168.1.129:3000/api';
```

**Шаг 5:** Запустите приложение
```bash
npx expo start
```

**Шаг 6:** Выберите способ запуска:
- Нажмите `a` для Android эмулятора
- Нажмите `i` для iOS симулятора
- Отсканируйте QR-код в Expo Go

**Приложение запущено!** 🟢

---

## 4. ЗАКЛЮЧЕНИЕ

Разработан полнофункциональный прототип мобильного приложения "Subway Runner" с:
- ✅ Серверной частью на Node.js + Express
- ✅ Базой данных SQLite
- ✅ Клиентской частью на React Native (Expo)
- ✅ Системой аутентификации
- ✅ Игровым процессом в стиле Subway Surfers
- ✅ Онлайн-таблицей лидеров
- ✅ Полной документацией

Приложение готово к дальнейшему развитию и публикации в магазинах приложений.
