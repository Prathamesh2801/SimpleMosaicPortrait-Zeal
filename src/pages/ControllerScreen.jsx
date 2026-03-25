import { useState, useEffect, useRef, useCallback } from "react";
import ImageDeform from "../components/ImageDeform";
import MosaicWall from "../components/MosaicWall";
import useSSE from "../hooks/useSSE";
import { BASE_URL } from "../../config";

export default function ControllerScreen() {
  const GRID_ROWS = 3;
  const GRID_COLS = 12;
  const totalTiles = GRID_ROWS * GRID_COLS;

  const CURRENT_DEFORM_ANIMATION = "waveCollapse";
  // [  "pixelSpin","waveCollapse","spiralZoom","explosionGather","flipMosaic","swirlDrop","rippleSpread","zoomRotate","foldUnfold","cascadeFlip" ]
  const [phase, setPhase] = useState("idle"); // idle | deform | mosaic
  const [imageURL, setImageURL] = useState(null);
  // storage key that includes dimensions so different grid sizes don't conflict
  const storageKey = `mosaicTiles_${GRID_ROWS}x${GRID_COLS}`;
  const [tiles, setTiles] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // create array of correct length and copy available saved values
          const next = Array(totalTiles).fill(null);
          for (let i = 0; i < Math.min(next.length, parsed.length); i++) {
            next[i] = parsed[i];
          }
          return next;
        }
      }
    } catch (err) {
      console.warn("Failed to parse saved mosaic tiles:", err);
    }
    return Array(totalTiles).fill(null);
  });
  const queueRef = useRef([]); // FIFO queue of image URLs
  const processingRef = useRef(false); // true when an image is being processed (deform->mosaic)
  const { data, eventType } = useSSE("/sse_api.php?Status=False", {
    autoStart: true,
  });
  const recentProcessedRef = useRef(new Map()); // map: basePath -> timestamp
  const RECENT_MS = 5_000;

  // If rows/cols change at runtime (optional), ensure tiles length matches
  useEffect(() => {
    setTiles((prev) => {
      const next = Array(totalTiles).fill(null);
      for (let i = 0; i < Math.min(prev.length, next.length); i++) {
        next[i] = prev[i];
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GRID_ROWS, GRID_COLS, totalTiles]);

  // persist tiles to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tiles));
    } catch (err) {
      console.warn("Failed to save mosaic tiles:", err);
    }
  }, [tiles, storageKey]);

  // Helper: normalize a URL to a base path (strip query params & origin)
  const normalizeImagePath = (fullUrl) => {
    try {
      // If fullUrl is relative, ensure we can parse it by providing a base
      const u = new URL(fullUrl, window.location.origin);
      // use pathname + filename (exclude search/query)
      return u.pathname.replace(/\/+/g, "/");
    } catch (err) {
      // fallback: strip query params manually
      return fullUrl.split("?")[0];
    }
  };

  // Helper: enqueue a new image (called from SSE event handler)
  const enqueueImage = useCallback(
    (url) => {
      const base = normalizeImagePath(url);

      // If the wall is full, ignore
      const filledCount = tiles.reduce((acc, t) => acc + (t ? 1 : 0), 0);
      if (filledCount >= totalTiles) {
        console.log("Mosaic full — ignoring incoming image", url);
        return;
      }

      // If currently processing this same image, ignore
      if (processingRef.current && imageURL) {
        const activeBase = normalizeImagePath(imageURL);
        if (activeBase === base) {
          console.log(
            "enqueueImage: currently processing same image -> ignore:",
            base,
          );
          return;
        }
      }

      // If the same image already exists in queue, ignore
      const alreadyQueued = queueRef.current.some(
        (q) => normalizeImagePath(q) === base,
      );
      if (alreadyQueued) {
        console.log("enqueueImage: image already queued -> ignore:", base);
        return;
      }

      // If the image was processed very recently, ignore (de-dupe bursts)
      const lastTs = recentProcessedRef.current.get(base) || 0;
      if (Date.now() - lastTs < RECENT_MS) {
        console.log("enqueueImage: image processed recently -> ignore:", base);
        return;
      }

      // push and attempt to start
      queueRef.current.push(url);
      console.log(
        "Enqueued image ->",
        url,
        " queueLen:",
        queueRef.current.length,
      );
      processQueue();
    },
    [tiles, totalTiles, imageURL],
  );

  // Process queue: if not already processing and queue non-empty, dequeue and start pipeline
  const processQueue = useCallback(() => {
    if (processingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    processingRef.current = true;
    setImageURL(next);
    setPhase("deform");
  }, []);

  // SSE: push incoming user events into the queue (do not stop SSE)
  useEffect(() => {
    if (!eventType) return;

    if (eventType === "user" && data && data.data) {
      const imgPath = data.data.Image_Path || data.data.image_path || "";
      if (!imgPath) {
        console.warn("SSE user event missing Image_Path:", data);
        return;
      }
      const trimmed = imgPath.replace(/^\/+/, "");
      const full = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `${BASE_URL}/${trimmed}`;

      console.log("SSE: enqueueing image ->", full);
      enqueueImage(full);
    }
    // ignore heartbeats and other events
  }, [eventType, data, enqueueImage]);

  // When ImageDeform finishes, it calls this -> we start mosaic phase
  const handleDeformComplete = useCallback(() => {
    setPhase("mosaic");
  }, []);

  const handleMosaicRevealComplete = useCallback(() => {
    if (imageURL) {
      const base = normalizeImagePath(imageURL);
      recentProcessedRef.current.set(base, Date.now());
    }

    processingRef.current = false;
    setImageURL(null);
    setPhase("idle");
    setTimeout(() => {
      processQueue();
    }, 100);
  }, [processQueue, imageURL]);

  const handleResetAll = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.warn("Failed to remove saved mosaic tiles:", err);
    }

    setTiles(Array(totalTiles).fill(null));
    queueRef.current = [];
    processingRef.current = false;
    setImageURL(null);
    setPhase("idle");
  }, [totalTiles, storageKey]);

  return (
    <div className="min-h-screen ">
      {/* IMAGE DEFORM stage: only visible while deforming */}
      {phase === "deform" && imageURL && (
        <ImageDeform
          imageURL={imageURL}
          autoPlay={true}
          currentAnimation={CURRENT_DEFORM_ANIMATION}
          onAnimationComplete={handleDeformComplete}
        />
      )}

      {phase !== "deform" && (
        <MosaicWall
          rows={GRID_ROWS}
          columns={GRID_COLS}
          imageURL={phase === "mosaic" ? imageURL : null}
          tiles={tiles}
          setTiles={setTiles}
          onReset={handleResetAll}
          onRevealComplete={handleMosaicRevealComplete}
        />
      )}
    </div>
  );
}
