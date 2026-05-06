'use client'

import './heavy.css'

interface Props {
  message: string
  count: number
}

// "Heavy" stand-in: a component with non-trivial JSX, embedded styles via CSS
// import, and a SVG-data-URI icon. Keep it small enough to not drown the
// benchmark, but large enough to make the size comparison meaningful.

const ICON =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>'

export default function HeavyComponent({ message, count }: Props) {
  return (
    <div className="heavy">
      <div className="heavy-header">
        <img alt="" className="heavy-icon" src={ICON} />
        <span className="heavy-title">Heavy mounted</span>
      </div>
      <p className="heavy-message">{message}</p>
      <ul className="heavy-list">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="heavy-item">
            Item #{i + 1}
          </li>
        ))}
      </ul>
    </div>
  )
}
