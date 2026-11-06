import type { AxiosError, AxiosRequestConfig } from 'axios';
import type { BasicRequestInterface, EntityFile, FileEncoded, ApiSuccess } from '../interfaces';
import { InstAxios, BareAxios } from './axiosInstances';
import { toApiError, getStatusText } from './helpers';

const basicRequestToken: BasicRequestInterface = {
  axiosInstance: InstAxios,
  TestDomain: null,
  baseUrl: null,
  languageId: null,
  debug: false,
  isLocalDev: window.location.host.includes('localhost') || window.location.host.includes('.kksa'),

  getBaseUrl() {
    if (this.baseUrl)
      return this.isLocalDev && this.TestDomain ? this.TestDomain.replace(/^\/+|\/+$/g, '') : this.baseUrl;
    return this.isLocalDev && this.TestDomain
      ? this.TestDomain.replace(/^\/+|\/+$/g, '')
      : window.location.protocol + '//' + window.location.host;
  },

  getStatusText(er, type = false) {
    return getStatusText(er, type);
  },

  post<T = unknown>(url: string, datas?: unknown, configs?: AxiosRequestConfig): Promise<ApiSuccess<T>> {
    return new Promise<ApiSuccess<T>>((resolve, reject) => {
      if (this.languageId && !url.includes('://')) url = '/' + this.languageId + url;
      const urlFinal = url.includes('://') ? url : this.getBaseUrl() + url;

      InstAxios.post<T>(urlFinal, datas, configs)
        .then((response) => {
          if (this.debug)
            console.log(
              'Debug axio (POST) : \n',
              urlFinal,
              '\n payload: ',
              datas,
              '\n config: ',
              configs,
              '\n Duration : ',
              response.headers['request-duration'],
              '\n reponse: ',
              response,
              '\n ------ \n',
            );
          resolve({
            status: true,
            data: response.data,
            response,
            statusText: this.getStatusText(response, true),
          });
        })
        .catch((error: AxiosError) => {
          if (this.debug) {
            console.log(`POST datas :: `, datas);
            console.log('error wbutilities', error.response, error);
          }
          const apiError = toApiError(error);
          apiError.statusText = this.getStatusText(apiError);
          reject(apiError);
        });
    });
  },

  async postBare<T = unknown>(url: string, datas?: unknown, configs?: AxiosRequestConfig): Promise<ApiSuccess<T>> {
    const urlFinal = url.includes('://') ? url : this.getBaseUrl() + url;
    try {
      const response = await BareAxios.post<T>(urlFinal, datas, configs);
      return {
        status: true,
        data: response.data,
        response,
        statusText: this.getStatusText(response, true),
      };
    } catch (error) {
      const apiError = toApiError(error as AxiosError);
      apiError.statusText = this.getStatusText(apiError);
      throw apiError;
    }
  },

  delete<T = unknown>(url: string, configs?: AxiosRequestConfig): Promise<ApiSuccess<T>> {
    return new Promise<ApiSuccess<T>>((resolve, reject) => {
      const urlFinal = url.includes('://') ? url : this.getBaseUrl() + url;

      InstAxios.delete<T>(urlFinal, configs)
        .then((response) => {
          resolve({
            status: true,
            data: response.data,
            response,
            statusText: this.getStatusText(response, true),
          });
        })
        .catch((error: AxiosError) => {
          if (this.debug) console.log('error wbutilities', error.response);
          const apiError = toApiError(error);
          apiError.statusText = this.getStatusText(apiError);
          reject(apiError);
        });
    });
  },

  get<T = unknown>(url: string, configs?: AxiosRequestConfig): Promise<ApiSuccess<T>> {
    return new Promise<ApiSuccess<T>>((resolve, reject) => {
      if (this.languageId && !url.includes('://')) url = '/' + this.languageId + url;
      const urlFinal = url.includes('://') ? url : this.getBaseUrl() + url;

      InstAxios.get<T>(urlFinal, configs)
        .then((response) => {
          if (this.debug)
            console.log(
              'Debug axio (GET) : \n',
              urlFinal,
              '\n Config: ',
              configs,
              '\n Duration : ',
              response.headers['request-duration'],
              '\n Reponse: ',
              response,
              '\n ------ \n',
            );
          resolve({
            status: true,
            data: response.data,
            response,
            statusText: this.getStatusText(response, true),
          });
        })
        .catch((error: AxiosError) => {
          if (this.debug) console.log('error wbutilities', error.response);
          const apiError = toApiError(error);
          apiError.statusText = this.getStatusText(apiError);
          reject(apiError);
        });
    });
  },

  postEntites<T = unknown>(
    url: string,
    entities: EntityFile[],
    configs: AxiosRequestConfig = {},
    token_csrf: string | null = null,
  ): Promise<ApiSuccess<T>> {
    if (!Array.isArray(entities) || entities.length === 0) {
      throw new Error('Aucun fichier à envoyer.');
    }
    const formData = new FormData();
    entities.forEach((entity, index) => {
      (Object.keys(entity) as Array<keyof EntityFile>).forEach((key) => {
        if (this.debug) console.log(`entities[${index}][${key}]`, entity[key]);
        const value = entity[key];
        if (value !== undefined && value !== null) {
          formData.append(`entities[${index}][${key}]`, value as string | Blob);
        }
      });
      if (token_csrf) formData.append('_token_csrf', token_csrf);
    });
    return this.post<T>(url, formData, configs);
  },

  postFile<T = unknown>(
    url: string,
    file: File,
    onProgress: (percent: number) => void,
    id: string | number | null = null,
    alt: string | null = null,
    description: string | null = null,
    configs: AxiosRequestConfig = {},
  ): Promise<ApiSuccess<T>> {
    if (configs.headers === undefined) {
      configs.headers = { 'Content-Type': 'multipart/form-data' };
    } else {
      configs.headers['Content-Type'] = 'multipart/form-data';
    }
    if (configs.onUploadProgress === undefined) {
      configs.onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      };
    }
    const formData = new FormData();
    formData.append('upload', file);
    if (id !== null) formData.append('id', id.toString());
    if (alt !== null) formData.append('alt', alt.toString());
    if (description !== null) formData.append('description', description.toString());
    return this.post<T>(url, formData, configs);
  },

  postFileBase64<T = unknown>(url: string, file: File, id: string | number | null = null): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.getBase64(file).then((fileEncode) => {
        const headers = new Headers();
        const fileCompose = file.name.split('.');
        const myInit: RequestInit = {
          method: 'POST',
          headers,
          body: JSON.stringify({
            upload: fileEncode.base64,
            ext: fileCompose.pop(),
            filename: fileCompose.join('.'),
            id,
          }),
          cache: 'default',
        };
        const urlFinal = url.includes('://') ? url : this.getBaseUrl() + url;
        fetch(urlFinal, myInit)
          .then((response) => response.json().then(resolve).catch(reject))
          .catch(reject);
      }, reject);
    });
  },

  getBase64(file: File): Promise<FileEncoded> {
    return new Promise<FileEncoded>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const fileArray = typeof reader.result === 'string' ? reader.result.split(',') : null;
        if (fileArray)
          resolve({
            src: typeof reader.result === 'string' ? reader.result : '',
            base64: fileArray[1] ?? '',
          });
        else reject(new Error('Failed to read file'));
      };
      reader.onerror = (error) => reject(error);
    });
  },
};

export default basicRequestToken;
