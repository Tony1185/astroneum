import { useMemo, useState } from 'react'

import { type Component } from '@/react-shared'

import type { OverlayCreate, OverlayMode } from '@/types'

import i18n from '@/i18n'
import { List } from '@/component'
import { DRAWING_GROUP_ID } from '@/constants'
import {
  createSingleLineOptions, createMoreLineOptions,
  createPolygonOptions, createFibonacciOptions, createWaveOptions,
  createMagnetOptions, createCursorOptions, createForecastingOptions,
  createAnnotationOptions,
  Icon
} from './icons'

export interface DrawingBarProps {
  locale: string
  onDrawingItemClick: (overlay: OverlayCreate) => void
  onModeChange: (mode: string) => void,
  onLockChange: (lock: boolean) => void
  onVisibleChange: (visible: boolean) => void
  onRemoveClick: (groupId: string) => void
  onSnapLevelsChange?: (active: boolean) => void
  onCursorChange?: (cursor: string) => void
  onZoomIn?: () => void
}

const CURSOR_MAP: Record<string, string> = {
  crossCursor: 'crosshair',
  dotCursor: 'pointer',
  arrowCursor: 'default',
  eraserCursor: 'not-allowed'
}

const ARROW_D = 'M1.07298,0.159458C0.827521,-0.0531526,0.429553,-0.0531526,0.184094,0.159458C-0.0613648,0.372068,-0.0613648,0.716778,0.184094,0.929388L2.61275,3.03303L0.260362,5.07061C0.0149035,5.28322,0.0149035,5.62793,0.260362,5.84054C0.505822,6.05315,0.903789,6.05315,1.14925,5.84054L3.81591,3.53075C4.01812,3.3556,4.05374,3.0908,3.92279,2.88406C3.93219,2.73496,3.87113,2.58315,3.73964,2.46925L1.07298,0.159458Z'

