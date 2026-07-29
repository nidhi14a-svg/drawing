# Development Plan

## Overview

This plan breaks the browser-based gesture drawing application into a series of well-defined phases. The work focuses on scalable frontend architecture, clear module boundaries, and incremental delivery without implementing production code in this document.

---

## Phase 1: Project Setup

### Goal
Establish the foundational React + Vite project structure and the architecture needed for future feature development.

### Files to Implement
- README.md
- package.json
- vite.config.ts
- tsconfig.json
- tsconfig.app.json
- tsconfig.node.json
- index.html
- src/app/main.tsx
- src/app/App.tsx
- src/styles/globals.css
- src/types/index.ts
- src/constants/index.ts

### Dependencies
- Vite
- React
- TypeScript
- ESLint and Prettier configuration
- Basic folder structure for features, hooks, services, utilities, and styles

### Expected Output
A clean project scaffold that supports modular development and future feature integration.

### Acceptance Criteria
- The project can be started locally in development mode.
- The base folder structure matches the planned architecture.
- Core configuration files are present and correctly organized.
- The app shell is ready for feature modules to be added.

---

## Phase 2: Camera System

### Goal
Add webcam access and the foundational video pipeline for real-time interaction.

### Files to Implement
- src/features/camera/components/CameraView.tsx
- src/features/camera/components/CameraStatus.tsx
- src/features/camera/hooks/useCameraStream.ts
- src/features/camera/services/cameraService.ts
- src/features/camera/types.ts

### Dependencies
- Browser MediaDevices API
- React state and effect lifecycle
- Camera permission handling

### Expected Output
A functional webcam preview with lifecycle controls for starting and stopping the stream.

### Acceptance Criteria
- The app requests camera access from the browser.
- The video stream is displayed correctly in the UI.
- Permission failures and unsupported environments are handled gracefully.
- Camera startup and shutdown are controlled cleanly.

---

## Phase 3: MediaPipe Integration

### Goal
Integrate MediaPipe Hands into the browser-based application for real-time hand tracking.

### Files to Implement
- src/features/gestures/services/mediapipeService.ts
- src/features/gestures/hooks/useHandTracking.ts
- src/features/gestures/types.ts
- src/features/gestures/constants.ts

### Dependencies
- MediaPipe Hands SDK
- Browser runtime support for WebGL and WebAssembly
- Camera stream output

### Expected Output
A hand tracking layer that produces landmark data from the live camera feed.

### Acceptance Criteria
- MediaPipe Hands initializes successfully with a live camera stream.
- Hand landmarks are exposed to the application in a structured format.
- Errors during initialization or tracking are surfaced clearly.
- The integration remains isolated from drawing and UI concerns.

---

## Phase 4: Gesture Engine

### Goal
Translate hand landmarks into meaningful application actions such as drawing, erasing, or switching modes.

### Files to Implement
- src/features/gestures/services/gestureClassifier.ts
- src/features/gestures/services/gestureMappingService.ts
- src/features/gestures/hooks/useGestureRecognition.ts
- src/features/gestures/utils/gestureUtils.ts
- src/features/gestures/constants.ts

### Dependencies
- MediaPipe hand landmark data
- Recognizer configuration and gesture mapping rules
- Event or action pipeline for downstream features

### Expected Output
A gesture engine capable of identifying recognized actions with confidence and delivering them to the app state.

### Acceptance Criteria
- The system recognizes a defined set of gestures reliably.
- Gesture results are mapped to explicit actions.
- Ambiguous or low-confidence detections are handled safely.
- Gesture logic is decoupled from UI rendering.

---

## Phase 5: Canvas Engine

### Goal
Create the drawing surface and manage its low-level interaction lifecycle.

### Files to Implement
- src/features/canvas/components/CanvasSurface.tsx
- src/features/canvas/hooks/useCanvasDrawing.ts
- src/features/canvas/services/canvasService.ts
- src/features/canvas/utils/canvasUtils.ts
- src/features/canvas/types.ts

