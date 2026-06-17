import { jsonStore } from './repositories/jsonStore.js'
// import { neonStore } from './repositories/neonStore.js'  // step 3

// Single switch point for the active storage backend. Routes import the repos
// from here and never know which implementation is behind them, so swapping
// JSON → Neon is a one-line change.
export const kanbanRepo = jsonStore
