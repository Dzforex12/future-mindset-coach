# Future Mindset Coach Desktop

This is an isolated Electron shell for Windows. It does not modify or bundle
the Next.js web app.

## Run on Windows

From this directory:

```powershell
npm install
npm start
```

The app opens a normal desktop window. Its primary button opens the Future
Mindset Coach Production website in a dedicated Electron window. Use the
application menu's **Agent Home** command or press **Alt+Home** to return to
the companion home window.

The Coach window uses a persistent Electron session for normal website sign-in.
It has no preload bridge or Node.js integration. The home window exposes only
the narrow Coach navigation bridge. Voice, wake-word, and computer-action cards
are placeholders; the app does not access the microphone, start automatically,
run hidden, or control other applications.
