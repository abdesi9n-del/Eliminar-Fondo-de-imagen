import React from 'react';
import { 
  Scissors, 
  Download, 
  RotateCcw, 
  RotateCw, 
  Eye, 
  Upload, 
  Sparkles,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { CanvasDimensions, ExportSettings } from '../types';

interface HeaderProps {
  hasImage: boolean;
  canvasDims: CanvasDimensions;
  exportSettings: ExportSettings;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  showComparison: boolean;
  onToggleComparison: () => void;
  onNewImage: () => void;
  onExport: () => void;
  onCopyClipboard: () => void;
  copied: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hasImage,
  canvasDims,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showComparison,
  onToggleComparison,
  onNewImage,
  onExport,
  onCopyClipboard,
  copied,
}) => {
  return (
    <header className="h-16 border-b border-neutral-700 bg-neutral-800/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
          <Scissors className="w-5 h-5 -rotate-45" />
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight text-white block">
            Retoucher<span className="text-indigo-400">Pro</span>
          </span>
          <p className="text-xs text-neutral-300 hidden sm:block">
            Quitar fondo &bull; Redimensionar lienzo sin deformar
          </p>
        </div>
      </div>

      {/* Middle Controls (active when image is loaded) */}
      {hasImage && (
        <div className="flex items-center space-x-1 sm:space-x-2 bg-neutral-750/90 p-1 rounded-xl border border-neutral-700">
          {/* Canvas info badge */}
          <div className="px-3 py-1 text-xs text-neutral-200 font-medium hidden md:flex items-center space-x-2 border-r border-neutral-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{canvasDims.width} &times; {canvasDims.height} px</span>
          </div>

          {/* Undo / Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Rehacer (Ctrl+Y)"
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-neutral-700 mx-1 hidden sm:block"></div>

          {/* Before/After Split */}
          <button
            onClick={onToggleComparison}
            title="Comparar con imagen original"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              showComparison 
                ? 'bg-indigo-600 text-white' 
                : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Comparar</span>
          </button>
        </div>
      )}

      {/* Right Action Buttons */}
      <div className="flex items-center space-x-2">
        {hasImage ? (
          <>
            <button
              onClick={onNewImage}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center space-x-1.5 border border-neutral-700/60"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cambiar Foto</span>
            </button>

            <button
              onClick={onCopyClipboard}
              title="Copiar imagen al portapapeles"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 transition-colors flex items-center space-x-1.5 border border-neutral-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden md:inline">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              onClick={onExport}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-md shadow-indigo-500/25 transition-all flex items-center space-x-2 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar</span>
            </button>
          </>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-neutral-400">
            <span className="flex items-center space-x-1 text-emerald-400 font-medium">
              <Sparkles className="w-3 h-3" />
              <span>100% Gratuito y Privado</span>
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
