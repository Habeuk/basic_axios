/**
 * Fichier encodé en base64 (résultat de getBase64).
 */
export type FileEncoded = {
  src: string;
  base64: string;
};

/**
 * Fichier à envoyer via postEntites (multipart/form-data).
 */
export type EntityFile = {
  file: File;
  alt?: string;
  title?: string;
  description?: string;
};
