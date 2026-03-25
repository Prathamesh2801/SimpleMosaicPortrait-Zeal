// src/hooks/useSSE.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { BASE_URL } from "../../config";

export default function useSSE(endpoint = "/sse_api.php?Status=False", options = { autoStart: true }) {
  const [data, setData] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const start = useCallback(() => {
    if (eventSourceRef.current) return; // already started
    const fullUrl = `${BASE_URL}${endpoint}`;
    const es = new EventSource(fullUrl, { withCredentials: false });
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log("✅ SSE connected");
      setIsConnected(true);
    };

    es.onmessage = (e) => {
      try {
        const parsedData = JSON.parse(e.data);
        setData(parsedData);
        setEventType("message");
      } catch {
        setData(e.data);
        setEventType("message");
      }
    };

    es.addEventListener("user", (e) => {
      try {
        const parsed = JSON.parse(e.data);
        setData(parsed);
        setEventType("user");
      } catch {
        console.error("Invalid JSON in user event:", e.data);
      }
    });

    es.addEventListener("heartbeat", (e) => {
      setEventType("heartbeat");
      try {
        setData(JSON.parse(e.data || "{}"));
      } catch {
        setData({});
      }
    });

    es.onerror = (err) => {
      console.error("❌ SSE error:", err);
      setIsConnected(false);
      try { es.close(); } catch {}
      eventSourceRef.current = null;

      // try to reconnect after 3s
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => start(), 3000);
    };
  }, [endpoint]);

  const stop = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      try { eventSourceRef.current.close(); } catch {}
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (options.autoStart) start();
    return () => {
      stop();
    };
  }, [start, stop, options.autoStart]);

  return { data, eventType, isConnected, start, stop };
}
