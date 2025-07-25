/**
 * Permet d'effectuer les requetes
 * pour modifier ou definir les paramettres par defaut de l'instance, {AjaxBasic}.axiosInstance.defaults.timeout = 30000;
 */
import axios from "axios";
const InstAxios = axios.create({
  timeout: 300000,
});
// Surcharge des données d'envoit
InstAxios.interceptors.request.use((config) => {
  //Recuperation du temps de debut.
  config.headers["request-startTime"] = new Date().getTime();
  //
  return config;
});
//surcharge de la reponse
InstAxios.interceptors.response.use((response) => {
  // Calcul de la durée
  const currentTime = new Date().getTime();
  const startTime = response.config.headers["request-startTime"];
  let duree = currentTime - startTime;
  if (duree) {
    duree = duree / 1000;
  }
  response.headers["request-duration"] = duree;
  //
  return response;
});

var formatBasicAuth = function (userName, password) {
  var basicAuthCredential = userName + ":" + password;
  var bace64 = btoa(basicAuthCredential);
  return "Basic " + bace64;
};
/**
 * Cette approche doit etre mise en place dans un enviroment securée et n'est pas recommander, car une tiere personne peut recuperer les données.
 * On mettre en place un systeme d'authentification qui utilise les jetons pour maintenir les communications.
 */
////******* */
var user = JSON.parse(window.localStorage.getItem("user"));
var current_user;
if (window.localStorage.getItem("current_user")) {
  current_user = JSON.parse(window.localStorage.getItem("current_user"));
} else {
  current_user = null;
}
////******* */

const basicRequest = {
  /* Permet de lire la variable user dans le localstorage et de formater l'authorisation */
  auth: user ? formatBasicAuth(user.username, user.password) : null,
  current_user: current_user,
  axiosInstance: InstAxios,
  /**
   * Domaine permettant d'effectuer les tests en local.
   * C'est sur ce domaine que les requetes vont etre transmise quand on est en local.
   * @public
   */
  TestDomain: null,
  /**
   * Permet de specifier un domaine pour la production. ( utiliser uniquement quand l'application front est sur un domaine different de l'application serveur ).
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
  isLocalDev: window.location.host.includes("localhost") || window.location.host.includes(".kksa") ? true : false,
  /**
   * Permet de derminer la source du domaine, en function des paramettres definit.
   * @private (ne doit pas etre surcharger).
   * @returns String
   */
  getBaseUrl() {
    if (this.baseUrl) return this.isLocalDev && this.TestDomain ? this.TestDomain.trim("/") : this.baseUrl;
    else return this.isLocalDev && this.TestDomain ? this.TestDomain.trim("/") : window.location.protocol + "//" + window.location.host;
  },
  /**
   * Permet de recuperer les messages , en priorité celui definie dans headers.customstatustext.
   *
   * @param {*} er
   * @param {*} type ( true pour recuperer les messages en cas de success )
   * @returns
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
        const message = er.response && er.response.data && er.response.data.message ? " || " + er.response.data.message : null;
        if (er.response && er.response.headers && er.response.headers.customstatustext) {
          return er.response.headers.customstatustext + message;
        } else if (er.response && er.response.statusText) {
          return er.response.statusText + message;
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
      if (this.languageId !== "" && this.languageId !== undefined && this.languageId !== null && !url.includes("://")) url = "/" + this.languageId + url;

      const urlFinal = url.includes("://") ? url : this.getBaseUrl() + url;
      InstAxios.post(urlFinal, datas, configs)
        .then((reponse) => {
          if (this.debug)
            console.log(
              "Debug axio : \n",
              urlFinal,
              "\n payload: ",
              datas,
              "\n config: ",
              configs,
              "\n Duration : ",
              reponse.headers["request-duration"],
              "\n reponse: ",
              reponse,
              "\n ------ \n"
            );
          resolv({
            status: true,
            data: reponse.data,
            reponse: reponse,
            statusText: this.getStatusText(reponse, true),
          });
        })
        .catch((error) => {
          console.log("error wbutilities", error.response);
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
  delete(url, datas, configs) {
    return new Promise((resolv, reject) => {
      const urlFinal = url.includes("://") ? url : this.getBaseUrl() + url;

      InstAxios.delete(urlFinal, configs, datas)
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
      if (this.languageId !== "" && this.languageId !== undefined && this.languageId !== null && !url.includes("://")) url = "/" + this.languageId + url;
      const urlFinal = url.includes("://") ? url : this.getBaseUrl() + url;

      InstAxios.get(urlFinal, configs)
        .then((reponse) => {
          if (this.debug)
            console.log("Debug axio : \n", urlFinal, "\n Config: ", configs, "\n Duration : ", reponse.headers["request-duration"], "\n Reponse: ", reponse, "\n ------ \n");
          resolv({
            status: true,
            data: reponse.data,
            reponse: reponse,
            statusText: this.getStatusText(reponse, true),
          });
        })
        .catch((error) => {
          console.log("error wbutilities", error.response);
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
   * @param file " fichier à uploaded"
   */
  postFile(url, file, id = null) {
    return new Promise((resolv, reject) => {
      this.getBase64(file).then((fileEncode) => {
        var headers = new Headers();
        var fileCompose = file.name.split(".");
        var myInit = {
          method: "POST",
          headers: headers,
          // mode: "cors",
          body: JSON.stringify({
            upload: fileEncode.base64,
            ext: fileCompose.pop(),
            filename: fileCompose.join("."),
            id: id,
          }),
          cache: "default",
        };
        const urlFinal = url.includes("://") ? url : this.getBaseUrl() + url;
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
      //reader.onload = () => resolve(reader.result);
      reader.onloadend = () => {
        var fileArray = reader.result.split(",");
        resolve({ src: reader.result, base64: fileArray[1] });
      };
      reader.onerror = (error) => reject(error);
    });
  },
};

export default basicRequest;
