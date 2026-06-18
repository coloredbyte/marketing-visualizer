// Preflight: Vite 5 and `node --watch` require Node 18+. The dev script tries
// to select Node 22 via nvm first; if that didn't take, fail with a clear
// message instead of a cryptic "crypto.getRandomValues is not a function".
const major = Number(process.versions.node.split('.')[0])

if (major < 18) {
  console.error(`
✖ Marketing Visualizer needs Node 18+ — you're on ${process.version}.

  Fix (you have Node 22 installed via nvm):
    nvm use 22        # or: nvm install 22
    npm run dev

  Make it permanent so this never bites again:
    nvm alias default 22
`)
  process.exit(1)
}
