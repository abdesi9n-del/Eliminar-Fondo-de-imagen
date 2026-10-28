import { BackgroundConfig, CanvasDimensions, ExportSettings, SubjectTransform } from '../types';

/**
 * Loads an image from dataURL or URL with crossOrigin anonymous
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('No se pudo cargar la imagen: ' + e));
    img.src = src;
  });
}

/**
 * Calculates subject position and size on canvas while strictly PRESERVING aspect ratio (no deformation!)
 */
export function calculateSubjectLayout(
  imageWidth: number,
  imageHeight: number,
  canvasDims: CanvasDimensions,
  transform: SubjectTransform
) {
  const { width: canvasW, height: canvasH, paddingTop, paddingBottom, paddingLeft, paddingRight } = canvasDims;
  
  // Available usable content area after canvas margins/paddings
  const usableW = Math.max(10, canvasW - paddingLeft - paddingRight);
  const usableH = Math.max(10, canvasH - paddingTop - paddingBottom);

  // Default "Contain" scale preserving aspect ratio 1:1
  const scaleX = usableW / imageWidth;
  const scaleY = usableH / imageHeight;
  const baseScale = Math.min(scaleX, scaleY);

  // Final scale applying user's scale transform
  const finalScale = baseScale * transform.scale;
  const drawWidth = imageWidth * finalScale;
  const drawHeight = imageHeight * finalScale;

  // Center of usable area + user's X/Y offset
  const centerX = paddingLeft + (usableW / 2) + transform.x;
  const centerY = paddingTop + (usableH / 2) + transform.y;

  return {
    drawWidth,
    drawHeight,
    centerX,
    centerY,
    left: centerX - drawWidth / 2,
    top: centerY - drawHeight / 2,
    usableW,
    usableH,
  };
}

/**
 * Render the entire composition onto a target HTMLCanvasElement
 */
export async function renderComposition(
  canvas: HTMLCanvasElement,
  cutoutImg: HTMLImageElement | null,
  canvasDims: CanvasDimensions,
  transform: SubjectTransform,
  bgConfig: BackgroundConfig,
  options: {
    exportScale?: number;
    showCheckerboard?: boolean;
    bgImageElement?: HTMLImageElement | null;
  } = {}
) {
  const exportScale = options.exportScale || 1;
  const totalW = Math.round(canvasDims.width * exportScale);
  const totalH = Math.round(canvasDims.height * exportScale);

  canvas.width = totalW;
  canvas.height = totalH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(exportScale, exportScale);

  const cw = canvasDims.width;
  const ch = canvasDims.height;

  // 1. Draw Background
  if (bgConfig.type === 'transparent') {
    if (options.showCheckerboard) {
      drawCheckerboard(ctx, cw, ch);
    } else {
      ctx.clearRect(0, 0, cw, ch);
    }
  } else if (bgConfig.type === 'color') {
    ctx.fillStyle = bgConfig.color || '#FFFFFF';
    ctx.fillRect(0, 0, cw, ch);
  } else if (bgConfig.type === 'gradient') {
    const { from, to, direction } = bgConfig.gradient;
    let grad: CanvasGradient;

    if (direction === 'radial') {
      const cx = cw / 2;
      const cy = ch / 2;
      const radius = Math.max(cw, ch) * 0.7;
      grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
    } else if (direction === 'to-r') {
      grad = ctx.createLinearGradient(0, 0, cw, 0);
    } else if (direction === 'to-br') {
      grad = ctx.createLinearGradient(0, 0, cw, ch);
    } else {
      // to-b
      grad = ctx.createLinearGradient(0, 0, 0, ch);
    }

    grad.addColorStop(0, from);
    grad.addColorStop(1, to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
  } else if (bgConfig.type === 'image' && options.bgImageElement) {
    // Cover background image
    const bgImg = options.bgImageElement;
    const bgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
    const canvasRatio = cw / ch;
    let dw = cw;
    let dh = ch;
    let dx = 0;
    let dy = 0;

    if (canvasRatio > bgRatio) {
      dh = cw / bgRatio;
      dy = (ch - dh) / 2;
    } else {
      dw = ch * bgRatio;
      dx = (cw - dw) / 2;
    }
    ctx.drawImage(bgImg, dx, dy, dw, dh);
  }

  // 2. Draw Subject & Shadow
  if (cutoutImg && cutoutImg.complete && cutoutImg.naturalWidth > 0) {
    const layout = calculateSubjectLayout(
      cutoutImg.naturalWidth,
      cutoutImg.naturalHeight,
      canvasDims,
      transform
    );

    // Realistic Drop Shadow
    if (bgConfig.shadow && bgConfig.shadow.enabled && bgConfig.shadow.opacity > 0) {
      ctx.save();
      ctx.translate(layout.centerX, layout.centerY);
      if (transform.rotation !== 0) {
        ctx.rotate((transform.rotation * Math.PI) / 180);
      }
      ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1);

      // Create blurred shadow
      const s = bgConfig.shadow;
      ctx.shadowColor = hexToRgba(s.color || '#000000', s.opacity);
      ctx.shadowBlur = s.blur;
      ctx.shadowOffsetX = s.offsetX;
      ctx.shadowOffsetY = s.offsetY;

      // Draw silhouette for shadow
      ctx.drawImage(
        cutoutImg,
        -layout.drawWidth / 2,
        -layout.drawHeight / 2,
        layout.drawWidth,
        layout.drawHeight
      );
      ctx.restore();
    }

    // Draw the subject image
    ctx.save();
    ctx.translate(layout.centerX, layout.centerY);

    if (transform.rotation !== 0) {
      ctx.rotate((transform.rotation * Math.PI) / 180);
    }
    ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1);

    // Image adjustments (brightness, contrast, saturation, opacity)
    const filters: string[] = [];
    if (transform.brightness !== 100) filters.push(`brightness(${transform.brightness}%)`);
    if (transform.contrast !== 100) filters.push(`contrast(${transform.contrast}%)`);
    if (transform.saturation !== 100) filters.push(`saturate(${transform.saturation}%)`);
    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
    }

    ctx.globalAlpha = transform.opacity ?? 1;

    ctx.drawImage(
      cutoutImg,
      -layout.drawWidth / 2,
      -layout.drawHeight / 2,
      layout.drawWidth,
      layout.drawHeight
    );

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draw a clean transparency checkerboard
 */
