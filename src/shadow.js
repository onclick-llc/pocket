
import pocket from './pocket'

/**
 *
 *
 */

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

/**
 *
 *
 */

const mount = once()

export const shadow = patch => (ref, app) => {
  mount(function () {
    const div = document.createElement('div')
    ref.vnode.node.attachShadow({ mode: 'open' }).appendChild(div)

    app(init => pocket(init, view => patch(div, view)))
  })
}
