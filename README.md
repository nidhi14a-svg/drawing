# Gesture Drawing Studio

A production-ready frontend architecture blueprint for a React + Vite application that runs entirely in the browser.

## Project Goal

Build a real-time hand gesture recognition experience using MediaPipe Hands for webcam-based interaction with an HTML5 canvas drawing surface.

## Scope

This repository currently contains only the project structure and technical specifications. No implementation code is included.

## Proposed Architecture

- React + Vite
- TypeScript
- MediaPipe Hands
- HTML5 Canvas
- Clean architecture with feature-based organization
- No backend, database, authentication, Docker, or API server

## Folder Structure

```text
src/
  app/
    App.tsx
    main.tsx
    routes/
    providers/
  components/
    layout/
    ui/
  features/
    camera/
    canvas/
    gestures/
    toolbar/
    palette/
    shapes/
  hooks/
  services/
  utils/
  constants/
  types/
  styles/
  assets/
  public/
    assets/

docs/
  specs/
```

## Design Principles

- Clean architecture
- SOLID principles
- Separation of concerns
- Feature-based modularity
- Reusable hooks and services
- Scalable folder organization
