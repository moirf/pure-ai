import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const CELL_SIZE = 520;
const CELL_BACKGROUND = '#e2e8f0';
const FONT_OPTIONS = [
  { label: 'Impact', value: 'Impact, Arial Black, sans-serif' },
  { label: 'Arial Black', value: 'Arial Black, Gadget, sans-serif' },
  { label: 'Comic Sans', value: '"Comic Sans MS", cursive, sans-serif' },
  { label: 'Montserrat', value: '"Montserrat", Arial, sans-serif' },
  { label: 'Serif Classic', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Verdana Bold', value: '"Verdana", Geneva, sans-serif' },
  { label: 'Pacifico', value: '"Pacifico", "Brush Script MT", cursive' },
  { label: 'Anton', value: '"Anton", Impact, sans-serif' }
];

type CaptionKey = 'top' | 'bottom';
type ImageSlot = 'primary' | 'secondary';
type LayoutKey = 'single' | 'side-by-side' | 'stacked';

const SLOT_LABELS: Record<ImageSlot, string> = {
  primary: 'Image 1',
  secondary: 'Image 2'
};

const LAYOUTS: Record<LayoutKey, { label: string; rows: number; cols: number; requiresSecondary: boolean; cells: Array<{ slot: ImageSlot; row: number; col: number }> }> = {
  'single': {
    label: 'Single image',
    rows: 1,
    cols: 1,
    requiresSecondary: false,
    cells: [{ slot: 'primary', row: 0, col: 0 }]
  },
  'side-by-side': {
    label: 'Two images (side-by-side)',
    rows: 1,
    cols: 2,
    requiresSecondary: true,
    cells: [
      { slot: 'primary', row: 0, col: 0 },
      { slot: 'secondary', row: 0, col: 1 }
    ]
  },
  'stacked': {
    label: 'Two images (stacked)',
    rows: 2,
    cols: 1,
    requiresSecondary: true,
    cells: [
      { slot: 'primary', row: 0, col: 0 },
      { slot: 'secondary', row: 1, col: 0 }
    ]
  }
};

const createDefaultPositions = () => ({
  top: { x: 0.5, y: 0.15 },
  bottom: { x: 0.5, y: 0.85 }
});

const createDefaultImageOffsets = () => ({
  primary: { x: 0, y: 0 },
  secondary: { x: 0, y: 0 }
});

const TEXT_FIELDS: Array<{ key: CaptionKey; label: string }> = [
  { key: 'top', label: 'Text 1' },
  { key: 'bottom', label: 'Text 2' }
];

const MemeCreatorPage: React.FC = () => {
  const [imageSources, setImageSources] = useState<Record<ImageSlot, string | null>>({ primary: null, secondary: null });
  const [topText, setTopText] = useState('Top text');
  const [bottomText, setBottomText] = useState('Bottom text');
  const [textColors, setTextColors] = useState<{ top: string; bottom: string }>({ top: '#ffa500', bottom: '#ffa500' });
  const [textSizes, setTextSizes] = useState<{ top: number; bottom: number }>({ top: 32, bottom: 32 });
  const [textFonts, setTextFonts] = useState<{ top: string; bottom: string }>(() => ({
    top: FONT_OPTIONS[0].value,
    bottom: FONT_OPTIONS[0].value
  }));
  const [layout, setLayout] = useState<LayoutKey>('single');
  const [status, setStatus] = useState<string | null>(null);
  const [captionPositions, setCaptionPositions] = useState(createDefaultPositions);
  const [draggedCaption, setDraggedCaption] = useState<CaptionKey | null>(null);
  const [imageOffsets, setImageOffsets] = useState(createDefaultImageOffsets);
  const [activeImageAdjustSlot, setActiveImageAdjustSlot] = useState<ImageSlot | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageElementsRef = useRef<Record<ImageSlot, HTMLImageElement | null>>({ primary: null, secondary: null });
  const fileInputRefs = useRef<Record<ImageSlot, HTMLInputElement | null>>({ primary: null, secondary: null });
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const imageDragStateRef = useRef<{ slot: ImageSlot | null; pointerId: number | null; lastX: number; lastY: number }>({ slot: null, pointerId: null, lastX: 0, lastY: 0 });

  const drawCanvas = useCallback(
    (override?: HTMLImageElement) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const layoutConfig = LAYOUTS[layout];
      const primaryImage = override ?? imageElementsRef.current.primary;
      if (!canvas || !ctx || !primaryImage) {
        ctx?.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0);
        return;
      }

      const cellWidth = CELL_SIZE;
      const cellHeight = Math.round(CELL_SIZE / layoutConfig.rows);
      const width = Math.max(1, cellWidth * layoutConfig.cols);
      const height = Math.max(1, cellHeight * layoutConfig.rows);
      canvas.width = width;
      canvas.height = height;
      setCanvasSize({ width, height });

      ctx.clearRect(0, 0, width, height);

      layoutConfig.cells.forEach(({ slot, row, col }) => {
        const img = imageElementsRef.current[slot] ?? imageElementsRef.current.primary;
        const dx = col * cellWidth;
        const dy = row * cellHeight;
        ctx.fillStyle = CELL_BACKGROUND;
        ctx.fillRect(dx, dy, cellWidth, cellHeight);
        if (!img) return;

        const scaleFactor = Math.max(cellWidth / img.width, cellHeight / img.height);
        const drawWidth = img.width * scaleFactor;
        const drawHeight = img.height * scaleFactor;
        const maxOffsetX = Math.max(0, (drawWidth - cellWidth) / 2);
        const maxOffsetY = Math.max(0, (drawHeight - cellHeight) / 2);
        const offset = imageOffsets[slot] ?? { x: 0, y: 0 };
        const baseX = dx + (cellWidth - drawWidth) / 2;
        const baseY = dy + (cellHeight - drawHeight) / 2;
        const renderX = baseX - offset.x * maxOffsetX;
        const renderY = baseY - offset.y * maxOffsetY;

        ctx.drawImage(img, 0, 0, img.width, img.height, renderX, renderY, drawWidth, drawHeight);
      });

      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';

      const drawTextBlock = (text: string, position: { x: number; y: number }, color: string, fontFamily: string, fontSize: number) => {
        if (!text.trim()) return;
        const lines = text.toUpperCase().split(/\r?\n/);
        const x = Math.min(0.98, Math.max(0.02, position.x)) * width;
        const baseY = Math.min(0.98, Math.max(0.02, position.y)) * height;
        const lineHeight = fontSize * 1.15;
        ctx.textBaseline = 'middle';
        const prevFill = ctx.fillStyle;
        const prevFont = ctx.font;
        const prevLineWidth = ctx.lineWidth;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.lineWidth = Math.max(2, fontSize * 0.08);
        lines.forEach((line, index) => {
          const offset = (index - (lines.length - 1) / 2) * lineHeight;
          ctx.strokeText(line || ' ', x, baseY + offset);
          ctx.fillText(line || ' ', x, baseY + offset);
        });
        ctx.font = prevFont;
        ctx.fillStyle = prevFill;
        ctx.lineWidth = prevLineWidth;
      };

      drawTextBlock(topText, captionPositions.top, textColors.top, textFonts.top, textSizes.top);
      drawTextBlock(bottomText, captionPositions.bottom, textColors.bottom, textFonts.bottom, textSizes.bottom);
    },
    [bottomText, captionPositions.bottom, captionPositions.top, imageOffsets, layout, textColors, textFonts, textSizes, topText]
  );

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleFileChange = (slot: ImageSlot) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('Please choose an image file.');
      return;
    }
    setStatus('Loading image…');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        imageElementsRef.current[slot] = img;
        setImageSources((prev) => ({ ...prev, [slot]: result }));
        setImageOffsets((prev) => ({ ...prev, [slot]: { x: 0, y: 0 } }));
        setActiveImageAdjustSlot((current) => (current === slot ? null : current));
        if (slot === 'primary') {
          setCaptionPositions(createDefaultPositions());
          drawCanvas(img);
        } else {
          drawCanvas();
        }
        setStatus(null);
      };
      img.onerror = () => setStatus('Failed to load image. Please try a different file.');
      img.src = result;
    };
    reader.onerror = () => setStatus('Unable to read the selected file.');
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const hasPrimary = Boolean(imageSources.primary);
    const layoutConfig = LAYOUTS[layout];
    const requiresSecondary = layoutConfig.requiresSecondary;
    if (!canvas || !hasPrimary || (requiresSecondary && !imageSources.secondary)) return;
    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleReset = () => {
    setImageSources({ primary: null, secondary: null });
    imageElementsRef.current = { primary: null, secondary: null };
    setTopText('Top text');
    setBottomText('Bottom text');
    setTextColors({ top: '#ffa500', bottom: '#ffa500' });
    setTextFonts({ top: FONT_OPTIONS[0].value, bottom: FONT_OPTIONS[0].value });
    setTextSizes({ top: 32, bottom: 32 });
    setStatus(null);
    setCaptionPositions(createDefaultPositions());
    setImageOffsets(createDefaultImageOffsets());
    setActiveImageAdjustSlot(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    ['primary', 'secondary'].forEach((slot) => {
      const ref = fileInputRefs.current[slot as ImageSlot];
      if (ref) ref.value = '';
    });
  };

  const handlePointerDown = (key: CaptionKey) => (event: React.PointerEvent<HTMLDivElement>) => {
    if (!imageSources.primary) return;
    setDraggedCaption(key);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggedCaption || !canvasWrapperRef.current) return;
    const rect = canvasWrapperRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    setCaptionPositions((prev) => ({
      ...prev,
      [draggedCaption]: {
        x: Math.min(0.98, Math.max(0.02, x)),
        y: Math.min(0.98, Math.max(0.02, y))
      }
    }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggedCaption) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggedCaption(null);
  };

  const handleImageAdjustPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activeImageAdjustSlot) return;
    imageDragStateRef.current = {
      slot: activeImageAdjustSlot,
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleImageAdjustPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = imageDragStateRef.current;
    if (!state.slot || state.pointerId !== event.pointerId) return;
    const layoutConfig = LAYOUTS[layout];
    const cellWidthPx = layoutConfig.cols ? canvasSize.width / layoutConfig.cols : CELL_SIZE;
    const cellHeightPx = layoutConfig.rows ? canvasSize.height / layoutConfig.rows : CELL_SIZE;
    if (!Number.isFinite(cellWidthPx) || !Number.isFinite(cellHeightPx)) return;

    const deltaX = event.clientX - state.lastX;
    const deltaY = event.clientY - state.lastY;
    state.lastX = event.clientX;
    state.lastY = event.clientY;

    setImageOffsets((prev) => {
      const current = prev[state.slot as ImageSlot];
      const nextX = Math.max(-1, Math.min(1, current.x + deltaX / Math.max(1, cellWidthPx)));
      const nextY = Math.max(-1, Math.min(1, current.y + deltaY / Math.max(1, cellHeightPx)));
      return { ...prev, [state.slot as ImageSlot]: { x: nextX, y: nextY } };
    });
  };

  const handleImageAdjustPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = imageDragStateRef.current;
    if (state.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      imageDragStateRef.current = { slot: null, pointerId: null, lastX: 0, lastY: 0 };
    }
  };

  const captionLabels = useMemo(() => ({
    top: topText || 'Text 1',
    bottom: bottomText || 'Text 2'
  }), [bottomText, topText]);

  const layoutConfig = LAYOUTS[layout];
  const hasPrimary = Boolean(imageSources.primary);
  const requiresSecondary = layoutConfig.requiresSecondary;
  const hasAllRequired = hasPrimary && (!requiresSecondary || Boolean(imageSources.secondary));
  const activeSlots = Array.from(new Set(layoutConfig.cells.map((c) => c.slot)));

  return (
    <section>
      <header className="mb-2">
        <h3 className="text-lg font-bold mb-2">Meme Creator</h3>
      </header>

      <div className="flex flex-col gap-4">
        <div className="border rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center gap-5">
          {hasPrimary ? (
            <div
              ref={canvasWrapperRef}
              className="relative max-w-full mx-auto"
              style={{ touchAction: 'none' }}
            >
              <canvas ref={canvasRef} aria-label="Meme preview" className="max-w-full h-auto block"></canvas>
              {!activeImageAdjustSlot ? (
                <div className="absolute inset-0 select-none">
                  {(['top', 'bottom'] as CaptionKey[]).map((key) => (
                    <div
                      key={key}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-black/50 text-white text-xs font-semibold pointer-events-auto cursor-move ${draggedCaption === key ? 'ring-2 ring-indigo-400' : ''}`}
                      style={{
                        left: `${captionPositions[key].x * 100}%`,
                        top: `${captionPositions[key].y * 100}%`
                      }}
                      onPointerDown={handlePointerDown(key)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                    >
                      {captionLabels[key] || (key === 'top' ? 'Text 1' : 'Text 2')}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="absolute inset-0 cursor-grab"
                  onPointerDown={handleImageAdjustPointerDown}
                  onPointerMove={handleImageAdjustPointerMove}
                  onPointerUp={handleImageAdjustPointerUp}
                  onPointerLeave={handleImageAdjustPointerUp}
                >
                  <div className="absolute bottom-2 right-2 text-[11px] text-white bg-black/50 px-3 py-1 rounded">Drag to reposition the selected image</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <p className="font-medium mb-2">No image yet</p>
              <p className="text-sm">Upload an image to start crafting your meme masterpiece.</p>
            </div>
          )}
          <div className="w-full flex justify-center -mt-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white p-2 shadow-sm">
              {Object.entries(LAYOUTS).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLayout(key as LayoutKey)}
                  aria-label={meta.label}
                  className={`h-10 w-10 rounded-md flex items-center justify-center transition-colors ${layout === key ? 'bg-indigo-600/10 ring-2 ring-indigo-400' : 'bg-transparent'}`}
                >
                  <span className="flex h-8 w-8 items-center justify-center" aria-hidden="true">
                    {key === 'single' && (
                      <span className="inline-flex h-9 w-9 items-center justify-center">
                        <span className="h-8 w-8 bg-indigo-400"></span>
                      </span>
                    )}
                    {key === 'side-by-side' && (
                      <span className="inline-flex h-9 w-9 items-center justify-between">
                        <span className="h-8 w-4 bg-indigo-400"></span>
                        <span className="h-8 w-3 bg-indigo-400"></span>
                      </span>
                    )}
                    {key === 'stacked' && (
                      <span className="inline-flex h-9 w-9 items-center flex-col justify-between">
                        <span className="h-3 w-8 bg-indigo-400"></span>
                        <span className="h-5 w-8 bg-indigo-400"></span>
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {activeImageAdjustSlot ? (
            <div className="w-full text-center text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-3 py-2">
              Adjusting {SLOT_LABELS[activeImageAdjustSlot]} — drag on the canvas to fine-tune fit. Click “Done” when finished.
            </div>
          ) : null}
          <div className="w-full grid gap-3 md:grid-cols-2">
            {activeSlots.map((slot) => (
              <div key={slot} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 bg-white rounded shadow-sm">
                <div>
                  <p className="text-sm font-semibold">{SLOT_LABELS[slot]}{layoutConfig.requiresSecondary && slot === 'secondary' ? ' (required)' : ''}</p>
                  <p className="text-xs text-gray-500">{imageSources[slot] ? 'Image ready' : 'PNG/JPEG up to ~5 MB'}</p>
                </div>
                <div className="flex gap-2">
                  {imageSources[slot] ? (
                    <button
                      className="px-3 py-1 text-xs rounded border"
                      onClick={() => {
                        setImageSources((prev) => ({ ...prev, [slot]: null }));
                        imageElementsRef.current[slot] = null;
                        setImageOffsets((prev) => ({ ...prev, [slot]: { x: 0, y: 0 } }));
                        setActiveImageAdjustSlot((current) => (current === slot ? null : current));
                        const ref = fileInputRefs.current[slot];
                        if (ref) ref.value = '';
                        drawCanvas();
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                  <button
                    className={`px-3 py-1 text-xs rounded border transition-colors ${!imageSources[slot]
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                      : activeImageAdjustSlot === slot
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                        : 'border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600'}`}
                    disabled={!imageSources[slot]}
                    onClick={() => {
                      if (!imageSources[slot]) return;
                      setActiveImageAdjustSlot((current) => (current === slot ? null : slot));
                    }}
                  >
                    {activeImageAdjustSlot === slot ? 'Done' : 'Adjust fit'}
                  </button>
                  <button
                    className="px-3 py-1 rounded text-sm bg-indigo-500 text-white"
                    onClick={() => fileInputRefs.current[slot]?.click()}
                  >
                    {imageSources[slot] ? 'Replace' : 'Upload'}
                  </button>
                  <input
                    ref={(el) => (fileInputRefs.current[slot] = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange(slot)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          {status ? <p className="text-sm text-indigo-600">{status}</p> : null}

          <div className="grid gap-6 md:grid-cols-2">
            {TEXT_FIELDS.map(({ key, label }) => {
              const isTop = key === 'top';
              const textValue = isTop ? topText : bottomText;
              return (
                <div key={key} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                  <label className="flex flex-col text-sm font-semibold">
                    {label}
                    <textarea
                      value={textValue}
                      onChange={(e) => (isTop ? setTopText(e.target.value) : setBottomText(e.target.value))}
                      className="mt-2 px-3 py-2 border rounded h-16 resize-none"
                      placeholder={`Add ${label} (line breaks supported)`}
                      rows={2}
                    ></textarea>
                  </label>

                  <div className="flex flex-col gap-3 text-sm font-medium">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2">
                        <span>Color:</span>
                        <input
                          type="color"
                          value={textColors[key]}
                          onChange={(e) => setTextColors((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="h-8 w-8 cursor-pointer rounded border"
                        />
                      </label>
                      <label className="flex items-center gap-2 min-w-[140px]">
                        <span>Font:</span>
                        <select
                          value={textFonts[key]}
                          onChange={(e) => setTextFonts((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="flex-1 px-2 py-1 border rounded bg-white text-sm"
                        >
                          {FONT_OPTIONS.map((opt) => (
                            <option value={opt.value} key={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-2 flex-1 min-w-[160px]">
                        <span>Font size:</span>
                        <input
                          type="range"
                          min={16}
                          max={96}
                          value={textSizes[key]}
                          onChange={(e) => setTextSizes((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="w-12 text-right text-xs">{textSizes[key]}px</span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-sm font-medium text-gray-600">Tip: drag captions on the preview to fine-tune their placement.</div>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleDownload} disabled={!hasAllRequired} className={`px-4 py-2 rounded text-white ${hasAllRequired ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-400 cursor-not-allowed'}`}>Download PNG</button>
            <button onClick={handleReset} className="px-4 py-2 rounded border">Reset</button>
          </div>
          {!hasAllRequired && requiresSecondary ? <p className="text-xs text-red-600">This layout needs two images. Upload a second image to enable download.</p> : null}
        </div>
      </div>
    </section>
  );
};

export default MemeCreatorPage;
