import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { InstAxios, getAuthToken } from './axiosInstances';

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export interface AuthRefreshOptions {
  /** Obtient un nouvel access token (et le stocke via setAuthToken). Doit utiliser postBare. */
  refresh: () => Promise<string>;
  /** Appelé UNE fois par échec de refresh (pas une fois par requête en attente). */
  onAuthFailure?: (error: unknown) => void;
  /** URLs qui ne doivent jamais déclencher de refresh (login, refresh…). */
  skip?: RegExp;
  /** Surcharge de la détection d'erreur d'auth (ex. code TOKEN_EXPIRED). Défaut : status 401. */
  isAuthError?: (error: AxiosError) => boolean;
}

let refreshInterceptorId: number | null = null;

/**
 * Installe l'intercepteur de refresh automatique sur 401.
 * Idempotent : un rechargement à chaud (HMR) n'empile pas les intercepteurs.
 */
export const installAuthRefresh = (options: AuthRefreshOptions) => {
  const { refresh, onAuthFailure, skip, isAuthError = (e) => e.response?.status === 401 } = options;

  if (refreshInterceptorId !== null) {
    InstAxios.interceptors.response.eject(refreshInterceptorId);
  }

  // Une seule promesse de refresh partagée par toutes les requêtes en 401.
  let inflight: Promise<string> | null = null;
  const getFreshToken = () => {
    inflight ??= refresh()
      .catch((e) => {
        onAuthFailure?.(e);
        throw e;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };

  refreshInterceptorId = InstAxios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;

      if (!original || original._retry || !isAuthError(error) || (skip && skip.test(original.url ?? ''))) {
        return Promise.reject(error);
      }

      original._retry = true;

      // Course : la requête est partie avec un ancien token alors qu'un refresh
      // vient de se terminer → inutile de refaire un refresh, on rejoue simplement.
      const currentToken = getAuthToken();
      const sent = String(original.headers?.get?.('Authorization') ?? '');
      if (currentToken && sent && sent !== `Bearer ${currentToken}`) {
        return InstAxios(original);
      }

      try {
        await getFreshToken();
      } catch {
        return Promise.reject(error); // l'appelant voit le 401 d'origine
      }

      // L'intercepteur de requête réinjecte currentToken (déjà mis à jour par setAuthToken).
      return InstAxios(original);
    },
  );
};
