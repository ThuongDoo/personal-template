import { useState } from 'react'
import Icon from './Icon.jsx'

export function Section({ title, children }) {
  return (
    <section className="section">
      <h4>{title}</h4>
      <div className="section-body">{children}</div>
    </section>
  )
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

/** Number input that tolerates transient invalid text (e.g. an empty field while retyping). */
export function NumberInput({ value, onChange, min = -Infinity, max = Infinity, step = 1, suffix }) {
  const [draft, setDraft] = useState(null)
  return (
    <div className="num">
      <input
        className="input"
        type="number"
        value={draft ?? value}
        step={step}
        min={Number.isFinite(min) ? min : undefined}
        max={Number.isFinite(max) ? max : undefined}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = parseFloat(e.target.value)
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
        }}
        onBlur={() => setDraft(null)}
      />
      {suffix && <span className="suffix">{suffix}</span>}
    </div>
  )
}

export function ColorInput({ value, onChange, allowNone = false }) {
  const isHex = /^#[0-9a-f]{6}$/i.test(value)
  return (
    <div className="color">
      <span className="swatch">
        <span style={{ background: value }} />
        <input type="color" value={isHex ? value : '#ffffff'} onChange={(e) => onChange(e.target.value)} />
      </span>
      <input
        className="input"
        type="text"
        value={value}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
      {allowNone && (
        <button
          type="button"
          className={`icon-btn sm${value === 'transparent' ? ' on' : ''}`}
          title="Trong suốt"
          onClick={() => onChange('transparent')}
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  )
}

export function Segmented({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.title}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.icon ? <Icon name={o.icon} size={15} /> : o.label}
        </button>
      ))}
    </div>
  )
}

export function Select({ value, options, onChange }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  )
}
