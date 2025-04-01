import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'Movie App',
      movies: 'Movies',
      categories: 'Categories',
      login: 'Login',
      register: 'Register',
      profile: 'Profile',
      adminPanel: 'Admin Panel',
      logout: 'Logout',
      loading: 'Loading...',
      loadingApp: 'Loading App...',
      retrying: 'Retrying... Attempt {{count}}',
      noMovies: 'No movies found.',
      failedToFetchTMDBShowingCached: 'Failed to fetch new movies from TMDB. Showing cached movies.',
      networkError: 'Network error: {{message}}',
      rating: 'Rating: {{rating}}',
      moreDetails: 'More Details',
      searchPlaceholder: 'Search by title or hashtag...',
      minRating: 'Min Rating:',
      randomMovie: 'Random Movie',
      refreshMovies: 'Refresh Movies',
      favorites: 'Favorites ({{count}})',
      addToFavorites: 'Add to Favorites',
      removeFromFavorites: 'Remove from Favorites',
      noFavorites: 'No favorites yet.',
      pleaseLogin: 'Please login to add to favorites.',
      trailerNotFound: 'Trailer not found.',
      reviews: 'Reviews',
      noReviews: 'No reviews yet.',
      leaveReview: 'Leave a review...',
      submitReview: 'Submit Review',
      editReview: 'Edit',
      updateReview: 'Update Review',
      deleteReview: 'Delete',
      close: 'Close',
      title: 'Title:',
      imageUrl: 'Image URL:',
      genre: 'Genre:',
      saveChanges: 'Save Changes',
      changesSaved: 'Changes saved successfully!',
      errorSaving: 'Error saving changes.',
      username: 'Username',
      password: 'Password',
      loginFailed: 'Login failed. Please check your credentials.',
      registrationFailed: 'Registration failed. Please try again.',
      registerAsAdmin: 'Register as Admin',
      isAdmin: 'Admin',
      yes: 'Yes',
      no: 'No',
      viewedMovies: 'Viewed Movies',
      viewedAt: 'Viewed at',
      noViews: 'No viewed movies yet.',
      darkTheme: 'Light Theme',
      lightTheme: 'Dark Theme',
      allRightsReserved: 'All rights reserved.',
    },
  },
  ru: {
    translation: {
      appName: 'Кино Приложение',
      movies: 'Фильмы',
      categories: 'Категории',
      login: 'Войти',
      register: 'Зарегистрироваться',
      profile: 'Профиль',
      adminPanel: 'Панель администратора',
      logout: 'Выйти',
      loading: 'Загрузка...',
      loadingApp: 'Загрузка приложения...',
      retrying: 'Повторная попытка... Попытка {{count}}',
      noMovies: 'Фильмы не найдены.',
      failedToFetchTMDBShowingCached: 'Не удалось загрузить новые фильмы с TMDB. Показаны кэшированные фильмы.',
      networkError: 'Ошибка сети: {{message}}',
      rating: 'Рейтинг: {{rating}}',
      moreDetails: 'Подробнее',
      searchPlaceholder: 'Поиск по названию или хэштегу...',
      minRating: 'Мин. рейтинг:',
      randomMovie: 'Случайный фильм',
      refreshMovies: 'Обновить фильмы',
      favorites: 'Избранное ({{count}})',
      addToFavorites: 'Добавить в избранное',
      removeFromFavorites: 'Удалить из избранного',
      noFavorites: 'У вас пока нет избранного.',
      pleaseLogin: 'Пожалуйста, войдите, чтобы добавить в избранное.',
      trailerNotFound: 'Трейлер не найден.',
      reviews: 'Отзывы',
      noReviews: 'Пока нет отзывов.',
      leaveReview: 'Оставить отзыв...',
      submitReview: 'Отправить отзыв',
      editReview: 'Редактировать',
      updateReview: 'Обновить отзыв',
      deleteReview: 'Удалить',
      close: 'Закрыть',
      title: 'Название:',
      imageUrl: 'URL изображения:',
      genre: 'Жанр:',
      saveChanges: 'Сохранить изменения',
      changesSaved: 'Изменения успешно сохранены!',
      errorSaving: 'Ошибка при сохранении изменений.',
      username: 'Имя пользователя',
      password: 'Пароль',
      loginFailed: 'Ошибка входа. Проверьте ваши данные.',
      registrationFailed: 'Ошибка регистрации. Попробуйте снова.',
      registerAsAdmin: 'Зарегистрироваться как администратор',
      isAdmin: 'Администратор',
      yes: 'Да',
      no: 'Нет',
      viewedMovies: 'Просмотренные фильмы',
      viewedAt: 'Просмотрено',
      noViews: 'Пока нет просмотренных фильмов.',
      darkTheme: 'Светлая тема',
      lightTheme: 'Тёмная тема',
      allRightsReserved: 'Все права защищены.',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;