function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number, size = 16) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#E2E8F0';

  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 1) {
        ctx.fillRect(x, y, Math.min(size, w - x), Math.min(size, h - y));
      }
    }
  }
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Export canvas to image file Blob with exact format (PNG transparent or JPG with color)
 */
export async function exportImage(
  cutoutImg: HTMLImageElement | null,
  canvasDims: CanvasDimensions,
  transform: SubjectTransform,
  bgConfig: BackgroundConfig,
  exportSettings: ExportSettings,
  bgImageElement?: HTMLImageElement | null
): Promise<{ blob: Blob; dataUrl: string; sizeBytes: number }> {
  const offscreenCanvas = document.createElement('canvas');

  // If exporting as JPG, background cannot be transparent - force solid color if transparent is set
  const effectiveBgConfig: BackgroundConfig = {
    ...bgConfig,
    type: exportSettings.format === 'jpeg' && bgConfig.type === 'transparent' ? 'color' : bgConfig.type,
    color: bgConfig.type === 'transparent' && exportSettings.format === 'jpeg' ? '#FFFFFF' : bgConfig.color,
  };

  await renderComposition(
    offscreenCanvas,
    cutoutImg,
    canvasDims,
    transform,
    effectiveBgConfig,
    {
      exportScale: exportSettings.scale,
      showCheckerboard: false,
      bgImageElement,
    }
  );

  const mimeType = exportSettings.format === 'jpeg' ? 'image/jpeg' : exportSettings.format === 'webp' ? 'image/webp' : 'image/png';
  const quality = exportSettings.format === 'png' ? undefined : exportSettings.quality;

  const dataUrl = offscreenCanvas.toDataURL(mimeType, quality);
  const blob = await (await fetch(dataUrl)).blob();

  return {
    blob,
    dataUrl,
    sizeBytes: blob.size,
  };
}

/**
 * Triggers browser download of file
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
