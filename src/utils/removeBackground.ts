import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import { RemovalLevel } from '../types';

export interface BgRemovalProgress {
  progress: number;
  status: string;
}

/**
 * Remove background with @imgly/background-removal and smart local fallback,
 * applying the selected precision level (soft, standard, deep).
 */
export async function processBackgroundRemoval(
  imageSource: string | File | Blob | HTMLImageElement,
  level: RemovalLevel = 'standard',
  onProgress?: (p: BgRemovalProgress) => void
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; rawCutoutDataUrl: string }> {
  try {
    if (onProgress) {
      onProgress({ progress: 15, status: 'Analizando imagen y modelo de IA...' });
    }

    // Try @imgly/background-removal
    const blob = await imglyRemoveBackground(imageSource, {
      progress: (key: string, current: number, total: number) => {
        if (onProgress && total > 0) {
          const pct = Math.round((current / total) * 70) + 15;
          onProgress({
            progress: Math.min(pct, 90),
            status: `Extrayendo sujeto: ${key} (${Math.round((current / total) * 100)}%)`,
          });
        }
      },
    });

    if (onProgress) {
      onProgress({ progress: 92, status: `Aplicando nivel de refinamiento: ${getLevelLabel(level)}...` });
    }

    const rawCutoutDataUrl = await blobToDataUrl(blob);
    // Apply removal level post-processing
    const refinedDataUrl = await applyRemovalLevelToCutout(rawCutoutDataUrl, level);
    const finalBlob = await dataUrlToBlob(refinedDataUrl);
    const { width, height } = await getImageDimensions(refinedDataUrl);

    if (onProgress) {
      onProgress({ progress: 100, status: '¡Listo! Fondo eliminado con éxito.' });
    }

    return { blob: finalBlob, dataUrl: refinedDataUrl, width, height, rawCutoutDataUrl };
  } catch (err) {
    console.warn('AI model failed or was interrupted, applying high-precision Canvas fallback segmentation:', err);
    if (onProgress) {
      onProgress({ progress: 50, status: `Aplicando segmentación de borde (${getLevelLabel(level)})...` });
    }

    // Fallback: smart color/edge segmentation
    const rawCutoutDataUrl = await fallbackEdgeRemoval(imageSource, level);
    const refinedDataUrl = await applyRemovalLevelToCutout(rawCutoutDataUrl, level);
    const blob = await dataUrlToBlob(refinedDataUrl);
    const { width, height } = await getImageDimensions(refinedDataUrl);

    if (onProgress) {
      onProgress({ progress: 100, status: '¡Listo! Fondo procesado.' });
    }

    return { blob, dataUrl: refinedDataUrl, width, height, rawCutoutDataUrl };
  }
}

function getLevelLabel(level: RemovalLevel): string {
  switch (level) {
    case 'soft':
      return 'Suave / Detallado';
    case 'deep':
      return 'Profundo / Sin halos';
    case 'standard':
    default:
      return 'Estándar';
  }
}

/**
 * Re-applies a removal level (soft, standard, deep) to a cutout image without re-running the AI model.
 */
