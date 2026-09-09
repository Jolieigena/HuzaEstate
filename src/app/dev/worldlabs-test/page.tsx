"use client";

// ---------------------------------------------------------------------
// DEVELOPER TEST PANEL — not part of the production UX.
//
// This exists only to exercise the /api/tours/generate and
// /api/tours/status routes directly with a raw prompt, for verifying the
// serverless World Labs integration works end to end without needing a
// real property. The production "Generate 3D Tour" flow (see
// SellerTourControl.tsx) never lets a user type a prompt — it always
// derives one server-side from property data (see promptBuilder.ts).
// ---------------------------------------------------------------------

import { useState } from 'react';
import { getWorldGenerationStatus } from '@/lib/tours/tourService';

type Phase = 'idle' | 'starting' | 'pending' | 'ready' | 'failed';

export default function WorldLabsDevTestPage() {
  const [prompt, setPrompt] = useState('A realistic modern 3-bedroom house with a spacious living room, kitchen, natural lighting, and a garden.');
  const [phase, setPhase] = useState<Phase>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState<{ worldId?: string; viewerUrl?: string; providerId?: string; providerMode?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const appendLog = (line: string) => setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${line}`]);

  const poll = async (operationId: string) => {
    const data = await getWorldGenerationStatus(operationId, 'dev-test');
    if (!('status' in data)) {
      setPhase('failed');
      setError(data.error);
      appendLog(`ERROR: ${data.error}`);
      return;
    }
    if (data.status === 'pending') {
      appendLog('status: pending…');
      setTimeout(() => poll(operationId), 2000);
      return;
    }
    if (data.status === 'failed') {
      setPhase('failed');
      setError(data.error ?? 'Generation failed.');
      appendLog(`status: failed — ${data.error ?? 'unknown error'}`);
      return;
    }
    setPhase('ready');
    setResult({ worldId: data.worldId, viewerUrl: data.viewerUrl, providerId: data.providerId, providerMode: data.providerMode });
    appendLog(`status: ready — world_id=${data.worldId}`);
  };

  const handleGenerate = async () => {
    setPhase('starting');
    setError(null);
    setResult(null);
    setLog([]);
    appendLog('POST /api/tours/generate (promptOverride, dev only)');

    let res: Response;
    try {
      res = await fetch('/api/tours/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptOverride: prompt }),
      });
    } catch (err) {
      setPhase('failed');
      setError('Network error reaching /api/tours/generate.');
      appendLog(`ERROR: ${err instanceof Error ? err.message : 'network error'}`);
      return;
    }

    const data = await res.json();

    if (!res.ok || data.error) {
      setPhase('failed');
      setError(data.error ?? `HTTP ${res.status}`);
      appendLog(`ERROR (HTTP ${res.status}${data.kind ? `, kind=${data.kind}` : ''}): ${data.error ?? 'unknown'}`);
      return;
    }

    appendLog(`operation_id=${data.operationId} · provider=${data.providerId} (${data.providerMode}) · prompt="${data.prompt}"`);
    setResult({ providerId: data.providerId, providerMode: data.providerMode });

    if (data.status === 'pending') {
      setPhase('pending');
      poll(data.operationId);
    } else {
      setPhase('ready');
      setResult((prev) => ({ ...prev, worldId: data.worldId, viewerUrl: data.viewerUrl }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono text-sm p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 px-4 py-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-300">
          ⚠ Developer test panel — exercises the World Labs serverless integration directly. Not part of the production UX.
        </div>

        <h1 className="text-lg font-bold text-white mb-4">World Labs World API — test harness</h1>

        <label className="block text-xs text-slate-400 mb-1">text_prompt (dev-only override; production never exposes this)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 mb-3"
        />

        <button
          onClick={handleGenerate}
          disabled={phase === 'starting' || phase === 'pending'}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg mb-6"
        >
          {phase === 'starting' ? 'Starting…' : phase === 'pending' ? 'Generating…' : 'Generate (text-to-world)'}
        </button>

        <div className="mb-4">
          <span className="text-slate-400">phase: </span>
          <span className={phase === 'ready' ? 'text-green-400' : phase === 'failed' ? 'text-red-400' : 'text-yellow-400'}>{phase}</span>
        </div>

        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300">{error}</div>}

        {result && (
          <div className="mb-4 p-3 bg-slate-900 border border-slate-700 rounded-lg">
            <div>provider: {result.providerId} ({result.providerMode})</div>
            {result.worldId && <div>world_id: {result.worldId}</div>}
            {result.viewerUrl && (
              <div>
                viewer:{' '}
                <a href={result.viewerUrl} target="_blank" rel="noopener noreferrer" className="text-green-400 underline">
                  {result.viewerUrl}
                </a>
              </div>
            )}
          </div>
        )}

        <div className="bg-black rounded-lg p-3 h-48 overflow-y-auto text-xs text-slate-400">
          {log.length === 0 ? <span className="text-slate-600">log will appear here…</span> : log.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      </div>
    </div>
  );
}
