// ─── Shared canvas drawing helper (avoids code duplication) ─────────────────
function drawMarkersOnCanvas(ctx, img, markers, groups) {
    markers.forEach((marker) => {
        const group = groups?.find(g => g.id === marker.groupId) || { color: '#ef4444' };
        ctx.beginPath();
        const radius = Math.max(5, Math.min(img.width, img.height) * 0.005);
        ctx.arc(marker.x, marker.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = group.color;
        ctx.fill();
        ctx.lineWidth = Math.max(1, radius * 0.2);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
    });
}

function drawLegendOnCanvas(ctx, img, markers, groups) {
    if (!groups || groups.length === 0) return;
    const minDim = Math.min(img.width, img.height);
    const legendPadding = Math.max(10, minDim * 0.015);
    const itemHeight = Math.max(20, minDim * 0.025);

    ctx.font = `${itemHeight * 0.7}px Arial`;
    let maxTextWidth = ctx.measureText('Legend').width;
    groups.forEach(g => {
        const count = markers.filter(m => m.groupId === g.id).length;
        const textWidth = ctx.measureText(`${g.name}: ${count}`).width;
        if (textWidth > maxTextWidth) maxTextWidth = textWidth;
    });

    const legendWidth = maxTextWidth + (legendPadding * 2) + itemHeight;
    const legendHeight = (groups.length * itemHeight) + (legendPadding * 2) + itemHeight;
    const legendX = img.width - legendWidth - legendPadding * 2;
    const legendY = img.height - legendHeight - legendPadding * 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = Math.max(1, minDim * 0.002);
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    ctx.font = `bold ${itemHeight * 0.8}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Legend', legendX + legendPadding, legendY + legendPadding);

    groups.forEach((group, index) => {
        const groupMarkerCount = markers.filter(m => m.groupId === group.id).length;
        const itemY = legendY + legendPadding + itemHeight + (index * itemHeight);
        ctx.beginPath();
        const radius = itemHeight * 0.35;
        const circleX = legendX + legendPadding + radius;
        const circleY = itemY + itemHeight * 0.5;
        ctx.arc(circleX, circleY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = group.color;
        ctx.fill();
        ctx.lineWidth = Math.max(1, radius * 0.2);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.font = `${itemHeight * 0.7}px Arial`;
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${group.name}: ${groupMarkerCount}`, circleX + radius * 2, circleY);
    });
}

// ─── Trigger browser download via a temporary anchor ─────────────────────────
function triggerDownload(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ─── Toast notification (non-blocking replacement for alert) ──────────────────
function showToast(message, type = 'success') {
    const existing = document.getElementById('ag-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ag-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '12px 20px',
        borderRadius: '10px',
        background: type === 'error' ? '#ef4444' : '#22c55e',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        zIndex: '9999',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        transition: 'opacity 0.4s ease',
        opacity: '1',
    });
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
export const exportToCSV = (markers, groups) => {
    const headers = ['ID', 'X', 'Y', 'Group Name', 'Color'];
    const rows = markers.map((m, idx) => {
        const group = groups?.find(g => g.id === m.groupId) || { name: 'Unknown', color: '#ef4444' };
        // Sanitize group name: escape double-quotes and wrap in quotes to prevent CSV injection
        const safeName = `"${group.name.replace(/"/g, '""')}"`;
        return [idx + 1, m.x, m.y, safeName, group.color];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `map_markers_${Date.now()}.csv`);
    // Revoke the object URL to free memory
    URL.revokeObjectURL(url);
    showToast('CSV file downloaded successfully!');
};

// ─── Image Export ─────────────────────────────────────────────────────────────
export const exportToImage = (imageSrc, markers, groups) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => showToast('Failed to load image for export.', 'error');
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        drawMarkersOnCanvas(ctx, img, markers, groups);
        drawLegendOnCanvas(ctx, img, markers, groups);
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            triggerDownload(url, `marked_map_${Date.now()}.jpg`);
            URL.revokeObjectURL(url);
            showToast('Image downloaded successfully!');
        }, 'image/jpeg', 0.9);
    };
    img.src = imageSrc;
};

// ─── Project Save / Load ──────────────────────────────────────────────────────
export const exportProject = (imageSrc, markers, groups, pointSize) => {
    const projectData = { version: '1.0', imageSrc, markers, groups, pointSize };
    const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `map_project_${Date.now()}.json`);
    // Revoke the object URL to free memory
    URL.revokeObjectURL(url);
    showToast('Project saved successfully!');
};

export const importProject = (file, onSuccess, onError) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            // Basic schema validation
            if (data && typeof data === 'object' && data.imageSrc && Array.isArray(data.markers) && Array.isArray(data.groups)) {
                onSuccess(data);
                showToast('Project loaded successfully!');
            } else {
                if (onError) onError('Invalid project file format.');
                showToast('Invalid project file format.', 'error');
            }
        } catch {
            if (onError) onError('Failed to parse project file.');
            showToast('Failed to parse project file.', 'error');
        }
    };
    reader.onerror = () => {
        if (onError) onError('Failed to read the file.');
        showToast('Failed to read the file.', 'error');
    };
    reader.readAsText(file);
};

// ─── PDF Export ───────────────────────────────────────────────────────────────
export const exportToPDF = async (imageSrc, markers, groups) => {
    try {
        const { jsPDF } = await import('jspdf');
        const img = new Image();
        if (!imageSrc.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        img.onerror = () => showToast('Failed to load image for PDF export.', 'error');
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                drawMarkersOnCanvas(ctx, img, markers, groups);
                drawLegendOnCanvas(ctx, img, markers, groups);

                const dataURL = canvas.toDataURL('image/jpeg', 0.9);
                const orientation = img.width > img.height ? 'landscape' : 'portrait';
                const pdf = new jsPDF(orientation, 'mm', 'a4');
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const imgRatio = img.width / img.height;
                const pageRatio = pageWidth / pageHeight;
                let drawWidth, drawHeight;
                if (imgRatio > pageRatio) {
                    drawWidth = pageWidth;
                    drawHeight = pageWidth / imgRatio;
                } else {
                    drawHeight = pageHeight;
                    drawWidth = pageHeight * imgRatio;
                }
                const offsetX = (pageWidth - drawWidth) / 2;
                const offsetY = (pageHeight - drawHeight) / 2;
                pdf.addImage(dataURL, 'JPEG', offsetX, offsetY, drawWidth, drawHeight);
                pdf.save(`marked_map_${Date.now()}.pdf`);
                showToast('PDF downloaded successfully!');
            } catch (err) {
                console.error('PDF render error:', err);
                showToast('Failed to export PDF: ' + err.message, 'error');
            }
        };
        img.src = imageSrc;
    } catch (err) {
        console.error('Failed to load jsPDF library:', err);
        showToast('Failed to load PDF library: ' + err.message, 'error');
    }
};
