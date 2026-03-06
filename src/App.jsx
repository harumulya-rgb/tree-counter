import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ImageMarker from './components/ImageMarker';
import { exportProject, importProject } from './utils/exportUtils';

function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [pointSize, setPointSize] = useState(1);
  const [groups, setGroups] = useState([{ id: 'default', name: 'Group 1', color: '#ef4444' }]);
  const [activeGroupId, setActiveGroupId] = useState('default');

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
        setMarkers([]); // Reset markers when new image uploaded
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  }, []);

  const handleSaveProject = useCallback(() => {
    // We need current values, so we read from state via refs wouldn't help here.
    // But since exportProject is called on-demand, this is fine.
    exportProject(imageSrc, markers, groups, pointSize);
  }, [imageSrc, markers, groups, pointSize]);

  const handleLoadProject = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      importProject(file, (data) => {
        setImageSrc(data.imageSrc);
        setMarkers(data.markers);
        setGroups(data.groups);
        if (data.pointSize) setPointSize(data.pointSize);
        setActiveGroupId(data.groups[0]?.id || 'default');
      }, (errorMsg) => {
        alert(errorMsg);
      });
    }
    e.target.value = null;
  }, []);

  const handleAddMarker = useCallback((x, y) => {
    setMarkers(prev => [...prev, { x, y, id: Date.now(), groupId: activeGroupId }]);
  }, [activeGroupId]);

  const handleClearMarkers = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all markers?")) {
      setMarkers([]);
    }
  }, []);

  const handleRemoveMarker = useCallback((id) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-white">
      <Sidebar
        imageSrc={imageSrc}
        onImageUpload={handleImageUpload}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        markers={markers}
        onClearMarkers={handleClearMarkers}
        onRemoveMarker={handleRemoveMarker}
        pointSize={pointSize}
        setPointSize={setPointSize}
        groups={groups}
        setGroups={setGroups}
        activeGroupId={activeGroupId}
        setActiveGroupId={setActiveGroupId}
      />
      <main className="flex-1 relative bg-surface border-l border-border flex items-center justify-center overflow-hidden">
        {imageSrc ? (
          <ImageMarker src={imageSrc} markers={markers} onAddMarker={handleAddMarker} onRemoveMarker={handleRemoveMarker} pointSize={pointSize} groups={groups} />
        ) : (
          <div className="text-gray-400 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-xl">
            <svg className="w-16 h-16 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p className="text-xl font-medium mb-2">No Image Selected</p>
            <p className="text-sm">Upload a large JPEG or PNG to start marking</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
