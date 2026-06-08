import { getAuthHeaders, postJson, requestJson } from './client.js';
import { getAccessToken } from '../lib/token-storage.js';


function getMovieId(movie) {
  return String(movie?.movie_id ?? movie?.id ?? movie?.title ?? '');
}


export function getUserWatchlist() {
  return requestJson('/users/watchlist', {
    headers: getAuthHeaders(),
  });
}


export function addUserWatchlistItem(movie) {
  return postJson(
    '/users/watchlist/add',
    {
      movie_id: getMovieId(movie),
      title: movie.title,
      poster_url: movie.poster_url ?? null,
    },
    { headers: getAuthHeaders() }
  );
}


export function removeUserWatchlistItem(movieId) {
  return postJson(
    '/users/watchlist/remove',
    { movie_id: String(movieId) },
    { headers: getAuthHeaders() }
  );
}


export function getWatchlist(sessionId) {
  if (getAccessToken()) {
    return getUserWatchlist().then((data) => ({ watchlist: data.items ?? [] }));
  }

  return requestJson(`/watchlist/${sessionId}`);
}


export function addToWatchlist(sessionId, movie) {
  if (getAccessToken()) {
    return addUserWatchlistItem(movie)
      .then(() => getWatchlist(sessionId));
  }

  return postJson('/watchlist/add', {
    session_id: sessionId,
    movie,
  });
}


export function removeFromWatchlist(sessionId, movieId) {
  if (getAccessToken()) {
    return removeUserWatchlistItem(movieId)
      .then(() => getWatchlist(sessionId));
  }

  return postJson('/watchlist/remove', {
    session_id: sessionId,
    movie_id: movieId,
  });
}
