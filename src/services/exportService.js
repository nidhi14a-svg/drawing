class ExportService {
  /**
   * Exports an HTML5 Canvas element to a PNG file and triggers a browser download.
   * Operates purely on the provided canvas, ensuring no UI or background elements are included.
   * 
   * @param {HTMLCanvasElement} canvasElement - The canvas containing the drawing to export.
   * @param {string} filename - The default filename for the download.
   */
  exportCanvasAsPNG(canvasElement, filename = 'drawing.png') {
    if (!canvasElement) {
      throw new Error("No drawing data found to export.");
    }

    try {
      // Serialize the visual state of the canvas into a Base64-encoded PNG data URL.
      // Because this operates strictly on the overlay canvas, the underlying 
      // camera feed (which is a separate <video> element) is completely ignored.
      const dataUrl = canvasElement.toDataURL('image/png');

      // Create a temporary anchor element to facilitate the download mechanism
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = filename;

      // Programmatically trigger a click to prompt the user's browser to save the file
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Clean up the DOM to prevent memory leaks
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error("Failed to export canvas:", error);
      // Catch specific security errors like Tainted Canvas (CORS issues)
      if (error.name === 'SecurityError') {
        throw new Error("Export blocked due to cross-origin security restrictions.");
      }
      throw new Error("An unexpected error occurred while exporting the drawing.");
    }
  }
}

export const exportService = new ExportService();
