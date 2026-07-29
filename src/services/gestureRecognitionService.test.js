import test from 'node:test';
import assert from 'node:assert/strict';
import { gestureRecognitionEngine, GESTURES } from './gestureRecognitionService.js';

function createLandmarks(overrides = {}) {
  const landmarks = Array.from({ length: 21 }, (_, index) => ({
    x: 0.1 + index * 0.005,
    y: 0.1 + index * 0.003,
    z: 0
  }));

  return {
    0: { x: 0.05, y: 0.1, z: 0 },
    1: { x: 0.06, y: 0.12, z: 0 },
    2: { x: 0.07, y: 0.14, z: 0 },
    3: { x: 0.08, y: 0.16, z: 0 },
    4: { x: 0.09, y: 0.18, z: 0 },
    5: { x: 0.12, y: 0.11, z: 0 },
    6: { x: 0.16, y: 0.10, z: 0 },
    7: { x: 0.20, y: 0.09, z: 0 },
    8: { x: 0.24, y: 0.08, z: 0 },
    9: { x: 0.12, y: 0.13, z: 0 },
    10: { x: 0.12, y: 0.16, z: 0 },
    11: { x: 0.12, y: 0.19, z: 0 },
    12: { x: 0.12, y: 0.22, z: 0 },
    13: { x: 0.10, y: 0.14, z: 0 },
    14: { x: 0.10, y: 0.17, z: 0 },
    15: { x: 0.10, y: 0.20, z: 0 },
    16: { x: 0.10, y: 0.23, z: 0 },
    17: { x: 0.08, y: 0.15, z: 0 },
    18: { x: 0.08, y: 0.18, z: 0 },
    19: { x: 0.08, y: 0.21, z: 0 },
    20: { x: 0.08, y: 0.24, z: 0 }
  };

  const merged = landmarks.map((landmark, index) => ({
    ...landmark,
    ...(overrides[index] || {})
  }));

  return merged;
}

test('detects draw gesture when index finger is extended and the other fingers remain folded', () => {
  const landmarks = createLandmarks({
    4: { x: 0.08, y: 0.16, z: 0 },
    6: { x: 0.12, y: 0.11, z: 0 },
    8: { x: 0.30, y: 0.10, z: 0 },
    10: { x: 0.10, y: 0.15, z: 0 },
    12: { x: 0.10, y: 0.18, z: 0 },
    14: { x: 0.09, y: 0.17, z: 0 },
    16: { x: 0.09, y: 0.20, z: 0 },
    18: { x: 0.08, y: 0.18, z: 0 },
    20: { x: 0.08, y: 0.21, z: 0 }
  });

  assert.equal(gestureRecognitionEngine.detectRawGesture(landmarks), GESTURES.DRAW);
});

test('keeps the previous gesture when landmarks temporarily disappear', () => {
  gestureRecognitionEngine.currentGesture = GESTURES.DRAW;
  gestureRecognitionEngine.gestureHistory = [GESTURES.DRAW];
  gestureRecognitionEngine.processResults({ multiHandLandmarks: [] });

  assert.equal(gestureRecognitionEngine.currentGesture, GESTURES.DRAW);
});
