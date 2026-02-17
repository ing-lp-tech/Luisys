/**
 * Utilidad para comprimir imágenes antes de subirlas a Supabase
 * Reduce drásticamente el tamaño de las imágenes manteniendo calidad aceptable
 */

/**
 * Comprime una imagen usando Canvas API
 * @param {File} file - Archivo de imagen original
 * @param {Object} options - Opciones de compresión
 * @param {number} options.maxWidth - Ancho máximo en píxeles (default: 1200)
 * @param {number} options.maxHeight - Alto máximo en píxeles (default: 1200)
 * @param {number} options.quality - Calidad JPEG 0-1 (default: 0.7)
 * @returns {Promise<Blob>} - Imagen comprimida como Blob
 */
export async function compressImage(file, options = {}) {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.7
    } = options;

    return new Promise((resolve, reject) => {
        // Crear FileReader para leer la imagen
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calcular nuevas dimensiones manteniendo aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const aspectRatio = width / height;

                    if (width > height) {
                        width = maxWidth;
                        height = width / aspectRatio;
                    } else {
                        height = maxHeight;
                        width = height * aspectRatio;
                    }
                }

                // Crear canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');

                // Dibujar imagen redimensionada
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a Blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Error al comprimir imagen'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Error al cargar imagen'));
            };

            img.src = e.target.result;
        };

        reader.onerror = () => {
            reject(new Error('Error al leer archivo'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Comprime múltiples imágenes en paralelo
 * @param {FileList|Array<File>} files - Lista de archivos de imagen
 * @param {Object} options - Opciones de compresión (ver compressImage)
 * @returns {Promise<Array<Blob>>} - Array de imágenes comprimidas
 */
export async function compressImages(files, options = {}) {
    const fileArray = Array.from(files);
    const compressionPromises = fileArray.map(file => compressImage(file, options));
    return Promise.all(compressionPromises);
}

/**
 * Obtiene el tamaño de un archivo en formato legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado (ej: "2.5 MB")
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calcula el porcentaje de reducción de tamaño
 * @param {number} originalSize - Tamaño original en bytes
 * @param {number} compressedSize - Tamaño comprimido en bytes
 * @returns {number} - Porcentaje de reducción
 */
export function getCompressionRatio(originalSize, compressedSize) {
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}
