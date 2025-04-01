const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.stack);
    return;
  }
  console.log('Успешно подключились к базе данных');
  release();
});

app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Прокси для TMDB
app.get('/api/tmdb/*', async (req, res) => {
  try {
    const tmdbPath = req.url.replace('/api/tmdb/', '');
    const tmdbUrl = `https://api.themoviedb.org/3/${tmdbPath}&api_key=${TMDB_API_KEY}`;
    console.log(`Proxying request to TMDB: ${tmdbUrl}`);

    const response = await axios.get(tmdbUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('TMDB Proxy Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    res.status(error.response?.status || 500).json({
      error: error.response ? error.response.data : error.message,
    });
  }
});

// Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, is_admin } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, is_admin, avatar) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, hashedPassword, is_admin || false, 'https://via.placeholder.com/100?text=User']
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, process.env.JWT_SECRET);
    console.log('Register response user:', { ...user, avatar_url: user.avatar });
    res.status(201).json({ user: { ...user, avatar_url: user.avatar }, token });
  } catch (error) {
    console.error('Ошибка при регистрации:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Логин
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, process.env.JWT_SECRET);
    console.log('Login response user:', { ...user, avatar_url: user.avatar });
    res.json({ user: { ...user, avatar_url: user.avatar }, token });
  } catch (error) {
    console.error('Ошибка при логине:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Получить все фильмы
app.get('/api/movies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении фильмов:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Получить фильм по tmdb_id
app.get('/api/movies/:tmdb_id', async (req, res) => {
  try {
    const { tmdb_id } = req.params;
    const result = await pool.query('SELECT * FROM movies WHERE tmdb_id = $1', [tmdb_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении фильма:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Добавить фильм
app.post('/api/movies', async (req, res) => {
  try {
    const { tmdb_id, title, poster_path, genre_ids, hashtags } = req.body;
    const result = await pool.query(
      'INSERT INTO movies (tmdb_id, title, poster_path, genre_ids, hashtags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [tmdb_id, title, poster_path, genre_ids, hashtags]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при добавлении фильма:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Обновить фильм
app.put('/api/movies/:tmdb_id', async (req, res) => {
  try {
    const { tmdb_id } = req.params;
    const { title, poster_path, genre_ids, hashtags } = req.body;
    const result = await pool.query(
      'UPDATE movies SET title = $1, poster_path = $2, genre_ids = $3, hashtags = $4 WHERE tmdb_id = $5 RETURNING *',
      [title, poster_path, genre_ids, hashtags, tmdb_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении фильма:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Удалить все фильмы
app.delete('/api/movies', async (req, res) => {
  try {
    await pool.query('DELETE FROM movies');
    res.status(200).json({ message: 'All movies deleted' });
  } catch (error) {
    console.error('Ошибка при удалении фильмов:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Получить избранное пользователя
app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching favorites for user:', userId);
    const result = await pool.query(
      'SELECT m.* FROM favorites f JOIN movies m ON f.movie_id = m.tmdb_id WHERE f.user_id = $1',
      [userId]
    );
    console.log('Favorites fetched:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении избранного:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Добавить фильм в избранное
app.post('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { movie_id } = req.body;
    console.log('Adding to favorites:', { userId, movie_id });
    const result = await pool.query(
      'INSERT INTO favorites (user_id, movie_id) VALUES ($1, $2) RETURNING *',
      [userId, movie_id]
    );
    console.log('Added to favorites:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при добавлении в избранное:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Удалить фильм из избранного
app.delete('/api/favorites/:movie_id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { movie_id } = req.params;
    console.log('Deleting favorite:', { userId, movie_id });
    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND movie_id = $2 RETURNING *',
      [userId, Number(movie_id)]
    );
    if (result.rowCount === 0) {
      console.log('Favorite not found for:', { userId, movie_id });
      return res.status(404).json({ error: 'Favorite not found' });
    }
    console.log('Deleted from favorites:', result.rows[0]);
    res.status(200).json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Ошибка при удалении из избранного:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Добавить просмотр
app.post('/api/views', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { movie_id } = req.body;
    const result = await pool.query(
      'INSERT INTO views (user_id, movie_id) VALUES ($1, $2) RETURNING *',
      [userId, movie_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при добавлении просмотра:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Получить просмотры пользователя
app.get('/api/views', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT * FROM views WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении просмотров:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Получить отзывы
app.get('/api/reviews', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviews');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении отзывов:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Добавить отзыв
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { movie_id, text } = req.body;
    const result = await pool.query(
      'INSERT INTO reviews (user_id, movie_id, text) VALUES ($1, $2, $3) RETURNING *',
      [userId, movie_id, text]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при добавлении отзыва:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Обновить отзыв
app.put('/api/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { text } = req.body;
    const result = await pool.query(
      'UPDATE reviews SET text = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [text, id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to edit this review' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении отзыва:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Удалить отзыв
app.delete('/api/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }
    res.status(200).json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Ошибка при удалении отзыва:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});