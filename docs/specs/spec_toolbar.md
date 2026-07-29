# Toolbar Module Specification

## Purpose

Provide the primary controls for tool selection, drawing actions, and session commands.

## Responsibilities

- Render tool buttons for brush, eraser, clear, and save actions
- Manage the active tool state in a controlled way
- Expose commands for the application shell
- Keep toolbar logic thin and composable

## Functional Requirements

- Must support switching between drawing and erasing tools
- Must expose actions for clearing and saving the canvas
- Must support responsive placement across device sizes
- Must remain decoupled from gesture recognition internals

## Non-Functional Requirements

- Must be easy to extend with new tools
- Must follow accessible interaction patterns
- Must support future integration with keyboard shortcuts

## Suggested Interfaces

- ToolbarView
- useToolbarController
- ToolbarActionRegistry
