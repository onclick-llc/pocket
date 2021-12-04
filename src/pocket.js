
/**
 * Debounce helper for renders
 * @function enqueue
 */

function enqueue (render) {
  let lock = false

  function callback () {
    lock = false
    render()
  }

  return function () {
    if (!lock) {
      lock = true
      window.requestAnimationFrame(callback)
    }
  }
}

/**
 * Micro framework for building web apps
 * @module pocket
 */

export default function (init, render) {
  const schedule = enqueue(function () {
    render(view())
  })

  const view = init.setup(init.state, dispatch) // hoist

  schedule()

  function dispatch (action, data) {
    const result = action(init.state, data)

    console.log(
      'Dispatch >>',
      action.name ? action.name : '(anon)',
      typeof result === 'function' ? '(effect)' : '(action)',
    )

    if (typeof result === 'function') {
      const effect = result(dispatch)

      if (effect && effect.then) {
        return effect.then(schedule)
      }
    } else {
      schedule()
    }
  }

  return {
    dispatch,
    getState: function () {
      return init.state
    }
  }
}
