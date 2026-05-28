/**
 * useKitchenSocket — opens a WebSocket to /ws/kitchen for live order updates.
 *
 * Calls the supplied `onEvent` for every {type, data} message the backend
 * pushes. Auto-reconnects with exponential backoff. Cleans up on unmount.
 */
import { useEffect, useRef } from "react";
import { openKitchenSocket } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function useKitchenSocket(onEvent) {
  const onEventRef = useRef(onEvent);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  const isAuthed = useAuth((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthed) return;
    let ws = null;
    let closedByUs = false;
    let attempt = 0;
    let reconnectTimer = null;

    const connect = () => {
      try { ws = openKitchenSocket(); }
      catch (err) { console.warn("[ws] open failed:", err); scheduleReconnect(); return; }

      ws.addEventListener("open", () => { attempt = 0; });
      ws.addEventListener("message", (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          onEventRef.current?.(msg);
        } catch { /* ignore malformed */ }
      });
      ws.addEventListener("close", () => { if (!closedByUs) scheduleReconnect(); });
      ws.addEventListener("error", () => { try { ws.close(); } catch { /* ignore */ } });
    };

    const scheduleReconnect = () => {
      attempt += 1;
      const delay = Math.min(1000 * 2 ** attempt, 30_000);
      reconnectTimer = setTimeout(connect, delay);
    };

    connect();

    return () => {
      closedByUs = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) try { ws.close(); } catch { /* ignore */ }
    };
  }, [isAuthed]);
}

export default useKitchenSocket;
