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

// Individual marker — clickable, shows delete popover when selected
const Marker = React.memo(({ x, y, color, size, index, imageWidth, imageHeight, isSelected, onSelect, onDelete }) => {
    const leftPercent = (x / imageWidth) * 100;
    const topPercent = (y / imageHeight) * 100;

    const handleClick = useCallback((e) => {
        e.stopPropagation(); // prevent triggering the image's pointerDown
        onSelect();
    }, [onSelect]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        onDelete();
    }, [onDelete]);

    return (
        <div
            className="absolute"
            style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 100 : 1,
            }}
        >
            {/* Delete popover — shown above the marker when selected */}
            {isSelected && (
                <div
                    className="absolute flex items-center gap-1 bg-gray-900 border border-white/20 rounded-lg px-2 py-1 shadow-xl whitespace-nowrap"
                    style={{
                        bottom: `calc(100% + ${size * 0.6}px)`,
                        left: '50%',
                        transform: 'translateX(-50%)',
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <span className="text-white/70 text-[11px] font-mono">#{index + 1}</span>
                    <div className="w-px h-3 bg-white/20" />
                    <button
                        onClick={handleDelete}
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

            {/* The marker dot */}
            <div
                onClick={handleClick}
                className={`rounded-full border-2 cursor-pointer transition-all duration-150 ${isSelected
                        ? 'border-white shadow-[0_0_0_3px_rgba(255,255,255,0.35)] scale-125'
                        : 'border-white/70 shadow-sm hover:border-white hover:scale-110'
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
        setNaturalSize({
            width: e.target.naturalWidth,
            height: e.target.naturalHeight
        });
    }, []);

    const handleImageClick = useCallback((e) => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const scaleX = naturalSize.width / rect.width;
        const scaleY = naturalSize.height / rect.height;
        onAddMarker(Math.round(x * scaleX), Math.round(y * scaleY));
    }, [naturalSize, onAddMarker]);

    const handleDragStart = useCallback((e) => {
        e.preventDefault();
    }, []);

    // Pre-compute group color lookup map for O(1) access per marker
    const groupColorMap = useMemo(() => {
        const map = {};
        if (groups) {
            for (const g of groups) {
                map[g.id] = g.color;
            }
        }
        return map;
    }, [groups]);

    // Calculate dynamic marker size
    const dynamicSize = useMemo(() => {
        const baseMarkerSize = Math.max(4, Math.min(40, naturalSize.width * 0.005));
        return baseMarkerSize * pointSize;
    }, [naturalSize.width, pointSize]);

    const defaultColor = groups?.[0]?.color || '#ef4444';

    // Ctrl+Click on image → add marker; any other click on the image → deselect
    const onPointerDown = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            handleImageClick(e);
            e.stopPropagation();
        } else {
            // Dismiss the selected marker (clicking on empty space)
            setSelectedMarkerId(null);
        }
    }, [handleImageClick]);

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
                    <div
                        className="relative inline-block isolate max-w-full max-h-full"
                        onPointerDownCapture={onPointerDown}
                    >
                        <img
                            ref={imageRef}
                            src={src}
                            alt="Map"
                            className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl"
                            onLoad={handleImageLoad}
                            onDragStart={handleDragStart}
                            crossOrigin="anonymous"
                            id="exportable-image"
                        />
                        {/* Render markers */}
                        {naturalSize.width > 0 && markers.map((marker, index) => (
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
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
});

export default ImageMarkerInner;
