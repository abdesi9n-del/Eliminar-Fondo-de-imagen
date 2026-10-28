import React, { useState } from 'react';
import { 
  Maximize2, 
  Palette, 
  User, 
  Sliders, 
  Download, 
  Lock, 
  Unlock, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  AlignHorizontalJustifyCenter, 
  AlignVerticalJustifyCenter, 
  ArrowDownToLine, 
  ArrowUpToLine,
  Check,
  Sparkles,
  Eraser,
  Paintbrush,
  Move,
  Wand2,
  Layers,
  Sun,
  Contrast,
  Image as ImageIcon,
  Copy
} from 'lucide-react';
import { 
  BackgroundConfig, 
  CanvasDimensions, 
  CanvasPreset, 
  ExportSettings, 
  SubjectTransform, 
  ToolMode, 
  BrushSettings,
  MagicWandSettings,
  AspectRatioCategory 
} from '../types';
import { CANVAS_PRESETS, STUDIO_PALETTE_COLORS, STUDIO_GRADIENTS } from '../data/presets';

interface SidebarTabsProps {
  canvasDims: CanvasDimensions;
  onUpdateCanvasDims: (dims: Partial<CanvasDimensions>) => void;
  transform: SubjectTransform;
  onUpdateTransform: (t: Partial<SubjectTransform>) => void;
  bgConfig: BackgroundConfig;
  onUpdateBgConfig: (bg: Partial<BackgroundConfig>) => void;
  exportSettings: ExportSettings;
  onUpdateExportSettings: (s: Partial<ExportSettings>) => void;
  originalDimensions: { width: number; height: number };
  onFitContain: () => void;
  onFitCover: () => void;
  onResetOriginalSize: () => void;
  onResetSubjectTransform: () => void;
  onExport: () => void;
  onCopyClipboard: () => void;
  copied: boolean;
  toolMode: ToolMode;
  onSelectToolMode: (mode: ToolMode) => void;
  magicWandSettings: MagicWandSettings;
  onUpdateMagicWandSettings: (s: Partial<MagicWandSettings>) => void;
  brushSettings: BrushSettings;
  onUpdateBrushSettings: (b: Partial<BrushSettings>) => void;
  onResetCutoutToOriginal: () => void;
}

type TabType = 'canvas' | 'background' | 'subject' | 'brush' | 'export';