export function applyRemovalLevelToCutout(
  sourceDataUrl: string,
  level: RemovalLevel
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(sourceDataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      if (level === 'soft') {
        // Nivel 1: Suave / Conservador
        // Expande ligeramente la transparencia para preservar cabellos finos,
        // velos, vidrio y bordes suaves sin cortar de más.
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a > 6) {
            // Gamma curve boost for soft edge visibility
            const normalized = a / 255;
            data[i + 3] = Math.min(255, Math.round(255 * Math.pow(normalized, 0.72)));
          } else {
            data[i + 3] = 0;
          }
        }
      } else if (level === 'deep') {
        // Nivel 3: Profundo / Agresivo / Cero halos
        // Recorta halos periféricos y limpia sombras o restos de fondo (spill).
        // Primero, limpiamos el ruido de baja opacidad y aumentamos el contraste del borde.
        const originalAlphas = new Uint8Array(w * h);
        for (let idx = 0; idx < w * h; idx++) {
          const a = data[idx * 4 + 3];
          if (a < 36) {
            data[idx * 4 + 3] = 0;
            originalAlphas[idx] = 0;
          } else {
            // Steepened alpha curve to eliminate fuzzy edge halos
            const normalized = a / 255;
            const boosted = Math.min(255, Math.round(255 * Math.pow(normalized, 1.45)));
            data[idx * 4 + 3] = boosted;
            originalAlphas[idx] = boosted;
          }
        }

        // Morphological 1-pixel edge defringe
        // Detect pixels on the border with transparent space and suppress outer edge contamination
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            const a = originalAlphas[idx];
            if (a > 0 && a < 250) {
              // Check if any direct neighbor is transparent
              const left = originalAlphas[idx - 1] === 0;
              const right = originalAlphas[idx + 1] === 0;
              const top = originalAlphas[idx - w] === 0;
              const btm = originalAlphas[idx + w] === 0;

              if (left || right || top || btm) {
                // If it is an exterior border pixel with low alpha, erode it
                if (a < 160) {
                  data[idx * 4 + 3] = 0;
                } else {
                  // Damp outer halo opacity
                  data[idx * 4 + 3] = Math.round(data[idx * 4 + 3] * 0.7);
                }
              }
            }
          }
        }
      } else {
        // Nivel 2: Estándar / Equilibrado
        // Balance equilibrado: limpia píxeles fantasma (< 12) conservando el suavizado antialias natural.
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 12) {
            data[i + 3] = 0;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = sourceDataUrl;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((res) => res.blob());
}

export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Intelligent client-side fallback: analyzes perimeter color distribution, detects dominant
 * background colors/gradients, and segments foreground subject based on removal level.
 */
async function fallbackEdgeRemoval(
  source: string | File | Blob | HTMLImageElement,
  level: RemovalLevel = 'standard'
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let srcUrl = '';
    if (typeof source === 'string') {
      srcUrl = source;
    } else if (source instanceof HTMLImageElement) {
      srcUrl = source.src;
    } else {
      srcUrl = URL.createObjectURL(source);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Cannot get 2d context'));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Sample border pixels to detect background color
      const sampleBorderPoints: [number, number, number][] = [];
      const step = Math.max(1, Math.floor(Math.min(w, h) / 40));

      for (let x = 0; x < w; x += step) {
        const topIdx = (x) * 4;
        const btmIdx = ((h - 1) * w + x) * 4;
        sampleBorderPoints.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
        sampleBorderPoints.push([data[btmIdx], data[btmIdx + 1], data[btmIdx + 2]]);
      }
      for (let y = 0; y < h; y += step) {
        const leftIdx = (y * w) * 4;
        const rightIdx = (y * w + (w - 1)) * 4;
        sampleBorderPoints.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
        sampleBorderPoints.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
      }

      // Calculate average background color from border samples
      let rSum = 0, gSum = 0, bSum = 0;
      for (const p of sampleBorderPoints) {
        rSum += p[0];
        gSum += p[1];
        bSum += p[2];
      }
      const count = sampleBorderPoints.length;
      const avgR = rSum / count;
      const avgG = gSum / count;
      const avgB = bSum / count;

      // Threshold according to level
      let threshold = 38;
      let softEdge = 18;

      if (level === 'soft') {
        threshold = 28;
        softEdge = 24;
      } else if (level === 'deep') {
        threshold = 50;
        softEdge = 10;
      }

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance in color space
        const dist = Math.sqrt(
          (r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2
        );

        if (dist < threshold) {
          data[i + 3] = 0; // Transparent
        } else if (dist < threshold + softEdge) {
          const factor = (dist - threshold) / softEdge;
          data[i + 3] = Math.round(factor * 255);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = srcUrl;
  });
}
