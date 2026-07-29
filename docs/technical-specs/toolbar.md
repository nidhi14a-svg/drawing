# Toolbar Technical Specification

## Purpose
To provide application-level controls that let the user switch tools, clear the canvas, save output, and manage basic drawing modes.

## Responsibilities
- Render visible controls for brush, eraser, clear, and save actions.
- Maintain the active tool state and expose it to the Canvas and Gesture modules.
- Trigger commands for drawing-related operations.
- Ensure the control layout is responsive and accessible.

## Public APIs
- setActiveTool(tool): void
- getActiveTool(): ToolType
- onAction(action): void
- subscribeToToolbarState(listener): () => void

## Input
- User interaction through clicks, taps, and keyboard shortcuts.
- Application state updates from Canvas and Gesture systems.

## Output
- Selected tool state.
- Command events such as clear canvas or export drawing.
- UI state updates for disabled or active controls.

## Dependencies
- Canvas Module for drawing operations.
- Export System for save actions.
- Color Palette and Brush Engine for tool configuration.

## Error Handling
- Handle unsupported action requests gracefully.
- Disable actions when the required state is unavailable.
- Preserve toolbar state when the canvas resets or reinitializes.

## Performance Notes
- Keep toolbar state updates lightweight and local.
- Avoid unnecessary repainting of the full toolbar on minor state changes.
- Support responsive layout without causing layout thrashing.

## Future Extensions
- Add keyboard shortcuts and command palettes.
- Support tool categories and submenus.
- Add undo/redo buttons and advanced editing modes.
- Add a compact mobile-friendly toolbar layout.
