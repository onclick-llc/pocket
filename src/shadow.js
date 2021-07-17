
import pocket from './pocket'

/**
 *
 *
*/

export const once = () => {
  const storage = []
  let lock = false

  const handler = () => {
    lock = true

    for (let i = 0; i < storage.length; i++) {
      storage[i]()
    }
  }

  return fn => {
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

export const shadow = patch => (ref, x) => {
  mount(() => {
    const root = ref.vnode.node.attachShadow({ mode: 'open' })
    const div = document.createElement('div')

    root.appendChild(div)

    x(init => pocket(init, view => patch(div, view)))
  })
}
