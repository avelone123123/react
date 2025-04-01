import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import Profile from './components/Profile';
import './App.css';

const BASE_URL = 'http://localhost:5000/api';
const API_KEY = process.env.REACT_APP_TMDB_API_KEY || '1009a9a225731a2a666e6fbb66e35cd0';

// Задержка между запросами
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Функция для повторных попыток с обработкой 429
const fetchWithRetry = async (url, retries = 3, delayMs = 2000, onRetry) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url);
      return response;
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`Rate limit exceeded, retrying (${i + 1}/${retries})...`);
        if (onRetry) onRetry(i + 1);
        await delay(delayMs * (i + 1));
      } else if (i === retries - 1) {
        throw error;
      }
      console.log(`Request failed: ${error.message}, retrying (${i + 1}/${retries})...`);
      await delay(delayMs);
    }
  }
};

const genres = [
  { id: 28, name: { en: 'Action', ru: 'Экшен' } },
  { id: 12, name: { en: 'Adventure', ru: 'Приключения' } },
  { id: 16, name: { en: 'Animation', ru: 'Анимация' } },
  { id: 35, name: { en: 'Comedy', ru: 'Комедия' } },
  { id: 80, name: { en: 'Crime', ru: 'Криминал' } },
  { id: 99, name: { en: 'Documentary', ru: 'Документальный' } },
  { id: 18, name: { en: 'Drama', ru: 'Драма' } },
  { id: 10751, name: { en: 'Family', ru: 'Семейный' } },
  { id: 14, name: { en: 'Fantasy', ru: 'Фэнтези' } },
  { id: 36, name: { en: 'History', ru: 'Исторический' } },
  { id: 27, name: { en: 'Horror', ru: 'Ужасы' } },
  { id: 10402, name: { en: 'Music', ru: 'Музыкальный' } },
  { id: 9648, name: { en: 'Mystery', ru: 'Мистика' } },
  { id: 10749, name: { en: 'Romance', ru: 'Романтика' } },
  { id: 878, name: { en: 'Science Fiction', ru: 'Научная фантастика' } },
  { id: 10770, name: { en: 'TV Movie', ru: 'ТВ-фильм' } },
  { id: 53, name: { en: 'Thriller', ru: 'Триллер' } },
  { id: 10752, name: { en: 'War', ru: 'Военный' } },
  { id: 37, name: { en: 'Western', ru: 'Вестерн' } },
];

const genreToHashtag = {
  28: '#action',
  12: '#adventure',
  16: '#animation',
  35: '#comedy',
  80: '#crime',
  99: '#documentary',
  18: '#drama',
  10751: '#family',
  14: '#fantasy',
  36: '#history',
  27: '#horror',
  10402: '#music',
  9648: '#mystery',
  10749: '#romance',
  878: '#scifi',
  10770: '#tvmovie',
  53: '#thriller',
  10752: '#war',
  37: '#western',
};

