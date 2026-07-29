import { shapeRecognitionService, SHAPE_TYPES } from './shapeRecognitionService';

class CanvasEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    
    // Drawing History State
    this.paths = [];
    this.redoStack = [];
    
    // Active Drawing State
    this.currentPath = null;
    this.currentColor = '#000000';
    this.currentThickness = 5;
    this.isErasing = false;
    this.isDrawing = false;
    this.rafPending = false;
  }

  /**
   * Initializes the engine with a target canvas element.
   * @param {HTMLCanvasElement} canvasElement 
   */
  initialize(canvasElement) {
    if (!canvasElement) return;
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    
    // Bind the resize context to this instance
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    
    // Initial sizing
    this.handleResize();
  }

  /**
   * Cleans up event listeners and references.
   */
  dispose() {
    window.removeEventListener('resize', this.handleResize);
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Adjusts the canvas internal resolution and styling to match its parent container,
   * accounting for high-DPI displays to prevent blurriness.
   */
  handleResize() {
    if (!this.canvas || !this.ctx) return;
    
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    
    this.ctx.scale(dpr, dpr);
    
    // Vector paths allow us to losslessly redraw after a resize
    this.redrawAll();
  }

  /**
   * Updates the current brush settings.
   */
  setBrush(color, thickness, isErasing = false) {
    if (color !== undefined && color !== null) this.currentColor = color;
    if (thickness !== undefined && thickness !== null) this.currentThickness = thickness;
    this.isErasing = isErasing;
  }

  /**
   * Starts a new stroke at the given coordinates.
   */
  beginStroke(x, y) {
    if (!this.ctx) return;
    this.isDrawing = true;
    
    this.currentPath = {
      points: [{ x, y }],
      color: this.isErasing ? null : this.currentColor,
      thickness: this.currentThickness,
      isErasing: this.isErasing
    };
    
    // New actions invalidate the redo history
    this.redoStack = []; 
    
    this.redrawAll();
  }

  /**
   * Continues the active stroke to the new coordinates.
   */
  continueStroke(x, y) {
    if (!this.isDrawing || !this.currentPath) return;
    
    this.currentPath.points.push({ x, y });
    
    // Throttles rendering to precisely 60fps to prevent main-thread lag
    if (!this.rafPending) {
      this.rafPending = true;
      requestAnimationFrame(() => {
        this.redrawAll();
        this.rafPending = false;
      });
    }
  }

  /**
   * Finalizes the active stroke, auto-detects geometric shapes, and commits it to history.
   */
  endStroke() {
    if (!this.isDrawing || !this.currentPath) return;
    
    // Only attempt shape recognition on drawn paths, not eraser paths
    if (!this.currentPath.isErasing && this.currentPath.points.length > 5) {
      const recognition = shapeRecognitionService.analyzeStroke(this.currentPath.points);
      
      // If a shape was successfully detected, replace the rough path points
      if (recognition.type !== SHAPE_TYPES.UNKNOWN) {
        this.currentPath.points = recognition.points;
      }
    }
    
    this.paths.push(this.currentPath);
    this.currentPath = null;
    this.isDrawing = false;
    
    this.redrawAll();
  }

  /**
   * Removes the last drawn path and moves it to the redo stack.
   */
  undo() {
    if (this.paths.length === 0) return;
    const lastPath = this.paths.pop();
    this.redoStack.push(lastPath);
    this.redrawAll();
  }

  /**
   * Restores the most recently undone path.
   */
  redo() {
    if (this.redoStack.length === 0) return;
    const pathToRestore = this.redoStack.pop();
    this.paths.push(pathToRestore);
    this.redrawAll();
  }

  /**
   * Completely clears the canvas and all history.
   */
  clear() {
    this.paths = [];
    this.redoStack = [];
    this.currentPath = null;
    this.redrawAll();
  }

  /**
   * Internal function to render a single path using smooth quadratic curves.
   */
  _drawSmoothPath(path) {
    const { points, color, thickness, isErasing } = path;
    if (points.length === 0) return;

    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = thickness;
    
    if (isErasing) {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)'; // Color doesn't matter for destination-out
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = color;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 1) {
      // Draw a single dot if the user just tapped
      this.ctx.lineTo(points[0].x, points[0].y);
      this.ctx.stroke();
    } else {
      // Interpolate points using quadratic curves for perfectly smooth strokes
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      // Connect to the final point
      this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      this.ctx.stroke();
    }
    
    // Reset composite mode to default
    this.ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Clears the active canvas and re-renders all committed paths + the active path.
   */
  redrawAll() {
    if (!this.ctx || !this.canvas) return;

    // Save context state and reset transforms to guarantee a full clear
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    // Render historical paths
    for (const path of this.paths) {
      this._drawSmoothPath(path);
    }

    // Render the currently active path on top
    if (this.currentPath) {
      this._drawSmoothPath(this.currentPath);
    }
  }
}

export const canvasEngine = new CanvasEngine();
