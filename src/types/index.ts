export type AspectRatioCategory = 'ecommerce' | 'social' | 'standard' | 'print' | 'custom';

export interface CanvasPreset {
  id: string;
  name: string;
  category: AspectRatioCategory;
  width: number;
  height: number;
  aspectRatioLabel: string;
  icon?: string;
  description?: string;
}

export interface CanvasDimensions {
  width: number;
  height: number;
  aspectRatioLocked: boolean;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
}

export interface SubjectTransform {
  x: number; // offset from center in px
  y: number; // offset from center in px
  scale: number; // percentage (1 = 100%)
  rotation: number; // degrees
  flipX: boolean;
  flipY: boolean;
  opacity: number;
  brightness: number; // 100 is default
  contrast: number; // 100 is default
  saturation: number; // 100 is default
}

export type BackgroundType = 'transparent' | 'color' | 'gradient' | 'image';

export interface DropShadowConfig {
  enabled: boolean;
  blur: number;
  opacity: number; // 0 to 1
  offsetX: number;
  offsetY: number;
  color: string;
}

export interface GradientConfig {
  from: string;
  to: string;
  direction: 'to-b' | 'to-r' | 'to-br' | 'radial';
  name?: string;
}

export interface BackgroundConfig {
  type: BackgroundType;
  color: string;
  gradient: GradientConfig;
  imageUrl?: string;
  shadow: DropShadowConfig;
}

export interface ExportSettings {
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0.1 to 1.0
  scale: 1 | 2;
  fileName: string;
}

export type ToolMode = 'move' | 'magic-wand' | 'erase' | 'restore';

export interface MagicWandSettings {
  tolerance: number; // 1 to 100%
  contiguous: boolean; // true = floodfill area, false = global color
}

export interface BrushSettings {
  size: number;
  hardness: number; // 0 to 1
  opacity: number; // 0 to 1
}

export interface SampleImage {
  id: string;
  title: string;
  category: string;
  url: string;
}
