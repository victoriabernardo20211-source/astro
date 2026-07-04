import { spawn } from "node:child_process";

/** Runs the API server (tsx) and the Vite dev server together. */
const procs = [
  { name: "api", cmd: "npm", args: ["run", "dev:api"], color: "\x1b[35m" },
  { name: "web", cmd: "npm", args: ["run", "dev:web"], color: "\x1b[36m" },
];

const children = procs.map(({ name, cmd, args, color }) => {
  const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], shell: false });
  const tag = `${color}[${name}]\x1b[0m `;
  const pipe = (stream) =>
    stream.on("data", (d) =>
      process.stdout.write(
        d.toString().replace(/^/gm, tag).replace(new RegExp(`${tag}$`), "")
      )
    );
  pipe(child.stdout);
  pipe(child.stderr);
  return child;
});

const killAll = () => children.forEach((c) => c.kill("SIGINT"));
process.on("SIGINT", killAll);
process.on("SIGTERM", killAll);
children.forEach((c) => c.on("exit", killAll));
