# Export System Technical Specification

## Purpose
To allow the current drawing to be exported from the browser as a portable image file for sharing or archiving.

## Responsibilities
- Capture the current canvas contents in a suitable format.
- Generate a downloadable image output such as PNG.
- Provide a consistent export workflow from the Toolbar and Canvas modules.
- Handle export errors and browser-specific limitations gracefully.

## Public APIs
- exportToPng(): Promise<Blob | string>
- downloadImage(filename): Promise<void>
- getExportState(): ExportState

## Input
- Current canvas bitmap state.
- User-selected filename or export metadata.
- Browser support for canvas-to-image conversion.

## Output
- A PNG image blob or data URL.
- Download-ready output exposed to the user interface.

## Dependencies
- Canvas Module for the current rendering state.
- Browser canvas export APIs.
- Toolbar for triggering export actions.

## Error Handling
- Handle canvas content that is empty or not yet initialized.
- Surface export failures clearly to the user.
- Fall back gracefully when browser download APIs are unavailable.

## Performance Notes
- Avoid unnecessary redraws during export.
- Keep export operations asynchronous and non-blocking.
- Support large canvases without excessive memory pressure.

## Future Extensions
- Add JPEG and SVG export support.
- Support exporting with transparent or custom backgrounds.
- Add automatic naming and export history.
- Support clipboard copy for selected images.
