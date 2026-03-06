import React, { useRef, useState, useCallback, useMemo } from 'react';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const MapControls = React.memo(() => {
    const { zoomIn, zoomOut, resetTransform } = useControls();
    return (
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50 bg-surface/80 backdrop-blur p-2 rounded-xl shadow-lg border border-border">
            <button onClick={() => zoomIn()} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors" title="Zoom In">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </button>
            <button onClick={() => zoomOut()} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors" title="Zoom Out">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
            </button>
            <button onClick={() => resetTransform()} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors" title="Reset view">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
        </div>
    );
});
MapControls.displayName = 'MapControls';

// Individual marker — shown inside the image transform so it scales with zoom
const Marker = React.memo(({ x, y, color, size, index, imageWidth, imageHeight, isSelected, onSelect, onDelete }) => {
    const leftPercent = (x / imageWidth) * 100;
    const topPercent = (y / imageHeight) * 100;

    const stopAll = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
    }, []);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect();
    }, [onSelect]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        onDelete();
    }, [onDelete]);

    return (
        <div
            // pointer-events-none on wrapper so it doesn't block pan/zoom on empty areas;
            // re-enabled selectively on the dot and popover.
            className="absolute pointer-events-none"
            style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                // Use translate so the element origin is the marker center
                // but occupies ZERO layout space (width/height stay 0).
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 100 : 1,
            }}
        >
            {/* Delete popover */}
            {isSelected && (
                <div
                    className="absolute flex items-center gap-1 bg-gray-900 border border-white/20 rounded-lg px-2 py-1 shadow-xl whitespace-nowrap pointer-events-auto"
                    style={{
                        bottom: `calc(100% + ${size * 0.6}px)`,
                        left: '50%',
                        transform: 'translateX(-50%)',
                    }}
                    onPointerDown={stopAll}
                >
                    <span className="text-white/70 text-[11px] font-mono">#{index + 1}</span>
                    <div className="w-px h-3 bg-white/20" />
                    <button
                        onClick={handleDelete}
                        onPointerDown={stopAll}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 text-[11px] font-medium transition-colors hover:bg-red-500/10 px-1 py-0.5 rounded"
                        title="Delete marker"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                    {/* Caret */}
                    <div
                        className="absolute border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"
                        style={{ bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }}
                    />
                </div>
            )}

            {/* Marker dot */}
            <div
                onClick={handleClick}
                onPointerDown={stopAll}
                className={`rounded-full cursor-pointer transition-all duration-150 pointer-events-auto ${isSelected
                        ? 'scale-125 shadow-lg'
                        : 'hover:scale-110'
                    }`}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    willChange: 'transform',
                }}
            />
        </div>
    );
});
Marker.displayName = 'Marker';

const ImageMarkerInner = React.memo(function ImageMarkerInner({ src, markers, onAddMarker, onRemoveMarker, pointSize = 1, groups }) {
    const imageRef = useRef(null);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [selectedMarkerId, setSelectedMarkerId] = useState(null);

    const handleImageLoad = useCallback((e) => {
        setNaturalSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
    }, []);

    const handleDragStart = useCallback((e) => { e.preventDefault(); }, []);

    // Group color lookup
    const groupColorMap = useMemo(() => {
        const map = {};
        if (groups) for (const g of groups) map[g.id] = g.color;
        return map;
    }, [groups]);

    // Dynamic marker size based on image resolution
    const dynamicSize = useMemo(() => {
        const base = Math.max(4, Math.min(40, naturalSize.width * 0.005));
        return base * pointSize;
    }, [naturalSize.width, pointSize]);

    const defaultColor = groups?.[0]?.color || '#ef4444';

    // Ctrl+click → add marker and stop the event so react-zoom-pan-pinch
    // never sees it (preventing accidental pan/zoom-out after placing a point).
    const onPointerDown = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            e.stopPropagation();
            e.preventDefault();
            if (!imageRef.current) return;
            const rect = imageRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
            const scaleX = naturalSize.width / rect.width;
            const scaleY = naturalSize.height / rect.height;
            onAddMarker(Math.round(x * scaleX), Math.round(y * scaleY));
        }
        // Non-ctrl clicks pass through freely so panning works normally.
    }, [naturalSize, onAddMarker]);

    // Plain click on empty space (no drag occurred) → deselect active marker.
    // Using onClick instead of onPointerDown so it never blocks pan gestures.
    const onClick = useCallback((e) => {
        if (!e.ctrlKey && !e.metaKey) {
            setSelectedMarkerId(null);
        }
    }, []);

    return (
        <div className="w-full h-full relative cursor-crosshair">
            <TransformWrapper
                initialScale={1}
                minScale={0.1}
                maxScale={10}
                centerOnInit={true}
                doubleClick={{ disabled: true }}
                velocityAnimation={{ disabled: true }}
                alignmentAnimation={{ disabled: true }}
                limitToBounds={false}
            >
                <MapControls />
                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                    {/*
                     * KEY STABILITY FIX:
                     * - `contain: layout` isolates this box from overflowing children.
                     *   Absolutely-positioned markers that visually overflow the image
                     *   can never cause this container to grow, which was making the
                     *   image jump out of view.
                     * - Marker canvas uses `position:absolute; inset:0; width:100%; height:100%`
                     *   so it always matches the image exactly — no ResizeObserver needed.
                     * - Everything stays inside the TransformComponent so markers scale
                     *   with zoom automatically (no transform math required).
                     */}
                    <div
                        className="relative"
                        style={{
                            display: 'inline-block',
                            contain: 'layout',
                        }}
                        onPointerDown={onPointerDown}
                        onClick={onClick}
                    >
                        <img
                            ref={imageRef}
                            src={src}
                            alt="Map"
                            className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl block"
                            onLoad={handleImageLoad}
                            onDragStart={handleDragStart}
                            crossOrigin="anonymous"
                            id="exportable-image"
                        />

                        {/* Marker canvas — sits exactly over the image, never affects layout */}
                        {naturalSize.width > 0 && (
                            <div
                                className="pointer-events-none"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    overflow: 'visible',
                                }}
                            >
                                {markers.map((marker, index) => (
                                    <Marker
                                        key={marker.id}
                                        x={marker.x}
                                        y={marker.y}
                                        color={groupColorMap[marker.groupId] || defaultColor}
                                        size={dynamicSize}
                                        index={index}
                                        imageWidth={naturalSize.width}
                                        imageHeight={naturalSize.height}
                                        isSelected={selectedMarkerId === marker.id}
                                        onSelect={() => setSelectedMarkerId(prev => prev === marker.id ? null : marker.id)}
                                        onDelete={() => {
                                            onRemoveMarker(marker.id);
                                            setSelectedMarkerId(null);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
});

export default ImageMarkerInner;
