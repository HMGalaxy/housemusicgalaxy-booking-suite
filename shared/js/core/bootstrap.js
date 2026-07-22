import {createEventBus} from './event-bus.js';
import {createStore} from './state.js';
import {storage} from './storage.js';

export const VERSION='10.0.4';
export const RELEASE='Business OS Logic Stabilization';
export const BUILD='2026-07-22T17:15:00Z';

export function bootstrapGalaxyCue(){
  const bus=createEventBus();
  const store=createStore({version:VERSION,release:RELEASE,build:BUILD,startedAt:new Date().toISOString()});
  const runtime=Object.freeze({version:VERSION,release:RELEASE,build:BUILD,bus,store,storage});
  window.GalaxyCue=runtime;
  document.documentElement.dataset.gcVersion=VERSION;
  console.info(`%cGalaxy Cue ${VERSION}%c — ${RELEASE} | Build ${BUILD}`,'font-weight:800;color:#d8bb6a','color:inherit');
  bus.emit('app:bootstrap',runtime);
  return runtime;
}
