
const FF_QUIET = process.env.FF_QUIET ?? false

/**
 * Debounce helper for renders
 * @function enqueue
 */

const enqueue = function (render) {
  let lock = false

  const callback = function () {
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
 * Deeply freeze objects and arrays
 * @function deepFreeze
 */

const deepFreeze = function (state) {
  for (const key in state) {
    const value = state[key]

    if (value !== null && typeof value === 'object' && Object.isFrozen(value) === false) {
      freeze(value)
    }
  }

  return Object.freeze(state)
}

/**
 * Collect state changes for batched updates
 * @function collect
 */

const collect = function (state, render) {
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
 * Micro framework for building web apps
 * @module pocket
 */

export default function (init, render) {
  // deepFreeze(init.state)

  const schedule = collect(init.state, function () {
    render(view())
  })

  schedule()

  const dispatch = function (action, data) {
    const result = action(init.state, data)
    const isEffect = typeof result === 'function'

    FF_QUIET === false && console.log(
      'Dispatch >>',
      action.name ?? '(anon)',
      isEffect ? '(effect)' : '(action)',
    )

    if (isEffect) {
      const effect = result(dispatch)

      if (effect && effect.then) {
        return effect.then(schedule)
      }
    } else {
      schedule(deepFreeze(result))
    }
  }

  const view = init.setup(init.state, dispatch)

  return {
    dispatch,
    schedule,
    getState: function () {
      return init.state
    }
  }
}