### Dependencies
- HTML5 Canvas API
- React ref management
- Drawing state model

### Expected Output
A responsive canvas component that supports drawing inputs and exposes drawing operations.

### Acceptance Criteria
- The canvas renders correctly at different sizes.
- User drawing interactions are captured and reflected on the canvas.
- Canvas resizing and redraw behavior remain stable.
- Drawing state can be reset or exported without breaking the engine.

---

## Phase 6: Toolbar

### Goal
Provide the application controls for tool selection, canvas actions, and session-level behavior.

### Files to Implement
- src/features/toolbar/components/Toolbar.tsx
- src/features/toolbar/components/ToolButton.tsx
- src/features/toolbar/hooks/useToolbarController.ts
- src/features/toolbar/types.ts

### Dependencies
- Canvas actions
- Gesture action mapping
- UI state management

### Expected Output
A polished toolbar that allows switching tools and invoking core actions such as clear and save.

### Acceptance Criteria
- Users can switch between brush and eraser modes.
- Clear and save actions are accessible and functional.
- Tool state updates are reflected across the interface.
- The toolbar remains responsive and accessible.

---

## Phase 7: Drawing Logic

### Goal
Implement the application logic that connects gesture input and tool selection to actual drawing behavior.

### Files to Implement
- src/features/canvas/services/drawingEngine.ts
- src/features/canvas/services/toolController.ts
- src/features/canvas/hooks/useDrawingSession.ts
- src/features/canvas/utils/strokeUtils.ts

### Dependencies
- Canvas engine
- Gesture engine
- Toolbar state

### Expected Output
A coherent drawing workflow where selected tools and recognized gestures produce expected canvas results.

### Acceptance Criteria
- Brush strokes render correctly with the selected color and size.
- Eraser behavior removes content as intended.
- Gesture-driven actions trigger the expected drawing behavior.
- Drawing behavior remains consistent across repeated sessions.

---

## Phase 8: Shape Detection

### Goal
Add optional shape recognition as an enhancement layer without disrupting the core drawing experience.

### Files to Implement
- src/features/shapes/components/ShapeOverlay.tsx
- src/features/shapes/services/shapeRecognizer.ts
- src/features/shapes/hooks/useShapeRecognition.ts
- src/features/shapes/types.ts

### Dependencies
- Gesture engine
- Canvas drawing state
- Optional feature flags

### Expected Output
A modular optional feature that can detect simple shapes and present them in the drawing workflow.

### Acceptance Criteria
- Shape detection can be enabled or disabled independently.
- Simple geometric shapes are detected successfully when the feature is active.
- The feature does not break normal drawing behavior when disabled.
- Detection logic remains isolated from the core drawing engine.

---

## Phase 9: Testing and Quality Assurance

### Goal
Verify the app’s stability, accessibility, and behavior across key flows.

### Files to Implement
- src/__tests__/setupTests.ts
- src/features/camera/__tests__/*
- src/features/canvas/__tests__/*
- src/features/gestures/__tests__/*
- src/features/toolbar/__tests__/*
- src/features/shapes/__tests__/*

### Dependencies
- Test runner configuration
- Mocking and browser environment utilities
- Manual QA checklist

### Expected Output
A tested and reliable foundation for the application’s core interactions.

### Acceptance Criteria
- Core modules have unit and integration tests.
- Critical paths for camera, drawing, and gesture handling are verified.
- Accessibility and responsive UI expectations are validated.
- No critical regressions remain in the core user journey.

---

## Recommended Delivery Order

1. Project setup
2. Camera system
3. MediaPipe integration
4. Gesture engine
5. Canvas engine
6. Toolbar
7. Drawing logic
8. Shape detection
9. Testing and QA

## Notes

- This plan intentionally separates concerns into modules to support scalability and maintainability.
- Each phase should be completed and validated before moving to the next.
- The architecture should remain browser-only, without backend or persistence dependencies.
