# School Live Scoreboard

Public leaderboard at `/`, admin editor at `/admin`.

## Local dev
```
npm install
npm run dev
```
(Storage won't work locally without a KV database connected — see deployment steps.)

## Deploy
See the setup guide provided alongside this project. Summary:
1. Push this folder to a GitHub repo.
2. Import the repo into Vercel.
3. In the Vercel project → Storage tab → create a KV (Upstash Redis) database and connect it. This auto-adds the required environment variables.
4. In Vercel project → Settings → Environment Variables, add `ADMIN_PIN` with your chosen PIN.
5. Redeploy. Visit the deployed URL — that's your public link. Visit `/admin` to edit scores.
