
const FF_ROUTE_EVENTS = FF_ROUTE_EVENTS ?? true
const FF_ROUTE_MIDDLEWARE = FF_ROUTE_MIDDLEWARE ?? true

/**
 * Decodes a query string to an object
 * @function decode
 */

const queryDelimeters = /[&=]/g

export const decode = /* @__PURE__ */ data => {
  const query = data.slice(1).split(queryDelimeters)
  const result = {}

  for (let i = 0; i < query.length; i += 2) {
    result[query[i]] = query[i + 1]
  }

  return result
}

/**
  * Encodes an object into a query string
  * @function encode
  */

export const encode = /* @__PURE__ */ data => {
  let result = '?'

  for (const key in data) {
    if (data[key] != null) {
      result += key + '=' + data[key] + '&'
    }
  }

  return result.slice(0, -1)
}

/**
 * @function link
 * @example
 * link({
 *   to: '/foobar',
 *   query: {
 *     foo: 'bar'
 *   }
 * })
 */

const pushstateEvent = new CustomEvent('pocket-pushstate')

export const link = /* @__PURE__ */ data => {
  if (data.to === history.state) {
    return history.back()
  }

  const path = location.pathname

  const to = typeof data.to === 'string' ? data.to : path
  const href = data.query ? to + encode(data.query) : to

  history.pushState(path, null, href)
  window.dispatchEvent(pushstateEvent)
}

/**
 * An action that syncs router state with `window.location`
 * @function sync
 */

const sync = ({ router }, rewrites) => {
  const search = location.search
  const pathname = location.pathname

  router.query = search.startsWith('?') ? decode(search) : {}

  if (FF_ROUTE_REWRITES === true) {
    for (let i = 0; i < rewrites.length; i++) {
      const rewrite = rewrites[i]

      if (typeof rewrite.source === 'function') {
        const result = rewrite.source()

        if (result === false || result == null) {
          continue
        }

        router.id = result
        router.to = rewrite.destination

        return { router }
      }

      const result = pathname.match(rewrite.source)

      if (result !== null) {
        router.id = result[0]
        router.to = rewrite.destination

        return { router }
      }
    }
  }

  router.id = null
  router.to = pathname

  return { router }
}

/**
 * Apply route middleware to each page
 * @function compile
 */

const compile = (init, dispatch) => {
  const target = []

  return array => {
    array ??= []

    for (let i = 0; i < target.length; i++) {
      target[i](dispatch)
    }

    for (let i = 0; i < array.length; i++) {
      const item = init[array[i]]()

      item.onRoute(dispatch)
      target.push(item.onBeforeLeave)
    }
  }
}

/**
 * Apply route events to each page
 * @function routeEvents
 */

const routeEvents = dispatch => {
  let target

  return route => {
    if (typeof target === 'function') {
      target(dispatch)
    }

    if (typeof route.onRoute === 'function') {
      route.onRoute(dispatch)
    }

    target = route.onBeforeLeave
  }
}

/**
 * Initialize app instance
 * @module pocket
 */

export const router = ({ state, pages, rewrites, middleware }, app) => {
  let route

  state.router = {
    id: null,
    to: '/',
    query: {}
  }

  const ctx = app({
    state,
    view: (state, dispatch) => route.view(state, dispatch)
  })

  const applyMiddleware = /* @__PURE__ */ compile(middleware, ctx.dispatch)
  const applyRouteEvents = /* @__PURE__ */ routeEvents(ctx.dispatch)

  const listener = () => {
    ctx.dispatch(sync, rewrites)

    route = pages[state.router.to] || pages['/missing']

    FF_ROUTE_MIDDLEWARE && applyMiddleware(route.middleware)
    FF_ROUTE_EVENTS && applyRouteEvents(route)
  }

  listener()

  window.addEventListener('pocket-pushstate', listener)
  window.addEventListener('popstate', listener)

  return ctx
}
