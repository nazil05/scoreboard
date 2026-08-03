import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [data, setData] = useState(null);
  const [newEvent, setNewEvent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (unlocked) {
      fetch('/api/state', { cache: 'no-store' })
        .then((r) => r.json())
        .then(setData);
    }
  }, [unlocked]);

  function tryUnlock() {
    // We don't verify the PIN client-side against anything secret —
    // the real check happens on save. This just gates the UI.
    setUnlocked(true);
  }

  function updateTeam(id, field, value) {
    setData((d) => ({
      ...d,
      teams: d.teams.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
  }

  function bumpPoints(id, delta) {
    setData((d) => ({
      ...d,
      teams: d.teams.map((t) =>
        t.id === id ? { ...t, points: (parseInt(t.points) || 0) + delta } : t
      ),
    }));
  }

  function addTeam() {
    setData((d) => ({
      ...d,
      teams: [
        ...d.teams,
        { id: 't' + Date.now(), name: 'New Team', color: '#4f8fe0', points: 0 },
      ],
    }));
  }

  function removeTeam(id) {
    setData((d) => ({ ...d, teams: d.teams.filter((t) => t.id !== id) }));
  }

  function logEvent() {
    if (!newEvent.trim()) return;
    setData((d) => ({
      ...d,
      events: [...(d.events || []), { label: newEvent.trim(), ts: Date.now() }],
    }));
    setNewEvent('');
  }

  async function save() {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, state: data }),
      });
      if (res.status === 401) {
        setSaveMsg('Wrong PIN — nothing was saved.');
        setUnlocked(false);
      } else if (res.ok) {
        const json = await res.json();
        setData(json);
        setSaveMsg('Saved and live on the public page.');
      } else {
        setSaveMsg('Save failed — try again.');
      }
    } catch (e) {
      setSaveMsg('Save failed — check your connection.');
    }
    setSaving(false);
  }

  if (!unlocked) {
    return (
      <>
        <Head>
          <title>Admin</title>
        </Head>
        <div className="wrap">
          <a href="/" className="back-link">
            ← Back to leaderboard
          </a>
          <div className="pin-gate">
            <div className="title" style={{ fontSize: 26 }}>
              Admin access
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label>Enter PIN</label>
              <input
                type="password"
                maxLength={8}
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
              />
            </div>
            <button className="btn-primary" onClick={tryUnlock}>
              Continue
            </button>
            <div className="hint">
              The PIN is checked when you save. Only the organizer needs it —
              everyone else just views the public page.
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <div className="wrap">
        <div className="updated">Loading…</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin — Scoreboard</title>
      </Head>
      <div className="wrap">
        <a href="/" className="back-link">
          ← Back to leaderboard
        </a>
        <div className="title" style={{ fontSize: 26, marginBottom: 16 }}>
          Manage scoreboard
        </div>

        <div className="field">
          <label>Event / competition title</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Announcement banner (shown to everyone)</label>
          <textarea
            rows={2}
            value={data.announcement || ''}
            onChange={(e) => setData({ ...data, announcement: e.target.value })}
            placeholder="e.g. Lunch break till 2 PM"
          />
        </div>

        <div className="divider"></div>

        <div className="field">
          <label>Teams &amp; points</label>
        </div>
        {data.teams.map((t) => (
          <div className="team-admin-row" key={t.id}>
            <input
              type="color"
              value={t.color}
              onChange={(e) => updateTeam(t.id, 'color', e.target.value)}
              style={{ width: 34, height: 34, padding: 2, flex: 'none' }}
            />
            <input
              type="text"
              className="name"
              value={t.name}
              onChange={(e) => updateTeam(t.id, 'name', e.target.value)}
            />
            <button className="step" onClick={() => bumpPoints(t.id, -1)}>
              −
            </button>
            <input
              type="number"
              className="pts"
              value={t.points}
              onChange={(e) => updateTeam(t.id, 'points', parseInt(e.target.value) || 0)}
            />
            <button className="step" onClick={() => bumpPoints(t.id, 1)}>
              +
            </button>
            <button className="btn-danger" onClick={() => removeTeam(t.id)}>
              ✕
            </button>
          </div>
        ))}
        <button className="btn-secondary" onClick={addTeam} style={{ marginTop: 8 }}>
          + Add team
        </button>

        <div className="divider"></div>

        <div className="field">
          <label>Log an event update (shows in the feed)</label>
          <input
            type="text"
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
            placeholder="e.g. Red House wins 100m Dash"
          />
        </div>
        <button className="btn-secondary" onClick={logEvent}>
          Add to feed
        </button>

        <div className="divider"></div>

        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save & publish'}
        </button>
        {saveMsg ? <div className="hint" style={{ marginTop: 10 }}>{saveMsg}</div> : null}
      </div>
    </>
  );
}