export const SidebarTabs: React.FC<SidebarTabsProps> = ({
  canvasDims,
  onUpdateCanvasDims,
  transform,
  onUpdateTransform,
  bgConfig,
  onUpdateBgConfig,
  exportSettings,
  onUpdateExportSettings,
  originalDimensions,
  onFitContain,
  onFitCover,
  onResetOriginalSize,
  onResetSubjectTransform,
  onExport,
  onCopyClipboard,
  copied,
  toolMode,
  onSelectToolMode,
  magicWandSettings,
  onUpdateMagicWandSettings,
  brushSettings,
  onUpdateBrushSettings,
  onResetCutoutToOriginal,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('canvas');
  const [presetCategory, setPresetCategory] = useState<string>('all');
  const [uniformPadding, setUniformPadding] = useState<boolean>(true);

  // Filter presets
  const filteredPresets = CANVAS_PRESETS.filter((p) => {
    if (presetCategory === 'all') return true;
    return p.category === presetCategory;
  });

  const handleApplyPreset = (preset: CanvasPreset) => {
    onUpdateCanvasDims({
      width: preset.width,
      height: preset.height,
    });
  };

  const handlePaddingChange = (side: 'top' | 'bottom' | 'left' | 'right', val: number) => {
    if (uniformPadding) {
      onUpdateCanvasDims({
        paddingTop: val,
        paddingBottom: val,
        paddingLeft: val,
        paddingRight: val,
      });
    } else {
      if (side === 'top') onUpdateCanvasDims({ paddingTop: val });
      if (side === 'bottom') onUpdateCanvasDims({ paddingBottom: val });
      if (side === 'left') onUpdateCanvasDims({ paddingLeft: val });
      if (side === 'right') onUpdateCanvasDims({ paddingRight: val });
    }
  };

  return (
    <aside className="w-full lg:w-96 bg-neutral-800 border-l border-neutral-700 flex flex-col h-full overflow-hidden shrink-0">
      {/* Tab Navigation */}
      <div className="grid grid-cols-5 border-b border-neutral-700 bg-neutral-850 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'canvas'
              ? 'bg-neutral-700 text-indigo-400 font-bold shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
          }`}
        >
          <Maximize2 className="w-4 h-4 mb-1" />
          <span className="text-[10px] truncate">Lienzo</span>
        </button>

        <button
          onClick={() => setActiveTab('background')}
          className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'background'
              ? 'bg-neutral-700 text-indigo-400 font-bold shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
          }`}
        >
          <Palette className="w-4 h-4 mb-1" />
          <span className="text-[10px] truncate">Fondo</span>
        </button>

        <button
          onClick={() => setActiveTab('subject')}
          className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'subject'
              ? 'bg-neutral-700 text-indigo-400 font-bold shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
          }`}
        >
          <User className="w-4 h-4 mb-1" />
          <span className="text-[10px] truncate">Sujeto</span>
        </button>

        <button
          onClick={() => setActiveTab('brush')}
          className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'brush'
              ? 'bg-neutral-700 text-indigo-400 font-bold shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
          }`}
        >
          <Wand2 className="w-4 h-4 mb-1" />
          <span className="text-[10px] truncate">Retoque</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'export'
              ? 'bg-indigo-600 text-white font-bold shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
          }`}
        >
          <Download className="w-4 h-4 mb-1" />
          <span className="text-[10px] truncate">Exportar</span>
        </button>
      </div>

      {/* Tab Contents Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* ================= TAB 1: LIENZO Y MEDIDAS ================= */}
        {activeTab === 'canvas' && (
          <div className="space-y-6">
            {/* Dimensions inputs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Dimensiones Manuales
                </label>
                <button
                  onClick={onResetOriginalSize}
                  className="text-[11px] text-indigo-400 hover:underline flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Original ({originalDimensions.width}&times;{originalDimensions.height})</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="text-[10px] text-neutral-400 mb-1">Ancho (px)</div>
                  <input
                    type="number"
                    min="100"
                    max="6000"
                    value={canvasDims.width}
                    onChange={(e) => {
                      const val = Math.max(100, Math.min(6000, Number(e.target.value) || 100));
                      if (canvasDims.aspectRatioLocked) {
                        const ratio = canvasDims.height / canvasDims.width;
                        onUpdateCanvasDims({ width: val, height: Math.round(val * ratio) });
                      } else {
                        onUpdateCanvasDims({ width: val });
                      }
                    }}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Aspect ratio lock toggle */}
                <div className="pt-5">
                  <button
                    onClick={() => onUpdateCanvasDims({ aspectRatioLocked: !canvasDims.aspectRatioLocked })}
                    title={canvasDims.aspectRatioLocked ? 'Relación de aspecto bloqueada' : 'Relación de aspecto libre'}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      canvasDims.aspectRatioLocked
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {canvasDims.aspectRatioLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex-1">
                  <div className="text-[10px] text-neutral-400 mb-1">Alto (px)</div>
                  <input
                    type="number"
                    min="100"
                    max="6000"
                    value={canvasDims.height}
                    onChange={(e) => {
                      const val = Math.max(100, Math.min(6000, Number(e.target.value) || 100));
                      if (canvasDims.aspectRatioLocked) {
                        const ratio = canvasDims.width / canvasDims.height;
                        onUpdateCanvasDims({ height: val, width: Math.round(val * ratio) });
                      } else {
                        onUpdateCanvasDims({ height: val });
                      }
                    }}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Manual Background Margin / Padding Expansion & Crop */}
            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200">
                  Margen del Fondo (Espacio libre)
                </span>
                <label className="flex items-center space-x-1.5 text-[11px] text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uniformPadding}
                    onChange={(e) => setUniformPadding(e.target.checked)}
                    className="rounded bg-neutral-800 border-neutral-700 text-indigo-500 focus:ring-0"
                  />
                  <span>Uniforme</span>
                </label>
              </div>

              {uniformPadding ? (
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Espaciado general</span>
                    <span className="font-mono">{canvasDims.paddingTop} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    step="5"
                    value={canvasDims.paddingTop}
                    onChange={(e) => handlePaddingChange('top', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-neutral-400">Arriba: {canvasDims.paddingTop}px</span>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      value={canvasDims.paddingTop}
                      onChange={(e) => handlePaddingChange('top', Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="text-neutral-400">Abajo: {canvasDims.paddingBottom}px</span>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      value={canvasDims.paddingBottom}
                      onChange={(e) => handlePaddingChange('bottom', Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="text-neutral-400">Izquierda: {canvasDims.paddingLeft}px</span>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      value={canvasDims.paddingLeft}
                      onChange={(e) => handlePaddingChange('left', Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="text-neutral-400">Derecha: {canvasDims.paddingRight}px</span>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      value={canvasDims.paddingRight}
                      onChange={(e) => handlePaddingChange('right', Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subject auto-fit buttons */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
                Ajuste del Sujeto Sin Deformar
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={onFitContain}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors border border-neutral-700/60"
                >
                  Ajustar (Contain)
                </button>
                <button
                  onClick={onFitCover}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors border border-neutral-700/60"
                >
                  Rellenar (Cover)
                </button>
                <button
                  onClick={() => onUpdateTransform({ scale: 1, x: 0, y: 0 })}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors border border-neutral-700/60"
                >
                  Escala 100%
                </button>
              </div>

              {/* Fast Alignments */}
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                <button
                  onClick={() => onUpdateTransform({ x: 0 })}
                  title="Centrar Horizontalmente"
                  className="p-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs flex items-center justify-center space-x-1"
                >
                  <AlignHorizontalJustifyCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUpdateTransform({ y: 0 })}
                  title="Centrar Verticalmente"
                  className="p-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs flex items-center justify-center space-x-1"
                >
                  <AlignVerticalJustifyCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUpdateTransform({ y: Math.round((canvasDims.height / 2) - 100) })}
                  title="Alinear al Suelo / Base"
                  className="p-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs flex items-center justify-center space-x-1"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUpdateTransform({ y: -Math.round((canvasDims.height / 2) - 100) })}
                  title="Alinear Arriba"
                  className="p-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs flex items-center justify-center space-x-1"
                >
                  <ArrowUpToLine className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Presets List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Medidas Preestablecidas
                </label>
              </div>

              {/* Categories */}
              <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'ecommerce', label: 'E-Commerce' },
                  { id: 'social', label: 'Redes Sociales' },
                  { id: 'standard', label: 'Estándar' },
                  { id: 'print', label: 'Impresión' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setPresetCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      presetCategory === cat.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Presets Grid */}
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {filteredPresets.map((preset) => {
                  const isCurrent =
                    canvasDims.width === preset.width && canvasDims.height === preset.height;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                        isCurrent
                          ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-xs text-white group-hover:text-indigo-400 transition-colors">
                            {preset.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                            {preset.aspectRatioLabel}
                          </span>
                        </div>
                        {preset.description && (
                          <p className="text-[10px] text-neutral-500 mt-0.5">{preset.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs text-neutral-400">
                          {preset.width}&times;{preset.height}
                        </span>
                        {isCurrent && (
                          <div className="text-[10px] font-bold text-indigo-400 flex items-center justify-end space-x-0.5">
                            <Check className="w-3 h-3" />
                            <span>Activo</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: FONDO ================= */}
        {activeTab === 'background' && (
          <div className="space-y-6">
            {/* Background Type Toggle */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
                Tipo de Fondo
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onUpdateBgConfig({ type: 'transparent' })}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center space-y-1.5 ${
                    bgConfig.type === 'transparent'
                      ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-md'
                      : 'border-neutral-800 bg-neutral-950/70 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-checkerboard-dark border border-neutral-700" />
                  <span className="text-xs font-semibold">Transparente</span>
                </button>

                <button
                  onClick={() => onUpdateBgConfig({ type: 'color' })}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center space-y-1.5 ${
                    bgConfig.type === 'color'
                      ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-md'
                      : 'border-neutral-800 bg-neutral-950/70 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-md border border-neutral-700 shadow-sm"
                    style={{ backgroundColor: bgConfig.color || '#FFFFFF' }}
                  />
                  <span className="text-xs font-semibold">Color Sólido</span>
                </button>

                <button
                  onClick={() => onUpdateBgConfig({ type: 'gradient' })}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center space-y-1.5 ${
                    bgConfig.type === 'gradient'
                      ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-md'
                      : 'border-neutral-800 bg-neutral-950/70 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-pink-500 border border-neutral-700" />
                  <span className="text-xs font-semibold">Degradado</span>
                </button>
              </div>
            </div>

            {/* Color Palette (When Color Mode) */}
            {bgConfig.type === 'color' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Paleta de Estudio
                  </span>
                  {/* Hex Picker Input */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={bgConfig.color || '#FFFFFF'}
                      onChange={(e) => onUpdateBgConfig({ color: e.target.value })}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={bgConfig.color || '#FFFFFF'}
                      onChange={(e) => onUpdateBgConfig({ color: e.target.value })}
                      className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded-lg text-xs font-mono text-white text-center uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {STUDIO_PALETTE_COLORS.map((c) => {
                    const isSelected = bgConfig.color?.toUpperCase() === c.hex.toUpperCase();
                    return (
                      <button
                        key={c.hex}
                        onClick={() => onUpdateBgConfig({ color: c.hex })}
                        title={c.name}
                        className={`h-11 rounded-xl border relative flex items-center justify-center transition-all group ${
                          isSelected ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30' : 'border-neutral-800 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && (
                          <Check className={`w-4 h-4 ${c.isLight ? 'text-neutral-900' : 'text-white'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gradient options (When Gradient Mode) */}
            {bgConfig.type === 'gradient' && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 block">
                  Estilos de Iluminación y Estudio
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {STUDIO_GRADIENTS.map((grad, i) => {
                    const isSelected =
                      bgConfig.gradient?.from === grad.from && bgConfig.gradient?.to === grad.to;
                    return (
                      <button
                        key={i}
                        onClick={() => onUpdateBgConfig({ gradient: grad })}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                          isSelected ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-neutral-800 hover:border-neutral-700'
                        }`}
                        style={{
                          background:
                            grad.direction === 'radial'
                              ? `radial-gradient(circle, ${grad.from}, ${grad.to})`
                              : `linear-gradient(${grad.from}, ${grad.to})`,
                        }}
                      >
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm self-start">
                          {grad.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Drop Shadow Under Subject (3D Studio Effect) */}
            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Sombra de Producto (3D)</span>
                  <span className="text-[10px] text-neutral-400">
                    Efecto realista de estudio fotográfico
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={bgConfig.shadow?.enabled || false}
                  onChange={(e) =>
                    onUpdateBgConfig({
                      shadow: { ...bgConfig.shadow, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-indigo-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {bgConfig.shadow?.enabled && (
                <div className="space-y-3 pt-2 border-t border-neutral-800 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Desenfoque (Blur)</span>
                      <span className="font-mono">{bgConfig.shadow.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bgConfig.shadow.blur}
                      onChange={(e) =>
                        onUpdateBgConfig({
                          shadow: { ...bgConfig.shadow, blur: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Opacidad</span>
                      <span className="font-mono">{Math.round(bgConfig.shadow.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={bgConfig.shadow.opacity}
                      onChange={(e) =>
                        onUpdateBgConfig({
                          shadow: { ...bgConfig.shadow, opacity: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-neutral-400">Desplazamiento Y: {bgConfig.shadow.offsetY}px</span>
                      <input
                        type="range"
                        min="-50"
                        max="80"
                        value={bgConfig.shadow.offsetY}
                        onChange={(e) =>
                          onUpdateBgConfig({
                            shadow: { ...bgConfig.shadow, offsetY: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400">Desplazamiento X: {bgConfig.shadow.offsetX}px</span>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={bgConfig.shadow.offsetX}
                        onChange={(e) =>
                          onUpdateBgConfig({
                            shadow: { ...bgConfig.shadow, offsetX: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: SUJETO (AJUSTES SIN DEFORMAR) ================= */}
        {activeTab === 'subject' && (
          <div className="space-y-6">
            {/* Scale slider (preserving 100% aspect ratio) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Escala Proporcional
                </label>
                <span className="text-xs font-mono text-indigo-400">
                  {Math.round(transform.scale * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-2">
                Aumenta o reduce el tamaño del sujeto sin deformar su proporción original.
              </p>
              <input
                type="range"
                min="0.1"
                max="2.5"
                step="0.05"
                value={transform.scale}
                onChange={(e) => onUpdateTransform({ scale: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Rotation slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Rotación
                </label>
                <button
                  onClick={() => onUpdateTransform({ rotation: 0 })}
                  className="text-[10px] text-neutral-400 hover:text-white"
                >
                  Restablecer (0°)
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={transform.rotation}
                  onChange={(e) => onUpdateTransform({ rotation: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-mono w-10 text-right text-neutral-300">
                  {transform.rotation}°
                </span>
              </div>
            </div>

            {/* Flip Horizontal / Vertical */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
                Espejo y Orientación
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateTransform({ flipX: !transform.flipX })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                    transform.flipX
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>Voltear H</span>
                </button>

                <button
                  onClick={() => onUpdateTransform({ flipY: !transform.flipY })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                    transform.flipY
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                >
                  <FlipVertical className="w-4 h-4" />
                  <span>Voltear V</span>
                </button>
              </div>
            </div>

            {/* Color adjustments (Brightness, Contrast, Saturation) */}
            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200">Ajustes de Color del Sujeto</span>
                <button
                  onClick={() => onUpdateTransform({ brightness: 100, contrast: 100, saturation: 100 })}
                  className="text-[10px] text-neutral-400 hover:text-white"
                >
                  Restablecer
                </button>
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Brillo</span>
                  <span className="font-mono">{transform.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={transform.brightness}
                  onChange={(e) => onUpdateTransform({ brightness: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Contraste</span>
                  <span className="font-mono">{transform.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={transform.contrast}
                  onChange={(e) => onUpdateTransform({ contrast: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Saturación</span>
                  <span className="font-mono">{transform.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={transform.saturation}
                  onChange={(e) => onUpdateTransform({ saturation: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: PINCEL DE RETOQUE ================= */}
        {/* ================= TAB 4: RETOQUE / ELIMINAR PARTES ================= */}
        {activeTab === 'brush' && (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
                Herramientas de Retoque
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSelectToolMode('magic-wand')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    toolMode === 'magic-wand'
                      ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-md ring-1 ring-indigo-500'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Tocar y Borrar</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    Haz clic en cualquier parte para borrarla
                  </span>
                </button>

                <button
                  onClick={() => onSelectToolMode('erase')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    toolMode === 'erase'
                      ? 'border-red-500 bg-red-500/20 text-white shadow-md ring-1 ring-red-500'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    <Eraser className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-white">Pincel Borrador</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    Pinta a mano alzada para borrar
                  </span>
                </button>

                <button
                  onClick={() => onSelectToolMode('restore')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    toolMode === 'restore'
                      ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-md ring-1 ring-emerald-500'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    <Paintbrush className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Restaurador</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    Recupera partes originales
                  </span>
                </button>

                <button
                  onClick={() => onSelectToolMode('move')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    toolMode === 'move'
                      ? 'border-neutral-600 bg-neutral-800 text-white shadow-md'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    <Move className="w-4 h-4 text-neutral-300" />
                    <span className="text-xs font-bold text-white">Mover</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    Arrastra y reposiciona el sujeto
                  </span>
                </button>
              </div>
            </div>

            {/* Magic Wand Controls */}
            {toolMode === 'magic-wand' && (
              <div className="space-y-4 p-4 rounded-2xl bg-neutral-950/80 border border-indigo-500/30 animate-in fade-in">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  <span>Ajustes de Tocar para Eliminar</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Tolerancia de Color</span>
                    <span className="font-mono text-indigo-400">{magicWandSettings.tolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="75"
                    value={magicWandSettings.tolerance}
                    onChange={(e) => onUpdateMagicWandSettings({ tolerance: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                    <span>Preciso (solo tono idéntico)</span>
                    <span>Amplio (sombras y variantes)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800/80">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={magicWandSettings.contiguous}
                      onChange={(e) => onUpdateMagicWandSettings({ contiguous: e.target.checked })}
                      className="mt-0.5 rounded bg-neutral-900 border-neutral-700 text-indigo-500 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-neutral-200 block">
                        Solo área contigua conectada
                      </span>
                      <span className="text-[11px] text-neutral-400 leading-tight block mt-0.5">
                        Si está marcado, solo borra la zona delimitada que toques. Si se desmarca, borrará ese color en toda la imagen.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 leading-relaxed">
                  💡 <strong>Tip:</strong> Toca cables, etiquetas, manchas o partes del fondo no deseadas sobre el lienzo para eliminarlas al instante.
                </div>
              </div>
            )}

            {/* Brush Controls for Erase / Restore */}
            {(toolMode === 'erase' || toolMode === 'restore') && (
              <div className="space-y-4 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Tamaño del Pincel</span>
                    <span className="font-mono text-indigo-400">{brushSettings.size}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    value={brushSettings.size}
                    onChange={(e) => onUpdateBrushSettings({ size: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Dureza de Borde</span>
                    <span className="font-mono text-indigo-400">
                      {Math.round(brushSettings.hardness * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={brushSettings.hardness}
                    onChange={(e) => onUpdateBrushSettings({ hardness: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Reset to AI Cutout */}
            <button
              onClick={onResetCutoutToOriginal}
              className="w-full py-2.5 px-3 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer al Recorte Inicial de IA</span>
            </button>
          </div>
        )}

        {/* ================= TAB 5: EXPORTAR ================= */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            {/* Format Selection: PNG vs JPG vs WEBP */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
                Formato de Descarga
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onUpdateExportSettings({ format: 'png' })}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    exportSettings.format === 'png'
                      ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold shadow-md'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-sm font-bold">PNG</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {bgConfig.type === 'transparent' ? 'Transparente' : 'Máxima calidad'}
                  </div>
                </button>

                <button
                  onClick={() => onUpdateExportSettings({ format: 'jpeg' })}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    exportSettings.format === 'jpeg'
                      ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold shadow-md'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-sm font-bold">JPG</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Fondo con color</div>
                </button>

                <button
                  onClick={() => onUpdateExportSettings({ format: 'webp' })}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    exportSettings.format === 'webp'
                      ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold shadow-md'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-sm font-bold">WEBP</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Web ligero</div>
                </button>
              </div>

              {exportSettings.format === 'jpeg' && bgConfig.type === 'transparent' && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                  Nota: El formato JPG no soporta transparencia. Se exportará con fondo blanco sólido o selecciona un color en la pestaña Fondo.
                </div>
              )}
            </div>

            {/* Quality Slider (JPG / WEBP) */}
            {exportSettings.format !== 'png' && (
              <div>
                <div className="flex justify-between text-xs text-neutral-300 mb-1">
                  <span>Calidad de compresión</span>
                  <span className="font-mono text-indigo-400">
                    {Math.round(exportSettings.quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={exportSettings.quality}
                  onChange={(e) => onUpdateExportSettings({ quality: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            )}

            {/* Resolution Multiplier */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
                Resolución de Salida
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateExportSettings({ scale: 1 })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    exportSettings.scale === 1
                      ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  1x ({canvasDims.width}&times;{canvasDims.height} px)
                </button>

                <button
                  onClick={() => onUpdateExportSettings({ scale: 2 })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    exportSettings.scale === 2
                      ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  2x Ultra HD ({canvasDims.width * 2}&times;{canvasDims.height * 2} px)
                </button>
              </div>
            </div>

            {/* Filename input */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-1">
                Nombre de Archivo
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={exportSettings.fileName}
                  onChange={(e) => onUpdateExportSettings({ fileName: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-xs text-neutral-400 font-mono">
                  .{exportSettings.format === 'jpeg' ? 'jpg' : exportSettings.format}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={onExport}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center space-x-2 active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Imagen Ahora</span>
              </button>

              <button
                onClick={onCopyClipboard}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors flex items-center justify-center space-x-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Imagen al Portapapeles'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
