'use client'

import { useState, useMemo, useEffect } from 'react'
import { AlertManager, type AlertCondition, type AlertFrequency, type NotificationSchedule, type SoundTitle, type SoundDuration } from '@tony01/astroneum'
import NotificationsDialog from './NotificationsDialog'
import './alert-dialog.css'

export interface NotificationConfig {
  soundEnabled: boolean
  notificationEnabled: boolean
  toastEnabled: boolean
  emailEnabled: boolean
  plainTextEnabled: boolean
  plainTextEmail: string
  webhookUrl: string
  soundTitle: SoundTitle
  soundDuration: SoundDuration
  notificationSchedule: NotificationSchedule
}

const DEFAULT_NOTIFS: NotificationConfig = {
  soundEnabled: true,
  notificationEnabled: true,
  toastEnabled: false,
  emailEnabled: false,
  plainTextEnabled: false,
  plainTextEmail: '',
  webhookUrl: '',
  soundTitle: 'Thin',
  soundDuration: 'once',
  notificationSchedule: { preset: '24/7' },
}

const CONDITIONS: { value: AlertCondition; label: string }[] = [
  { value: 'above', label: 'Greater Than' },
  { value: 'below', label: 'Less Than' },
  { value: 'crosses_above', label: 'Crossing Up' },
  { value: 'crosses_below', label: 'Crossing Down' },
]

const TRIGGERS: { value: AlertFrequency; label: string }[] = [
  { value: 'once', label: 'Once only' },
  { value: 'every_bar', label: 'Every bar' },
]

const EXPIRATION_OPTIONS = [
  { value: '', label: 'Open-ended' },
  { value: '1d', label: 'In 1 day' },
  { value: '1w', label: 'In 1 week' },
  { value: '1m', label: 'In 1 month' },
  { value: '2m', label: 'In 2 months' },
]

function computeExpiration(value: string): string | undefined {
  if (!value) return undefined
  const now = new Date()
  switch (value) {
    case '1d': now.setDate(now.getDate() + 1); break
    case '1w': now.setDate(now.getDate() + 7); break
    case '1m': now.setMonth(now.getMonth() + 1); break
    case '2m': now.setMonth(now.getMonth() + 2); break
    default: return undefined
  }
  return now.toISOString()
}

