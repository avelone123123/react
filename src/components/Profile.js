import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const BASE_URL = 'http://localhost:5000/api';

function Profile({ user, setUser, setIsAdmin, setFavorites }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [favorites, setLocalFavorites] = useState([]);
  const [views, setViews] = useState([]);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [error, setError] = useState('');

  console.log('Profile user:', user);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BASE_URL}/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLocalFavorites(response.data || []);
        setFavorites(response.data || []);
      } catch (error) {
        console.error('Ошибка при загрузке избранного:', error.message);
        setLocalFavorites([]);
      }
    };

    const fetchViews = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BASE_URL}/views`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setViews(response.data || []);
      } catch (error) {
        console.error('Ошибка при загрузке просмотров:', error.message);
        setViews([]);
      }
    };

    fetchFavorites();
    fetchViews();
  }, [setFavorites]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    setUser(null);
    setIsAdmin(false);
    setFavorites([]);
    navigate('/login');
  };

  const handleAvatarChange = async (e) => {
    e.preventDefault();
    if (!newAvatarUrl.trim()) {
      setError(t('avatarUrlRequired'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${BASE_URL}/users/avatar`,
        { avatar_url: newAvatarUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setNewAvatarUrl('');
      setError('');
      alert(t('avatarUpdated'));
    } catch (error) {
      console.error('Ошибка при обновлении аватарки:', error.message);
      setError(error.response?.data?.error || t('avatarUpdateFailed'));
    }
  };

  return (
    <motion.div
      className="profile-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2>{t('profile')}</h2>
      <div className="profile-avatar">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt="User Avatar"
            className="user-avatar"
          />
        ) : (
          <img
            src="https://via.placeholder.com/100?text=User"
            alt="Default Avatar"
            className="user-avatar"
          />
        )}
      </div>
      <div className="avatar-change-form">
        <h3>{t('changeAvatar')}</h3>
        <form onSubmit={handleAvatarChange}>
          <div className="form-group">
            <label>{t('newAvatarUrl')}</label>
            <input
              type="text"
              value={newAvatarUrl}
              onChange={(e) => setNewAvatarUrl(e.target.value)}
              placeholder={t('enterAvatarUrl')}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit">{t('updateAvatar')}</button>
        </form>
      </div>
      <p>{t('username')}: {user?.username || 'N/A'}</p>
      <p>{t('isAdmin')}: {user?.is_admin ? t('yes') : t('no')}</p>
      <button onClick={handleLogout} className="logout-btn">{t('logout')}</button>
      <h3>{t('favorites', { count: favorites.length })}</h3>
      {favorites.length > 0 ? (
        <div className="movie-list">
          {favorites.map(movie => (
            <div key={movie.tmdb_id} className="movie-card">
              <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} />
              <h3>{movie.title}</h3>
            </div>
          ))}
        </div>
      ) : (
        <p>{t('noFavorites')}</p>
      )}
      <h3>{t('viewedMovies')}</h3>
      {views.length > 0 ? (
        <div className="movie-list">
          {views.map(view => (
            <div key={view.movie_id} className="movie-card">
              <h3>{view.movie_id}</h3>
              <p>{t('viewedAt')}: {new Date(view.viewed_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>{t('noViews')}</p>
      )}
    </motion.div>
  );
}

export default Profile;