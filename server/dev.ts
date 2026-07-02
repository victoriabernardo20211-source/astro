import express from "express";
import type { Request, Response } from "express";
import track from "../api/track.js";
import login from "../api/login.js";
import adminOrders from "../api/admin/orders.js";
import adminImport from "../api/admin/import.js";
import adminDelete from "../api/admin/delete.js";
import adminTestEmail from "../api/admin/test-email.js";
import adminSendEmails from "../api/admin/send-emails.js";

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
app.post("/api/login", wrap(login));
app.get("/api/admin/orders", wrap(adminOrders));
app.post("/api/admin/import", wrap(adminImport));
app.post("/api/admin/delete", wrap(adminDelete));
app.post("/api/admin/test-email", wrap(adminTestEmail));
app.post("/api/admin/send-emails", wrap(adminSendEmails));

const port = Number(process.env.API_PORT || 3001);
app.listen(port, () => console.log(`[api] http://localhost:${port}`));
