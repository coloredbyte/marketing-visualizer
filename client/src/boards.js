// The Kanban boards shown in the sidebar. Each has its own columns/cards on the
// server (keyed by id). Add a board by adding an entry here — the sidebar and
// the /kanban/:boardId route pick it up automatically. The server seeds data
// for ids 'lucas' and 'gustavo'.
export const BOARDS = [
  { id: 'lucas', name: 'Lucas', initial: 'L' },
  { id: 'gustavo', name: 'Gustavo', initial: 'G' },
]
