
export const freeze = function (state) {
  Object.freeze(state)

  for (const key in state) {
    const value = state[key]

    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      freeze(value)
    }
  }

  return state
}

// dispatch(function (state) {
//   return Object.freeze({
//     ...state,
//     partial: Object.freeze({
//       foo: 'bar'
//     })
//   })
// })
