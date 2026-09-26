import ElementContent from './ElementContent.jsx'
import GradientBorder from './GradientBorder.jsx'
import { rotationTransform } from '../lib/geometry.js'

/** Thumbnails are drawn at this width; the card grid uses fixed-width columns to match. */
const THUMB_WIDTH = 280

/** Scaled-down, non-interactive render of the top of a page. */
export default function DesignThumb({ design }) {
  const { page, elements } = design
  const scale = THUMB_WIDTH / page.width
  return (
    <div className="thumb" style={{ background: page.background }} aria-hidden="true">
      <div className="thumb-page" style={{ width: page.width, height: page.height, transform: `scale(${scale})` }}>
        {elements.map((el, i) =>
          el.hidden ? null : (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.h,
                zIndex: i + 1,
                transform: rotationTransform(el),
              }}
            >
              {el.type === 'video' ? (
                // Avoid loading a YouTube iframe per card.
                <div style={{ width: '100%', height: '100%', background: el.style.background, borderRadius: el.style.radius }} />
              ) : (
                <ElementContent el={el} mode="editor" />
              )}
              <GradientBorder el={el} />
            </div>
          ),
        )}
      </div>
    </div>
  )
}
