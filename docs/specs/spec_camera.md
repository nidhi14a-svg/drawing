# Camera Module Specification

## Purpose

Manage webcam access, video stream lifecycle, and MediaPipe Hands integration for real-time hand tracking.

## Responsibilities

- Request webcam permission from the browser
- Display the live video stream in a responsive viewport
- Initialize MediaPipe Hands with appropriate configuration
- Handle stream errors and unsupported browser cases
- Expose lifecycle controls such as start, stop, and reset

## Functional Requirements

- Must support browser permission prompts gracefully
- Must support camera start and stop operations
- Must provide a clear fallback state when permission is denied
- Must remain isolated from canvas and drawing behavior

## Non-Functional Requirements

- Must be reusable and testable
- Must avoid direct DOM manipulation outside the dedicated view layer
- Must be compatible with modern Chromium-based browsers and Safari

## Suggested Interfaces

- CameraController
- useCameraStream
- CameraStatusView
