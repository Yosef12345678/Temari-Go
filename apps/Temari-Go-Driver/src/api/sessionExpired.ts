type SessionExpiredHandler = () => void | Promise<void>;

let handler: SessionExpiredHandler | null = null;
let inFlight: Promise<void> | null = null;

export function setSessionExpiredHandler(next: SessionExpiredHandler | null) {
  handler = next;
}

export function notifySessionExpired(): void {
  if (!handler) return;
  if (inFlight) return;
  inFlight = Promise.resolve(handler()).finally(() => {
    inFlight = null;
  });
}
