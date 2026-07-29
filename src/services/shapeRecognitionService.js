export const SHAPE_TYPES = {
  LINE: 'LINE',
  CIRCLE: 'CIRCLE',
  RECTANGLE: 'RECTANGLE',
  TRIANGLE: 'TRIANGLE',
  UNKNOWN: 'UNKNOWN'
};

class ShapeRecognitionService {
  /**
   * Analyzes a rough stroke path and attempts to convert it to a perfect geometric shape.
   * Recognizes: Lines, Circles, Triangles, and Rectangles.
   * 
   * @param {Array<{x, y}>} points 
   * @returns {{type: string, points: Array<{x, y}>}}
   */
  analyzeStroke(points) {
    if (!points || points.length < 10) return { type: SHAPE_TYPES.UNKNOWN, points };

    const bbox = this.getBoundingBox(points);
    const maxDim = Math.max(bbox.width, bbox.height);
    
    // Ignore strokes that are too small
    if (maxDim < 30) return { type: SHAPE_TYPES.UNKNOWN, points }; 

    const start = points[0];
    const end = points[points.length - 1];
    
    const startEndDist = this.getDistance(start, end);
    const isClosed = startEndDist < maxDim * 0.25; // 25% tolerance for a closed shape

    const pathLength = this.getPathLength(points);
    
    // 1. Check for Line
    // A straight line will have a direct start-to-end distance very close to the total path length
    if (!isClosed && (startEndDist / pathLength) > 0.90) {
      return {
        type: SHAPE_TYPES.LINE,
        points: [start, end] // Replace with a perfect straight line connecting start and end
      };
    }

    // Simplify the path to find major vertices using Douglas-Peucker
    const epsilon = maxDim * 0.12; // 12% of bounding box is the simplification tolerance
    const simplified = this.simplifyPath(points, epsilon);
    const numVertices = simplified.length;

    if (isClosed) {
      // 2. Check for Circle
      const maxDimBox = Math.max(bbox.width, bbox.height);
      const minDimBox = Math.min(bbox.width, bbox.height);
      // Safeguard against division by zero
      const aspectRatio = maxDimBox === 0 ? 0 : minDimBox / maxDimBox;
      
      const center = { x: bbox.minX + bbox.width / 2, y: bbox.minY + bbox.height / 2 };
      
      let avgRadius = 0;
      points.forEach(p => avgRadius += this.getDistance(center, p));
      avgRadius /= points.length;
      
      let radiusVariance = 0;
      points.forEach(p => {
        const d = this.getDistance(center, p);
        radiusVariance += Math.pow(d - avgRadius, 2);
      });
      const stdDev = Math.sqrt(radiusVariance / points.length);
      
      // Circles are fairly uniform in radius (low standard deviation) and have a near-1 aspect ratio
      if (aspectRatio > 0.70 && (stdDev / avgRadius) < 0.25) {
        return {
          type: SHAPE_TYPES.CIRCLE,
          points: this.generateCirclePoints(center, avgRadius)
        };
      }

      // 3. Check for Triangle 
      // Simplified closed triangle typically has 3 primary vertices + 1 closure point = 4
      if (numVertices === 3 || numVertices === 4) {
        let vertices = simplified;
        if (numVertices === 4) vertices = simplified.slice(0, 3); // Strip sloppy closure
        vertices.push(vertices[0]); // Force exact mathematical closure
        return {
          type: SHAPE_TYPES.TRIANGLE,
          points: vertices
        };
      }

      // 4. Check for Rectangle
      // Simplified closed rectangle typically has 4 vertices + 1 closure point = 5
      if (numVertices === 4 || numVertices === 5) {
        // Create an axis-aligned perfect rectangle based on bounding box
        const rectPoints = [
          { x: bbox.minX, y: bbox.minY },
          { x: bbox.maxX, y: bbox.minY },
          { x: bbox.maxX, y: bbox.maxY },
          { x: bbox.minX, y: bbox.maxY },
          { x: bbox.minX, y: bbox.minY }
        ];
        return {
          type: SHAPE_TYPES.RECTANGLE,
          points: rectPoints
        };
      }
    }

    // Fallback: Retain the rough stroke if no perfect shape is recognized
    return { type: SHAPE_TYPES.UNKNOWN, points };
  }

  generateCirclePoints(center, radius, segments = 60) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      points.push({
        x: center.x + radius * Math.cos(theta),
        y: center.y + radius * Math.sin(theta)
      });
    }
    return points;
  }

  getBoundingBox(points) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }

  getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  getPathLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += this.getDistance(points[i-1], points[i]);
    }
    return length;
  }

  simplifyPath(points, epsilon) {
    if (points.length < 3) return points;

    let dmax = 0;
    let index = 0;
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
      const d = this.perpendicularDistance(points[i], points[0], points[end]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }

    if (dmax > epsilon) {
      const rec1 = this.simplifyPath(points.slice(0, index + 1), epsilon);
      const rec2 = this.simplifyPath(points.slice(index), epsilon);
      return rec1.slice(0, -1).concat(rec2);
    } else {
      return [points[0], points[end]];
    }
  }

  perpendicularDistance(point, lineStart, lineEnd) {
    const x = point.x, y = point.y;
    const x1 = lineStart.x, y1 = lineStart.y;
    const x2 = lineEnd.x, y2 = lineEnd.y;
    
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = (x - x1) * C + (y - y1) * D;
    const lenSq = C * C + D * D;
    
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export const shapeRecognitionService = new ShapeRecognitionService();
