import React, { useCallback, useMemo } from 'react';
import { Download, Image as ImageIcon, Trash2, Map, FileSpreadsheet, Plus, Save, FolderOpen, FileText } from 'lucide-react';
import { exportToCSV, exportToImage, exportToPDF } from '../utils/exportUtils';

const Sidebar = React.memo(function Sidebar({ imageSrc, onImageUpload, onSaveProject, onLoadProject, markers, onClearMarkers, onRemoveMarker, pointSize, setPointSize, groups, setGroups, activeGroupId, setActiveGroupId }) {
    const handleExportCSV = useCallback(() => {
        exportToCSV(markers, groups);
    }, [markers, groups]);

    const handleExportImage = useCallback(() => {
        exportToImage(imageSrc, markers, groups);
    }, [imageSrc, markers, groups]);

    const handleExportPDF = useCallback(() => {
        exportToPDF(imageSrc, markers, groups);
    }, [imageSrc, markers, groups]);

    const handleAddGroup = useCallback(() => {
        const newId = `group-${Date.now()}`;
        setGroups(prev => [...prev, { id: newId, name: `Group ${prev.length + 1}`, color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0') }]);
        setActiveGroupId(newId);
    }, [setGroups, setActiveGroupId]);

    const handleUpdateGroup = useCallback((id, field, value) => {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
    }, [setGroups]);

    const handleDeleteGroup = useCallback((id) => {
        setGroups(prev => {
            if (prev.length <= 1) return prev;
            const remaining = prev.filter(g => g.id !== id);
            // Also update activeGroupId using the freshest array
            setActiveGroupId(currentActive => {
                if (currentActive === id) {
                    return remaining[0]?.id || 'default';
                }
                return currentActive;
            });
            return remaining;
        });
    }, [setGroups, setActiveGroupId]);

    // Pre-compute group marker counts in a single pass instead of .filter() per group
    const groupMarkerCounts = useMemo(() => {
        const counts = {};
        for (const m of markers) {
            counts[m.groupId] = (counts[m.groupId] || 0) + 1;
        }
        return counts;
    }, [markers]);

    return (
        <aside className="w-80 bg-surface h-full flex flex-col shadow-xl z-10 border-r border-border shrink-0">
            <div className="p-6 border-b border-border">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                    <Map className="text-primary" />
                    Map Marker
                </h1>
                <p className="text-sm text-gray-400 mt-2">Upload a map and mark your points.</p>
            </div>

            <div className="p-6 border-b border-border flex flex-col gap-4">
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={onSaveProject}
                        disabled={!imageSrc}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 border border-border rounded-lg text-sm transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} /> Save Project
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 border border-border rounded-lg text-sm transition-colors text-white cursor-pointer">
                        <FolderOpen size={16} /> Load Project
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={onLoadProject}
                        />
                    </label>
                </div>

                <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg cursor-pointer transition-colors font-medium">
                    <ImageIcon size={20} />
                    {imageSrc ? 'Replace Image' : 'Import Image'}
                    <input
                        type="file"
                        accept="image/jpeg, image/png, image/webp"
                        className="hidden"
                        onChange={onImageUpload}
                    />
                </label>

                {imageSrc && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCSV}
                            disabled={markers.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-1 bg-white/5 hover:bg-white/10 border border-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                        >
                            <FileSpreadsheet size={16} />
                            CSV
                        </button>
                        <button
                            onClick={handleExportImage}
                            disabled={markers.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-1 bg-white/5 hover:bg-white/10 border border-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                        >
                            <Download size={16} />
                            Image
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={markers.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-1 bg-white/5 hover:bg-white/10 border border-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                        >
                            <FileText size={16} />
                            PDF
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
                {imageSrc && (
                    <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                        <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-3">
                            Marker Size
                            <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded text-xs">
                                {pointSize.toFixed(1)}x
                            </span>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={pointSize}
                            onChange={(e) => setPointSize(parseFloat(e.target.value))}
                            className="w-full accent-primary h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                )}

                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Groups & Counters</h2>
                    <button onClick={handleAddGroup} className="text-primary hover:text-primary/80 text-sm flex items-center gap-1 transition-colors">
                        <Plus size={14} /> Add Group
                    </button>
                </div>

                <div className="space-y-3 mb-6">
                    {groups && groups.map(group => {
                        const groupMarkerCount = groupMarkerCounts[group.id] || 0;
                        return (
                            <div
                                key={group.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors group/item ${activeGroupId === group.id ? 'bg-primary/10 border-primary/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                onClick={() => setActiveGroupId(group.id)}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="relative w-6 h-6 shrink-0 rounded overflow-hidden">
                                            <input
                                                type="color"
                                                value={group.color}
                                                onChange={(e) => handleUpdateGroup(group.id, 'color', e.target.value)}
                                                className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={group.name}
                                            onChange={(e) => handleUpdateGroup(group.id, 'name', e.target.value)}
                                            className="bg-transparent border-none text-sm text-white font-medium focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 min-w-0 flex-1 transition-colors hover:bg-white/5 focus:bg-white/10"
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder="Group Name"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-gray-300">
                                            {groupMarkerCount}
                                        </span>
                                        {groups.length > 1 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                                                className="text-gray-500 hover:text-red-400 p-1.5 opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-all rounded hover:bg-white/10"
                                                title="Delete Group"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between mb-4 mt-6 pt-6 border-t border-white/10">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Total Markers ({markers.length})</h2>
                    {markers.length > 0 && (
                        <button onClick={onClearMarkers} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors">
                            <Trash2 size={14} /> Clear All
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
});

export default Sidebar;
