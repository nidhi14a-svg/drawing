# Brush Engine Technical Specification

## Purpose
To define and apply the visual characteristics of the active drawing tool, including stroke style, size, opacity, and blending behavior.

## Responsibilities
- Maintain brush configuration such as color, size, and opacity.
- Apply brush settings to strokes drawn on the canvas.
- Support switching between standard brush and eraser behavior.
- Provide a consistent abstraction for the Canvas Module.

## Public APIs
- setBrushConfig(config): void
- getBrushConfig(): BrushConfig
- beginStroke(point): void
- updateStroke(point): void
- endStroke(): void
- setMode(mode): void

## Input
- Active tool state from the Toolbar.
- Color selection from the Color Palette.
- Input points from the Canvas Module.

## Output
- Stroke style parameters for rendering.
- Drawing instructions that the Canvas Module can apply.

## Dependencies
- Canvas Module.
- Color Palette.
- Toolbar.

## Error Handling
- Validate unsupported brush values and fallback to defaults.
- Prevent invalid stroke states when input is incomplete.
- Handle mode changes safely without corrupting current strokes.

## Performance Notes
- Keep configuration updates minimal and declarative.
- Use a simple stroke model to preserve performance on continuous input.
- Avoid excessive object creation during rapid updates.

## Future Extensions
- Add pressure-sensitive stroke width.
- Add texture and smoothing options.
- Add custom brush presets and saveable profiles.
