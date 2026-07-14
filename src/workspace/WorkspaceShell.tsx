import { createContext, type ReactNode, useCallback, useContext, useEffect, useId, useState } from 'react'

export interface WorkspaceShellContextValue {
  sidebarOpen: boolean
  sidebarWidth: number
  dockOpen: boolean
  dockMaximized: boolean
  dockHeight: number
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  toggleDock: () => void
  toggleDockMaximized: () => void
  setDockHeight: (height: number) => void
}

export interface WorkspaceShellProps {
  children: ReactNode
  toolbar?: ReactNode
  sidebar?: ReactNode
  dock?: ReactNode
  footer?: ReactNode
  theme?: 'dark' | 'light' | 'high-contrast'
  defaultSidebarOpen?: boolean
  defaultDockOpen?: boolean
  defaultSidebarWidth?: number
  defaultDockHeight?: number
}

export interface WorkspaceToolbarProps {
  children?: ReactNode
  leading?: ReactNode
  context?: ReactNode
  actions?: ReactNode
}

export function WorkspaceToolbar ({ children, leading, context, actions }: WorkspaceToolbarProps) {
  return (
    <div className="astroneum-workspace-toolbar-content">
      {leading && <div className="astroneum-workspace-toolbar-leading">{leading}</div>}
      {context && <div className="astroneum-workspace-toolbar-context">{context}</div>}
      {(actions || children) && <div className="astroneum-workspace-toolbar-actions">{actions}{children}</div>}
    </div>
  )
}

const SIDEBAR_MIN_WIDTH = 280
const SIDEBAR_MAX_WIDTH = 540
const DOCK_MIN_HEIGHT = 120
const DOCK_MAX_HEIGHT = 480

const WorkspaceShellContext = createContext<WorkspaceShellContextValue | null>(null)

export function useWorkspaceShell (): WorkspaceShellContextValue {
  const context = useContext(WorkspaceShellContext)
  if (!context) throw new Error('useWorkspaceShell must be used inside WorkspaceShell')
  return context
}

function clamp (value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function ResizeSeparator ({
  axis,
  value,
  min,
  max,
  label,
  onChange,
}: {
  axis: 'horizontal' | 'vertical'
  value: number
  min: number
  max: number
  label: string
  onChange: (value: number) => void
}) {
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const step = event.shiftKey ? 40 : 10
    const decrease = axis === 'vertical' ? 'ArrowLeft' : 'ArrowUp'
    const increase = axis === 'vertical' ? 'ArrowRight' : 'ArrowDown'
    if (event.key === 'Home') { event.preventDefault(); onChange(min); return }
    if (event.key === 'End') { event.preventDefault(); onChange(max); return }
    if (event.key === decrease) { event.preventDefault(); onChange(value - step); return }
    if (event.key === increase) { event.preventDefault(); onChange(value + step) }
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const startPosition = axis === 'vertical' ? event.clientX : event.clientY
    const startValue = value
    const onMove = (moveEvent: PointerEvent): void => {
      const position = axis === 'vertical' ? moveEvent.clientX : moveEvent.clientY
      onChange(startValue - (position - startPosition))
    }
    const onUp = (): void => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className={`astroneum-workspace-resize astroneum-workspace-resize-${axis}`}
      role="separator"
      tabIndex={0}
      aria-orientation={axis}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
    />
  )
}

export default function WorkspaceShell ({
  children,
  toolbar,
  sidebar,
  dock,
  footer,
  theme = 'dark',
  defaultSidebarOpen = true,
  defaultDockOpen = true,
  defaultSidebarWidth = 320,
  defaultDockHeight = 220,
}: WorkspaceShellProps) {
  const sidebarId = useId()
  const dockId = useId()
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen)
  const [sidebarWidth, setSidebarWidthState] = useState(() => clamp(defaultSidebarWidth, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH))
  const [dockOpen, setDockOpen] = useState(defaultDockOpen)
  const [dockMaximized, setDockMaximized] = useState(false)
  const [dockHeight, setDockHeightState] = useState(() => clamp(defaultDockHeight, DOCK_MIN_HEIGHT, DOCK_MAX_HEIGHT))

  const setSidebarWidth = useCallback((width: number) => setSidebarWidthState(clamp(width, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH)), [])
  const setDockHeight = useCallback((height: number) => setDockHeightState(clamp(height, DOCK_MIN_HEIGHT, DOCK_MAX_HEIGHT)), [])
  const toggleSidebar = useCallback(() => setSidebarOpen(open => !open), [])
  const toggleDock = useCallback(() => {
    setDockOpen(open => !open)
    setDockMaximized(false)
  }, [])
  const toggleDockMaximized = useCallback(() => {
    setDockOpen(true)
    setDockMaximized(maximized => !maximized)
  }, [])

  useEffect(() => {
    if (!dockOpen) setDockMaximized(false)
  }, [dockOpen])

  const context: WorkspaceShellContextValue = {
    sidebarOpen,
    sidebarWidth,
    dockOpen,
    dockMaximized,
    dockHeight,
    toggleSidebar,
    setSidebarWidth,
    toggleDock,
    toggleDockMaximized,
    setDockHeight,
  }

  return (
    <WorkspaceShellContext.Provider value={context}>
      <section
        className="astroneum-workspace term-shell"
        data-theme={theme}
        data-sidebar={sidebarOpen ? 'open' : 'closed'}
        data-dock={dockOpen ? 'open' : 'closed'}
        data-dock-maximized={dockMaximized}
        style={{
          '--astroneum-workspace-sidebar-width': `${sidebarWidth}px`,
          '--astroneum-workspace-dock-height': `${dockHeight}px`,
        }}
      >
        <header className="astroneum-workspace-toolbar term-topbar" role="toolbar">{toolbar}</header>
        <main className="astroneum-workspace-main term-workspace">
          <div className="astroneum-workspace-content term-workspace-main">
            <div className="astroneum-workspace-chart term-chart">{children}</div>
            <section id={dockId} className="astroneum-workspace-dock term-dock" aria-label="Workspace dock">
              {dockOpen && <ResizeSeparator axis="horizontal" value={dockHeight} min={DOCK_MIN_HEIGHT} max={DOCK_MAX_HEIGHT} label="Resize dock" onChange={setDockHeight} />}
              {dock}
            </section>
          </div>
        </main>
        <aside id={sidebarId} className="astroneum-workspace-sidebar term-sidebar" aria-label="Workspace sidebar" aria-hidden={!sidebarOpen}>
          {sidebarOpen && <ResizeSeparator axis="vertical" value={sidebarWidth} min={SIDEBAR_MIN_WIDTH} max={SIDEBAR_MAX_WIDTH} label="Resize sidebar" onChange={setSidebarWidth} />}
          {sidebar}
        </aside>
        <footer className="astroneum-workspace-footer term-footer">{footer}</footer>
      </section>
    </WorkspaceShellContext.Provider>
  )
}
