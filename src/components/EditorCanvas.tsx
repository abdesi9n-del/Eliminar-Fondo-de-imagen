import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Move, 
  Eraser, 
  Paintbrush, 
  Grid, 
  Wand2,
  Info,
  SlidersHorizontal,
  Check,
  Feather,
  Zap,
  Sparkles,
  RotateCcw,
  SquareDashed,
  Crop,
  Scissors,
  Trash2,
  X
} from 'lucide-react';
import { 
  BackgroundConfig, 
  CanvasDimensions, 
  SubjectTransform, 
  ToolMode, 
  BrushSettings,
  MagicWandSettings,
  RemovalLevel,
  SelectionRect 
} from '../types';
import { calculateSubjectLayout, renderComposition } from '../utils/canvasRenderer';
import { 
  canvasCoordsToImageCoords, 
  canvasRectToImageRect,
  eraseOutsideRect,
  eraseInsideRect,
  magicWandErase, 
  brushEraseCircle, 
  brushRestoreCircle 
} from '../utils/imageEditor';

interface EditorCanvasProps {
  originalImg: HTMLImageElement | null;
  cutoutImg: HTMLImageElement | null;
  canvasDims: CanvasDimensions;
  transform: SubjectTransform;
  onUpdateTransform: (t: Partial<SubjectTransform>) => void;
  bgConfig: BackgroundConfig;
  showComparison: boolean;
  toolMode: ToolMode;
  onSelectToolMode: (mode: ToolMode) => void;
  magicWandSettings: MagicWandSettings;
  onUpdateMagicWandSettings: (s: Partial<MagicWandSettings>) => void;
  brushSettings: BrushSettings;
  onUpdateBrushSettings: (b: Partial<BrushSettings>) => void;
  onApplyImageEdit: (newDataUrl: string) => void;
  removalLevel: RemovalLevel;
  onSelectRemovalLevel: (level: RemovalLevel) => void;
  onTriggerAiRemoval?: () => void;
  onResetToOriginal?: () => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  originalImg,
  cutoutImg,
  canvasDims,
  transform,
  onUpdateTransform,
  bgConfig,
  showComparison,
  toolMode,
  onSelectToolMode,
  magicWandSettings,
  onUpdateMagicWandSettings,
  brushSettings,
  onUpdateBrushSettings,
  onApplyImageEdit,
  removalLevel,
  onSelectRemovalLevel,
  onTriggerAiRemoval,
  onResetToOriginal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  // Hidden working canvas for pixel manipulations
  const workingCutoutCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport Zoom & Pan
  const [zoom, setZoom] = useState<number>(1);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [isDraggingSubject, setIsDraggingSubject] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; initialX: number; initialY: number } | null>(null);

  // Brush drawing state
  const [isPainting, setIsPainting] = useState<boolean>(false);
  const [hasPaintedAny, setHasPaintedAny] = useState<boolean>(false);

  // Split Comparison Slider (0 to 100%)
  const [compareSplit, setCompareSplit] = useState<number>(50);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);

  // Snapping guide indicator
  const [snapH, setSnapH] = useState<boolean>(false);
  const [snapV, setSnapV] = useState<boolean>(false);

  // Mouse position for cursor preview & ripples
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [tapRipple, setTapRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  // Bounding box selection state (recuadro de proporción libre)
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [isSelectingBox, setIsSelectingBox] = useState<boolean>(false);

  // Fit canvas into view automatically on init or resize
  const fitToView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 60;
    const availW = Math.max(100, clientWidth - padding);
    const availH = Math.max(100, clientHeight - padding);

    const scaleW = availW / canvasDims.width;
    const scaleH = availH / canvasDims.height;
    const initialZoom = Math.min(scaleW, scaleH, 1);
    setZoom(Number(initialZoom.toFixed(2)));
  }, [canvasDims.width, canvasDims.height]);

  useEffect(() => {
    fitToView();
  }, [fitToView]);

  // Sync working canvas with cutoutImg
  useEffect(() => {
    if (!cutoutImg || cutoutImg.naturalWidth === 0) return;
    if (!workingCutoutCanvasRef.current) {
      workingCutoutCanvasRef.current = document.createElement('canvas');
    }
    const wc = workingCutoutCanvasRef.current;
    wc.width = cutoutImg.naturalWidth;
    wc.height = cutoutImg.naturalHeight;
    const ctx = wc.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, wc.width, wc.height);
      ctx.drawImage(cutoutImg, 0, 0);
    }
  }, [cutoutImg]);

  // Main canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderComposition(canvas, cutoutImg, canvasDims, transform, bgConfig, {
      showCheckerboard: true,
    });
  }, [cutoutImg, canvasDims, transform, bgConfig]);

  // Comparison canvas rendering
  useEffect(() => {
    if (!showComparison || !originalCanvasRef.current || !originalImg) return;
    const canvas = originalCanvasRef.current;
    canvas.width = canvasDims.width;
    canvas.height = canvasDims.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasDims.width, canvasDims.height);
    
    const scale = Math.min(
      canvasDims.width / originalImg.naturalWidth,
      canvasDims.height / originalImg.naturalHeight
    );
    const w = originalImg.naturalWidth * scale;
    const h = originalImg.naturalHeight * scale;
    const x = (canvasDims.width - w) / 2;
    const y = (canvasDims.height - h) / 2;

    ctx.drawImage(originalImg, x, y, w, h);
  }, [showComparison, originalImg, canvasDims]);

  // Helper to convert pointer event to canvas coordinates
  const getCanvasCoordsFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;
    return { canvasX, canvasY, clientX: e.clientX, clientY: e.clientY };
  };

  // Pointer Down handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (showComparison) return;
    const coords = getCanvasCoordsFromEvent(e);
    if (!coords || !cutoutImg) return;

    const imgCoords = canvasCoordsToImageCoords(
      coords.canvasX,
      coords.canvasY,
      cutoutImg.naturalWidth,
      cutoutImg.naturalHeight,
      canvasDims,
      transform
    );

    // 0. BOX SELECT: Freeform bounding box
    if (toolMode === 'box-select') {
      setSelectionStart({ x: coords.canvasX, y: coords.canvasY });
      setSelectionRect({ x: coords.canvasX, y: coords.canvasY, width: 0, height: 0 });
      setIsSelectingBox(true);
      return;
    }

    // 1. MAGIC WAND: Tap to delete specific region or color
    if (toolMode === 'magic-wand') {
      if (imgCoords.inside && workingCutoutCanvasRef.current) {
        // Trigger visual tap feedback
        setTapRipple({ x: coords.clientX, y: coords.clientY, id: Date.now() });
        setTimeout(() => setTapRipple(null), 600);

        const newCutoutUrl = magicWandErase(
          workingCutoutCanvasRef.current,
          imgCoords.x,
          imgCoords.y,
          magicWandSettings.tolerance,
          magicWandSettings.contiguous
        );

        onApplyImageEdit(newCutoutUrl);
      }
      return;
    }

    // 2. BRUSH ERASE or RESTORE
    if (toolMode === 'erase' || toolMode === 'restore') {
      if (imgCoords.inside && workingCutoutCanvasRef.current) {
        setIsPainting(true);
        setHasPaintedAny(true);
        applyBrushAtCoords(imgCoords.x, imgCoords.y);
      }
      return;
    }

    // 3. MOVE TOOL: Drag subject
    if (toolMode === 'move') {
      setIsDraggingSubject(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        initialX: transform.x,
        initialY: transform.y,
      });
    }
  };

  // Paint circle on working canvas at local image coordinates
  const applyBrushAtCoords = (imgX: number, imgY: number) => {
    if (!workingCutoutCanvasRef.current || !cutoutImg) return;
    const wc = workingCutoutCanvasRef.current;
    
    // Scale brush radius to image coordinates
    const layout = calculateSubjectLayout(cutoutImg.naturalWidth, cutoutImg.naturalHeight, canvasDims, transform);
    const scale = layout.drawWidth / cutoutImg.naturalWidth;
    const brushRadius = (brushSettings.size / 2) / (scale || 1);

    if (toolMode === 'erase') {
      brushEraseCircle(wc, imgX, imgY, brushRadius, brushSettings.hardness);
    } else if (toolMode === 'restore' && originalImg) {
      brushRestoreCircle(wc, originalImg, imgX, imgY, brushRadius, brushSettings.hardness);
    }

    // Fast preview re-render
    const mainCanvas = canvasRef.current;
    if (mainCanvas) {
      renderComposition(mainCanvas, wc as unknown as HTMLImageElement, canvasDims, transform, bgConfig, {
        showCheckerboard: true,
      });
    }
  };

  // Pointer Move handler
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    // Dragging box select rectangle
    if (isSelectingBox && selectionStart && toolMode === 'box-select') {
      const coords = getCanvasCoordsFromEvent(e);
      if (coords) {
        const curX = coords.canvasX;
        const curY = coords.canvasY;
        const rx = Math.min(selectionStart.x, curX);
        const ry = Math.min(selectionStart.y, curY);
        const rw = Math.abs(curX - selectionStart.x);
        const rh = Math.abs(curY - selectionStart.y);
        setSelectionRect({ x: rx, y: ry, width: rw, height: rh });
      }
      return;
    }

    // Painting with brush
    if (isPainting && (toolMode === 'erase' || toolMode === 'restore') && cutoutImg) {
      const coords = getCanvasCoordsFromEvent(e);
      if (coords) {
        const imgCoords = canvasCoordsToImageCoords(
          coords.canvasX,
          coords.canvasY,
          cutoutImg.naturalWidth,
          cutoutImg.naturalHeight,
          canvasDims,
          transform
        );
        if (imgCoords.inside) {
          applyBrushAtCoords(imgCoords.x, imgCoords.y);
        }
      }
      return;
    }

    // Dragging subject
    if (isDraggingSubject && dragStart) {
      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;

      let newX = Math.round(dragStart.initialX + deltaX);
      let newY = Math.round(dragStart.initialY + deltaY);

      const snapThreshold = 8;
      const isCenteredX = Math.abs(newX) < snapThreshold;
      const isCenteredY = Math.abs(newY) < snapThreshold;

      if (isCenteredX) newX = 0;
      if (isCenteredY) newY = 0;

      setSnapV(isCenteredX);
      setSnapH(isCenteredY);

      onUpdateTransform({ x: newX, y: newY });
    }
  };

  // Pointer Up handler
  const handlePointerUp = () => {
    if (isSelectingBox && toolMode === 'box-select') {
      setIsSelectingBox(false);
      setSelectionStart(null);
      if (selectionRect && (selectionRect.width < 10 || selectionRect.height < 10)) {
        setSelectionRect(null);
      }
      return;
    }
    if (isPainting && hasPaintedAny && workingCutoutCanvasRef.current) {
      const newUrl = workingCutoutCanvasRef.current.toDataURL('image/png');
      onApplyImageEdit(newUrl);
    }
    setIsPainting(false);
    setHasPaintedAny(false);
    setIsDraggingSubject(false);
    setDragStart(null);
    setSnapH(false);
    setSnapV(false);
  };

  // Actions for Box Select
  const handleFocusDetail = () => {
    if (!selectionRect || !containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 120;
    const availW = Math.max(100, clientWidth - padding);
    const availH = Math.max(100, clientHeight - padding);

    const scaleW = availW / Math.max(60, selectionRect.width);
    const scaleH = availH / Math.max(60, selectionRect.height);
    const targetZoom = Math.min(3.5, Math.max(1.3, Math.min(scaleW, scaleH)));
    setZoom(Number(targetZoom.toFixed(2)));

    // Shift subject transform to center this selection in viewport
    const selCenterX = selectionRect.x + selectionRect.width / 2;
    const selCenterY = selectionRect.y + selectionRect.height / 2;
    const deltaX = (canvasDims.width / 2) - selCenterX;
    const deltaY = (canvasDims.height / 2) - selCenterY;
    onUpdateTransform({
      x: Math.round(transform.x + deltaX),
      y: Math.round(transform.y + deltaY),
    });

    onSelectToolMode('magic-wand');
    setSelectionRect(null);
  };

  const handleKeepInsideEraseOutside = () => {
    if (!selectionRect || !workingCutoutCanvasRef.current || !cutoutImg) return;
    const imgRect = canvasRectToImageRect(
      selectionRect,
      cutoutImg.naturalWidth,
      cutoutImg.naturalHeight,
      canvasDims,
      transform
    );
    const newCutoutUrl = eraseOutsideRect(workingCutoutCanvasRef.current, imgRect);
    onApplyImageEdit(newCutoutUrl);
    setSelectionRect(null);
    onSelectToolMode('magic-wand');
  };

  const handleEraseInside = () => {
    if (!selectionRect || !workingCutoutCanvasRef.current || !cutoutImg) return;
    const imgRect = canvasRectToImageRect(
      selectionRect,
      cutoutImg.naturalWidth,
      cutoutImg.naturalHeight,
      canvasDims,
      transform
    );
    const newCutoutUrl = eraseInsideRect(workingCutoutCanvasRef.current, imgRect);
    onApplyImageEdit(newCutoutUrl);
    setSelectionRect(null);
  };

  const handleCancelSelection = () => {
    setSelectionRect(null);
    setSelectionStart(null);
  };

  const layout = cutoutImg && cutoutImg.naturalWidth > 0
    ? calculateSubjectLayout(cutoutImg.naturalWidth, cutoutImg.naturalHeight, canvasDims, transform)
    : null;

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 bg-neutral-800 flex items-center justify-center overflow-hidden p-6 select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Background Subtle Workspace Grid */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Floating Tool Switcher */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-neutral-800/95 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-700 shadow-2xl flex items-center space-x-1 z-30">
        <button
          onClick={() => onSelectToolMode('move')}
          title="Mover y centrar sujeto"
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            toolMode === 'move'
              ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span>Mover</span>
        </button>

        <button
          onClick={() => onSelectToolMode('box-select')}
          title="Recuadro de proporción libre: Delimita un área para trabajar a detalle o eliminar fondo exterior"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
            toolMode === 'box-select'
              ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/25'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <SquareDashed className="w-3.5 h-3.5 text-amber-300" />
          <span>Recuadro Detalle</span>
        </button>

        <button
          onClick={() => onSelectToolMode('magic-wand')}
          title="Toca cualquier parte de la imagen para borrarla al instante"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
            toolMode === 'magic-wand'
              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-300" />
          <span>Tocar para Eliminar</span>
        </button>

        <button
          onClick={() => onSelectToolMode('erase')}
          title="Pincel borrador manual"
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            toolMode === 'erase'
              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>Borrador</span>
        </button>

        <button
          onClick={() => onSelectToolMode('restore')}
          title="Pincel para restaurar partes originales"
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            toolMode === 'restore'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>Restaurar</span>
        </button>

        {/* 3-Level Background Removal Quick Switcher */}
        {removalLevel && onSelectRemovalLevel && (
          <>
            <div className="h-4 w-px bg-neutral-700 mx-1"></div>
            <div className="flex items-center space-x-1 pl-0.5">
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold hidden md:inline mr-1">
                Recorte:
              </span>
              <button
                onClick={() => onSelectRemovalLevel('soft')}
                title="Nivel Suave: Pelo fino, bordes orgánicos, sin sobrecorte"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                  removalLevel === 'soft'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <Feather className="w-3.5 h-3.5 text-emerald-400" />
                <span>Suave</span>
              </button>

              <button
                onClick={() => onSelectRemovalLevel('standard')}
                title="Nivel Estándar: Equilibrado para retratos y moda"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                  removalLevel === 'standard'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Estándar</span>
              </button>

              <button
                onClick={() => onSelectRemovalLevel('deep')}
                title="Nivel Profundo: Máxima nitidez para productos y e-commerce, sin halos"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                  removalLevel === 'deep'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Profundo</span>
              </button>
            </div>
          </>
        )}

        {/* Quick Action: Apply AI Background Removal or Reset to Original Image */}
        {(onTriggerAiRemoval || onResetToOriginal) && (
          <>
            <div className="h-4 w-px bg-neutral-700 mx-1"></div>
            <div className="flex items-center space-x-1 pl-0.5">
              {onTriggerAiRemoval && (
                <button
                  onClick={onTriggerAiRemoval}
                  title="Eliminar todo el fondo con Inteligencia Artificial"
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Quitar con IA</span>
                </button>
              )}
              {onResetToOriginal && (
                <button
                  onClick={onResetToOriginal}
                  title="Cargar la imagen original completa para seleccionar y borrar partes manualmente"
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Origen</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Info Banner for Magic Wand */}
      {toolMode === 'magic-wand' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-indigo-950/90 border border-indigo-500/30 text-indigo-200 px-4 py-2 rounded-2xl shadow-xl flex items-center space-x-3 text-xs z-30 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-1.5">
            <Wand2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Haz clic o toca la parte que quieras eliminar</span>
          </div>

          <div className="h-4 w-px bg-indigo-800"></div>

          {/* Quick Tolerance Slider */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-neutral-400">Tolerancia:</span>
            <input
              type="range"
              min="5"
              max="70"
              value={magicWandSettings.tolerance}
              onChange={(e) => onUpdateMagicWandSettings({ tolerance: Number(e.target.value) })}
              className="w-20 accent-indigo-400 cursor-pointer"
            />
            <span className="font-mono text-[11px] text-white w-7 text-right">
              {magicWandSettings.tolerance}%
            </span>
          </div>

          <div className="h-4 w-px bg-indigo-800"></div>

          {/* Contiguous toggle */}
          <label className="flex items-center space-x-1 cursor-pointer text-[11px] text-neutral-300 hover:text-white">
            <input
              type="checkbox"
              checked={magicWandSettings.contiguous}
              onChange={(e) => onUpdateMagicWandSettings({ contiguous: e.target.checked })}
              className="rounded bg-neutral-900 border-neutral-700 text-indigo-500 focus:ring-0"
            />
            <span>Área contigua</span>
          </label>
        </div>
      )}

      {/* Floating Info Banner for Box Select */}
      {toolMode === 'box-select' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-950/90 border border-amber-500/40 text-amber-200 px-4 py-2 rounded-2xl shadow-xl flex items-center space-x-3 text-xs z-30 backdrop-blur-md animate-in fade-in slide-in-from-top-2 whitespace-nowrap">
          <div className="flex items-center space-x-1.5">
            <SquareDashed className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Haz clic y arrastra sobre el lienzo para trazar un recuadro de proporción libre</span>
          </div>
          {selectionRect && selectionRect.width > 5 && (
            <>
              <div className="h-4 w-px bg-amber-800"></div>
              <span className="font-mono text-amber-300 font-bold text-[11px]">
                {Math.round(selectionRect.width)} × {Math.round(selectionRect.height)} px
              </span>
            </>
          )}
        </div>
      )}

      {/* Floating Canvas Viewport */}
      <div
        className="relative shadow-2xl transition-transform duration-75"
        style={{
          width: `${canvasDims.width * zoom}px`,
          height: `${canvasDims.height * zoom}px`,
          cursor: toolMode === 'move' 
            ? (isDraggingSubject ? 'grabbing' : 'grab') 
            : toolMode === 'box-select'
            ? 'crosshair'
            : toolMode === 'magic-wand' 
            ? 'crosshair' 
            : 'crosshair',
        }}
        onPointerDown={handlePointerDown}
      >
        {/* The Main Composition Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block rounded-lg shadow-2xl border border-neutral-800/80 overflow-hidden"
        />

        {/* Before / After Split Slider View */}
        {showComparison && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
            style={{ clipPath: `inset(0 ${100 - compareSplit}% 0 0)` }}
          >
            <canvas
              ref={originalCanvasRef}
              className="w-full h-full block bg-black"
            />
            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/75 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
              Original
            </div>
          </div>
        )}

        {showComparison && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded bg-indigo-600/90 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm pointer-events-none">
            Sin Fondo
          </div>
        )}

        {/* Split Divider Bar */}
        {showComparison && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize pointer-events-auto flex items-center justify-center shadow-lg"
            style={{ left: `${compareSplit}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsSplitting(true);
              const handleMove = (ev: MouseEvent) => {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const pct = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
                setCompareSplit(pct);
              };
              const handleUp = () => {
                setIsSplitting(false);
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
              };
              window.addEventListener('mousemove', handleMove);
              window.addEventListener('mouseup', handleUp);
            }}
          >
            <div className="w-6 h-6 rounded-full bg-white text-neutral-900 shadow-md flex items-center justify-center text-[10px] font-bold -ml-2.5">
              &harr;
            </div>
          </div>
        )}

        {/* Snapping Guidelines */}
        {showGuides && snapV && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 pointer-events-none z-20 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
            style={{ left: '50%' }}
          />
        )}
        {showGuides && snapH && (
          <div 
            className="absolute left-0 right-0 h-0.5 bg-indigo-400 pointer-events-none z-20 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
            style={{ top: '50%' }}
          />
        )}

        {/* Subject Outline & Bounding Box Guide */}
        {showGuides && layout && !showComparison && toolMode === 'move' && (
          <div
            className="absolute pointer-events-none border border-indigo-400/30 rounded transition-all"
            style={{
              left: `${layout.left * zoom}px`,
              top: `${layout.top * zoom}px`,
              width: `${layout.drawWidth * zoom}px`,
              height: `${layout.drawHeight * zoom}px`,
              transform: `rotate(${transform.rotation}deg)`,
            }}
          >
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-indigo-400 rounded-full"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-400 rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-400 rounded-full"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-indigo-400 rounded-full"></div>
          </div>
        )}

        {/* Brush Cursor Indicator */}
        {(toolMode === 'erase' || toolMode === 'restore') && mousePos && (
          <div
            className="absolute rounded-full border-2 border-white pointer-events-none shadow-sm -translate-x-1/2 -translate-y-1/2 z-30"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              width: `${brushSettings.size * zoom}px`,
              height: `${brushSettings.size * zoom}px`,
              backgroundColor: toolMode === 'erase' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)',
            }}
          />
        )}

        {/* Magic Wand Cursor Indicator */}
        {toolMode === 'magic-wand' && mousePos && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
            }}
          >
            <div className="w-5 h-5 rounded-full border border-indigo-400 bg-indigo-500/20 animate-ping absolute"></div>
            <div className="w-3 h-3 rounded-full border-2 border-white bg-indigo-500 shadow-md"></div>
          </div>
        )}

        {/* Selection Rectangle Overlay (Box Select / Proporción Libre) */}
        {selectionRect && selectionRect.width > 2 && selectionRect.height > 2 && (
          <div
            className="absolute border-2 border-dashed border-amber-400 bg-amber-400/10 z-30 pointer-events-none"
            style={{
              left: `${selectionRect.x * zoom}px`,
              top: `${selectionRect.y * zoom}px`,
              width: `${selectionRect.width * zoom}px`,
              height: `${selectionRect.height * zoom}px`,
            }}
          >
            {/* Dimensions label tag */}
            <div className="absolute -top-6 left-0 bg-neutral-900/95 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-md whitespace-nowrap pointer-events-none">
              {Math.round(selectionRect.width)} × {Math.round(selectionRect.height)} px (Proporción Libre)
            </div>

            {/* Corner handles */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-400 rounded-sm shadow border border-neutral-900"></div>
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-sm shadow border border-neutral-900"></div>
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-400 rounded-sm shadow border border-neutral-900"></div>
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-sm shadow border border-neutral-900"></div>

            {/* Action Bar for this selection */}
            {!isSelectingBox && (
              <div 
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-neutral-900/95 border border-amber-500/50 p-1.5 rounded-xl shadow-2xl flex items-center space-x-1.5 text-xs pointer-events-auto backdrop-blur-md whitespace-nowrap z-40"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleFocusDetail}
                  title="Amplía y centra esta área para trabajar con la varita mágica o pincel al detalle"
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold flex items-center space-x-1 transition-all shadow-sm cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Enfocar Detalle</span>
                </button>

                <button
                  type="button"
                  onClick={handleKeepInsideEraseOutside}
                  title="Elimina de un golpe todo el fondo exterior al recuadro"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-1 transition-all shadow-sm cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Conservar Interior</span>
                </button>

                <button
                  type="button"
                  onClick={handleEraseInside}
                  title="Borra y hace transparente todo lo que está dentro de este recuadro"
                  className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold flex items-center space-x-1 transition-all border border-red-500/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar Zona</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelSelection}
                  title="Cancelar selección"
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tap Ripple Effect on Magic Wand Click */}
      {tapRipple && (
        <div
          className="fixed pointer-events-none rounded-full border-2 border-indigo-400 bg-indigo-500/30 z-50 animate-ping -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${tapRipple.x}px`,
            top: `${tapRipple.y}px`,
            width: '40px',
            height: '40px',
          }}
        />
      )}

      {/* Floating Bottom Toolbar (Zoom, Fit, Guides) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-neutral-800/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-neutral-700 shadow-xl flex items-center space-x-1 z-30 text-xs">
        <button
          onClick={() => setZoom((z) => Math.max(0.1, Number((z - 0.1).toFixed(2))))}
          title="Alejar (-)"
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="font-mono text-neutral-200 w-12 text-center text-[11px]">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
          title="Acercar (+)"
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-neutral-700 mx-1"></div>

        <button
          onClick={fitToView}
          title="Ajustar a la ventana"
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors flex items-center space-x-1"
        >
          <Maximize className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">Ajustar</span>
        </button>

        <button
          onClick={() => setShowGuides((g) => !g)}
          title="Alternar guías de alineación"
          className={`p-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
            showGuides ? 'text-indigo-400 bg-indigo-500/15' : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">Guías</span>
        </button>
      </div>
    </div>
  );
};
