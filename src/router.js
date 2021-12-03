
/**
 * Decodes a query string to an object
 * @function decode
 */

 const queryDelimeters = /[&=]/g

 export function decode (data) {
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

 export function encode (data) {
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

 export function link (data) {
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

 function sync (state, rewrites) {
   const search = location.search
   const pathname = location.pathname

   state.router.query = search.startsWith('?') ? decode(search) : {}

   for (let i = 0; i < rewrites.length; i++) {
     const rewrite = rewrites[i]

     if (typeof rewrite.source === 'function') {
       const result = rewrite.source()

       if (result === false || result == null) {
         continue
       }

       state.router.id = result
       state.router.to = rewrite.destination

       return // exit
     }

     const result = pathname.match(rewrite.source)

     if (result !== null) {
       state.router.id = result[0]
       state.router.to = rewrite.destination

       return // exit
     }
   }

   state.router.id = null
   state.router.to = pathname
 }

 /**
  * Initialize app instance
  * @module pocket
  */

 export function router (init, app) {
   init.state.router = {
     id: null,
     to: '/',
     query: {}
   }

   return app({
     state: init.state,
     setup (state, dispatch) {
       let route = null
       let destroy = null
       let render = null

       listener()

       window.addEventListener('pocket-pushstate', listener)
       window.addEventListener('popstate', listener)

       function listener () {
         dispatch(sync, init.rewrites)

         route = init.pages[init.state.router.to] ?? init.pages['/missing']

         if (typeof destroy === 'function') {
           destroy(state, dispatch)
         }

         if (typeof route.setup === 'function') {
           render = route.setup(state, dispatch)
         }

         destroy = route.destroy
       }

       return function () {
         return render()
       }
     }
   })
 }
