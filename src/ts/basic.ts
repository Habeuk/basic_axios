import type { BasicRequestInterface, EntityFile } from './basicInterface';

/**
 * Permet d'effectuer les requetes
 * pour modifier ou definir les paramettres par defaut de l'instance, {AjaxBasic}.axiosInstance.defaults.timeout = 30000;
 */
import axios from 'axios';

const InstAxios = axios.create({
  timeout: 300000,
});
// definiton du token
let currentToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  currentToken = token;
};
// Surcharge des données d'envoit
InstAxios.interceptors.request.use((config) => {
  // Recuperation du temps de debut.
  config.headers['request-startTime'] = new Date().getTime();
  // Ajout du token d'authentification
  if (currentToken) {
    config.headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return config;
});
//surcharge de la reponse
InstAxios.interceptors.response.use((response) => {
  // Calcul de la durée
  const currentTime = new Date().getTime();
  const startTime = response.config.headers['request-startTime'];
  let duree = currentTime - startTime;
  if (duree) {
    duree = duree / 1000;
  }
  response.headers['request-duration'] = duree;
  //
  return response;
});

////******* */

const basicRequestToken: BasicRequestInterface = {
  axiosInstance: InstAxios,
  /**
   * Domaine permettant d'effectuer les tests en local.
   * C'est sur ce domaine que les requetes vont etre transmise quand on est en local.
   * exemple : http://facturation-photographe.kksa
   * @public
   */
  TestDomain: null,
  /**
   * Permet de specifier un domaine pour la production. ( utiliser uniquement quand l'application front est sur un domaine different de l'application serveur ).
   * exemple : https://facturation-photographe.com
   * @public
   */
  baseUrl: null,
  /**
   * Utiliser si le module supporte la traduction
   * example : fr, en, ar ...
   */
  languageId: null,
  /**
   * Permet d'afficher la console la les données envoyé et le retour de chaque requete.
   */
  debug: false,
  /**
   * Permet de determiner, si nous sommes en local ou pas.
   * @public
   * @returns Booleans
   */
  isLocalDev: window.location.host.includes('localhost') || window.location.host.includes('.kksa') ? true : false,
  /**
   * Permet de derminer la source du domaine, en function des paramettres definit.
   * @private (ne doit pas etre surcharger).
   * @returns String
   */
  getBaseUrl() {
    if (this.baseUrl)
      return this.isLocalDev && this.TestDomain ? this.TestDomain.replace(/^\/+|\/+$/g, '') : this.baseUrl;
    else
      return this.isLocalDev && this.TestDomain
        ? this.TestDomain.replace(/^\/+|\/+$/g, '')
        : window.location.protocol + '//' + window.location.host;
  },
  /**
   * Récupère les messages, en priorité celui défini dans headers.customstatustext
   *
   * @param er - La réponse ou l'erreur
   * @param type - true pour les messages de succès, false pour les erreurs
   */
  getStatusText(er, type = false) {
    if (er) {
      if (type) {
        if (er) {
          if (er.response && er.headers.customstatustext) {
            return er.headers.customstatustext;
          }
        } else if (er.statusText) {
          return er.statusText;
        } else {
          return null;
        }
      }
      // get message error
      else {
        const message =
          er.response && er.response.data && er.response.data.message ? ' || ' + er.response.data.message : null;
        if (er.response && er.response.headers && er.response.headers.customstatustext) {
          if (message) return er.response.headers.customstatustext + ' ' + message;
          else return er.response.headers.customstatustext;
        } else if (er.response && er.response.statusText) {
          if (message) return er.response.statusText + ' ' + message;
          else return er.response.statusText;
        } else {
          return message;
        }
      }
    } else {
      return null;
    }
  },
  post(url, datas, configs) {
    return new Promise((resolv, reject) => {
      if (this.languageId !== '' && this.languageId !== undefined && this.languageId !== null && !url.includes('://'))
        url = '/' + this.languageId + url;

      const urlFinal = url.includes('://') ? url : this.getBaseUrl() + url;
      basicRequestToken.axiosInstance
        .post(urlFinal, datas, configs)
        .then((reponse) => {
          console.log(`POST datas :: `, datas);
          if (this.debug)
            console.log(
              'Debug axio : \n',
              urlFinal,
              '\n payload: ',
              datas,
              '\n config: ',
              configs,
              '\n Duration : ',
              reponse.headers['request-duration'],
              '\n reponse: ',
              reponse,
              '\n ------ \n',
            );
          resolv({
            status: true,
            data: reponse.data,
            reponse: reponse,
            statusText: this.getStatusText(reponse, true),
          });
        })
        .catch((error) => {
          if (this.debug) {
            console.log(`POST datas :: `, datas);
            console.log('error wbutilities', error.response, error);
          }
          reject({
            status: false,
            code: error.code,
            stack: error.stack,
            statusTextCustom: this.getStatusText(error),
            ...error.response,
          });
        });
    });
  },
  delete(url, configs) {
    return new Promise((resolv, reject) => {
      const urlFinal = url.includes('://') ? url : this.getBaseUrl() + url;

      basicRequestToken.axiosInstance
        .delete(urlFinal, configs)
        .then((reponse) => {
          resolv({
            status: true,
            data: reponse.data,
            reponse: reponse,
            statusText: this.getStatusText(reponse, true),
          });
        })
        .catch((error) => {
          reject({
            status: false,
            error: error.response,
            code: error.code,
            stack: error.stack,
            statusText: this.getStatusText(error),
          });
        });
    });
  },
  get(url, configs) {
    return new Promise((resolv, reject) => {
      if (this.languageId !== '' && this.languageId !== undefined && this.languageId !== null && !url.includes('://'))
        url = '/' + this.languageId + url;
      const urlFinal = url.includes('://') ? url : this.getBaseUrl() + url;

      basicRequestToken.axiosInstance
        .get(urlFinal, configs)
        .then((reponse) => {
          if (this.debug)
            console.log(
              'Debug axio : \n',
              urlFinal,
              '\n Config: ',
              configs,
              '\n Duration : ',
              reponse.headers['request-duration'],
              '\n Reponse: ',
              reponse,
              '\n ------ \n',
            );
          resolv({
            status: true,
            data: reponse.data,
            reponse: reponse,
            statusText: this.getStatusText(reponse, true),
          });
        })
        .catch((error) => {
          console.log('error wbutilities', error.response);
          reject({
            status: false,
            error: error.response,
            code: error.code,
            stack: error.stack,
            statusText: this.getStatusText(error),
          });
        });
    });
  },
  /**
   * Post entities with image, boundary.
   * @param <string> url
   * @param entities - tableau d'objets { file, alt, title, description }
   * @param configs - configurations Axios
   */
  postEntites(url, entities: Array<EntityFile>, configs = {}, token_csrf = null) {
    if (!Array.isArray(entities) || entities.length === 0) {
      throw new Error('Aucun fichier à envoyer.');
    }
    const formData = new FormData();
    entities.forEach((entity, index) => {
      (Object.keys(entity) as Array<keyof EntityFile>).forEach((key) => {
        console.log(`entities[${index}][${key}]`, entity[key]);
        const value = entity[key];
        if (value !== undefined && value !== null) {
          formData.append(`entities[${index}][${key}]`, value as string | Blob);
        }
      });
      if (token_csrf) formData.append('_token_csrf', token_csrf);
    });
    return this.post(url, formData, configs);
  },
  postFile(url, file, onProgress, id = null, alt = null, description = null, configs = {}) {
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
    return this.post(url, formData, configs);
  },
  /**
   * Post single file with encode.
   * @param file " fichier à uploaded"
   */
  postFileBase64(url, file, id = null) {
    return new Promise((resolv, reject) => {
      this.getBase64(file).then((fileEncode) => {
        var headers = new Headers();
        var fileCompose = file.name.split('.');
        var myInit: RequestInit = {
          method: 'POST',
          headers: headers,
          // mode: "cors",
          body: JSON.stringify({
            upload: fileEncode.base64,
            ext: fileCompose.pop(),
            filename: fileCompose.join('.'),
            id: id,
          }),
          cache: 'default',
        };
        const urlFinal = url.includes('://') ? url : this.getBaseUrl() + url;
        fetch(urlFinal, myInit).then(function (response) {
          response
            .json()
            .then(function (json) {
              resolv(json);
            })
            .catch((error) => {
              reject(error);
            });
        });
      });
    });
  },
  getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      // reader.onload = () => resolve(reader.result);
      reader.onloadend = () => {
        var fileArray = typeof reader.result === 'string' ? reader.result.split(',') : null;
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
