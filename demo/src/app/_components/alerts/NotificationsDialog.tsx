'use client'

import type { NotificationConfig } from './AlertDialog'
import type { SoundTitle, SoundDuration, NotificationSchedule } from '@tony01/astroneum'
import './alert-dialog.css'

const SOUND_TITLES: SoundTitle[] = ['Thin', 'Classic', 'Alert', 'Bell', 'Chime']
const SOUND_DURATIONS: SoundDuration[] = ['once', 'repeating']
const SCHEDULE_PRESETS: { value: NotificationSchedule['preset']; label: string }[] = [
  { value: '24/7', label: '24/7' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'working_hours', label: 'Working hours (Monâ€“Fri 09:00â€“18:00)' },
  { value: 'custom', label: 'Custom' },
]

type UrlTone = 'empty' | 'valid' | 'invalid'

function classifyWebhookUrl(raw: string): UrlTone {
  const s = raw.trim()
  if (!s) return 'empty'
  try {
    const u = new URL(s)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'invalid'
    const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, '')
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return 'invalid'
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|127\.)/.test(h)) return 'invalid'
    if (h.endsWith('.local') || h.endsWith('.internal')) return 'invalid'
    return 'valid'
  } catch { return 'invalid' }
}

interface Props {
  config: NotificationConfig
  onChange: (config: NotificationConfig) => void
  onBack: () => void
  onClose: () => void
}

function HintLink({ href, title }: { href: string; title: string }) {
  return (
    <a className="ad-hint-link" href={href} target="_blank" rel="noopener noreferrer" title={title} style={{ flexShrink: 0 }}>
      <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
        <path fillRule="evenodd" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm-1-4a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm2.83-3.52c-.49.43-.97.85-1.06 1.52H8.26c.08-1.18.74-1.69 1.32-2.13.49-.38.92-.71.92-1.37C10.5 6.67 9.82 6 9 6s-1.5.67-1.5 1.5V8H6v-.5a3 3 0 1 1 6 0c0 .96-.6 1.48-1.17 1.98Z"/>
      </svg>
    </a>
  )
}

