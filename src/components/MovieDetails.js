import { useContext } from 'react';
import { UserContext } from '../UserContext';

function MovieDetails({ movie }) {
  const { userRole } = useContext(UserContext);

  return (
    <div>
      <h2>{movie.title}</h2>
      {userRole === 'admin' ? (
        <div>
          {/* Форма редактирования для админов */}
          <input type="text" defaultValue={movie.title} />
          <select defaultValue={movie.genre}>
            <option value="Action">Action</option>
            <option value="Comedy">Comedy</option>
            {/* Другие жанры */}
          </select>
          <button>Сохранить</button>
        </div>
      ) : (
        <div>
          {/* Трейлер для обычных пользователей */}
          <iframe src={movie.trailerUrl} title="Trailer" />
        </div>
      )}
    </div>
  );
}

export default MovieDetails;