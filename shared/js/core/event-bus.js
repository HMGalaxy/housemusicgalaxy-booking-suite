/** Galaxy Cue v5 event bus. Keeps modules decoupled as the product grows. */
export function createEventBus(){
  const listeners=new Map();
  return Object.freeze({
    on(type,handler){
      if(typeof handler!=='function')throw new TypeError('Event handler must be a function');
      const bucket=listeners.get(type)||new Set();
      bucket.add(handler);listeners.set(type,bucket);
      return()=>bucket.delete(handler);
    },
    emit(type,payload){
      (listeners.get(type)||[]).forEach(handler=>{
        try{handler(payload)}catch(error){console.error(`[Galaxy Cue] ${type} listener failed`,error)}
      });
    },
    clear(type){type?listeners.delete(type):listeners.clear()}
  });
}
