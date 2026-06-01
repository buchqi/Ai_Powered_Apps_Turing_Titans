const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

// Exported so components can build URLs (e.g. static assets) without duplicating the base.
export { API_BASE_URL };

async function requestJson(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      ...options,
    });
  } catch {
    throw new Error(
      'Backend is not running. Start the FastAPI server and try again.'
    );
  }

  if (!response.ok) {
    throw new Error('Backend request failed.');
  }

  const data = await response.json();
  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

function postJson(path, payload) {
  return requestJson(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createRecommendationSession(preferences, batchSize = 10) {
  return postJson('/recommend/session', {
    preferences,
    batch_size: batchSize,
  });
}

export function getMoreMovies(sessionId, batchSize = 10) {
  return postJson('/recommend/more', {
    session_id: sessionId,
    batch_size: batchSize,
  });
}

export function addToWatchlist(sessionId, movie) {
  return postJson('/watchlist/add', {
    session_id: sessionId,
    movie,
  });
}

export function removeFromWatchlist(sessionId, movieId) {
  return postJson('/watchlist/remove', {
    session_id: sessionId,
    movie_id: movieId,
  });
}

export function getWatchlist(sessionId) {
  return requestJson(`/watchlist/${sessionId}`);
}