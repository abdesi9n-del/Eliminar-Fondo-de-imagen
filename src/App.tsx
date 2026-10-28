import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { EditorCanvas } from './components/EditorCanvas';
import { SidebarTabs } from './components/SidebarTabs';
import { 
  BackgroundConfig, 
  CanvasDimensions, 
  ExportSettings, 
  SubjectTransform, 
  ToolMode, 
  BrushSettings,
  MagicWandSettings 
} from './types';
import { processBackgroundRemoval } from './utils/removeBackground';
import { exportImage, downloadBlob, loadImage } from './utils/canvasRenderer';
import { Sparkles, Wand2, Check, AlertCircle } from 'lucide-react';

interface HistoryState {
  canvasDims: CanvasDimensions;
  transform: SubjectTransform;
  bgConfig: BackgroundConfig;
  cutoutImgSrc?: string;
}

export default function App() {
  // Main Image States
  const [originalImgSrc, setOriginalImgSrc] = useState<string | null>(null);
  const [originalImgElement, setOriginalImgElement] = useState<HTMLImageElement | null>(null);
  const [cutoutImgSrc, setCutoutImgSrc] = useState<string | null>(null);
  const [initialCutoutSrc, setInitialCutoutSrc] = useState<string | null>(null);
  const [cutoutImgElement, setCutoutImgElement] = useState<HTMLImageElement | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({
    width: 1080,
    height: 1080,
  });

  // Processing Progress
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');

  // Canvas Dimensions
  const [canvasDims, setCanvasDims] = useState<CanvasDimensions>({
    width: 1080,
    height: 1080,
    aspectRatioLocked: false,
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
  });

  // Subject Position & Transformations (strictly non-deforming)
  const [transform, setTransform] = useState<SubjectTransform>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });

  // Background Options (transparent, solid color, gradient, realistic shadow)
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>({
    type: 'transparent',
    color: '#FFFFFF',
    gradient: {
      from: '#FFFFFF',
      to: '#D1D5DB',
      direction: 'radial',
      name: 'Estudio Spotlight Centro',
    },
    shadow: {
      enabled: false,
      blur: 25,
      opacity: 0.35,
      offsetX: 0,
      offsetY: 20,
      color: '#000000',
    },
  });

  // Export Settings (PNG transparent vs JPG color vs WEBP)
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'png',
    quality: 0.92,
    scale: 1,
    fileName: 'retoucher_cutout',
  });

  // Interactive Tools
  const [toolMode, setToolMode] = useState<ToolMode>('move');
  const [magicWandSettings, setMagicWandSettings] = useState<MagicWandSettings>({
    tolerance: 25,
    contiguous: true,
  });
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 40,
    hardness: 0.7,
    opacity: 1,
  });
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    subject?: string;
    tips?: string;
    recommendedBackgroundColors?: string[];
  } | null>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Push to history when major changes occur
  const pushHistory = useCallback((newDims: CanvasDimensions, newT: SubjectTransform, newBg: BackgroundConfig, newCutoutSrc?: string) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      const activeCutout = newCutoutSrc !== undefined ? newCutoutSrc : (prev[historyIndex]?.cutoutImgSrc || cutoutImgSrc || '');
      return [...sliced, { canvasDims: newDims, transform: newT, bgConfig: newBg, cutoutImgSrc: activeCutout }];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex, cutoutImgSrc]);

  // Load image element when cutout src changes
  useEffect(() => {
    if (!cutoutImgSrc) {
      setCutoutImgElement(null);
      return;
    }
    loadImage(cutoutImgSrc)
      .then((img) => setCutoutImgElement(img))
      .catch((err) => console.error('Failed to load cutout image element:', err));
  }, [cutoutImgSrc]);

  // Load original image element
  useEffect(() => {
    if (!originalImgSrc) {
      setOriginalImgElement(null);
      return;
    }
    loadImage(originalImgSrc)
      .then((img) => setOriginalImgElement(img))
      .catch((err) => console.error('Failed to load original image element:', err));
  }, [originalImgSrc]);

  // Handle image upload & automatic background removal
  const handleImageSelected = async (source: File | string) => {
    try {
      setIsLoading(true);
      setProgressPercent(10);
      setProgressStatus('Cargando imagen...');

      let srcUrl = '';
      if (typeof source === 'string') {
        srcUrl = source;
      } else {
        srcUrl = URL.createObjectURL(source);
      }
      setOriginalImgSrc(srcUrl);

      // Measure dimensions
      const originalImg = await loadImage(srcUrl);
      const w = originalImg.naturalWidth || 1080;
      const h = originalImg.naturalHeight || 1080;
      setOriginalDimensions({ width: w, height: h });

      // Initialize canvas size to match image or clean 1:1 square
      const initialW = Math.max(800, Math.min(2400, w));
      const initialH = Math.max(800, Math.min(2400, h));
      const initialDims: CanvasDimensions = {
        width: initialW,
        height: initialH,
        aspectRatioLocked: false,
        paddingTop: 30,
        paddingBottom: 30,
        paddingLeft: 30,
        paddingRight: 30,
      };
      setCanvasDims(initialDims);

      const initialTransform: SubjectTransform = {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        flipX: false,
        flipY: false,
        opacity: 1,
        brightness: 100,
        contrast: 100,
        saturation: 100,
      };
      setTransform(initialTransform);

      // Process Background Removal
      const result = await processBackgroundRemoval(source, ({ progress, status }) => {
        setProgressPercent(progress);
        setProgressStatus(status);
      });

      setCutoutImgSrc(result.dataUrl);
      setInitialCutoutSrc(result.dataUrl);

      // Reset history
      const initialBg: BackgroundConfig = {
        type: 'transparent',
        color: '#FFFFFF',
        gradient: {
          from: '#FFFFFF',
          to: '#D1D5DB',
          direction: 'radial',
          name: 'Estudio Spotlight Centro',
        },
        shadow: {
          enabled: false,
          blur: 25,
          opacity: 0.35,
          offsetX: 0,
          offsetY: 20,
          color: '#000000',
        },
      };
      setBgConfig(initialBg);
      setHistory([{ canvasDims: initialDims, transform: initialTransform, bgConfig: initialBg, cutoutImgSrc: result.dataUrl }]);
      setHistoryIndex(0);

      // Attempt AI subject recommendation in background
      tryAnalyzeSubject(result.dataUrl);
    } catch (error) {
      console.error('Error procesando imagen:', error);
      alert('Hubo un problema al procesar la imagen. Se ha cargado la imagen para edición manual.');
    } finally {
      setIsLoading(false);
    }
  };

  // Optional AI analysis via server proxy
  const tryAnalyzeSubject = async (base64Url: string) => {
    try {
      const res = await fetch('/api/ai/analyze-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Url }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data);
      }
    } catch (e) {
      // Non-critical, continue smoothly
    }
  };

  // Clipboard Paste Support (Ctrl+V anywhere)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageSelected(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Fit Contain calculation (scales subject to fit perfectly inside canvas without deformation)
  const handleFitContain = () => {
    if (!cutoutImgElement) return;
    const { width: cw, height: ch, paddingTop, paddingBottom, paddingLeft, paddingRight } = canvasDims;
    const usableW = Math.max(10, cw - paddingLeft - paddingRight);
    const usableH = Math.max(10, ch - paddingTop - paddingBottom);

    const scaleX = usableW / cutoutImgElement.naturalWidth;
    const scaleY = usableH / cutoutImgElement.naturalHeight;
    const idealScale = Math.min(scaleX, scaleY);

    setTransform((t) => {
      const next = { ...t, scale: 1, x: 0, y: 0 };
      pushHistory(canvasDims, next, bgConfig);
      return next;
    });
  };

  // Fit Cover calculation
  const handleFitCover = () => {
    if (!cutoutImgElement) return;
    const { width: cw, height: ch } = canvasDims;
    const scaleX = cw / cutoutImgElement.naturalWidth;
    const scaleY = ch / cutoutImgElement.naturalHeight;
    const coverScale = Math.max(scaleX, scaleY);
    const baseScale = Math.min(scaleX, scaleY);
    const multiplier = Number((coverScale / (baseScale || 1)).toFixed(2));

    setTransform((t) => {
      const next = { ...t, scale: Math.max(1, multiplier), x: 0, y: 0 };
      pushHistory(canvasDims, next, bgConfig);
      return next;
    });
  };

  // Reset to original dimensions
  const handleResetOriginalSize = () => {
    setCanvasDims((d) => {
      const next = {
        ...d,
        width: originalDimensions.width,
        height: originalDimensions.height,
      };
      pushHistory(next, transform, bgConfig);
      return next;
    });
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setCanvasDims(prev.canvasDims);
      setTransform(prev.transform);
      setBgConfig(prev.bgConfig);
      if (prev.cutoutImgSrc) {
        setCutoutImgSrc(prev.cutoutImgSrc);
      }
      setHistoryIndex((i) => i - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setCanvasDims(next.canvasDims);
      setTransform(next.transform);
      setBgConfig(next.bgConfig);
      if (next.cutoutImgSrc) {
        setCutoutImgSrc(next.cutoutImgSrc);
      }
      setHistoryIndex((i) => i + 1);
    }
  };

  // Apply edits from Magic Wand or Brush
  const handleApplyImageEdit = (newDataUrl: string) => {
    setCutoutImgSrc(newDataUrl);
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, { canvasDims, transform, bgConfig, cutoutImgSrc: newDataUrl }];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  // Reset Cutout to initial AI Cutout
  const handleResetCutoutToOriginal = () => {
    if (initialCutoutSrc) {
      handleApplyImageEdit(initialCutoutSrc);
    }
  };

  // Export & Download
  const handleExport = async () => {
    try {
      const res = await exportImage(
        cutoutImgElement,
        canvasDims,
        transform,
        bgConfig,
        exportSettings
      );

      const ext = exportSettings.format === 'jpeg' ? 'jpg' : exportSettings.format;
      const fileName = `${exportSettings.fileName || 'retoucher_imagen'}.${ext}`;
      downloadBlob(res.blob, fileName);
    } catch (e) {
      console.error('Error al exportar imagen:', e);
      alert('Hubo un error al generar la imagen para descargar.');
    }
  };

  // Copy Image to Clipboard
  const handleCopyClipboard = async () => {
    try {
      const res = await exportImage(
        cutoutImgElement,
        canvasDims,
        transform,
        bgConfig,
        { ...exportSettings, format: 'png' } // Clipboard API prefers PNG
      );

      if (navigator.clipboard && (window as any).ClipboardItem) {
        const item = new (window as any).ClipboardItem({ 'image/png': res.blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        alert('Tu navegador no soporta copiar imágenes directamente. Usa el botón Descargar.');
      }
    } catch (e) {
      console.error('Error al copiar al portapapeles:', e);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-800 text-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        hasImage={Boolean(cutoutImgSrc)}
        canvasDims={canvasDims}
        exportSettings={exportSettings}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        showComparison={showComparison}
        onToggleComparison={() => setShowComparison((s) => !s)}
        onNewImage={() => {
          setOriginalImgSrc(null);
          setCutoutImgSrc(null);
          setInitialCutoutSrc(null);
        }}
        onExport={handleExport}
        onCopyClipboard={handleCopyClipboard}
        copied={copied}
      />

      {/* Main Workspace */}
      {!cutoutImgSrc ? (
        <main className="flex-1 flex items-center justify-center">
          <UploadZone
            onImageSelected={handleImageSelected}
            isLoading={isLoading}
            progressText={progressStatus}
            progressPercent={progressPercent}
          />
        </main>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Center Canvas Viewport */}
          <EditorCanvas
            originalImg={originalImgElement}
            cutoutImg={cutoutImgElement}
            canvasDims={canvasDims}
            transform={transform}
            onUpdateTransform={(t) => setTransform((prev) => ({ ...prev, ...t }))}
            bgConfig={bgConfig}
            showComparison={showComparison}
            toolMode={toolMode}
            onSelectToolMode={setToolMode}
            magicWandSettings={magicWandSettings}
            onUpdateMagicWandSettings={(s) => setMagicWandSettings((prev) => ({ ...prev, ...s }))}
            brushSettings={brushSettings}
            onUpdateBrushSettings={(b) => setBrushSettings((prev) => ({ ...prev, ...b }))}
            onApplyImageEdit={handleApplyImageEdit}
          />

          {/* Right Editing Sidebar */}
          <SidebarTabs
            canvasDims={canvasDims}
            onUpdateCanvasDims={(dims) => setCanvasDims((prev) => ({ ...prev, ...dims }))}
            transform={transform}
            onUpdateTransform={(t) => setTransform((prev) => ({ ...prev, ...t }))}
            bgConfig={bgConfig}
            onUpdateBgConfig={(bg) => setBgConfig((prev) => ({ ...prev, ...bg }))}
            exportSettings={exportSettings}
            onUpdateExportSettings={(s) => setExportSettings((prev) => ({ ...prev, ...s }))}
            originalDimensions={originalDimensions}
            onFitContain={handleFitContain}
            onFitCover={handleFitCover}
            onResetOriginalSize={handleResetOriginalSize}
            onResetSubjectTransform={() =>
              setTransform({
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0,
                flipX: false,
                flipY: false,
                opacity: 1,
                brightness: 100,
                contrast: 100,
                saturation: 100,
              })
            }
            onExport={handleExport}
            onCopyClipboard={handleCopyClipboard}
            copied={copied}
            toolMode={toolMode}
            onSelectToolMode={setToolMode}
            magicWandSettings={magicWandSettings}
            onUpdateMagicWandSettings={(s) => setMagicWandSettings((prev) => ({ ...prev, ...s }))}
            brushSettings={brushSettings}
            onUpdateBrushSettings={(b) => setBrushSettings((prev) => ({ ...prev, ...b }))}
            onResetCutoutToOriginal={handleResetCutoutToOriginal}
          />
        </div>
      )}
    </div>
  );
}
