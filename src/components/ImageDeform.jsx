import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ImageDeform
 *
 * Props:
 * - imageURL: string — image source from parent
 * - currentAnimation: string — one of the animation ids below
 * - onAnimationComplete: () => void — called after animation + hold
 * - autoPlay: boolean — start automatically when imageURL arrives
 * - holdDuration: number (ms) — how long to hold after animation (default 3000)
 */

const GRID_COLS = 16;
const GRID_ROWS = 16;
const PAD = 32; // px padding on all sides — image never touches screen edge

export default function ImageDeform({
  imageURL,
  currentAnimation = "pixelSpin",
  onAnimationComplete,
  autoPlay = true,
  holdDuration = 30000,
}) {
  const [imgSize, setImgSize] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [animate, setAnimate] = useState(false);
  const [animationType, setAnimationType] = useState(currentAnimation);

  const completionTimerRef = useRef(null);
  const holdTimerRef = useRef(null);

  useEffect(() => {
    setAnimationType(currentAnimation);
  }, [currentAnimation]);

  useEffect(() => {
    if (!imageURL) {
      setImgSize(null);
      setPieces([]);
      setAnimate(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
      setAnimate(false);

      const temp = [];
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          temp.push({ id: row * GRID_COLS + col, row, col });
        }
      }
      setPieces(temp);

      if (autoPlay) {
        setTimeout(() => setAnimate(true), 600);
      }
    };
    img.onerror = () => {
      // Still build the grid even if CORS fails — backgroundImage will still render
      setImgSize({ width: 16, height: 9 }); // fallback ratio
      const temp = [];
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          temp.push({ id: row * GRID_COLS + col, row, col });
        }
      }
      setPieces(temp);
      if (autoPlay) setTimeout(() => setAnimate(true), 600);
    };
    img.src = imageURL;

    return () => { img.onload = null; img.onerror = null; };
  }, [imageURL, autoPlay]);

  useEffect(() => {
    return () => {
      clearTimeout(completionTimerRef.current);
      clearTimeout(holdTimerRef.current);
    };
  }, []);

  const getAnimationProps = useCallback((piece) => {
    const rndX = (Math.random() - 0.5) * 900;
    const rndY = (Math.random() - 0.5) * 900;
    const rndRot = Math.random() * 720 - 360;
    const centerDist = Math.sqrt(
      Math.pow(piece.col - GRID_COLS / 2, 2) + Math.pow(piece.row - GRID_ROWS / 2, 2)
    );
    const diag = piece.row + piece.col;

    const map = {
      pixelSpin: {
        initial: { x: rndX, y: rndY, rotate: rndRot, opacity: 0, scale: 0.4 },
        animate: { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 },
        transition: { duration: 1.8, delay: Math.random() * 1.2, ease: "easeOut" },
      },
      waveCollapse: {
        initial: { y: -700, opacity: 0, scale: 0.3 },
        animate: { y: 0, opacity: 1, scale: 1 },
        transition: { duration: 1.4, delay: piece.col * 0.025 + piece.row * 0.012, ease: [0.6, 0.05, 0.01, 0.9] },
      },
      spiralZoom: {
        initial: { scale: 0, rotate: -360, opacity: 0 },
        animate: { scale: 1, rotate: 0, opacity: 1 },
        transition: { duration: 1.7, delay: centerDist * 0.035, ease: "easeOut" },
      },
      explosionGather: {
        initial: { x: (piece.col - GRID_COLS / 2) * 55, y: (piece.row - GRID_ROWS / 2) * 55, scale: 0, opacity: 0 },
        animate: { x: 0, y: 0, scale: 1, opacity: 1 },
        transition: { duration: 1.9, delay: Math.random() * 0.7, ease: [0.34, 1.56, 0.64, 1] },
      },
      flipMosaic: {
        initial: { rotateY: 180, opacity: 0, scale: 0.75 },
        animate: { rotateY: 0, opacity: 1, scale: 1 },
        transition: { duration: 1.1, delay: diag * 0.028, ease: "easeInOut" },
      },
      swirlDrop: {
        initial: { x: (GRID_COLS - piece.col) * 35 + (Math.random() - 0.5) * 60, y: -700 + (piece.row - GRID_ROWS / 2) * 8, rotate: (Math.random() - 0.5) * 400, opacity: 0, scale: 0.5 },
        animate: { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 },
        transition: { duration: 1.5, delay: (piece.row + (GRID_COLS - piece.col)) * 0.016 + Math.random() * 0.2, ease: [0.22, 1, 0.36, 1] },
      },
      rippleSpread: {
        initial: { y: 50, scale: 0.6, opacity: 0 },
        animate: { y: 0, scale: 1, opacity: 1 },
        transition: { duration: 1.3, delay: centerDist * 0.042, ease: [0.34, 1.56, 0.64, 1] },
      },
      zoomRotate: {
        initial: { scale: 0.05, rotate: (Math.random() - 0.5) * 720, opacity: 0 },
        animate: { scale: 1, rotate: 0, opacity: 1 },
        transition: { duration: 1.8, delay: diag * 0.012 + Math.random() * 0.18, ease: "easeOut" },
      },
      foldUnfold: {
        initial: { scaleY: 0.1, opacity: 0 },
        animate: { scaleY: 1, opacity: 1 },
        transition: { duration: 1.0, delay: diag * 0.022, ease: "easeInOut" },
      },
      cascadeFlip: {
        initial: { rotateX: 90, opacity: 0, y: 25 },
        animate: { rotateX: 0, opacity: 1, y: 0 },
        transition: { duration: 1.1, delay: piece.col * 0.022 + (GRID_ROWS - piece.row) * 0.01, ease: "easeOut" },
      },
    };

    return map[animationType] ?? map.explosionGather;
  }, [animationType]);

  useEffect(() => {
    clearTimeout(completionTimerRef.current);
    clearTimeout(holdTimerRef.current);

    if (!animate || pieces.length === 0) return;

    let maxSec = 0;
    for (const p of pieces) {
      const { transition: t } = getAnimationProps(p);
      const total = (t?.duration ?? 0) + (t?.delay ?? 0);
      if (total > maxSec) maxSec = total;
    }
    if (maxSec === 0) maxSec = 2.5;

    completionTimerRef.current = setTimeout(() => {
      holdTimerRef.current = setTimeout(() => {
        if (typeof onAnimationComplete === "function") onAnimationComplete();
      }, holdDuration);
    }, Math.ceil(maxSec * 1000) + 400);

    return () => {
      clearTimeout(completionTimerRef.current);
      clearTimeout(holdTimerRef.current);
    };
  }, [animate, pieces, animationType, onAnimationComplete, holdDuration, getAnimationProps]);

  // ─── Sizing logic ──────────────────────────────────────────────────────────
  //
  // Goal: image fills as much of (100vw × 100vh) - PAD as possible,
  //       preserving aspect ratio, no scrolling, no overflow.
  //
  // Strategy:
  //   1. Give the box width: 100% so it wants to fill the parent flex container
  //   2. maxWidth  = 100vw - 2*PAD  prevents horizontal overflow
  //   3. maxHeight = 100vh - 2*PAD  prevents vertical overflow
  //   4. aspect-ratio = W/H         makes height follow width…
  //                                 …and when maxHeight is hit, browser
  //                                 reduces width to satisfy both constraints.
  //
  // This works for ALL orientations: landscape, portrait, square.
  // Do NOT set explicit height — that fights aspect-ratio.

  const aspectRatio = imgSize ? `${imgSize.width} / ${imgSize.height}` : "16 / 9";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          // Must have width so the element isn't 0×0.
          // width:100% fills the flex container, then maxWidth+maxHeight+aspect-ratio
          // together constrain it to fit within the padded viewport.
          width: "100%",
          maxWidth: `calc(100vw - ${PAD * 2}px)`,
          maxHeight: `calc(100vh - ${PAD * 2}px)`,
          aspectRatio,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(120, 80, 255, 0.35)",
          background: "#1a1730",
          isolation: "isolate",
        }}
      >
        {/* Placeholder when no image */}
        {!imageURL && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 14, fontFamily: "sans-serif" }}>
            Awaiting image…
          </div>
        )}

        {/* Pieces — rendered only when imgSize is resolved */}
        <AnimatePresence>
          {imageURL && imgSize && pieces.map((piece) => {
            // Tile geometry:
            // backgroundSize = GRID_COLS*100% × GRID_ROWS*100%
            //   → image stretched across the full container N times, one per grid
            // backgroundPosition uses the CSS percentage formula for tiled grids:
            //   posX% = col / (GRID_COLS-1) * 100  →  0% for first, 100% for last
            //   posY% = row / (GRID_ROWS-1) * 100
            // +1px bleed on width/height kills sub-pixel seam gaps at any DPR.

            const pctW = 100 / GRID_COLS;
            const pctH = 100 / GRID_ROWS;
            const bgPosX = GRID_COLS > 1 ? (piece.col / (GRID_COLS - 1)) * 100 : 0;
            const bgPosY = GRID_ROWS > 1 ? (piece.row / (GRID_ROWS - 1)) * 100 : 0;
            const ap = getAnimationProps(piece);

            return (
              <motion.div
                key={`${imageURL}-${piece.id}`}
                initial={ap.initial}
                animate={animate ? ap.animate : {}}
                transition={ap.transition}
                style={{
                  position: "absolute",
                  width: `calc(${pctW}% + 1px)`,
                  height: `calc(${pctH}% + 1px)`,
                  left: `${piece.col * pctW}%`,
                  top: `${piece.row * pctH}%`,
                  backgroundImage: `url(${imageURL})`,
                  backgroundSize: `${GRID_COLS * 100}% ${GRID_ROWS * 100}%`,
                  backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                  backgroundRepeat: "no-repeat",
                  transformOrigin: "center center",
                  willChange: "transform, opacity",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