function App() {
  const { t, i18n } = useTranslation();
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [category, setCategory] = useState(27);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
    const token = localStorage.getItem('token');

    console.log('Stored user from localStorage:', storedUser);

    if (storedUser && token) {
      setUser(storedUser);
      setIsAdmin(storedIsAdmin);
    } else {
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('token');
    }

    setTimeout(() => {
      setIsAppLoading(false);
    }, 2000);
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    setErrorMessage('');
    setRetryCount(0);

    const cacheKey = `movies_${category}_${i18n.language}`;
    const cachedData = JSON.parse(localStorage.getItem(cacheKey));
    const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
    const cacheExpiration = 60 * 60 * 1000; // 1 час

    if (cachedData && cacheTimestamp && (Date.now() - cacheTimestamp < cacheExpiration)) {
      console.log('Using cached movies:', cachedData);
      setMovies(cachedData);
      setFilteredMovies(cachedData);
      setLoading(false);
      return;
    }

    try {
      console.log(`Fetching movies for genre ID: ${category}, language: ${i18n.language}`);
      const url = `${BASE_URL}/tmdb/discover/movie?with_genres=${category}&language=${i18n.language}-US`;
      console.log(`Request URL: ${url}`);
      const tmdbResponse = await fetchWithRetry(url, 3, 2000, setRetryCount);
      console.log('TMDB Response:', tmdbResponse.data);

      if (!tmdbResponse.data.results) {
        throw new Error('No results from TMDB.');
      }

      let localMovies = tmdbResponse.data.results || [];
      localMovies = localMovies.map(movie => ({
        ...movie,
        hashtags: movie.genre_ids ? movie.genre_ids.map(genreId => genreToHashtag[genreId] || '#unknown') : [],
      }));

      await axios.delete(`${BASE_URL}/movies`);
      for (const movie of localMovies) {
        await axios.post(`${BASE_URL}/movies`, {
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          genre_ids: movie.genre_ids,
          hashtags: movie.hashtags,
        });
        await delay(500);
      }

      setMovies(localMovies || []);
      setFilteredMovies(localMovies || []);

      localStorage.setItem(cacheKey, JSON.stringify(localMovies));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now());
    } catch (error) {
      console.error('Detailed error:', error.response ? error.response.data : error.message);
      try {
        const localMoviesResponse = await axios.get(`${BASE_URL}/movies`);
        let localMovies = localMoviesResponse.data || [];
        localMovies = localMovies.filter(movie => movie.genre_ids.includes(category));
        setMovies(localMovies);
        setFilteredMovies(localMovies);
        if (localMovies.length === 0) {
          setErrorMessage(t('noMovies'));
        } else {
          setErrorMessage(t('failedToFetchTMDBShowingCached'));
        }
      } catch (dbError) {
        console.error('Ошибка при загрузке из базы:', dbError.message);
        setErrorMessage(`Failed to connect to TMDB API: ${error.message}. Please check your network connection or try again later.`);
        setMovies([]);
        setFilteredMovies([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshMovies = async () => {
    const cacheKey = `movies_${category}_${i18n.language}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_timestamp`);
    await fetchMovies();
  };

  useEffect(() => {
    fetchMovies();

    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/reviews`);
        setReviews(response.data || []);
      } catch (error) {
        console.error('Ошибка при загрузке отзывов:', error.message);
        setReviews([]);
      }
    };

    const fetchFavorites = async () => {
      if (user) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${BASE_URL}/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Fetched favorites on load:', response.data);
          setFavorites(response.data || []);
        } catch (error) {
          console.error('Ошибка при загрузке избранного:', error.message);
          setFavorites([]);
        }
      }
    };

    fetchReviews();
    fetchFavorites();
  }, [category, i18n.language, user, t]);

  useEffect(() => {
    const searchMovies = async () => {
      if (!searchQuery) {
        setSearchResults([]);
        let filtered = movies || [];
        if (minRating > 0) {
          filtered = filtered.filter(movie => movie.vote_average >= minRating);
        }
        setFilteredMovies(filtered || []);
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/movies`);
        let allMovies = response.data || [];

        const query = searchQuery.toLowerCase();
        const filtered = allMovies.filter(movie => {
          const matchesTitle = movie.title?.toLowerCase().includes(query);
          const matchesHashtag = movie.hashtags?.some(hashtag => hashtag.toLowerCase().includes(query));
          return matchesTitle || matchesHashtag;
        });

        if (minRating > 0) {
          filtered = filtered.filter(movie => movie.vote_average >= minRating);
        }

        setSearchResults(filtered || []);
      } catch (error) {
        console.error('Ошибка при поиске фильмов:', error.message);
        setSearchResults([]);
      }
    };

    searchMovies();
  }, [searchQuery, minRating, movies]);

  const fetchTrailer = async (movieId) => {
    try {
      const url = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}&language=${i18n.language}-US`;
      const response = await fetchWithRetry(url, 3, 2000);
      const trailer = response.data.results?.find(video => video.type === 'Trailer' && video.site === 'YouTube');
      setTrailerKey(trailer ? trailer.key : null);
    } catch (error) {
      console.error('Ошибка при загрузке трейлера:', error.message);
      setTrailerKey(null);
    }
  };

  const handleMovieClick = async (movie, fromSearch = false) => {
    if (fromSearch && movie.genre_ids && movie.genre_ids.length > 0) {
      const newCategory = movie.genre_ids[0];
      setCategory(newCategory);
      setSearchQuery('');
      setSearchResults([]);
    }

    setSelectedMovie(movie);
    fetchTrailer(movie.id);
    if (user) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          `${BASE_URL}/views`,
          { movie_id: movie.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Ошибка при записи просмотра:', error.message);
      }
    }
  };

  const closeModal = () => {
    setSelectedMovie(null);
    setTrailerKey(null);
    setNewReview('');
    setEditingReview(null);
  };

  const handleSaveChanges = async (movieId, newTitle, newImageUrl, newGenre) => {
    try {
      const updatedMovie = movies.find(movie => movie.id === movieId);
      updatedMovie.title = newTitle;
      updatedMovie.poster_path = newImageUrl;
      updatedMovie.genre_ids = [Number(newGenre)];
      updatedMovie.hashtags = [genreToHashtag[Number(newGenre)] || '#unknown'];

      await axios.put(`${BASE_URL}/movies/${movieId}`, updatedMovie);

      setMovies(movies.map(movie => (movie.id === movieId ? updatedMovie : movie)));
      setFilteredMovies(filteredMovies.map(movie => (movie.id === movieId ? updatedMovie : movie)));
      alert(t('changesSaved'));
    } catch (error) {
      console.error('Ошибка при сохранении изменений:', error.message);
      alert(t('errorSaving'));
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleRandomMovie = () => {
    if (filteredMovies?.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredMovies.length);
      handleMovieClick(filteredMovies[randomIndex]);
    }
  };

  const toggleFavorite = async (movie) => {
    if (!user) {
      alert(t('pleaseLogin'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const movieId = Number(movie.id); // Убедимся, что movie.id — это число
      console.log('Toggling favorite for movie ID:', movieId);
      console.log('Current favorites:', favorites);

      // Проверяем, есть ли фильм в избранном
      const isFavorite = favorites.some(fav => Number(fav.tmdb_id) === movieId);
      console.log('Is movie in favorites?', isFavorite);

      if (isFavorite) {
        // Удаляем из избранного
        console.log('Removing from favorites:', movieId);
        await axios.delete(`${BASE_URL}/favorites/${movieId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Successfully removed from favorites');
      } else {
        // Добавляем в избранное
        console.log('Adding to favorites:', movieId);
        await axios.post(
          `${BASE_URL}/favorites`,
          { movie_id: movieId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Successfully added to favorites');
      }

      // Обновляем список избранного
      const response = await axios.get(`${BASE_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedFavorites = response.data || [];
      setFavorites(updatedFavorites);
      console.log('Updated favorites:', updatedFavorites);

      // Обновляем searchResults, чтобы отразить изменение статуса избранного
      setSearchResults(prevResults =>
        prevResults.map(result =>
          Number(result.id) === movieId ? { ...result, isFavorite: !isFavorite } : result
        )
      );
    } catch (error) {
      console.error('Ошибка при обновлении избранного:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAdmin');
        setUser(null);
        setIsAdmin(false);
      }
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(t('pleaseLogin'));
      return;
    }
    if (!newReview.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const review = {
        movie_id: selectedMovie.id,
        text: newReview,
      };
      const response = await axios.post(`${BASE_URL}/reviews`, review, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews([...reviews, response.data]);
      setNewReview('');
    } catch (error) {
      console.error('Ошибка при добавлении отзыва:', error.message);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setNewReview(review.text);
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!newReview.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const updatedReview = { text: newReview };
      const response = await axios.put(`${BASE_URL}/reviews/${editingReview.id}`, updatedReview, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(reviews.map(r => (r.id === editingReview.id ? response.data : r)));
      setNewReview('');
      setEditingReview(null);
    } catch (error) {
      console.error('Ошибка при обновлении отзыва:', error.message);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BASE_URL}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error('Ошибка при удалении отзыва:', error.message);
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsLangDropdownOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div className={`App ${theme}`}>
        {isAppLoading ? (
          <div className="preloader">
            <motion.div
              className="preloader-spinner"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
            <p>{t('loadingApp')}</p>
          </div>
        ) : (
          <>
            <nav className="navbar">
              <div className="navbar-left">
                <Link to="/" className="logo">
                  <span role="img" aria-label="movie">🎬</span> {t('appName')}
                </Link>
                <button onClick={toggleSidebar} className="sidebar-toggle">
                  {isSidebarOpen ? '◄' : '►'}
                </button>
              </div>
              <div className="navbar-right">
                <div className="theme-toggle">
                  <button onClick={toggleTheme} title={theme === 'dark' ? t('lightTheme') : t('darkTheme')}>
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>
                </div>
                <div className="lang-toggle">
                  <button onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}>
                    {i18n.language.toUpperCase()} ▼
                  </button>
                  {isLangDropdownOpen && (
                    <div className="lang-dropdown">
                      <button onClick={() => changeLanguage('en')}>EN</button>
                      <button onClick={() => changeLanguage('ru')}>RU</button>
                    </div>
                  )}
                </div>
                {user ? (
                  <Link to="/profile" className="user-profile">
                    <img
                      src={user.avatar_url || 'https://via.placeholder.com/30?text=User'}
                      alt="User Avatar"
                      className="user-avatar"
                    />
                    <span>{user.username}</span>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">{t('login')}</Link> | <Link to="/register">{t('register')}</Link>
                  </>
                )}
              </div>
            </nav>
            <motion.div
              className="sidebar"
              animate={{ x: isSidebarOpen ? 0 : -200 }}
              transition={{ duration: 0.3 }}
            >
              <h3>{t('categories')}</h3>
              <ul>
                {genres?.map(genre => (
                  <li key={genre.id} onClick={() => setCategory(genre.id)}>
                    {genre.name[i18n.language] || genre.name.en}
                  </li>
                ))}
              </ul>
            </motion.div>
            <div className="content" style={{ marginLeft: isSidebarOpen ? '200px' : '0' }}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route
                    path="/login"
                    element={
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Login setIsAdmin={setIsAdmin} setUser={setUser} />
                      </motion.div>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <motion.div
                        key="register"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Register setUser={setUser} />
                      </motion.div>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <motion.div
                        key="admin"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5 }}
                      >
                        <AdminPanel setIsAdmin={setIsAdmin} handleSaveChanges={handleSaveChanges} />
                      </motion.div>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Profile user={user} setUser={setUser} setIsAdmin={setIsAdmin} setFavorites={setFavorites} />
                      </motion.div>
                    }
                  />
                  <Route
                    path="/"
                    element={
                      <motion.div
                        key="home"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5 }}
                      >
                        <h1>{t('movies')}</h1>
                        <div className="controls">
                          <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                          />
                          <div className="rating-filter">
                            <label>{t('minRating')}</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={minRating}
                              onChange={(e) => setMinRating(Number(e.target.value))}
                            />
                          </div>
                          <button onClick={handleRandomMovie} className="random-btn">{t('randomMovie')}</button>
                          <button onClick={handleRefreshMovies} className="refresh-btn">{t('refreshMovies')}</button>
                        </div>
                        {searchResults.length > 0 && (
                          <div className="search-results">
                            <h3>{t('searchResults')}</h3>
                            <motion.div className="movie-list">
                              {searchResults.map((movie, index) => (
                                <motion.div
                                  key={movie.id}
                                  className="movie-card"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.1 }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} />
                                  <h3>{movie.title}</h3>
                                  <p>{t('rating', { rating: movie.vote_average || 'N/A' })}</p>
                                  <div className="hashtags">
                                    {movie.hashtags?.map((hashtag, idx) => (
                                      <span key={idx} className="hashtag">{hashtag}</span>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => toggleFavorite(movie)}
                                    className="favorite-btn"
                                  >
                                    {favorites.some(fav => Number(fav.tmdb_id) === Number(movie.id)) ? t('removeFromFavorites') : t('addToFavorites')}
                                  </button>
                                  <button onClick={() => handleMovieClick(movie, true)}>{t('moreDetails')}</button>
                                </motion.div>
                              ))}
                            </motion.div>
                          </div>
                        )}
                        <div className="favorites">
                          <h3>{t('favorites', { count: favorites.length })}</h3>
                          {favorites?.length > 0 ? (
                            <div className="movie-list">
                              {favorites.map((movie) => (
                                <motion.div
                                  key={movie.tmdb_id}
                                  className="movie-card"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} />
                                  <h3>{movie.title}</h3>
                                  <button
                                    onClick={() => toggleFavorite(movie)}
                                    className="favorite-btn"
                                  >
                                    {t('removeFromFavorites')}
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <p>{t('noFavorites')}</p>
                          )}
                        </div>
                        {loading ? (
                          <div className="spinner">
                            {t('loading')}
                            {retryCount > 0 && <p>{t('retrying', { count: retryCount })}</p>}
                          </div>
                        ) : errorMessage ? (
                          <p className="error-message">{errorMessage}</p>
                        ) : (
                          <motion.div className="movie-list">
                            {filteredMovies?.length > 0 ? (
                              filteredMovies.map((movie, index) => (
                                <motion.div
                                  key={movie.id}
                                  className="movie-card"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.1 }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} />
                                  <h3>{movie.title}</h3>
                                  <p>{t('rating', { rating: movie.vote_average })}</p>
                                  <div className="hashtags">
                                    {movie.hashtags?.map((hashtag, idx) => (
                                      <span key={idx} className="hashtag">{hashtag}</span>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => toggleFavorite(movie)}
                                    className="favorite-btn"
                                  >
                                    {favorites.some(fav => Number(fav.tmdb_id) === Number(movie.id)) ? t('removeFromFavorites') : t('addToFavorites')}
                                  </button>
                                  <button onClick={() => handleMovieClick(movie)}>{t('moreDetails')}</button>
                                </motion.div>
                              ))
                            ) : (
                              <p>{t('noMovies')}</p>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    }
                  />
                </Routes>
              </AnimatePresence>
            </div>

            {selectedMovie && (
              <motion.div
                className="modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
              >
                <motion.div
                  className="modal-content"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={e => e.stopPropagation()}
                >
                  <h2>{selectedMovie.title}</h2>
                  {isAdmin ? (
                    <div>
                                              <form onSubmit={(e) => {
                          e.preventDefault();
                          const newTitle = e.target.title.value;
                          const newImageUrl = e.target.imageUrl.value;
                          const newGenre = e.target.genre.value;
                          handleSaveChanges(selectedMovie.id, newTitle, newImageUrl, newGenre);
                        }}>
                          <label>
                            {t('title')}
                            <input type="text" name="title" defaultValue={selectedMovie.title} />
                          </label>
                          <label>
                            {t('imageUrl')}
                            <input type="text" name="imageUrl" defaultValue={selectedMovie.poster_path} />
                          </label>
                          <label>
                            {t('genre')}
                            <select name="genre" defaultValue={selectedMovie.genre_ids[0]}>
                              {genres.map(genre => (
                                <option key={genre.id} value={genre.id}>
                                  {genre.name[i18n.language] || genre.name.en}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button type="submit">{t('saveChanges')}</button>
                        </form>
                      </div>
                    ) : (
                      <>
                        <img src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`} alt={selectedMovie.title} />
                        <p>{selectedMovie.overview || t('noDescription')}</p>
                        <p>{t('rating', { rating: selectedMovie.vote_average })}</p>
                        {trailerKey ? (
                          <iframe
                            width="560"
                            height="315"
                            src={`https://www.youtube.com/embed/${trailerKey}`}
                            title="Trailer"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <p>{t('trailerNotFound')}</p>
                        )}
                        <div className="hashtags">
                          {selectedMovie.hashtags?.map((hashtag, idx) => (
                            <span key={idx} className="hashtag">{hashtag}</span>
                          ))}
                        </div>
                        <div className="reviews-section">
                          <h3>{t('reviews')}</h3>
                          {reviews
                            .filter(review => review.movie_id === selectedMovie.id)
                            .map(review => (
                              <div key={review.id} className="review">
                                <p>{review.text}</p>
                                {user && review.user_id === user.id && (
                                  <div className="review-actions">
                                    <button onClick={() => handleEditReview(review)}>{t('editReview')}</button>
                                    <button onClick={() => handleDeleteReview(review.id)}>{t('deleteReview')}</button>
                                  </div>
                                )}
                              </div>
                            ))}
                          {reviews.filter(review => review.movie_id === selectedMovie.id).length === 0 && (
                            <p>{t('noReviews')}</p>
                          )}
                          {user && (
                            <form onSubmit={editingReview ? handleUpdateReview : handleAddReview}>
                              <textarea
                                placeholder={t('leaveReview')}
                                value={newReview}
                                onChange={(e) => setNewReview(e.target.value)}
                              />
                              <button type="submit">
                                {editingReview ? t('updateReview') : t('submitReview')}
                              </button>
                            </form>
                          )}
                        </div>
                      </>
                    )}
                  <button onClick={closeModal} className="close-btn">{t('close')}</button>
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </Router>
  );
}

export default App;