function formatExpiration(iso: string | undefined): string {
  if (!iso) return 'Open-ended'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function isValidJson(s: string): boolean {
  try { JSON.parse(s); return true } catch { return false }
}

interface AlertDialogProps {
  symbol: string
  symbolLogo?: string
  currentPrice?: number
  onClose: () => void
  onCreated?: (id: string) => void
}

export default function AlertDialog({ symbol, symbolLogo, currentPrice, onClose, onCreated }: AlertDialogProps) {
  const [condition, setCondition] = useState<AlertCondition>('crosses_above')
  const [price, setPrice] = useState<string>(currentPrice ? String(currentPrice) : '')
  const [trigger, setTrigger] = useState<AlertFrequency>('once')
  const [expirationChoice, setExpirationChoice] = useState('2m')
  const [notifConfig, setNotifConfig] = useState<NotificationConfig>(DEFAULT_NOTIFS)
  const [showNotifs, setShowNotifs] = useState(false)

  const conditionLabel = CONDITIONS.find(c => c.value === condition)?.label ?? condition
  const triggerLabel = TRIGGERS.find(t => t.value === trigger)?.label ?? trigger
  const expiration = computeExpiration(expirationChoice)
  const expirationLabel = formatExpiration(expiration)

  const defaultMessage = useMemo(() => {
    return `${symbol} ${conditionLabel} ${price || 'â€”'}`
  }, [symbol, conditionLabel, price])

  const [message, setMessage] = useState(defaultMessage)
  useEffect(() => { setMessage(defaultMessage) }, [defaultMessage])

  const notifSummary = useMemo(() => {
    const parts: string[] = []
    if (notifConfig.notificationEnabled) parts.push('App')
    if (notifConfig.toastEnabled) parts.push('Toast')
    if (notifConfig.soundEnabled) parts.push('Sound')
    if (notifConfig.emailEnabled) parts.push('Email')
    if (notifConfig.webhookUrl) parts.push('Webhook')
    if (notifConfig.plainTextEnabled) parts.push('Plain text')
    return parts.length > 0 ? parts.join(', ') : 'None'
  }, [notifConfig])

  const canCreate = price !== '' && isFinite(parseFloat(price))

  function handleCreate() {
    if (!canCreate) return
    const manager = AlertManager.getInstance()
    const id = manager.add({
      symbol,
      condition,
      price: parseFloat(price),
      frequency: trigger,
      soundEnabled: notifConfig.soundEnabled,
      notificationEnabled: notifConfig.notificationEnabled,
      webhookUrl: notifConfig.webhookUrl || undefined,
      expiration,
      messageTemplate: message,
      emailEnabled: notifConfig.emailEnabled,
      plainTextEnabled: notifConfig.plainTextEnabled,
      plainTextEmail: notifConfig.plainTextEmail || undefined,
      toastEnabled: notifConfig.toastEnabled,
      notificationSchedule: notifConfig.notificationSchedule,
      soundTitle: notifConfig.soundTitle,
      soundDuration: notifConfig.soundDuration,
    })
    onCreated?.(id)
    onClose()
  }

  function adjustPrice(delta: number) {
    const cur = parseFloat(price) || 0
    setPrice(String(cur + delta))
  }

  if (showNotifs) {
    return (
      <div className="ad-overlay" onClick={onClose}>
        <div className="ad-dialog" onClick={e => e.stopPropagation()} style={{ height: 'auto', maxHeight: '90vh' }}>
          <NotificationsDialog
            config={notifConfig}
            onChange={setNotifConfig}
            onBack={() => setShowNotifs(false)}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-dialog" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ad-header">
          <span className="ad-header-prefix">Create alert on</span>
          <span className="ad-symbol-pill">
            {symbolLogo && <img src={symbolLogo} alt="" />}
            <span>{symbol}</span>
          </span>
          <span className="ad-header-spacer" />
          <button className="ad-icon-btn" title="Alert presets">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M8 6a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2V8a2 2 0 00-2-2H8zm3 1H8a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V8a1 1 0 00-1-1zM8 15a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2v-3a2 2 0 00-2-2H8zm3 1H8a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 00-1-1zM15 8a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V8zm2-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V8a1 1 0 011-1z"/>
              <path fill="currentColor" d="M18 19h-3v-1h3v-3h1v3h3v1h-3v3h-1v-3z"/>
            </svg>
          </button>
          <button className="ad-icon-btn" onClick={onClose} title="Close">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeWidth="1.2" d="m1.5 1.5 11 11m0-11-11 11" vectorEffect="non-scaling-stroke"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="ad-body">
          {/* Condition */}
          <fieldset className="ad-fieldset">
            <legend className="ad-legend">Condition</legend>
            <div className="ad-condition-row">
              <div className="ad-dropdown ad-condition-select">
                <span className="ad-dropdown-label">Price</span>
                <span className="caret">â–¾</span>
              </div>
              <div className="ad-dropdown ad-operator" onClick={() => {
                const idx = CONDITIONS.findIndex(c => c.value === condition)
                setCondition(CONDITIONS[(idx + 1) % CONDITIONS.length].value)
              }}>
                <span className="ad-dropdown-label">
                  <svg width="16" height="16" viewBox="0 0 28 28" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M16 5h5.3L5 21.3l.7.7L22 5.7V11h1V4h-7zM5.7 6l6.23 6.22-.7.7L5 6.7zm15.6 17-7.25-7.24.7-.7L22 22.28V17h1v7h-7v-1z"/>
                  </svg>
                  {conditionLabel}
                </span>
                <span className="caret">â–¾</span>
              </div>
            </div>
            <div className="ad-bands">
              <div className="ad-dropdown ad-bands-select">
                <span>Value</span>
                <span className="caret">â–¾</span>
              </div>
              <div className="ad-number-input">
                <input
                  type="text"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder={currentPrice ? String(currentPrice) : '0'}
                />
                <div className="ad-steppers">
                  <button className="ad-stepper" onClick={() => adjustPrice(1)}>â–²</button>
                  <button className="ad-stepper" onClick={() => adjustPrice(-1)}>â–¼</button>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Add condition */}
          <div className="ad-add-condition">
            <button className="ad-add-btn">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor">
                <path d="M9.5 4.5h-1v4h-4v1h4v4h1v-4h4v-1h-4v-4Z"/>
              </svg>
              Add condition
            </button>
            <a className="ad-hint-link" href="https://www.tradingview.com/support/solutions/43000761492-multi-condition-alerts/" target="_blank" rel="noopener noreferrer" title="Learn more about multi-condition alerts">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
                <path fillRule="evenodd" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm-1-4a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm2.83-3.52c-.49.43-.97.85-1.06 1.52H8.26c.08-1.18.74-1.69 1.32-2.13.49-.38.92-.71.92-1.37C10.5 6.67 9.82 6 9 6s-1.5.67-1.5 1.5V8H6v-.5a3 3 0 1 1 6 0c0 .96-.6 1.48-1.17 1.98Z"/>
              </svg>
            </a>
          </div>

          <div className="ad-separator" />

          {/* Trigger */}
          <fieldset className="ad-fieldset">
            <legend className="ad-legend">Trigger</legend>
            <div className="ad-dropdown" onClick={() => {
              setTrigger(t => t === 'once' ? 'every_bar' : 'once')
            }}>
              <span>{triggerLabel}</span>
              <span className="caret">â–¾</span>
            </div>
          </fieldset>

          {/* Expiration */}
          <fieldset className="ad-fieldset">
            <legend className="ad-legend">Expiration</legend>
            <div className="ad-dropdown" onClick={() => {
              const idx = EXPIRATION_OPTIONS.findIndex(e => e.value === expirationChoice)
              setExpirationChoice(EXPIRATION_OPTIONS[(idx + 1) % EXPIRATION_OPTIONS.length].value)
            }}>
              <span>{expirationLabel}</span>
              <span className="caret">â–¾</span>
            </div>
          </fieldset>

          {/* Message */}
          <fieldset className="ad-fieldset">
            <legend className="ad-legend">Message</legend>
            <textarea
              className="ad-message-textarea"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              spellCheck={false}
              placeholder={`${symbol} ${conditionLabel} ${price || '0'}`}
            />
            <div className="ad-webhook-hint">
              {notifConfig.webhookUrl
                ? `Webhook body Â· ${isValidJson(message) ? 'application/json' : 'text/plain'}`
                : 'Sent as the webhook body when a webhook URL is set.'}
            </div>
          </fieldset>

          {/* Notifications */}
          <fieldset className="ad-fieldset">
            <legend className="ad-legend">Notifications</legend>
            <div className="ad-dropdown" onClick={() => setShowNotifs(true)}>
              <span>{notifSummary}</span>
              <span className="caret">â–¾</span>
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="ad-footer">
          <button className="ad-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="ad-btn-create" disabled={!canCreate} onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  )
}
