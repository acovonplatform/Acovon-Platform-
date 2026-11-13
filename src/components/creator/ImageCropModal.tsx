import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  Move, 
  RefreshCw,
  Smartphone,
  Monitor
} from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  aspectRatio: 'square' | 'cover'; // square (1:1) for avatar, cover (3:1 or 16:9) for banner
  title: string;
  onSave: (croppedDataUrl: string) => void;
  onClose: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  aspectRatio,
  title,
  onSave,
  onClose
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset transforms
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Mouse / Touch Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Generate cropped output canvas
  const handleCropAndSave = () => {
    if (!imgRef.current) return;
    setSaving(true);

    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setSaving(false);
        return;
      }

      // Output dimensions
      const targetWidth = aspectRatio === 'square' ? 600 : 1920;
      const targetHeight = aspectRatio === 'square' ? 600 : 640;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Fill neutral dark background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Scaling factor
      const aspectWidth = img.naturalWidth;
      const aspectHeight = img.naturalHeight;
      const baseScale = Math.max(targetWidth / aspectWidth, targetHeight / aspectHeight);
      const finalScale = baseScale * zoom;

      // Draw image with offsets scaled to canvas coordinate system
      // Normalize offset relative to preview viewport
      const previewWidth = containerRef.current?.clientWidth || 400;
      const scaleFactor = targetWidth / previewWidth;

      const drawX = (offset.x * scaleFactor) - (aspectWidth * finalScale) / 2;
      const drawY = (offset.y * scaleFactor) - (aspectHeight * finalScale) / 2;

      ctx.drawImage(
        img,
        drawX,
        drawY,
        aspectWidth * finalScale,
        aspectHeight * finalScale
      );

      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onSave(dataUrl);
    } catch {
      // If cross-origin or canvas issue, fallback directly to raw imageSrc
      onSave(imageSrc);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-2xl w-full max-h-[92dvh] my-auto overflow-hidden shadow-2xl flex flex-col acovon-modal-panel">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#26262b] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Move className="w-4 h-4 text-[#d4af37] shrink-0" />
            <h3 className="text-sm font-bold text-white tracking-wide truncate">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Crop Canvas Box */}
        <div className="relative bg-black flex items-center justify-center overflow-hidden min-h-[210px] sm:min-h-[300px] max-h-[42dvh] sm:max-h-[460px] select-none shrink-0">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center ${
              aspectRatio === 'square'
                ? 'w-52 h-52 xs:w-64 xs:h-64 sm:w-80 sm:h-80'
                : previewDevice === 'mobile'
                ? 'w-64 h-40 sm:w-80 sm:h-52'
                : 'w-full h-44 sm:h-72'
            }`}
          >
            {/* The Image being transformed */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop Source"
              crossOrigin="anonymous"
              draggable={false}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
              className="max-w-none w-full h-full object-cover pointer-events-none"
            />

            {/* Framing Guide Mask Overlay */}
            {aspectRatio === 'square' ? (
              <div className="absolute inset-0 pointer-events-none ring-1 ring-white/40 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] flex items-center justify-center">
                <div className="w-full h-full border border-dashed border-[#d4af37]/60 rounded-full" />
              </div>
            ) : (
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-[#d4af37]/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-neutral-300">
                  {previewDevice === 'desktop' ? 'Desktop 1920×640 Banner Safe Area' : 'Mobile Header Framing'}
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] text-neutral-400 font-mono pointer-events-none">
            Drag to reposition · Scroll or slide to zoom
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="p-3.5 sm:p-4 bg-[#141418] border-t border-[#26262b] space-y-3 overflow-y-auto flex-1 min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Zoom Slider */}
            <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto sm:min-w-[200px]">
              <button 
                type="button"
                onClick={() => setZoom(z => Math.max(0.5, Number((z - 0.2).toFixed(1))))}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-[#1c1c22] border border-[#27272a] hover:border-[#3d3d46]"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#d4af37] cursor-pointer"
              />

              <button 
                type="button"
                onClick={() => setZoom(z => Math.min(3.0, Number((z + 0.2).toFixed(1))))}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-[#1c1c22] border border-[#27272a] hover:border-[#3d3d46]"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <span className="font-mono text-[11px] text-[#fce7b0] w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Extra Tools: Rotate & Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white bg-[#1c1c22] border border-[#27272a] flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white bg-[#1c1c22] border border-[#27272a] flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                title="Reset zoom & position"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {aspectRatio === 'cover' && (
                <div className="flex items-center gap-1 bg-[#1c1c22] p-1 rounded-lg border border-[#27272a]">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-[#27272a] text-[#fce7b0]' : 'text-neutral-400'}`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-[#27272a] text-[#fce7b0]' : 'text-neutral-400'}`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-[#26262b]/60">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-transparent border border-transparent hover:border-[#27272a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCropAndSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-[#d4af37] hover:bg-[#e5c07b] shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Applying...' : 'Save & Apply Image'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
