type ApiResponse<T = any> = { status: boolean; data: T; reponse: any; statusText: string | null };

type FileEncoded = { src: string; base64: string };

import type { AxiosInstance, AxiosRequestConfig } from 'axios';

export type EntityFile = { file: File; alt?: string; title?: string; description?: string };
export interface basic {
  user: {
    username: string;
    password: string;
  };
}

export interface BasicRequestInterface {
  /** Instance Axios */
  axiosInstance: AxiosInstance;

  /** Domaine pour les tests en local */
  TestDomain: string | null;

  /** Domaine pour la production (quand frontend et backend sont sur des domaines différents) */
  baseUrl: string | null;

  /** Langue pour les traductions (ex: 'fr', 'en', 'ar') */
  languageId: string | null;

  /** Mode debug : affiche les logs des requêtes */
  debug: boolean;

  /** Détecte si l'application tourne en local */
  isLocalDev: boolean;

  /**
   * Retourne l'URL de base en fonction de la configuration
   */
  getBaseUrl(): string;

  /**
   * Récupère le message de status d'une réponse
   * @param er - La réponse ou l'erreur
   * @param type - true pour les succès, false pour les erreurs
   */
  getStatusText(er: any, type?: boolean): string | null;

  /**
   * Requête POST
   */
  post<T = any>(url: string, datas?: any, configs?: AxiosRequestConfig): Promise<ApiResponse<T>>;

  /**
   * Requête DELETE
   */
  delete<T = any>(url: string, configs?: AxiosRequestConfig): Promise<ApiResponse<T>>;

  /**
   * Requête GET
   */
  get<T = any>(url: string, configs?: AxiosRequestConfig): Promise<ApiResponse<T>>;

  /**
   * Envoi d'entités avec fichiers (multipart/form-data)
   * @param url - URL de destination
   * @param entities - Tableau d'entités contenant des fichiers
   * @param configs - Configurations Axios
   * @param token_csrf - Token CSRF optionnel
   */
  postEntites(
    url: string,
    entities: EntityFile[],
    configs?: AxiosRequestConfig,
    token_csrf?: string | null,
  ): Promise<ApiResponse<any>>;

  /**
   * Envoi d'un fichier encodé en base64
   * @param url - URL de destination
   * @param file - Fichier à uploader
   * @param id - Identifiant optionnel
   */
  postFile(url: string, file: File, id?: string | number | null): Promise<any>;

  /**
   * Convertit un fichier en base64
   */
  getBase64(file: File): Promise<FileEncoded>;
}
