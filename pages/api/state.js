import { Redis } from '@upstash/redis';

const kv = Redis.fromEnv();

const KEY = 'leaderboard-state';

const DEFAULT_STATE = {
  title: 'Sports Day',
  announcement: '',
  teams: [
    { id: 't1', name: 'Red House', color: '#e0607a', points: 0 },
    { id: 't2', name: 'Blue House', color: '#4f8fe0', points: 0 },
    { id: 't3', name: 'Green House', color: '#3ddc84', points: 0 },
    { id: 't4', name: 'Yellow House', color: '#f4c542', points: 0 },
  ],
  events: [],
  lastUpdated: Date.now(),
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    let state = await kv.get(KEY);
    if (!state) {
      state = DEFAULT_STATE;
      await kv.set(KEY, state);
    }
    return res.status(200).json(state);
  }

  if (req.method === 'POST') {
    try {
      const { pin, state } = req.body;
      if (!pin || pin !== process.env.ADMIN_PIN) {
        return res.status(401).json({ error: 'Incorrect PIN' });
      }
      if (!state || !Array.isArray(state.teams)) {
        return res.status(400).json({ error: 'Malformed state' });
      }
      const newState = { ...state, lastUpdated: Date.now() };
      await kv.set(KEY, newState);
      return res.status(200).json(newState);
    } catch (e) {
      return res.status(500).json({ error: 'Save failed' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
