import { useEffect, useState, useRef, useCallback } from "react";
import { BASE_URL } from "../../config";

export default function useSSE(
  endpoint = "/sse_api.php?Status=False",
  options = { autoStart: true },
) {
  // ✅ Single source of truth (NO race condition)
  const [event, setEvent] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  // 🔧 Helper to safely emit event
  const emitEvent = useCallback((type, data) => {
    setEvent({
      type,
      data,
      ts: Date.now(), // helps React detect even same payload
    });
  }, []);

  const start = useCallback(() => {
    if (eventSourceRef.current) {
      console.log("⚠️ SSE already running, skipping start");
      return;
    }

    const fullUrl = `${BASE_URL}${endpoint}`;
    console.log("🔌 Starting SSE:", fullUrl);

    const es = new EventSource(fullUrl, { withCredentials: false });
    eventSourceRef.current = es;

    // ✅ Connected
    es.onopen = () => {
      console.log("✅ SSE connected");
      setIsConnected(true);
    };

    // ✅ Fallback handler (IMPORTANT)
    es.onmessage = (e) => {
      console.log("📡 SSE RAW (message):", e.data);

      try {
        const parsed = JSON.parse(e.data);

        // smart detection (fallback if backend doesn't send event name)
        if (parsed?.data?.Image_Path || parsed?.data?.image_path) {
          emitEvent("user", parsed);
        } else {
          emitEvent("message", parsed);
        }
      } catch (err) {
        console.warn("⚠️ Invalid JSON (message):", e.data);
        emitEvent("message", e.data);
      }
    };

    // ✅ Named event: user
    es.addEventListener("user", (e) => {
      console.log("📡 SSE RAW (user):", e.data);

      try {
        const parsed = JSON.parse(e.data);
        emitEvent("user", parsed);
      } catch (err) {
        console.error("❌ Invalid JSON in user event:", e.data);
      }
    });

    // ✅ Heartbeat
    es.addEventListener("heartbeat", (e) => {
      console.log("💓 SSE heartbeat:", e.data);

      try {
        const parsed = e.data ? JSON.parse(e.data) : {};
        emitEvent("heartbeat", parsed);
      } catch {
        emitEvent("heartbeat", {});
      }
    });

    // ❌ Error + reconnect
    es.onerror = (err) => {
      console.error("❌ SSE error (FULL):", {
        err,
        readyState: es.readyState,
        url: fullUrl,
      });
      setIsConnected(false);

      try {
        es.close();
      } catch {}

      eventSourceRef.current = null;

      // reconnect after delay
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      reconnectTimerRef.current = setTimeout(() => {
        console.log("🔄 Reconnecting SSE...");
        start();
      }, 3000);
    };
  }, [endpoint, emitEvent]);

  const stop = useCallback(() => {
    if (!eventSourceRef.current) return;
    console.log("🛑 Stopping SSE");

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch {}
      eventSourceRef.current = null;
    }

    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (options.autoStart) {
      start();
    }

    return () => {
      stop();
    };
  }, [start, stop, options.autoStart]);

  return {
    event, // ✅ unified event object
    isConnected,
    start,
    stop,
  };
}
