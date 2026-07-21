/** Minimal central state container for v5 modules. Existing v4 state remains compatible. */
export function createStore(initialState={}){
  let state={...initialState};
  const subscribers=new Set();
  const notify=()=>subscribers.forEach(fn=>{try{fn(state)}catch(error){console.error('[Galaxy Cue] store subscriber failed',error)}});
  return Object.freeze({
    getState:()=>state,
    setState(patch){state={...state,...(typeof patch==='function'?patch(state):patch)};notify();return state},
    subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn)}
  });
}
