import React, { useEffect, useState } from 'react';

const HomePage: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [records, setRecords] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('sessionId');
      if (s) setSessionId(s);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!sessionId) return setRecords(null);
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sessions/records?sessionId=${encodeURIComponent(sessionId)}`);
        if (!res.ok) {
          setRecords([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn('failed to load records', e);
        setRecords([]);
      } finally { setLoading(false); }
    })();
  }, [sessionId]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Home</h1>
      {!sessionId ? (
        <div className="text-gray-700">No session selected. Create or enter a Session ID in the header to see your taken quizzes.</div>
      ) : (
        <div>
          <div className="mb-4 text-sm text-gray-600">Showing records for <span className="font-mono">{sessionId}</span></div>
          {loading ? <div>Loading...</div> : null}
          {records && records.length === 0 ? <div className="text-gray-600">No attempts found for this session.</div> : null}
          {records && records.length > 0 ? (
            <ul className="space-y-3">
              {records.map((r, i) => (
                <li key={i} className="p-3 border rounded">
                  <div className="text-sm text-gray-700">Attempt: <span className="font-mono">{r.attemptId || r.AttemptId || 'unknown'}</span></div>
                  <div className="text-xs text-gray-500">Started: {r.startedAt ? new Date(r.startedAt).toLocaleString() : 'unknown'}</div>
                  <pre className="text-xs mt-2 overflow-auto bg-gray-50 p-2 rounded text-gray-800">{JSON.stringify(r, null, 2)}</pre>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </main>
  );
};

export default HomePage;
