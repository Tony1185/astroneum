import type Nullable from './Nullable'
import { isValid } from './utils/typeChecks'

type TaskFinishedCallback = () => void

export type TaskPriority = 'data' | 'indicator' | 'overlay'
const PRIORITY_ORDER: Record<TaskPriority, number> = { data: 0, indicator: 1, overlay: 2 }

interface QueuedTasks {
  priority: TaskPriority
  tasks: Record<string, Promise<unknown>>
}

/**
 * Priority-aware async task serialiser.
 *
 * Data-load tasks (priority 'data') always run before indicator calculations
 * (priority 'indicator'), which run before overlay/drawing tasks (priority
 * 'overlay'). Within the same priority level, tasks execute in FIFO order.
 */
export default class TaskScheduler {
  private _holdingTasks: Nullable<QueuedTasks[]> = null
  private _running = false
  private readonly _callback: Nullable<TaskFinishedCallback>

  constructor(callback: TaskFinishedCallback) {
    this._callback = callback
  }

  add(tasks: Record<string, Promise<unknown>>, priority: TaskPriority = 'indicator'): void {
    const entry: QueuedTasks = { priority, tasks }
    if (!this._running) {
      void this._runBatch(entry)
    } else {
      if (isValid(this._holdingTasks)) {
        // Insert sorted by priority so higher-priority tasks run first
        const order = PRIORITY_ORDER[priority]
        let inserted = false
        for (let i = 0; i < this._holdingTasks.length; i++) {
          if (PRIORITY_ORDER[this._holdingTasks[i].priority] > order) {
            this._holdingTasks.splice(i, 0, entry)
            inserted = true
            break
          }
        }
        if (!inserted) this._holdingTasks.push(entry)
      } else {
        this._holdingTasks = [entry]
      }
    }
  }

  private async _runBatch(batch: QueuedTasks): Promise<void> {
    this._running = true
    try {
      await Promise.all(Object.values(batch.tasks))
    } finally {
      this._running = false
      this._callback?.()
      if (isValid(this._holdingTasks) && this._holdingTasks.length > 0) {
        const next = this._holdingTasks.shift()!
        void this._runBatch(next)
      } else {
        this._holdingTasks = null
      }
    }
  }

  clear(): void {
    this._holdingTasks = null
  }
}
