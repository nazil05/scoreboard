import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  return h + 'h ago';
}

export default function Home() {
  const [data, setData] = useState(null);
  const [tick, setTick] = useState(0);
  const timerRef = useRef(null);

  async function load() {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      // network hiccup — keep showing last good data
    }
  }

  useEffect(() => {
    load();
    const poll = setInterval(load, 4000);
    const clock = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  const sorted = data ? [...data.teams].sort((a, b) => b.points - a.points) : [];
  const maxPts = Math.max(1, ...sorted.map((t) => t.points));

  return (
    <>
      <Head>
        <title>{data ? data.title : 'Live Scoreboard'}</title>
      </Head>
      <div className="wrap">
        <div className="header">
          <div>
            <div className="eyebrow">Live Scoreboard</div>
            <div className="title">{data ? data.title : 'Loading…'}</div>
          </div>
          <div className="live-badge">
            <span className="live-dot"></span>LIVE
          </div>
        </div>
        <div className="updated">
          {data ? `Updated ${timeAgo(data.lastUpdated)}` : ''}
        </div>

        {data && data.announcement ? (
          <div className="announcement">
            <span className="icon">📣</span>
            <span>{data.announcement}</span>
          </div>
        ) : null}

        <div>
          {sorted.map((t, i) => {
            const pct = Math.round((t.points / maxPts) * 100);
            return (
              <div
                key={t.id}
                className={`card ${i === 0 && t.points > 0 ? 'rank-1' : ''}`}
              >
                <div className="rank-num">{i + 1}</div>
                <div className="dot" style={{ background: t.color }}></div>
                <div className="team-info">
                  <div className="team-name">
                    {t.name} {i === 0 && t.points > 0 ? <span>👑</span> : null}
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: pct + '%', background: t.color }}
                    ></div>
                  </div>
                </div>
                <div className="score-block">
                  <div className="score" style={{ color: t.color }}>
                    {t.points}
                  </div>
                  <div className="score-label">pts</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="section-label">Recent updates</div>
        <div>
          {!data || !data.events || data.events.length === 0 ? (
            <div className="empty">No events logged yet.</div>
          ) : (
            [...data.events]
              .slice(-8)
              .reverse()
              .map((e, idx) => (
                <div className="event-row" key={idx}>
                  <div>{e.label}</div>
                  <div className="event-meta">{timeAgo(e.ts)}</div>
                </div>
              ))
          )}
        </div>
      </div>

      <a href="/admin" className="admin-link" title="Admin">
        ⚙
      </a>
    </>
  );
}
