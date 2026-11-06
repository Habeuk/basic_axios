import type { AxiosResponse } from 'axios';

/**
 * Succès standardisé renvoyé par basicRequestToken.
 */
export interface ApiSuccess<T = unknown> {
  status: true;
  data: T;
  reponse: AxiosResponse<T>;
  statusText: string | null;
}

/**
 * Rejet standardisé émis par basicRequestToken
 * (post, get, delete, postBare).
 */
export interface ApiError {
  status: false;
  /** Réponse Axios en cas d'erreur HTTP (undefined si erreur réseau/timeout). */
  error?: AxiosResponse;
  /** Code d'erreur Axios (ex: 'ERR_NETWORK', 'ECONNABORTED'). */
  code?: string;
  stack?: string;
  /** Message lisible extrait de la réponse. */
  statusText: string | null;
}

/**
 * Union discriminée (optionnelle, pour un typage de bout en bout).
 */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
