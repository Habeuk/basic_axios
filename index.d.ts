// on exporter toutes les interfaces de basic_axios.
export * from './src/basicInterface';
// on déclare une constante pour le type BasicRequest et on l'exporte.
declare const basicRequest: import('./src/basicInterface').BasicRequest;
export default basicRequest;
