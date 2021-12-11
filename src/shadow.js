
import pocket from './pocket'

export function once () {
  let lock = false
  const storage = []

  function handler () {
    lock = true

    for (let i = 0; i < storage.length; i++) {
      storage[i]()
    }
  }

  return function (fn) {
    if (!lock) {
      storage.push(fn)
      window.requestAnimationFrame(handler)
    }
  }
}

export function shadow (patch) {
  let ctx = null

  return function (node, init) {
    ctx != null && ctx.schedule != null && ctx.schedule()

    if (node.shadowRoot == null) {
      const root = node.attachShadow({ mode: 'open' })
      const div = document.createElement('div')

      root.appendChild(div)

      ctx = pocket(init, function (view) {
        patch(div, view)
      })
    }

    return ctx
  }
}
