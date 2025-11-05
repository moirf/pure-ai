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
    if (!sessionId) {
      setRecords(null);
      return;
    }

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
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  function summarize(record: any) {
    const started = record.startedAt ? Number(record.startedAt) : undefined;
    const finished = record.finishedAt ? Number(record.finishedAt) : undefined;
    let total: number | undefined = undefined;
    let correct: number | undefined = undefined;
    if (record.summary && typeof record.summary === 'object') {
      total = record.summary.total ?? record.summary.questions ?? undefined;
      correct = record.summary.correct ?? record.summary.score ?? undefined;
    }
    if ((total === undefined || correct === undefined) && Array.isArray(record.answers)) {
      total = record.answers.length;
      correct = record.answers.filter((a: any) => a === 1).length;
    }
    const duration = (started && finished) ? Math.max(0, finished - started) : undefined;
    const pct = (typeof total === 'number' && typeof correct === 'number' && total > 0) ? Math.round((correct / total) * 100) : undefined;
    return { started, finished, total, correct, duration, pct };
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h3 className="text-2xl font-semibold mb-4">Taken quizzes ...</h3>
      {!sessionId ? (
        <div className="text-gray-700">No session selected. Create or enter a Session ID in the header to see your taken quizzes.</div>
      ) : (
        <div>
          <div className="mb-4 text-sm text-gray-600">Showing records for <span className="font-mono">{sessionId}</span></div>
          {loading ? <div>Loading...</div> : null}
          {records && records.length === 0 ? <div className="text-gray-600">No attempts found for this session.</div> : null}
          {records && records.length > 0 ? (
            <ul className="space-y-3">
              {records.map((r, i) => {
                const s = summarize(r);
                return (
                  <li key={i} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-700">Attempt: <span className="font-mono">{r.attemptId || r.AttemptId || 'unknown'}</span></div>
                        <div className="text-xs text-gray-500">Started: {s.started ? new Date(s.started).toLocaleString() : 'unknown'}</div>
                      </div>
                      <div className="text-right">
                        {s.pct !== undefined ? <div className="text-sm font-semibold">{s.pct}%</div> : null}
                        {s.duration !== undefined ? <div className="text-xs text-gray-500">{Math.round(s.duration/1000)}s</div> : null}
                      </div>
                    </div>
                    { (r.answers || r.summary) ? (
                      <details className="mt-2 text-xs text-gray-700">
                        <summary className="cursor-pointer">View details</summary>
                        <pre className="mt-2 overflow-auto bg-gray-50 p-2 rounded text-xs">{JSON.stringify(r, null, 2)}</pre>
                      </details>
                    ) : null }
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      )}
    </main>
  );
};

export default HomePage;