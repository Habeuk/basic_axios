import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiError, ApiSuccess } from './api';
import type { EntityFile, FileEncoded } from './files';

/**
 * Contrat de l'instance de requêtes (basicRequestToken).
 * Toutes les méthodes typées renvoient une Promise<ApiSuccess<T>> en cas de succès
 * et rejettent avec un ApiError en cas d'échec.
 */
export interface BasicRequestInterface {
  /** Instance Axios sous-jacente (avec intercepteurs token + refresh). */
  axiosInstance: AxiosInstance;

  /** Domaine pour les tests en local (ex: http://facturation-photographe.kksa). */
  TestDomain: string | null;

  /** Domaine pour la production (quand frontend et backend sont sur des domaines différents). */
  baseUrl: string | null;

  /** Langue pour les traductions (ex: 'fr', 'en', 'ar'). */
  languageId: string | null;

  /** Mode debug : affiche les logs des requêtes. */
  debug: boolean;

  /** Détecte si l'application tourne en local (localhost ou .kksa). */
  isLocalDev: boolean;

  /**
   * Retourne l'URL de base en fonction de la configuration
   * (TestDomain en local, baseUrl sinon, ou l'origine courante).
   */
  getBaseUrl(): string;

  /**
   * Récupère le message de status d'une réponse ou d'une erreur.
   * Priorité au header `customstatustext`, puis `statusText`, puis `data.message`.
   *
   * @param er   - Réponse Axios (succès) ou erreur (AxiosError ou ApiError)
   * @param type - `true` pour les succès, `false` pour les erreurs
   */
  getStatusText(er: AxiosResponse | ApiError | undefined, type?: boolean): string | null;

  /**
   * Requête POST.
   * @param url     - URL relative (préfixée par la langue si configurée) ou absolue
   * @param datas   - Corps de la requête
   * @param configs - Configuration Axios optionnelle
   */
  post<T = unknown>(url: string, datas?: unknown, configs?: AxiosRequestConfig): Promise<ApiSuccess<T>>;

  /**
   * Requête POST sans token ni intercepteur (refresh, endpoints publics sensibles).
   * Pas de préfixe de langue.
   */
  postBare<T = unknown>(url: string, datas?: unknown, configs?: AxiosRequestConfig): Promise<ApiSuccess<T>>;

  /**
   * Requête DELETE.
   */
  delete<T = unknown>(url: string, configs?: AxiosRequestConfig): Promise<ApiSuccess<T>>;

  /**
   * Requête GET.
   */
  get<T = unknown>(url: string, configs?: AxiosRequestConfig): Promise<ApiSuccess<T>>;

  /**
   * Envoi d'entités avec fichiers (multipart/form-data).
   * @param url        - URL de destination
   * @param entities   - Tableau d'entités contenant des fichiers
   * @param configs    - Configuration Axios optionnelle
   * @param token_csrf - Token CSRF optionnel
   */
  postEntites<T = unknown>(
    url: string,
    entities: EntityFile[],
    configs?: AxiosRequestConfig,
    token_csrf?: string | null,
  ): Promise<ApiSuccess<T>>;

  /**
   * Envoi d'un fichier encodé en base64 (via fetch, sans token ni intercepteur).
   * @param url  - URL de destination
   * @param file - Fichier à uploader
   * @param id   - Identifiant optionnel
   */
  postFileBase64<T = unknown>(url: string, file: File, id?: string | number | null): Promise<T>;

  /**
   * Envoi d'un fichier avec multipart/form-data et suivi de progression.
   * @param url         - URL de destination
   * @param file        - Fichier à uploader
   * @param onProgress  - Callback de progression (0-100)
   * @param id          - Identifiant optionnel
   * @param alt         - Texte alternatif optionnel
   * @param description - Description optionnelle
   * @param configs     - Configuration Axios optionnelle
   */
  postFile<T = unknown>(
    url: string,
    file: File,
    onProgress: (percent: number) => void,
    id?: string | number | null,
    alt?: string | null,
    description?: string | null,
    configs?: AxiosRequestConfig,
  ): Promise<ApiSuccess<T>>;

  /**
   * Convertit un fichier en base64.
   */
  getBase64(file: File): Promise<FileEncoded>;
}
