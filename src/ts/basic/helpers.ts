import type { AxiosError, AxiosResponse } from 'axios';
import type { ApiError } from '../interfaces/api';

/** Corps d'erreur standard attendu du backend (optionnel). */
interface ErrorBody {
  message?: string;
}

/** Headers custom attendus (ex: customstatustext). */
interface CustomHeaders {
  customstatustext?: string;
}

/** Type guard : vérifie si er est un ApiError (forme normalisée). */
const isApiError = (er: unknown): er is ApiError =>
  typeof er === 'object' && er !== null && 'status' in er && (er as ApiError).status === false && 'statusText' in er;

/**
 * Construit un ApiError à partir d'une AxiosError.
 * Le champ `statusText` est initialisé à `null` ; il doit être rempli
 * via `getStatusText(apiError)` par l'appelant.
 */
export const toApiError = (error: AxiosError): ApiError => ({
  status: false,
  error: error.response,
  code: error.code,
  stack: error.stack,
  statusText: null,
});

/**
 * Extrait le message de status d'une réponse Axios (succès)
 * ou d'une erreur (AxiosError ou ApiError).
 *
 * Priorité :
 *   1. header `customstatustext`
 *   2. `statusText` HTTP
 *   3. `data.message` (préfixé par ` || `)
 */
export const getStatusText = (er: AxiosResponse | ApiError | undefined, type = false): string | null => {
  if (!er) return null;

  // Succès : er est un AxiosResponse
  if (type) {
    const response = er as AxiosResponse;
    const custom = (response.headers as CustomHeaders | undefined)?.customstatustext;
    if (custom) return String(custom);
    return response.statusText ?? null;
  }

  // Erreur : on distingue ApiError (déjà normalisé) d'un AxiosResponse brut
  const response: AxiosResponse | undefined = isApiError(er) ? er.error : (er as AxiosResponse);

  if (!response) return null;

  const body = response.data as ErrorBody | undefined;
  const message = body?.message ? ` || ${body.message}` : null;

  const custom = (response.headers as CustomHeaders | undefined)?.customstatustext;
  if (custom) return message ? `${custom} ${message}` : String(custom);

  if (response.statusText) {
    return message ? `${response.statusText} ${message}` : response.statusText;
  }

  return message;
};
