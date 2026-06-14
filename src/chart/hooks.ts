import { useEffect, useRef, useState } from 'react'

import type { Nullable, Chart } from '@/types'
import { DRAWING_GROUP_ID } from '@/constants'

// ---------------------------------------------------------------------------
// useClockTick
// ---------------------------------------------------------------------------

/**
 * Returns a HH:MM:SS string that updates every second.
 */
export function useClockTick(): string {
  const [clockTime, setClockTime] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const tick = (): void => {
      const now = new Date()
      setClockTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      )
    }
    tick()
    intervalRef.current = setInterval(tick, 1000)
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return clockTime
}

// ---------------------------------------------------------------------------
// useKeyboardShortcuts — extended with zoom, pan, scroll shortcuts
// ---------------------------------------------------------------------------

const SCROLL_DISTANCE = 200   // CSS pixels per arrow-key press
const WHEEL_ZOOM_STEP = 0.15 // zoom factor per wheel tick

/**
 * Registers keyboard and mouse shortcuts for chart navigation.
 *
 * | Shortcut            | Action                                 |
 * |---------------------|----------------------------------------|
 * | Delete / Backspace  | Remove selected overlay                |
 * | Escape              | Cancel drawing tool                     |
 * | Arrow Left / Right  | Pan chart by one step                   |
 * | Page Up / Down      | Scroll by one screen width               |
 * | Home / End          | Jump to start / end of data              |
 * | Ctrl+Z              | Undo (placeholder — UndoManager pending) |
 * | Mouse wheel         | Zoom centered on cursor                  |
 *
 * Returns a stable cleanup function.
 */
export function useKeyboardShortcuts(widgetRef: React.RefObject<Nullable<Chart>>): () => void {
  const latestCleanup = useRef<() => void>(() => { })

  useEffect(() => {
    let mouseWheelTarget: HTMLElement | null = null

    const handleKeyDown = (keyboardEvent: KeyboardEvent): void => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      const widget = widgetRef.current
      if (!widget) return

      switch (keyboardEvent.key) {
        case 'Delete':
        case 'Backspace':
          widget.removeOverlay()
          break
        case 'Escape':
          widget.removeOverlay({ groupId: DRAWING_GROUP_ID })
          break
        case 'ArrowLeft':
          keyboardEvent.preventDefault()
          widget.scrollByDistance(SCROLL_DISTANCE)
          break
        case 'ArrowRight':
          keyboardEvent.preventDefault()
          widget.scrollByDistance(-SCROLL_DISTANCE)
          break
        case 'PageUp':
          keyboardEvent.preventDefault()
          widget.scrollByDistance(SCROLL_DISTANCE * 5)
          break
        case 'PageDown':
          keyboardEvent.preventDefault()
          widget.scrollByDistance(-SCROLL_DISTANCE * 5)
          break
        case 'Home':
          keyboardEvent.preventDefault()
          widget.scrollToDataIndex(0)
          break
        case 'End':
          keyboardEvent.preventDefault()
          widget.scrollToRealTime()
          break
      }

      // Copy/paste drawings via Ctrl+C / Ctrl+V
      if (keyboardEvent.ctrlKey || keyboardEvent.metaKey) {
        if (keyboardEvent.key === 'c' || keyboardEvent.key === 'C') {
          const overlays = widget.getOverlays()
          if (overlays.length > 0) {
            const state = { overlays: overlays.map(o => ({ name: o.name, points: o.points, styles: o.styles, lock: o.lock, visible: o.visible })) }
            navigator.clipboard.writeText(JSON.stringify(state)).catch(() => { })
          }
        } else if (keyboardEvent.key === 'v' || keyboardEvent.key === 'V') {
          navigator.clipboard.readText().then(text => {
            try {
              const state = JSON.parse(text) as { overlays?: Array<{ name: string; points?: unknown; styles?: unknown; lock?: boolean; visible?: boolean }> }
              if (state.overlays) {
                for (const o of state.overlays) {
                  widget.createOverlay({ name: o.name, points: o.points as never, styles: o.styles as never, lock: o.lock, visible: o.visible })
                }
              }
            } catch { /* invalid clipboard data */ }
          }).catch(() => { })
        }
      }
    }

    const handleWheel = (e: WheelEvent): void => {
      const widget = widgetRef.current
      if (!widget) return

      // Only zoom if the chart container area has focus (avoid zooming when
      // scrolling page content past the chart).
      const chartEl = (e.target as HTMLElement)?.closest('.astroneum-widget')
      if (!chartEl) return

      e.preventDefault()

      // Zoom direction: scroll up = zoom in (scale > 1), scroll down = zoom out (scale < 1)
      const dir = e.deltaY < 0 ? 1 : -1
      const scale = 1 + dir * WHEEL_ZOOM_STEP

      // Zoom centered on the cursor's X position within the chart
      const rect = chartEl.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      widget.zoomAtCoordinate(scale, { x, y })
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('wheel', handleWheel, { passive: false })

    const cleanup = (): void => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('wheel', handleWheel)
    }
    latestCleanup.current = cleanup
    return cleanup
  }, [widgetRef])

  // Return stable wrapper that delegates to latest cleanup
  const stableCleanup = useRef<() => void>(() => { latestCleanup.current() })
  return stableCleanup.current
}