const DrawingBar: Component<DrawingBarProps> = props => {
  const [cursorIcon, setCursorIcon] = useState('crossCursor')

  const [singleLineIcon, setSingleLineIcon] = useState('horizontalStraightLine')
  const [moreLineIcon, setMoreLineIcon] = useState('priceChannelLine')
  const [polygonIcon, setPolygonIcon] = useState('circle')
  const [fibonacciIcon, setFibonacciIcon] = useState('fibonacciLine')
  const [waveIcon, setWaveIcon] = useState('abcd')
  const [forecastingIcon, setForecastingIcon] = useState('longPosition')
  const [annotationIcon, setAnnotationIcon] = useState('simpleAnnotation')

  const [modeIcon, setModeIcon] = useState('weak_magnet')
  const [mode, setMode] = useState('normal')

  const [snapLevelsActive, setSnapLevelsActive] = useState(false)
  const [keepDrawing, setKeepDrawing] = useState(false)
  const [lock, setLock] = useState(false)
  const [visible, setVisible] = useState(true)

  const [popoverKey, setPopoverKey] = useState('')

  const cursorOptions = useMemo(() => createCursorOptions(props.locale), [props.locale])

  const overlays = useMemo(() => {
    return [
      { key: 'singleLine', icon: singleLineIcon, list: createSingleLineOptions(props.locale), setter: setSingleLineIcon },
      { key: 'moreLine', icon: moreLineIcon, list: createMoreLineOptions(props.locale), setter: setMoreLineIcon },
      { key: 'polygon', icon: polygonIcon, list: createPolygonOptions(props.locale), setter: setPolygonIcon },
      { key: 'fibonacci', icon: fibonacciIcon, list: createFibonacciOptions(props.locale), setter: setFibonacciIcon },
      { key: 'wave', icon: waveIcon, list: createWaveOptions(props.locale), setter: setWaveIcon },
      { key: 'forecasting', icon: forecastingIcon, list: createForecastingOptions(props.locale), setter: setForecastingIcon },
      { key: 'annotation', icon: annotationIcon, list: createAnnotationOptions(props.locale), setter: setAnnotationIcon }
    ]
  }, [singleLineIcon, moreLineIcon, polygonIcon, fibonacciIcon, waveIcon, forecastingIcon, annotationIcon, props.locale])

  const modes = useMemo(() => createMagnetOptions(props.locale), [props.locale])

  return (
    <div
      role="toolbar"
      aria-label="Drawing tools"
      className="astroneum-drawing-bar">

      <div
        key="cursor"
        className="item"
        role="group"
        aria-label="cursors"
        data-semantic-id="draw.cursor"
        tabIndex={0}
        onBlur={() => { setPopoverKey('') }}>
        <span
          className="icon-overlay"
          role="button"
          tabIndex={0}
          aria-label="Cursor"
          data-semantic-id="draw.cursor"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onCursorChange?.(CURSOR_MAP[cursorIcon] ?? 'crosshair') } }}
          onClick={() => { props.onCursorChange?.(CURSOR_MAP[cursorIcon] ?? 'crosshair') }}>
          <Icon name={cursorIcon} />
        </span>
        <div
          className="icon-arrow"
          role="button"
          tabIndex={0}
          aria-label="Cursor tools"
          aria-expanded={popoverKey === 'cursor'}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setPopoverKey(popoverKey === 'cursor' ? '' : 'cursor')
            }
          }}
          onClick={() => {
            setPopoverKey(popoverKey === 'cursor' ? '' : 'cursor')
          }}>
          <svg className={popoverKey === 'cursor' ? 'rotate' : ''} viewBox="0 0 4 6">
            <path d={ARROW_D} stroke="none" strokeOpacity={0}/>
          </svg>
        </div>
        {popoverKey === 'cursor' && (
          <List className="list">
            {cursorOptions.map(data => (
              <li
                key={data.key}
                onClick={() => {
                  setCursorIcon(data.key)
                  props.onCursorChange?.(CURSOR_MAP[data.key] ?? 'crosshair')
                  setPopoverKey('')
                }}>
                <Icon name={data.key}/>
                <span style={{paddingLeft:"8px"}}>{data.text}</span>
              </li>
            ))}
          </List>
        )}
      </div>

      {
        overlays.map(item => (
          <div
            key={item.key}
            className="item"
            role="group"
            aria-label={item.key}
            data-semantic-id={item.key === 'fibonacci' ? 'draw.fib_menu' : `draw.${item.key}`}
            tabIndex={0}
            onBlur={() => { setPopoverKey('') }}>
            <span
              className="icon-overlay"
              role="button"
              tabIndex={0}
              aria-label={item.icon}
              data-semantic-id={item.key === 'fibonacci' ? 'draw.fib' : `draw.${item.key}`}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onDrawingItemClick({ groupId: DRAWING_GROUP_ID, name: item.icon, visible, lock, mode: mode as OverlayMode }) } }}
              onClick={() => { props.onDrawingItemClick({ groupId: DRAWING_GROUP_ID, name: item.icon, visible, lock, mode: mode as OverlayMode }) }}>
              <Icon name={item.icon} />
            </span>
            <div
              className="icon-arrow"
              role="button"
              tabIndex={0}
              aria-label={`${item.key} tools`}
              aria-expanded={item.key === popoverKey}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setPopoverKey(item.key === popoverKey ? '' : item.key)
                }
              }}
              onClick={() => {
                if (item.key === popoverKey) {
                  setPopoverKey('')
                } else {
                  setPopoverKey(item.key)
                }
              }}>
              <svg
                className={item.key === popoverKey ? 'rotate' : ''}
                viewBox="0 0 4 6">
                <path d={ARROW_D} stroke="none" strokeOpacity={0}/>
              </svg>
            </div>
            {
              item.key === popoverKey && (
                <List className="list">
                  {
                    item.list.map(data => data.isHeader ? (
                      <li key={data.key} className="list-header">
                        <span>{data.text}</span>
                      </li>
                    ) : (
                      <li
                        key={data.key}
                        onClick={() => {
                          item.setter(data.key)
                          props.onDrawingItemClick({ groupId: DRAWING_GROUP_ID, name: data.key, lock, mode: mode as OverlayMode })
                          setPopoverKey('')
                        }}>
                        <Icon name={data.key}/>
                        <span style={{paddingLeft:"8px"}}>{data.text}</span>
                      </li>
                    ))
                  }
                </List>
              )
            }
          </div>
        ))
      }

      <span className="split-line"/>

      <div
        className="item"
        data-semantic-id="draw.measure">
        <span
          className="icon-overlay"
          role="button"
          tabIndex={0}
          aria-label="Measure"
          data-semantic-id="draw.measure"
          onClick={() => { props.onDrawingItemClick({ groupId: DRAWING_GROUP_ID, name: 'measure', visible, lock, mode: mode as OverlayMode }) }}>
          <Icon name="measure" />
        </span>
      </div>

      <div
        className="item"
        data-semantic-id="draw.zoom">
        <span
          className="icon-overlay"
          role="button"
          tabIndex={0}
          aria-label="Zoom in"
          data-semantic-id="draw.zoom"
          onClick={() => { props.onZoomIn?.() }}>
          <Icon name="zoomIn" />
        </span>
      </div>

      <span className="split-line"/>

      <div
        className="item"
        tabIndex={0}
        onBlur={() => { setPopoverKey('') }}>
        <span
          className={`icon-overlay${mode !== 'normal' ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Magnet mode"
          aria-pressed={mode !== 'normal'}
          onClick={() => {
            let currentMode = modeIcon
            if (mode !== 'normal') {
              currentMode = 'no_magnet'
            }
            const engineMode = currentMode === 'no_magnet' ? 'normal' : currentMode
            setMode(engineMode)
            props.onModeChange(engineMode)
          }}>
          <Icon name={modeIcon === 'weak_magnet' ? 'weak_magnet' : 'strong_magnet'} />
        </span>
        <div
          className="icon-arrow"
          onClick={() => {
            if (popoverKey === 'mode') {
              setPopoverKey('')
            } else {
              setPopoverKey('mode')
            }
          }}>
          <svg
            className={popoverKey === 'mode' ? 'rotate' : ''}
            viewBox="0 0 4 6">
            <path d={ARROW_D} stroke="none" strokeOpacity={0}/>
          </svg>
        </div>
        {
          popoverKey === 'mode' && (
            <List className="list">
              {
                modes.map(data => (
                  <li
                    key={data.key}
                    onClick={() => {
                      setModeIcon(data.key)
                      const engineMode = data.key === 'no_magnet' ? 'normal' : data.key
                      setMode(engineMode)
                      props.onModeChange(engineMode)
                      setPopoverKey('')
                    }}>
                    <Icon name={data.key}/>
                    <span style={{paddingLeft:"8px"}}>{data.text}</span>
                  </li>
                ))
              }
            </List>
          )
        }
      </div>

      <div
        className="item"
        data-semantic-id="draw.keep_drawing">
        <span
          className={`icon-overlay${keepDrawing ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Keep drawing"
          aria-pressed={keepDrawing}
          data-semantic-id="draw.keep_drawing"
          onClick={() => { setKeepDrawing(!keepDrawing) }}>
          <Icon name="keepDrawing" />
        </span>
      </div>

      <div
        className="item">
        <span
          className="icon-overlay"
          role="button"
          tabIndex={0}
          aria-label="Lock all drawings"
          aria-pressed={lock}
          onClick={() => {
            const currentLock = !lock
            setLock(currentLock)
            props.onLockChange(currentLock)
          }}>
          {
            lock ? <Icon name="lock"/> : <Icon name="unlock" />
          }
        </span>
      </div>

      <div
        className="item">
        <span
          className="icon-overlay"
          role="button"
          tabIndex={0}
          aria-label="Hide all drawings"
          aria-pressed={!visible}
          onClick={() => {
            const nextVisible = !visible
            setVisible(nextVisible)
            props.onVisibleChange(nextVisible)
          }}>
          {
            visible ? <Icon name="visible" /> : <Icon name="invisible" />
          }
        </span>
      </div>

      <div
        className="item">
        <span
          className="icon-overlay"
          role="button"
          tabIndex={0}
          aria-label="Remove drawings"
          onClick={() => { props.onRemoveClick(DRAWING_GROUP_ID) }}>
          <Icon name="remove" />
        </span>
      </div>

      <span className="split-line"/>

      <div
        className="item"
        title={i18n('snap_levels', props.locale)}>
        <span
          className={`icon-overlay${snapLevelsActive ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          aria-pressed={snapLevelsActive}
          aria-label={i18n('snap_levels', props.locale)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              const nextSnapLevelsActive = !snapLevelsActive
              setSnapLevelsActive(nextSnapLevelsActive)
              props.onSnapLevelsChange?.(nextSnapLevelsActive)
            }
          }}
          onClick={() => {
            const nextSnapLevelsActive = !snapLevelsActive
            setSnapLevelsActive(nextSnapLevelsActive)
            props.onSnapLevelsChange?.(nextSnapLevelsActive)
          }}>
          <Icon name="snap_levels" />
        </span>
      </div>
    </div>
  )
}

export default DrawingBar
