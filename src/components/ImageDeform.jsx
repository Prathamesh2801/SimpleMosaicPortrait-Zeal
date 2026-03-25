import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ImageDeformAPIDimension
 *
 * Props:
 * - imageURL: string (image source from parent)
 * - currentAnimation: string (one of the animation ids below) — controls which animation to use
 * - onAnimationComplete: function called when the deform animation run finishes
 * - autoPlay: boolean (start automatically when imageURL arrives)
 *
 * Default currentAnimation is "explosionGather".
 */

export default function ImageDeform({
  imageURL,
  currentAnimation = "pixelSpin",
  onAnimationComplete,
  autoPlay = true,
}) {
  const [image, setImage] = useState(imageURL || null);
  const [pieces, setPieces] = useState([]);
  const [animate, setAnimate] = useState(false);
  const [animationType, setAnimationType] = useState(currentAnimation);

  const GRID_SIZE = 16;
  const completionTimerRef = useRef(null);

  // keep animationType in sync with prop when animate starts
  useEffect(() => {
    setAnimationType(currentAnimation);
  }, [currentAnimation]);

  // when parent supplies a new image, prepare pieces and optionally autoplay
  useEffect(() => {
    if (imageURL) {
      setImage(imageURL);
      setAnimate(false);
      if (autoPlay) {
        setTimeout(() => setAnimate(true), 700);
      }
    } else {
      // parent cleared image
      setImage(null);
      setAnimate(false);
      setPieces([]);
    }
  }, [imageURL, autoPlay]);

  // populate pieces grid
  useEffect(() => {
    if (!image) {
      setPieces([]);
      return;
    }
    const temp = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        temp.push({ id: row * GRID_SIZE + col, row, col });
      }
    }
    setPieces(temp);
  }, [image]);

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
    };
  }, []);

  // animation factory: returns initial/animate/transition for each piece
  const getAnimationProps = (piece) => {
    const initialX = (Math.random() - 0.5) * 800;
    const initialY = (Math.random() - 0.5) * 800;
    const rotate = Math.random() * 720 - 360;

    const centerDist = Math.sqrt(
      Math.pow(piece.col - GRID_SIZE / 2, 2) + Math.pow(piece.row - GRID_SIZE / 2, 2)
    );

    const animations = {
      // original five
      pixelSpin: {
        initial: { x: initialX, y: initialY, rotate, opacity: 0, scale: 0.5 },
        animate: { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 },
        transition: { duration: 2, delay: Math.random() * 1.5, ease: "easeOut" },
      },
      waveCollapse: {
        initial: { y: -800, opacity: 0, scale: 0.3 },
        animate: { y: 0, opacity: 1, scale: 1 },
        transition: {
          duration: 1.5,
          delay: piece.col * 0.02 + piece.row * 0.02,
          ease: [0.6, 0.05, 0.01, 0.9],
        },
      },
      spiralZoom: {
        initial: { scale: 0, rotate: -180, opacity: 0 },
        animate: { scale: 1, rotate: 0, opacity: 1 },
        transition: {
          duration: 1.8,
          delay: centerDist * 0.03,
          ease: "easeOut",
        },
      },
      explosionGather: {
        initial: {
          x: (piece.col - GRID_SIZE / 2) * 50,
          y: (piece.row - GRID_SIZE / 2) * 50,
          scale: 0,
          opacity: 0,
        },
        animate: { x: 0, y: 0, scale: 1, opacity: 1 },
        transition: { duration: 2, delay: Math.random() * 0.8, ease: [0.34, 1.56, 0.64, 1] },
      },
      flipMosaic: {
        initial: { rotateY: 180, opacity: 0, scale: 0.8 },
        animate: { rotateY: 0, opacity: 1, scale: 1 },
        transition: { duration: 1.2, delay: (piece.row + piece.col) * 0.03, ease: "easeInOut" },
      },

      // five new animations (added)
      swirlDrop: {
        initial: {
          x: (GRID_SIZE - piece.col) * 40 + (Math.random() - 0.5) * 60,
          y: -600 + (piece.row - GRID_SIZE / 2) * 6,
          rotate: (Math.random() - 0.5) * 360,
          opacity: 0,
          scale: 0.6,
        },
        animate: { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 },
        transition: {
          duration: 1.6,
          delay: (piece.row + (GRID_SIZE - piece.col)) * 0.018 + Math.random() * 0.25,
          ease: [0.22, 1, 0.36, 1],
        },
      },
      rippleSpread: {
        initial: { y: 40, scale: 0.7, opacity: 0 },
        animate: { y: 0, scale: 1, opacity: 1 },
        transition: { duration: 1.4, delay: centerDist * 0.04, ease: [0.34, 1.56, 0.64, 1] },
      },
      zoomRotate: {
        initial: { scale: 0.1, rotate: (Math.random() - 0.5) * 720, opacity: 0 },
        animate: { scale: 1, rotate: 0, opacity: 1 },
        transition: {
          duration: 1.9,
          delay: (piece.row + piece.col) * 0.01 + Math.random() * 0.2,
          ease: "easeOut",
        },
      },
      foldUnfold: {
        initial: { scaleY: 0.15, opacity: 0 },
        animate: { scaleY: 1, opacity: 1 },
        transition: { duration: 1.1, delay: (piece.row + piece.col) * 0.02, ease: "easeInOut" },
      },
      cascadeFlip: {
        initial: { rotateX: 90, opacity: 0, y: 30 },
        animate: { rotateX: 0, opacity: 1, y: 0 },
        transition: {
          duration: 1.2,
          delay: piece.col * 0.02 + (GRID_SIZE - piece.row) * 0.008,
          ease: "easeOut",
        },
      },
    };

    return animations[animationType] || animations.explosionGather;
  };

  // when animate toggles on, start completion timer (longest piece)
  useEffect(() => {
    if (!animate || pieces.length === 0) {
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
      return;
    }

    // compute longest (delay + duration)
    let maxSec = 0;
    for (const p of pieces) {
      const ap = getAnimationProps(p);
      const t = ap.transition || {};
      const dur = typeof t.duration === "number" ? t.duration : 0;
      const delay = typeof t.delay === "number" ? t.delay : 0;
      const total = dur + delay;
      if (total > maxSec) maxSec = total;
    }
    if (maxSec === 0) maxSec = 2.5;

    const bufferMs = 350;
    completionTimerRef.current = setTimeout(() => {
      completionTimerRef.current = null;
      try {
        if (typeof onAnimationComplete === "function") onAnimationComplete();
      } catch (err) {
        console.error("onAnimationComplete threw:", err);
      }
    }, Math.ceil(maxSec * 1000) + bufferMs);

    return () => {
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
    };
    // include animationType so timer recalculates when style changes
  }, [animate, pieces, animationType, onAnimationComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 sm:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
          Image Deform Studio
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">Animations controlled by parent via <code>currentAnimation</code> prop</p>
      </motion.div>

      {/* Image Display Area */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-[400px] aspect-square bg-slate-800/50 overflow-hidden rounded-2xl shadow-2xl shadow-purple-900/50 backdrop-blur-sm">
        {!image && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-sm">Awaiting image from parent</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {image &&
            pieces.map((piece) => {
              const size = 400 / GRID_SIZE;
              const backgroundPosition = `-${piece.col * size}px -${piece.row * size}px`;
              const animProps = getAnimationProps(piece);

              return (
                <motion.div
                  key={piece.id}
                  initial={animProps.initial}
                  animate={animate ? animProps.animate : {}}
                  transition={animProps.transition}
                  className="absolute"
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(piece.col * 100) / GRID_SIZE}%`,
                    top: `${(piece.row * 100) / GRID_SIZE}%`,
                    backgroundImage: `url(${image})`,
                    backgroundSize: "400px 400px",
                    backgroundPosition,
                    backgroundRepeat: "no-repeat",
                    transformOrigin: "center center",
                    backfaceVisibility: "hidden",
                  }}
                />
              );
            })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
