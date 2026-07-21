/** Safe JSON storage helpers shared by future CRM, calendar and document modules. */
export const storage={
  read(key,fallback=null){try{const value=localStorage.getItem(key);return value===null?fallback:JSON.parse(value)}catch(error){console.warn(`[Galaxy Cue] Could not read ${key}`,error);return fallback}},
  write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.error(`[Galaxy Cue] Could not write ${key}`,error);return false}},
  remove(key){try{localStorage.removeItem(key);return true}catch(error){console.error(`[Galaxy Cue] Could not remove ${key}`,error);return false}}
};
