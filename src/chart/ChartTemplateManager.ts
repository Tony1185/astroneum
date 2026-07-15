import type { AstroneumHandle, SerializedChartState } from '@/types'

const STORAGE_KEY = 'astroneum-chart-templates'

export interface ChartTemplate {
  id: string
  name: string
  state: SerializedChartState
  createdAt: string
}

/**
 * ChartTemplateManager — save/load named chart configurations.
 *
 * Templates persist the complete chart state to localStorage.
 *
 * Usage:
 *   const templates = ChartTemplateManager.getInstance()
 *   templates.save('My Setup', chart.serializeState())
 *   templates.load('My Setup', chart) // applies to current chart
 */
export class ChartTemplateManager {
  private static _instance: ChartTemplateManager | null = null
  private _templates: ChartTemplate[] = []

  private constructor() {
    this._load()
  }

  static getInstance(): ChartTemplateManager {
    if (!ChartTemplateManager._instance) {
      ChartTemplateManager._instance = new ChartTemplateManager()
    }
    return ChartTemplateManager._instance
  }

  /** Save current chart state as a named template. Overwrites if name exists. */
  save(name: string, state: SerializedChartState): ChartTemplate {

    const existing = this._templates.findIndex(t => t.name === name)
    const template: ChartTemplate = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      state,
      createdAt: new Date().toISOString(),
    }

    if (existing >= 0) {
      this._templates[existing] = template
    } else {
      this._templates.push(template)
    }

    this._persist()
    return template
  }

  /** Load a template onto a chart. Returns false if template not found. */
  load(name: string, chart: AstroneumHandle): boolean {
    const template = this._templates.find(t => t.name === name)
    if (!template) return false
    chart.loadState(template.state)
    return true
  }

  /** Delete a template by name. Returns false if not found. */
  delete(name: string): boolean {
    const prev = this._templates.length
    this._templates = this._templates.filter(t => t.name !== name)
    if (this._templates.length < prev) {
      this._persist()
      return true
    }
    return false
  }

  /** List all saved template names. */
  list(): string[] {
    return this._templates.map(t => t.name)
  }

  /** Get a template by name. */
  get(name: string): ChartTemplate | undefined {
    return this._templates.find(t => t.name === name)
  }

  /** Get all templates. */
  getAll(): ChartTemplate[] {
    return [...this._templates]
  }

  private _persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._templates))
  }

  private _load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      // Schema validation — reject corrupted/malicious data
      this._templates = parsed.filter((t: unknown) => {
        if (t === null || typeof t !== 'object') return false
        const obj = t as Record<string, unknown>
        return typeof obj.id === 'string' &&
          typeof obj.name === 'string' &&
          typeof obj.state === 'object' && obj.state !== null &&
          typeof obj.createdAt === 'string'
      }) as ChartTemplate[]
    } catch { /* corrupt data */ }
  }
}

export default ChartTemplateManager
