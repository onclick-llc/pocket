
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
  return function (ref, app) {
    window.requestAnimationFrame(function () {
      const node = ref.vnode.node

      if (node.shadowRoot == null) {
        const root = node.attachShadow({ mode: 'open' })
        const div = document.createElement('div')

        root.appendChild(div)

        app(init => pocket(init, view => patch(div, view)))
      }
    })
  }
}
