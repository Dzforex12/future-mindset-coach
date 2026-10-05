# Future Mindset Coach Desktop

## Windows tray and background wake

Wake Word defaults OFF on each launch. Agent Home's close button hides it to
the Windows tray after a first-close notice. Minimize keeps normal Windows
behavior. The tray provides Open Agent, Wake Word On/Off, Open Coach, and
Quit Future Mindset; its tooltip and menu show the current wake state.

Local wake listening continues while hidden only when explicitly enabled.
Detection restores Agent Home and uses the existing Voice Coach handoff.
Command audio still requires explicit Transcribe before any Groq upload.
After completing a command, close or minimize Agent Home to return to the
background. It does not automatically hide a transcript.

Sleep stops the wake worker; resume waits 1.5 seconds before attempting to
restart enabled wake listening, unless a Voice Coach flow is still active.
Quit destroys the recording renderer and Coach window, waits for the wake
worker to exit, destroys the tray, and exits. A single-instance lock prevents
duplicate tray icons and wake workers. No startup-on-login is configured.

Focused lifecycle regression checks (after building):

```powershell
node scripts/test-background.mjs
```

These checks simulate process lifecycle events; they do not replace live
Windows tray, microphone, foreground-focus, or sleep/resume testing.

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

## Wake Word

Wake Word mode defaults off and must be enabled from Agent Home. While enabled,
Electron's main process launches one fixed local Vosk worker with `shell: false`.
The worker owns the microphone, listens only for the constrained local grammar
containing `future mindset coach wake up`, and emits only JSON-line status
events such as ready, listening, wake detected, error, and stopped. It does not
emit transcripts or audio content.

On the first valid wake detection the event is latched, the wake worker is
stopped, the wake microphone is released, and Agent Home starts the existing
Voice Coach command recorder. Command audio remains local until **Transcribe**
is explicitly selected. Wake audio is never uploaded or saved as history.

For this development step the app can use a fixed local Python environment under
`resources/wake/.venv/`. That folder is ignored and is not part of the app
contract. The packaging plan is to freeze the Python worker into a standalone
executable, bundle it with the fixed Vosk model asset, and have Electron launch
that exact packaged worker path with fixed arguments.

Computer actions, tray behavior, startup-on-login, and hidden persistence are
not implemented.
