import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { CommandButton } from '@fluentui/react';

// Simple header sign-in/session UI that stores a lightweight `user` and `sessionId` in localStorage.
// This is intentionally minimal: production apps should use a real auth provider (Cognito, Auth0, etc.).

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionInput, setSessionInput] = useState('');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUserName, setCreateUserName] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const messageTimeout = useRef<number | null>(null);

  const flashSessionMessage = (msg: string) => {
    if (messageTimeout.current) window.clearTimeout(messageTimeout.current);
    setSessionMessage(msg);
    messageTimeout.current = window.setTimeout(() => {
      setSessionMessage(null);
      messageTimeout.current = null;
    }, 2600);
  };

  useEffect(() => {
    try {
      const s = localStorage.getItem('sessionId');
      if (s) setSessionId(s);
    } catch (e) {}
  }, []);

  useEffect(() => () => {
    if (messageTimeout.current) window.clearTimeout(messageTimeout.current);
  }, []);

  useEffect(() => {
    if (!sessionId) { setSessionInfo(null); return; }
    try {
      localStorage.setItem('sessionId', sessionId);
    } catch (e) {}
    // fetch session metadata to show a friendly welcome
    (async () => {
      try {
        const res = await fetch(`/api/sessions?sessionId=${encodeURIComponent(sessionId)}`);
        if (!res.ok) return;
        const data = await res.json();
        setSessionInfo(data);
      } catch (e) {
        console.warn('failed to fetch session info', e);
      }
    })();
  }, [sessionId]);

  // sign-in functionality removed from header

  async function useSessionId() {
    if (!sessionInput) return;
    if (messageTimeout.current) window.clearTimeout(messageTimeout.current);
    setSessionMessage(null);
    setLoadingSession(true);
    try {
      const res = await fetch(`/api/sessions?sessionId=${encodeURIComponent(sessionInput)}`);
      if (!res.ok) {
        flashSessionMessage('Session not found');
        setLoadingSession(false);
        return;
      }
      const data = await res.json();
      // persist locally and update welcome
      try {
        localStorage.setItem('sessionId', sessionInput);
        setSessionId(sessionInput);
        setSessionInfo(data);
        flashSessionMessage('Loaded session');
        setSessionInput('');
      } catch (e) {
        flashSessionMessage('Failed to save session locally');
      }
    } catch (e) {
      console.warn('failed to validate session', e);
      flashSessionMessage('Error validating session');
    } finally {
      setLoadingSession(false);
    }
  }

  async function createUniqueId() {
    try {
      // allocate a session id (SessionID-centric flow). Optionally include a userName from the modal.
      const body = createUserName ? { userName: createUserName } : {};
      const allocRes = await fetch('/api/sessions/allocate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!allocRes.ok) throw new Error('allocation failed');
      const allocData = await allocRes.json();
        const fl = allocData.sessionId as string;
      if (fl) {
        localStorage.setItem('sessionId', fl);
        setSessionId(fl);
      }
      // fetch the persisted session entry so we show the userName immediately
      try {
        const res = await fetch(`/api/sessions?sessionId=${encodeURIComponent(allocData.sessionId)}`);
        if (res.ok) {
          const saved = await res.json();
          setSessionInfo(saved);
          flashSessionMessage('Session created');
        }
      } catch (e) {
        console.warn('failed to fetch created session', e);
      }
      setShowCreateModal(false);
    } catch (e) {
      console.warn('createUniqueId failed', e);
      flashSessionMessage('Failed to create session');
    }
  }

  async function copyCurrentSession() {
    if (!sessionId) return;
    try {
      await navigator.clipboard.writeText(sessionId);
      flashSessionMessage('Session ID copied');
    } catch (err) {
      try {
        const fallback = document.createElement('textarea');
        fallback.value = sessionId;
        fallback.setAttribute('readonly', '');
        fallback.style.position = 'absolute';
        fallback.style.left = '-9999px';
        document.body.appendChild(fallback);
        fallback.select();
        document.execCommand('copy');
        document.body.removeChild(fallback);
        flashSessionMessage('Session ID copied');
      } catch (fallbackErr) {
        console.warn('copyCurrentSession failed', fallbackErr);
        flashSessionMessage('Unable to copy Session ID');
      }
    }
  }
  // startTest removed from header; session flow is driven elsewhere

  return (
    // sticky ensures the header stays at the top; z-index keeps it above content
    <header className="bg-white shadow-sm sticky top-0 z-40 relative">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-nowrap">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="text-xl font-bold shrink-0">Free Learning</Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex gap-3 text-sm text-gray-700 flex-nowrap overflow-x-auto">
            
            <Link to="/" className="hover:underline whitespace-nowrap">Home</Link>
            <Link to="/quiz" className="hover:underline whitespace-nowrap">Take Quiz</Link>
            <Link to="/projects" className="hover:underline whitespace-nowrap">Projects</Link>
            <Link to="/galleries" className="hover:underline whitespace-nowrap">Galleries</Link>

            <Link to="/profile" className="hover:underline whitespace-nowrap">Profile</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">

          {sessionInfo ? (
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-sm text-gray-700">Welcome{sessionInfo.userName ? `, ${sessionInfo.userName}` : ''} · <span className="font-mono">{sessionId}</span></div>
              <button onClick={copyCurrentSession} title="Copy Session ID" className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v16h13a2 2 0 0 0 2-2V5zm0 18H8V7h11v16z" />
                </svg>
                Copy
              </button>
              <button onClick={() => { localStorage.removeItem('sessionId'); setSessionId(null); setSessionInfo(null); }} className="px-2 py-1 text-sm bg-gray-100 rounded">Switch</button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <input value={sessionInput} onChange={(e) => setSessionInput(e.target.value)} placeholder="Session ID eg. FL-XXXX" className="px-2 py-1 border rounded text-sm" />
              <div className="flex items-center gap-2">
                <button onClick={useSessionId} disabled={!sessionInput || loadingSession} className={`px-3 py-1 text-sm rounded ${!sessionInput || loadingSession ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200'}`}>
                  {loadingSession ? (
                    <svg className="animate-spin inline-block w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                  ) : 'Load Session'}
                </button>
                <button onClick={() => setShowInfo(true)} title="Session info" aria-label="Session info" className="p-1 rounded-full bg-blue-50 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" className="inline-block">
                    <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm.75 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM11 10.5h2v6h-2v-6z"/>
                  </svg>
                </button>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Create Session</button>
            </div>
          )}
          <ThemeToggle />
          {/* Mobile hamburger */}
          <CommandButton
            className="sm:hidden"
            iconProps={{ iconName: open ? 'ChromeClose' : 'GlobalNavButton' }}
            title={open ? 'Close menu' : 'Open menu'}
            ariaLabel={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((s) => !s)}
          />
        </div>
      </div>

      {/* Mobile menu */}
        <div className={`sm:hidden border-t bg-white transition-all duration-200 overflow-hidden ${open ? 'max-h-96 py-3' : 'max-h-0'}`}>
          <div className="max-w-6xl mx-auto px-4 flex flex-col gap-2">
            <Link to="/" onClick={() => setOpen(false)} className="hover:underline py-2">Home</Link>
            <Link to="/projects" onClick={() => setOpen(false)} className="hover:underline py-2">Projects</Link>
            <Link to="/galleries" onClick={() => setOpen(false)} className="hover:underline py-2">Galleries</Link>
            <Link to="/quiz" onClick={() => setOpen(false)} className="hover:underline py-2">Quiz</Link>
            <Link to="/profile" onClick={() => setOpen(false)} className="hover:underline py-2">Profile</Link>
          </div>
        </div>
        {/* Create session modal */}
        {showCreateModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded shadow-lg p-4 w-11/12 max-w-md">
              <h3 className="text-lg font-semibold mb-2">Create Session ID</h3>
              <p className="text-sm text-gray-600 mb-3">Provide a user name to associate with this Session ID (required).</p>
              <input value={createUserName} onChange={(e) => setCreateUserName(e.target.value)} placeholder="Enter display name" className="w-full px-3 py-2 border rounded mb-1" />
              {!createUserName.trim() ? <div className="text-xs text-red-600 mb-2">User name is required to create a Session ID.</div> : null}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreateModal(false)} className="px-3 py-1 rounded border">Cancel</button>
                <button onClick={createUniqueId} disabled={!createUserName.trim()} className={`px-3 py-1 rounded text-white ${createUserName.trim() ? 'bg-indigo-600' : 'bg-gray-300 cursor-not-allowed'}`}>Create</button>
              </div>
            </div>
          </div>
        ) : null}
        {showInfo ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded shadow-lg p-4 w-11/12 max-w-md">
              <h3 className="text-lg font-semibold mb-2">About Session IDs</h3>
              <p className="text-sm text-gray-700 mb-2">Session IDs are short, human-friendly identifiers (for example <span className="font-mono">FL-1A2B</span>) that let you return to previous quiz attempts and share progress. Click "Create Session" to generate a new ID tied to your display name.</p>
              <p className="text-sm text-gray-600 mb-3">If you don't want others to see your attempts, keep your Session ID private.</p>
              <div className="flex justify-end">
                <button onClick={() => setShowInfo(false)} className="px-3 py-1 rounded border">Close</button>
              </div>
            </div>
          </div>
        ) : null}
        {sessionMessage ? (
          <div className="absolute right-4 top-full mt-2 px-3 py-2 rounded bg-gray-900 text-white text-xs shadow-md">
            {sessionMessage}
          </div>
        ) : null}
    </header>
  );
};

export default Header;
