
const FF_QUIET = FF_QUIET ?? false

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
 * Collect state changes for batched updates
 * @function collect
 */

function collect (state, render) {
  let batch = [state]

  const schedule = enqueue(function () {
    Object.assign.apply(Object, batch)
    batch = [state]
    render()
  })

  schedule()

  return function (result) {
    batch.push(result)
    schedule()
  }
}

/**
 * Minimalist state manager with actions and effects
 * @module pocket
 */

export default function ({ state, setup }, render) {
  const view = setup(state, dispatch)

  const push = collect(state, function () {
    render(view())
  })

  function dispatch (action, data) {
    const result = action(state, data)

    FF_QUIET && console.log(
      'Dispatch >>',
      typeof action.name === 'string' ? action.name : '(anon)',
      typeof result === 'function' ? '(effect)' : JSON.stringify(result, null, 2)
    )

    if (typeof result === 'function') {
      const effect = result(dispatch)

      if (effect && effect.then) {
        return effect.then(push)
      }
    } else {
      push(result)
    }
  }

  return dispatch
}
