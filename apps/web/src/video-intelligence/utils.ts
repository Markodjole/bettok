const PREFIX = "[video-intelligence]";

export function log(phase: string, event: string, extra?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const payload = extra ? ` ${JSON.stringify(extra)}` : "";
  console.log(`${ts} ${PREFIX} [${phase}] ${event}${payload}`);
}
