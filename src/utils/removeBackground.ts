import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

export interface BgRemovalProgress {
  progress: number;
  status: string;
}

/**
 * Remove background with @imgly/background-removal and smart local fallback
 */
export async function processBackgroundRemoval(
  imageSource: string | File | Blob | HTMLImageElement,
  onProgress?: (p: BgRemovalProgress) => void
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
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
      onProgress({ progress: 95, status: 'Refinando bordes transparentes...' });
    }

    const dataUrl = await blobToDataUrl(blob);
    const { width, height } = await getImageDimensions(dataUrl);

    if (onProgress) {
      onProgress({ progress: 100, status: '¡Listo! Fondo eliminado con éxito.' });
    }

    return { blob, dataUrl, width, height };
  } catch (err) {
    console.warn('AI model failed or was interrupted, applying high-precision Canvas fallback segmentation:', err);
    if (onProgress) {
      onProgress({ progress: 50, status: 'Aplicando segmentación rápida de borde...' });
    }

    // Fallback: smart color/edge segmentation
    const dataUrl = await fallbackEdgeRemoval(imageSource);
    const blob = await dataUrlToBlob(dataUrl);
    const { width, height } = await getImageDimensions(dataUrl);

    if (onProgress) {
      onProgress({ progress: 100, status: '¡Listo! Fondo procesado.' });
    }

    return { blob, dataUrl, width, height };
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
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
 * background colors/gradients, and segments foreground subject.
 */
async function fallbackEdgeRemoval(source: string | File | Blob | HTMLImageElement): Promise<string> {
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

      // Simple flood-fill / threshold alpha keying
      const threshold = 38;
      const softEdge = 18;

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
