import { CanvasDimensions, SubjectTransform } from '../types';
import { calculateSubjectLayout } from './canvasRenderer';

/**
 * Transforms canvas coordinates to subject image local pixel coordinates
 */
export function canvasCoordsToImageCoords(
  canvasX: number,
  canvasY: number,
  imgWidth: number,
  imgHeight: number,
  canvasDims: CanvasDimensions,
  transform: SubjectTransform
): { x: number; y: number; inside: boolean } {
  const layout = calculateSubjectLayout(imgWidth, imgHeight, canvasDims, transform);

  // Offset from subject center
  let dx = canvasX - layout.centerX;
  let dy = canvasY - layout.centerY;

  // Invert rotation
  if (transform.rotation !== 0) {
    const rad = (-transform.rotation * Math.PI) / 180;
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
    dx = rx;
    dy = ry;
  }

  // Invert flip
  if (transform.flipX) dx = -dx;
  if (transform.flipY) dy = -dy;

  // Invert scale
  const scale = layout.drawWidth / imgWidth;
  const localX = dx / scale + imgWidth / 2;
  const localY = dy / scale + imgHeight / 2;

  const inside = localX >= 0 && localX < imgWidth && localY >= 0 && localY < imgHeight;

  return {
    x: Math.round(localX),
    y: Math.round(localY),
    inside,
  };
}

/**
 * Magic Wand: Tap on any part of the image to erase that connected region or color
 */
export function magicWandErase(
  cutoutCanvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  tolerancePercent: number,
  contiguous: boolean
): string {
  const ctx = cutoutCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return cutoutCanvas.toDataURL('image/png');

  const w = cutoutCanvas.width;
  const h = cutoutCanvas.height;

  if (startX < 0 || startX >= w || startY < 0 || startY >= h) {
    return cutoutCanvas.toDataURL('image/png');
  }

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const startIndex = (startY * w + startX) * 4;
  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];
  const targetA = data[startIndex + 3];

  // If already transparent, nothing to erase
  if (targetA === 0) {
    return cutoutCanvas.toDataURL('image/png');
  }

  // Max Euclidean RGB distance is sqrt(255^2 * 3) ~ 441.67
  const maxDist = Math.sqrt(255 * 255 * 3);
  const maxThreshold = (tolerancePercent / 100) * maxDist;
  const softEdgeWidth = Math.max(5, maxThreshold * 0.25);

  if (contiguous) {
    // Breadth-first search / queue flood fill
    const visited = new Uint8Array(w * h);
    const queueX = new Int32Array(w * h);
    const queueY = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    queueX[tail] = startX;
    queueY[tail] = startY;
    tail++;
    visited[startY * w + startX] = 1;

    while (head < tail) {
      const cx = queueX[head];
      const cy = queueY[head];
      head++;

      const idx = (cy * w + cx) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a > 0) {
        const dist = Math.sqrt(
          (r - targetR) ** 2 + (g - targetG) ** 2 + (b - targetB) ** 2
        );

        if (dist <= maxThreshold) {
          if (dist > maxThreshold - softEdgeWidth) {
            const factor = (dist - (maxThreshold - softEdgeWidth)) / softEdgeWidth;
            data[idx + 3] = Math.round(data[idx + 3] * factor);
          } else {
            data[idx + 3] = 0;
          }

          // Check 4-connected neighbors
          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];

          for (let i = 0; i < 4; i++) {
            const nx = neighbors[i][0];
            const ny = neighbors[i][1];

            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nPos = ny * w + nx;
              if (visited[nPos] === 0) {
                visited[nPos] = 1;
                const nIdx = nPos * 4;
                const nR = data[nIdx];
                const nG = data[nIdx + 1];
                const nB = data[nIdx + 2];
                const nA = data[nIdx + 3];

                if (nA > 0) {
                  const nDist = Math.sqrt(
                    (nR - targetR) ** 2 + (nG - targetG) ** 2 + (nB - targetB) ** 2
                  );
                  if (nDist <= maxThreshold) {
                    queueX[tail] = nx;
                    queueY[tail] = ny;
                    tail++;
                  }
                }
              }
            }
          }
        }
      }
    }
  } else {
    // Global color erase (removes this color everywhere in image)
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a === 0) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const dist = Math.sqrt(
        (r - targetR) ** 2 + (g - targetG) ** 2 + (b - targetB) ** 2
      );

      if (dist <= maxThreshold) {
        if (dist > maxThreshold - softEdgeWidth) {
          const factor = (dist - (maxThreshold - softEdgeWidth)) / softEdgeWidth;
          data[i + 3] = Math.round(data[i + 3] * factor);
        } else {
          data[i + 3] = 0;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return cutoutCanvas.toDataURL('image/png');
}

/**
 * Brush Erase on image canvas
 */
export function brushEraseCircle(
  cutoutCanvas: HTMLCanvasElement,
  centerX: number,
  centerY: number,
  radius: number,
  hardness: number
): void {
  const ctx = cutoutCanvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';

  if (hardness >= 0.95) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const grad = ctx.createRadialGradient(
      centerX,
      centerY,
      radius * hardness,
      centerX,
      centerY,
      radius
    );
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Brush Restore: Restores original pixels from source image onto cutout
 */
export function brushRestoreCircle(
  cutoutCanvas: HTMLCanvasElement,
  originalImg: HTMLImageElement,
  centerX: number,
  centerY: number,
  radius: number,
  hardness: number
): void {
  const ctx = cutoutCanvas.getContext('2d');
  if (!ctx) return;

  ctx.save();

  // Create clipping mask for the brush circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  // Draw the original image over the clipped region
  ctx.drawImage(originalImg, 0, 0, cutoutCanvas.width, cutoutCanvas.height);

  ctx.restore();
}
