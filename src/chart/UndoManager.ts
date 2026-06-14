import type { AstroneumHandle, SerializedChartState } from '@/types'

/**
 * UndoManager — tracks chart overlay mutations for Ctrl+Z / Ctrl+Y support.
 *
 * Every createOverlay / removeOverlay / overrideOverlay is recorded as a
 * snapshot of the full overlay list. Undo pops the stack and restores.
 *
 * Usage:
 *   const undo = new UndoManager(chart)
 *   chart.createOverlay(...)
 *   undo.record()           // call after every mutation
 *   undo.undo()             // Ctrl+Z
 *   undo.redo()             // Ctrl+Y
 */
export class UndoManager {
  private readonly _chart: AstroneumHandle
  private _stack: SerializedChartState[] = []
  private _redoStack: SerializedChartState[] = []
  private _maxDepth: number
  private _lastSnapshot: string | null = null

  constructor(chart: AstroneumHandle, maxDepth = 50) {
    this._chart = chart
    this._maxDepth = maxDepth
  }

  /** Record current overlay state. Call after every overlay mutation. */
  record(): void {
    const state = this._chart.serializeState()
    const json = JSON.stringify(state.overlays)

    // Don't push duplicate states
    if (json === this._lastSnapshot) return
    this._lastSnapshot = json

    this._stack.push(state)
    this._redoStack = []

    // Trim stack to max depth
    while (this._stack.length > this._maxDepth) {
      this._stack.shift()
    }
  }

  /** Undo last mutation. Returns true if an undo was performed. */
  undo(): boolean {
    if (this._stack.length <= 1) return false

    // Push current state to redo stack
    const current = this._chart.serializeState()
    this._redoStack.push(current)

    // Pop the last recorded state and restore it
    this._stack.pop() // discard current
    const prev = this._stack[this._stack.length - 1]
    this._chart.loadState(prev)
    this._lastSnapshot = JSON.stringify(prev.overlays)
    return true
  }

  /** Redo last undone mutation. Returns true if a redo was performed. */
  redo(): boolean {
    if (this._redoStack.length === 0) return false

    // Push current state to undo stack
    const current = this._chart.serializeState()
    this._stack.push(current)

    // Restore the redo state
    const next = this._redoStack.pop()!
    this._chart.loadState(next)
    this._lastSnapshot = JSON.stringify(next.overlays)
    return true
  }

  /** Clear all undo/redo history. */
  clear(): void {
    this._stack = []
    this._redoStack = []
    this._lastSnapshot = null
  }

  get canUndo(): boolean {
    return this._stack.length > 1
  }

  get canRedo(): boolean {
    return this._redoStack.length > 0
  }
}

export default UndoManager
