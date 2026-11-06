import axios from 'axios';

/** Instance principale (avec intercepteurs token + refresh). */
export const InstAxios = axios.create({
  timeout: 300000,
});

/**
 * Instance NUE : aucun intercepteur (ni token, ni refresh).
 * Réservée à l'appel de refresh → impossible de boucler sur elle-même.
 * Timeout court : un refresh bloqué ne doit pas geler toutes les requêtes en attente.
 */
export const BareAxios = axios.create({
  timeout: 30000,
  withCredentials: true, // indispensable pour le cookie HttpOnly du refresh token
});

// ============================================================
// Gestion du token (état centralisé : un seul module le possède)
// ============================================================

let currentToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
};

export const getAuthToken = () => currentToken;

// ============================================================
// Intercepteurs
// ============================================================

InstAxios.interceptors.request.use((config) => {
  config.headers['request-startTime'] = new Date().getTime();
  if (currentToken) {
    config.headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return config;
});

InstAxios.interceptors.response.use((response) => {
  const startTime = response.config.headers['request-startTime'] as number;
  const currentTime = new Date().getTime();
  const duree = startTime ? (currentTime - startTime) / 1000 : 0;
  response.headers['request-duration'] = duree;
  return response;
});
