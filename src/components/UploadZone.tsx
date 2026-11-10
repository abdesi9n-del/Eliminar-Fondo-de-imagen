import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Sparkles, 
  Layers, 
  Maximize2, 
  Zap, 
  Feather, 
  Check, 
  Wand2, 
  MousePointerClick,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { SAMPLE_IMAGES, REMOVAL_LEVELS } from '../data/presets';
import { SampleImage, RemovalLevel, InitialStartMode } from '../types';

interface UploadZoneProps {
  onImageSelected: (source: File | string, mode?: InitialStartMode) => void;
  isLoading: boolean;
  progressText: string;
  progressPercent: number;
  selectedLevel: RemovalLevel;
  onSelectLevel: (level: RemovalLevel) => void;
  startMode: InitialStartMode;
  onSelectStartMode: (mode: InitialStartMode) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onImageSelected,
  isLoading,
  progressText,
  progressPercent,
  selectedLevel,
  onSelectLevel,
  startMode,
  onSelectStartMode,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file, startMode);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelected(e.target.files[0], startMode);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Elimina el fondo y redimensiona tu foto <br className="hidden sm:inline" />
          <span className="text-indigo-400">sin deformar la imagen</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-300 max-w-2xl mx-auto">
          Ajusta medidas del lienzo manualmente o con presets para Amazon, Instagram o Shopify.
          Descarga en <strong className="text-white">PNG transparente</strong> o <strong className="text-white">JPG con fondos de color</strong>.
        </p>
      </div>

      {/* Main Start Mode Selector */}
      <div className="mb-6 bg-neutral-800/95 border border-neutral-700/80 rounded-2xl p-2 sm:p-2.5 shadow-md flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => onSelectStartMode('ai-auto')}
          className={`flex-1 p-3.5 rounded-xl border text-left transition-all flex items-start space-x-3.5 ${
            startMode === 'ai-auto'
              ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
              : 'bg-neutral-850/60 border-neutral-700/80 hover:bg-neutral-800 text-neutral-300'
          }`}
        >
          <div className={`p-2.5 rounded-xl shrink-0 ${startMode === 'ai-auto' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25' : 'bg-neutral-700 text-neutral-400'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-bold ${startMode === 'ai-auto' ? 'text-white' : 'text-neutral-200'}`}>
                1. Eliminación Automática con IA
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Recomendado
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-snug">
              La IA detecta al sujeto y elimina todo el fondo al instante con 3 niveles de precisión a elegir.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectStartMode('manual-original')}
          className={`flex-1 p-3.5 rounded-xl border text-left transition-all flex items-start space-x-3.5 ${
            startMode === 'manual-original'
              ? 'bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-500/50'
              : 'bg-neutral-850/60 border-neutral-700/80 hover:bg-neutral-800 text-neutral-300'
          }`}
        >
          <div className={`p-2.5 rounded-xl shrink-0 ${startMode === 'manual-original' ? 'bg-amber-500 text-neutral-900 shadow-md shadow-amber-500/25' : 'bg-neutral-700 text-neutral-400'}`}>
            <Wand2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-bold ${startMode === 'manual-original' ? 'text-white' : 'text-neutral-200'}`}>
                2. Empezar con Imagen Original
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Tocar para Eliminar
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-snug">
              Carga tu foto intacta y ve tocando o pintando las partes o fondos específicos que quieras borrar.
            </p>
          </div>
        </button>
      </div>

      {/* Dynamic Subpanel based on Selected Start Mode */}
      {startMode === 'ai-auto' ? (
        /* 3 Niveles de Eliminación Automática */
        <div className="mb-6 bg-neutral-800/90 border border-neutral-700/80 rounded-2xl p-4 shadow-sm animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Nivel de Eliminación Automática
              </span>
            </div>
            <span className="text-[11px] text-neutral-400">
              Elige la sensibilidad antes de procesar tu imagen:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {REMOVAL_LEVELS.map((lvl) => {
              const isSelected = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => onSelectLevel(lvl.id)}
                  className={`relative p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-neutral-850/80 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        {lvl.id === 'soft' && <Feather className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-neutral-400'}`} />}
                        {lvl.id === 'standard' && <Sparkles className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-neutral-400'}`} />}
                        {lvl.id === 'deep' && <Zap className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-neutral-400'}`} />}
                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                          {lvl.name}
                        </span>
                      </div>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {lvl.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-snug mb-1">
                      {lvl.description}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-neutral-700/60 text-[10px] text-neutral-400">
                    <span className="text-neutral-400 font-medium">Ideal: </span>{lvl.idealFor}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Manual Original Mode Tip Banner */
        <div className="mb-6 bg-neutral-800/90 border border-amber-500/30 rounded-2xl p-4 shadow-sm animate-in fade-in">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-amber-300">
                  Modo Selección Manual Directa
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                  Varita Mágica + Pincel
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Tu imagen original se cargará completa sin recortes. Podrás <strong>hacer clic en cualquier parte</strong> (fondo, objetos o colores) para eliminarlos paso a paso con tolerancia ajustable. Además, podrás aplicar la IA en cualquier instante con un solo clic.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center transition-all duration-300 shadow-lg ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/15 scale-[1.01] shadow-2xl shadow-indigo-500/20'
            : startMode === 'manual-original'
            ? 'border-amber-500/40 bg-neutral-800/90 hover:border-amber-400 hover:bg-neutral-800'
            : 'border-neutral-600 bg-neutral-800/80 hover:border-neutral-500 hover:bg-neutral-800'
        } ${isLoading ? 'pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/bmp"
          className="hidden"
          onChange={handleFileChange}
        />

        {isLoading ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
              <div 
                className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Preparando imagen...</h3>
              <p className="text-xs text-neutral-400">{progressText}</p>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-xs bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">{progressPercent}%</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform ${
              startMode === 'manual-original'
                ? 'bg-gradient-to-tr from-amber-600/30 to-amber-500/20 border border-amber-500/30 text-amber-400'
                : 'bg-gradient-to-tr from-indigo-600/30 to-violet-500/20 border border-indigo-500/30 text-indigo-400'
            }`}>
              {startMode === 'manual-original' ? (
                <Wand2 className="w-10 h-10" />
              ) : (
                <UploadCloud className="w-10 h-10" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {startMode === 'manual-original'
                  ? 'Sube tu foto y toca las partes a eliminar'
                  : 'Sube tu imagen o arrástrala aquí'}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
                {startMode === 'manual-original'
                  ? 'Se cargará la foto original intacta para que vayas tocando con la varita mágica o pincel cada parte a eliminar.'
                  : 'Formatos soportados: PNG, JPG, WEBP, AVIF hasta 25 MB'}
              </p>
            </div>

            <div className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all ${
              startMode === 'manual-original'
                ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/25'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
            }`}>
              {startMode === 'manual-original' ? (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Cargar imagen original para recortar</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span>Seleccionar desde el equipo</span>
                </>
              )}
            </div>

            <div className="pt-2 flex items-center space-x-2 text-xs text-neutral-500">
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px]">
                Ctrl + V
              </kbd>
              <span>o pega directamente desde tu portapapeles</span>
            </div>

            {/* Quick Switcher Prompt inside dropzone */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onSelectStartMode(startMode === 'ai-auto' ? 'manual-original' : 'ai-auto');
              }}
              className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              {startMode === 'ai-auto'
                ? '¿Prefieres empezar con la imagen original intacta y tocar para borrar? Cambiar a modo manual'
                : '¿Prefieres que la IA elimine todo el fondo automáticamente? Cambiar a modo IA'}
            </div>
          </div>
        )}
      </div>

      {/* Sample Photos for quick testing */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {startMode === 'manual-original'
                ? 'Prueba el modo de tocar para eliminar con estas fotos de muestra:'
                : '¿Sin foto a mano? Prueba con estas imágenes de muestra:'}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SAMPLE_IMAGES.map((sample: SampleImage) => (
            <button
              key={sample.id}
              onClick={() => onImageSelected(sample.url, startMode)}
              disabled={isLoading}
              className="group relative rounded-2xl overflow-hidden border border-neutral-700 bg-neutral-800 hover:border-indigo-400 hover:bg-neutral-750 transition-all text-left disabled:opacity-50 shadow-sm"
            >
              <div className="aspect-square w-full overflow-hidden bg-neutral-900">
                <img
                  src={sample.url}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  crossOrigin="anonymous"
                  loading="lazy"
                />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-neutral-200 truncate group-hover:text-indigo-400 transition-colors">
                  {sample.title}
                </p>
                <p className="text-[10px] text-neutral-400">{sample.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature highlights grid */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-start space-x-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Tocar para Eliminar</h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Empieza desde la foto original y toca cualquier color o fondo con la Varita Mágica para borrarlo con precisión.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-start space-x-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Cero Deformación</h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Amplía o recorta el fondo libremente conservando la proporción perfecta del producto original.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-start space-x-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Exportación Profesional</h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Salva en PNG transparente o JPG con fondos blancos de catálogo o colores personalizados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
