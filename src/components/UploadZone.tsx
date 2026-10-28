import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Sparkles, 
  ShieldCheck, 
  Maximize2, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { SAMPLE_IMAGES } from '../data/presets';
import { SampleImage } from '../types';

interface UploadZoneProps {
  onImageSelected: (source: File | string) => void;
  isLoading: boolean;
  progressText: string;
  progressPercent: number;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onImageSelected,
  isLoading,
  progressText,
  progressPercent,
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
        onImageSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelected(e.target.files[0]);
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

      {/* Main Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center transition-all duration-300 shadow-lg ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/15 scale-[1.01] shadow-2xl shadow-indigo-500/20'
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
              <h3 className="text-lg font-bold text-white">Procesando imagen con IA...</h3>
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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-105 transition-transform">
              <UploadCloud className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Sube tu imagen o arrástrala aquí
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                Formatos soportados: PNG, JPG, WEBP, AVIF hasta 25 MB
              </p>
            </div>

            <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all">
              <ImageIcon className="w-4 h-4" />
              <span>Seleccionar desde el equipo</span>
            </div>

            <div className="pt-2 flex items-center space-x-2 text-xs text-neutral-500">
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px]">
                Ctrl + V
              </kbd>
              <span>o pega directamente desde tu portapapeles</span>
            </div>
          </div>
        )}
      </div>

      {/* Sample Photos for quick testing */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>¿Sin foto a mano? Prueba con estas imágenes de muestra:</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SAMPLE_IMAGES.map((sample: SampleImage) => (
            <button
              key={sample.id}
              onClick={() => onImageSelected(sample.url)}
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
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Recorte Inteligente</h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Detección automática del sujeto con suavizado de bordes para pelos, productos y personas.
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
