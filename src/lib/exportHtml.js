import { GOOGLE_FONTS_URL, contentStyle, dividerLineStyle, youtubeEmbed } from './elements.js'
import { shapeSvg } from './shapes.js'
import { AUDIO_SCRIPT, audioAttrs } from './audioViz.js'

const UNITLESS = new Set(['opacity', 'fontWeight', 'lineHeight', 'zIndex'])

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const attr = (s = '') => esc(s).replace(/"/g, '&quot;')

export function toCssText(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      const prop = k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
      const value = typeof v === 'number' && v !== 0 && !UNITLESS.has(k) ? `${v}px` : v
      return `${prop}:${value}`
    })
    .join(';')
}

function renderInner(el) {
  const css = attr(toCssText(contentStyle(el)))
  const p = el.props
  switch (el.type) {
    case 'heading':
      return `<h2 style="${css}">${esc(p.text)}</h2>`
    case 'text':
      return `<p style="${css}">${esc(p.text)}</p>`
    case 'button': {
      const target = p.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${attr(p.href || '#')}"${target} style="${css}">${esc(p.text)}</a>`
    }
    case 'image':
      return p.src
        ? `<div style="${css}"><img src="${attr(p.src)}" alt="${attr(p.alt)}" style="width:100%;height:100%;object-fit:${attr(p.fit)};display:block"></div>`
        : `<div style="${css}"></div>`
    case 'shape':
      return `<div style="${css}">${shapeSvg(el, `shape-${el.id}`)}</div>`
    case 'divider':
      return `<div style="${css}"><div style="${attr(toCssText(dividerLineStyle(el)))}"></div></div>`
    case 'audio': {
      if (!p.src) return `<div style="${css}"></div>`
      const data = Object.entries(audioAttrs(p))
        .map(([k, v]) => (v === '' ? k : `${k}="${attr(v)}"`))
        .join(' ')
      return `<div style="${css}" ${data}></div>`
    }
    case 'video': {
      const src = youtubeEmbed(p.url)
      return src
        ? `<div style="${css}"><iframe src="${attr(src)}" style="width:100%;height:100%;border:0;display:block" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        : `<div style="${css}"></div>`
    }
    default:
      return `<div style="${css}"></div>`
  }
}

/** Builds a standalone HTML file. The fixed-width page is scaled down to fit narrow screens. */
export function exportHtml(doc) {
  const { page, elements } = doc
  const hasAudio = elements.some((el) => !el.hidden && el.type === 'audio' && el.props.src)
  const body = elements
    .filter((el) => !el.hidden)
    .map((el, i) => {
      const wrap = toCssText({
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        zIndex: i + 1,
        // Rotated around the element's centre (the CSS default), matching the editor.
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      })
      return `    <div style="${wrap}">${renderInner(el)}</div>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(page.title)}</title>${page.favicon ? `
  <link rel="icon" href="${attr(page.favicon)}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${attr(GOOGLE_FONTS_URL)}">
  <style>
    html, body { margin: 0; background: ${attr(page.background)}; }
    .wrap { position: relative; overflow: hidden; height: ${page.height}px; }
    .page { position: absolute; top: 0; left: 50%; width: ${page.width}px; height: ${page.height}px;
            transform: translateX(-50%); transform-origin: top center; }
    a { text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap" id="wrap">
  <div class="page" id="page">
${body}
  </div>
  </div>
  <script>
    (function () {
      var W = ${page.width}, H = ${page.height};
      function fit() {
        var s = Math.min(1, document.documentElement.clientWidth / W);
        document.getElementById('page').style.transform = 'translateX(-50%) scale(' + s + ')';
        document.getElementById('wrap').style.height = H * s + 'px';
      }
      window.addEventListener('resize', fit);
      fit();
    })();
  </script>${hasAudio ? `
  <script>
${AUDIO_SCRIPT.replace(/<\//g, '<\\/')}
  </script>` : ''}
</body>
</html>
`
}

export function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
