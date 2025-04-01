import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const BASE_URL = 'http://localhost:5000/api';

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

function AdminPanel({ setIsAdmin, handleSaveChanges }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/movies`);
        setMovies(response.data || []);
      } catch (error) {
        console.error('Ошибка при загрузке фильмов:', error.message);
        setMovies([]);
      }
    };
    fetchMovies();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    setIsAdmin(false);
    navigate('/login');
  };

  return (
    <motion.div
      className="admin-panel"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2>{t('adminPanel')}</h2>
      <button onClick={handleLogout} className="logout-btn">{t('logout')}</button>
      <div className="movie-list">
        {movies.map(movie => (
          <div key={movie.tmdb_id} className="movie-card">
            <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} />
            <form onSubmit={(e) => {
              e.preventDefault();
              const newTitle = e.target.title.value;
              const newImageUrl = e.target.imageUrl.value;
              const newGenre = e.target.genre.value;
              handleSaveChanges(movie.tmdb_id, newTitle, newImageUrl, newGenre);
            }}>
              <label>
                {t('title')}
                <input type="text" name="title" defaultValue={movie.title} />
              </label>
              <label>
                {t('imageUrl')}
                <input type="text" name="imageUrl" defaultValue={movie.poster_path} />
              </label>
              <label>
                {t('genre')}
                <select name="genre">
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
        ))}
      </div>
    </motion.div>
  );
}

export default AdminPanel;