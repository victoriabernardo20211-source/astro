import express from "express";
import type { Request, Response } from "express";
import track from "../api/track.js";
import presence from "../api/presence.js";
import login from "../api/login.js";
import admin from "../api/admin/index.js";
import webhookLpqv from "../api/webhook/lpqv.js";

/**
 * Local API server. Mounts the same handlers that Vercel deploys as serverless
 * functions, so `npm run dev` exercises the real code path (against PGlite).
 */
const app = express();
app.use(express.json({ limit: "20mb" }));

type Handler = (req: any, res: any) => unknown;
const wrap = (h: Handler) => (req: Request, res: Response) =>
  Promise.resolve(h(req, res)).catch((err) => {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: String(err) });
  });

app.get("/api/track", wrap(track));
app.post("/api/presence", wrap(presence));
app.post("/api/login", wrap(login));
app.post("/api/admin", wrap(admin));
app.post("/api/webhook/lpqv", wrap(webhookLpqv));

const port = Number(process.env.API_PORT || 3001);
app.listen(port, () => console.log(`[api] http://localhost:${port}`));
