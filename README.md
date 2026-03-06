# 🌳 Tree Counter

A sleek, modern web application designed for marking and counting trees (or any points of interest) on high-resolution aerial or drone images.

![App Icon](public/icon.png)

## 🚀 Features

- **High-Performance Image Viewer**: Smooth zoom and pan for large aerial images using `react-zoom-pan-pinch`.
- **Intelligent Marking**: 
  - `Ctrl + Click` to add a marker.
  - Click any marker to view details or **Delete** it.
- **Group Management**: Organize markers into custom groups with unique colors and names.
- **Dynamic Legends**: Automatic legend generation on the canvas during export.
- **Pro Exports**: Export your data to:
  - **CSV**: Full coordinate data with group information.
  - **Image (JPG)**: High-resolution export with all markers and a color-coded legend.
  - **PDF**: Ready-to-print reports scaled to A4.
- **Project Persistence**: Save and load your entire project (image + markers + groups) as a `.json` file to resume work later.

## 🛠️ Security & Performance (Audited)

- **Memory Efficient**: Correctly handles browser memory by revoking object URLs after downloads.
- **Safe Exports**: Robust CSV sanitization to prevent injection attacks.
- **Fast Load Times**: Optimized build with automatic chunk splitting for large libraries like `jsPDF`.
- **Non-blocking UI**: Modern toast notifications replace disruptive browser alerts.

## 📦 Getting Started

1. **Clone & Install**:
   ```bash
   git clone https://github.com/harumulya-rgb/tree-counter.git
   cd tree-counter
   npm install
   ```
2. **Development**:
   ```bash
   npm run dev
   ```
3. **Production Build**:
   ```bash
   npm run build
   ```

## 🌐 Deployment

This project is configured for seamless deployment:
- **GitHub Pages**: Automatically deployed via GitHub Actions when pushing to `master`.
- **Vercel**: Pre-configured for zero-config Vercel deployments.

---
*Created with ❤️ for precision mapping.*
