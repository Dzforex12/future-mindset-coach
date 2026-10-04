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
narrow, purpose-specific IPC methods.

## Voice Coach

Voice recording starts only after **Start Listening** is clicked and is limited
to 30 seconds. A recording remains in memory on the device until **Transcribe**
is explicitly selected; **Delete** discards it without an upload. Confirmed
recordings are sent to Groq's `whisper-large-v3` transcription endpoint. The
transcript is editable, is not saved as history, and is never sent to Coach
automatically. **Send to Coach** copies the edited text and opens `/mindset` for
the user to paste and submit manually.

Configure `GROQ_API_KEY` in the main-process environment or in the repository
root `.env.local` file. The key is read only by Electron's main process and is
never exposed to the renderer or hosted Coach window. Do not commit the key.

Wake-word detection and computer actions are not implemented. The app does not
listen in the background or control other applications.
