import { API_BASE_URL, getAuthHeaders, postJson } from './client.js';
import { getAccessToken } from '../lib/token-storage.js';
export { API_BASE_URL };

export function createRecommendationSession(preferences, batchSize = 10) {
  if (getAccessToken()) {
    return startUserRecommendationSession(preferences, batchSize);
  }

  return postJson('/recommend/session', {
    preferences,
    batch_size: batchSize,
  });
}

export function getMoreMovies(sessionId, batchSize = 10) {
  if (getAccessToken()) {
    return getMoreUserRecommendations(sessionId, batchSize);
  }

  return postJson('/recommend/more', {
    session_id: sessionId,
    batch_size: batchSize,
  });
}

export function startUserRecommendationSession(preferences, batchSize = 10) {
  return postJson(
    '/users/recommend/session',
    {
      preferences,
      batch_size: batchSize,
    },
    { headers: getAuthHeaders() }
  );
}

export function getMoreUserRecommendations(sessionId, batchSize = 10) {
  return postJson(
    '/users/recommend/more',
    {
      session_id: sessionId,
      batch_size: batchSize,
    },
    { headers: getAuthHeaders() }
  );
}

export {
  addToWatchlist,
  getWatchlist,
  getUserWatchlist,
  removeFromWatchlist,
  addUserWatchlistItem,
  removeUserWatchlistItem,
} from './watchlist.js';