export default function NotificationsDialog({ config, onChange, onBack, onClose }: Props) {
  const update = (patch: Partial<NotificationConfig>) => onChange({ ...config, ...patch })

  const toggle = (key: keyof NotificationConfig) => {
    update({ [key]: !config[key] } as Partial<NotificationConfig>)
  }

  const scheduleIdx = SCHEDULE_PRESETS.findIndex(s => s.value === config.notificationSchedule.preset)
  const cycleSchedule = () => {
    const next = SCHEDULE_PRESETS[(scheduleIdx + 1) % SCHEDULE_PRESETS.length]
    update({ notificationSchedule: { preset: next.value } })
  }

  const webhookEnabled = !!config.webhookUrl.trim()
  const urlTone = classifyWebhookUrl(config.webhookUrl)

  return (
    <>
      {/* Header with back button */}
      <div className="ad-header">
        <button className="ad-back-btn" onClick={onBack} title="Back">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <path d="M12.92 1.92 5.85 9l7.07 7.08-.84.84-7.5-7.5L4.15 9l.43-.42 7.5-7.5z"/>
          </svg>
        </button>
        <span className="ad-secondary-title">Notifications</span>
        <span className="ad-header-spacer" />
        <button className="ad-icon-btn" onClick={onClose} title="Close">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path stroke="currentColor" strokeWidth="1.2" d="m1.5 1.5 11 11m0-11-11 11" vectorEffect="non-scaling-stroke"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="ad-body">
        {/* Notify in app */}
        <div className="ad-notif-item">
          <div className="ad-checkbox-row">
            <div className={`ad-checkbox ${config.notificationEnabled ? 'checked' : ''}`} onClick={() => toggle('notificationEnabled')} />
            <span className="ad-checkbox-label">Notify in app</span>
            <HintLink href="https://www.tradingview.com/support/solutions/43000474389-how-to-receive-phone-notifications-for-alerts/" title="Learn more about phone notifications" />
          </div>
          <div className="ad-notif-desc">Provides a push notification in the mobile app.</div>
        </div>

        {/* Show toast */}
        <div className="ad-notif-item">
          <div className="ad-checkbox-row">
            <div className={`ad-checkbox ${config.toastEnabled ? 'checked' : ''}`} onClick={() => toggle('toastEnabled')} />
            <span className="ad-checkbox-label">Show toast notification</span>
          </div>
          <div className="ad-notif-desc">Displays an onsite notification in the page corner.</div>
        </div>

        {/* Send email */}
        <div className="ad-notif-item">
          <div className="ad-checkbox-row">
            <div className={`ad-checkbox ${config.emailEnabled ? 'checked' : ''}`} onClick={() => toggle('emailEnabled')} />
            <span className="ad-checkbox-label">Send email</span>
          </div>
          <div className="ad-notif-desc">Provides an email notification to the address in your account settings.</div>
        </div>

        {/* Webhook URL */}
        <div className="ad-notif-item">
          <div className="ad-checkbox-row">
            <div className={`ad-checkbox ${webhookEnabled ? 'checked' : ''}`} onClick={() => { if (webhookEnabled) update({ webhookUrl: '' }) }} />
            <span className="ad-checkbox-label">Webhook URL</span>
            <HintLink href="https://www.tradingview.com/support/solutions/43000529348-how-to-configure-webhook-alerts/" title="Learn more about webhooks" />
          </div>
          <div className="ad-notif-desc">
            Sends a POST request to your URL when the alert triggers. The alert message is sent as the body â€” use JSON for <code>application/json</code> content-type.
          </div>
          <div className="ad-notif-expander">
            <input
              className={`ad-text-input ad-webhook-url ad-webhook-url-${urlTone}`}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://example.com/alert-hook"
              value={config.webhookUrl}
              onChange={e => update({ webhookUrl: e.target.value })}
            />
            {urlTone === 'invalid' && (
              <div className="ad-webhook-validation ad-webhook-validation-invalid">
                Invalid URL â€” use http(s)://, no private or localhost hosts
              </div>
            )}
            {urlTone === 'valid' && (
              <div className="ad-webhook-validation ad-webhook-validation-valid">Valid target URL</div>
            )}
          </div>
        </div>

        {/* Play sound */}
        <div className="ad-notif-item">
          <div className="ad-checkbox-row">
            <div className={`ad-checkbox ${config.soundEnabled ? 'checked' : ''}`} onClick={() => toggle('soundEnabled')} />
            <span className="ad-checkbox-label">Play sound</span>
          </div>
          <div className="ad-notif-desc">Plays an audio cue when your alert triggers.</div>
          {config.soundEnabled && (
            <div className="ad-notif-expander ad-sound-selects">
              <div className="ad-dropdown" style={{ width: 100 }} onClick={() => {
                const idx = SOUND_TITLES.indexOf(config.soundTitle)
                update({ soundTitle: SOUND_TITLES[(idx + 1) % SOUND_TITLES.length] })
              }}>
                <span>{config.soundTitle}</span>
                <span className="caret">â–¾</span>
              </div>
              <div className="ad-dropdown" style={{ width: 100 }} onClick={() => {
                const idx = SOUND_DURATIONS.indexOf(config.soundDuration)
                update({ soundDuration: SOUND_DURATIONS[(idx + 1) % SOUND_DURATIONS.length] })
              }}>
                <span>{config.soundDuration === 'once' ? 'Once' : 'Repeating'}</span>
                <span className="caret">â–¾</span>
              </div>
            </div>
          )}
        </div>

        {/* Send plain text */}
        <div className="ad-notif-item">
          <div className="ad-checkbox-row">
            <div className={`ad-checkbox ${config.plainTextEnabled ? 'checked' : ''}`} onClick={() => toggle('plainTextEnabled')} />
            <span className="ad-checkbox-label">Send plain text</span>
            <HintLink href="https://www.tradingview.com/support/solutions/43000474394-i-d-like-to-use-an-alternative-email-address-for-alert-notifications/" title="Learn more about alternative email notifications" />
          </div>
          <div className="ad-notif-desc">Sends plain text to an alternative email.</div>
          {config.plainTextEnabled && (
            <div className="ad-notif-expander">
              <input
                className="ad-text-input"
                type="email"
                placeholder="alternative@example.com"
                value={config.plainTextEmail}
                onChange={e => update({ plainTextEmail: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="ad-separator" />

        {/* Notification schedule */}
        <div className="ad-notif-item">
          <div className="ad-checkbox-row" style={{ justifyContent: 'space-between' }}>
            <span className="ad-checkbox-label">Notification schedule</span>
            <HintLink href="https://www.tradingview.com/support/solutions/43000787196-notification-schedule-for-alerts/" title="Learn more" />
          </div>
          <div className="ad-notif-expander">
            <div className="ad-dropdown" onClick={cycleSchedule}>
              <span>{SCHEDULE_PRESETS[scheduleIdx]?.label ?? '24/7'}</span>
              <span className="caret">â–¾</span>
            </div>
          </div>
          <div className="ad-notif-desc">Notifications are muted outside this schedule.</div>
        </div>
      </div>

      {/* Footer */}
      <div className="ad-footer">
        <button className="ad-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="ad-btn-create" onClick={onBack}>Apply</button>
      </div>
    </>
  )
}
