import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MosaicBG from "../assets/img/demobg.jpg";
import Logo from "../assets/img/logo.png";
import { T } from "../constants/colors";
import { Users } from "lucide-react";
export default function MosaicWall({
  imageURL,
  onReset,
  tiles: propTiles,
  setTiles: setPropTiles,
  rows = 7, // Y (rows)
  columns = 5, // X (columns)
  onRevealComplete = null,
}) {
  const gridRows = rows;
  const gridCols = columns;
  const totalTiles = gridRows * gridCols;

  // Animation timing configuration (in seconds)
  const ANIMATION_CONFIG = {
    initialDelay: 0.3,
    coverDuration: 0.6,
    coverHoldDuration: 0.5,
    shrinkDuration: 1.2,
    revealDuration: 0.6,
    particleDuration: 0.8,
  };

  const totalAnimationTime =
    ANIMATION_CONFIG.initialDelay +
    ANIMATION_CONFIG.coverDuration +
    ANIMATION_CONFIG.coverHoldDuration +
    ANIMATION_CONFIG.shrinkDuration +
    ANIMATION_CONFIG.revealDuration;

  // Timeouts cleanup
  const timeoutIdsRef = useRef([]);

  const containerRef = useRef(null);

  // Use lifted tiles if provided, otherwise internal fallback
  const [internalTiles, setInternalTiles] = useState(() =>
    Array(totalTiles).fill(null),
  );

  // if parent provides tiles, use them; otherwise internal
  const tiles = propTiles ?? internalTiles;
  const setTiles = setPropTiles ?? setInternalTiles;

  // If rows/columns change, ensure internal tiles array has correct length
  useEffect(() => {
    if (!propTiles) {
      setInternalTiles((prev) => {
        const next = Array(totalTiles).fill(null);
        // copy over existing revealed tiles if possible (up to new length)
        for (let i = 0; i < Math.min(prev.length, next.length); i++) {
          next[i] = prev[i];
        }
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns, totalTiles]);

  const [lastRevealedIndex, setLastRevealedIndex] = useState(null);
  const [animatingImage, setAnimatingImage] = useState(null);
  const [targetTileIndex, setTargetTileIndex] = useState(null);
  const [animationPhase, setAnimationPhase] = useState(null);

  const filledCount = useMemo(
    () => tiles.reduce((acc, t) => acc + (t ? 1 : 0), 0),
    [tiles],
  );
  const isFull = filledCount === totalTiles;

  // Helper: tile sizes as percent of container
  const tileWidthPct = 100 / gridCols;
  const tileHeightPct = 100 / gridRows;

  // Return left/top percent (relative to container) for the tile's top-left corner
  const getTileLeftTop = (index) => {
    const row = Math.floor(index / gridCols);
    const col = index % gridCols;
    const left = col * tileWidthPct; // percentage of container width
    const top = row * tileHeightPct; // percentage of container height
    return {
      left: `${left}%`,
      top: `${top}%`,
    };
  };

  const clearAllTimeouts = () => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
  };

  // create a masked/blended tile image File for given full image URL and tile index
  // inside MosaicWallAPIDimension component
  // create a masked/blended tile File for given uploadedImageUrl and tile index
  // create a blended tile File for given uploadedImageUrl and tile index
  // create a blended tile File using actual DOM mosaic size so cropping aligns 1:1
  const createMaskedTileFile = async (uploadedImageUrl, index) => {
    // measure container on screen
    const container = containerRef?.current;
    if (!container) {
      // fallback: use previous approach (grid size * fallback tile size)
      console.warn(
        "containerRef missing; falling back to default tilePixelSize",
      );
      return await createMaskedTileFile_Fallback(uploadedImageUrl, index);
    }

    const rect = container.getBoundingClientRect();
    const containerW = Math.max(1, Math.round(rect.width));
    const containerH = Math.max(1, Math.round(rect.height));

    // device pixel ratio for crispness
    const DPR = Math.max(1, window.devicePixelRatio || 1);

    // big canvas matches actual displayed mosaic size (in CSS px * DPR)
    const bigW = Math.round(containerW * DPR);
    const bigH = Math.round(containerH * DPR);

    // per-tile pixel dimensions based on actual container
    const tileW = Math.round(bigW / gridCols);
    const tileH = Math.round(bigH / gridRows);
    // We'll assume square tiles visually; use tileW/tileH for cropping in pixels

    // load images
    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image load failed: " + src));
        img.src = src;
      });

    const [bgImg, fgImg] = await Promise.all([
      loadImage(MosaicBG),
      loadImage(uploadedImageUrl),
    ]);

    // helper: draw cover-fit into ctx of given target size (w,h)
    const fitCoverDraw = (ctx, img, w, h) => {
      const imgRatio = img.width / img.height;
      const canvasRatio = w / h;
      let drawW = w,
        drawH = h,
        dx = 0,
        dy = 0;
      if (imgRatio > canvasRatio) {
        drawH = h;
        drawW = imgRatio * drawH;
        dx = -(drawW - w) / 2;
      } else {
        drawW = w;
        drawH = drawW / imgRatio;
        dy = -(drawH - h) / 2;
      }
      ctx.drawImage(img, dx, dy, drawW, drawH);
    };

    // create big canvas (match on-screen mosaic) scaled by DPR
    const bigCanvas = document.createElement("canvas");
    bigCanvas.width = bigW;
    bigCanvas.height = bigH;
    const bctx = bigCanvas.getContext("2d");
    bctx.imageSmoothingEnabled = true;
    bctx.save();
    // draw background cover into big canvas
    fitCoverDraw(bctx, bgImg, bigW, bigH);
    bctx.restore();

    // compute tile crop on big canvas in pixel-space
    const row = Math.floor(index / gridCols);
    const col = index % gridCols;
    const sx = col * tileW;
    const sy = row * tileH;

    // create tile canvas scaled by DPR
    const tileCanvas = document.createElement("canvas");
    // Use tileW x tileH which are DPR-scaled pixel sizes
    tileCanvas.width = tileW;
    tileCanvas.height = tileH;
    const tctx = tileCanvas.getContext("2d");
    tctx.imageSmoothingEnabled = true;

    // Draw the cropped *background portion* first
    tctx.drawImage(bigCanvas, sx, sy, tileW, tileH, 0, 0, tileW, tileH);

    // Blend: draw FG on top with alpha + blend mode as you prefer
    const FG_ALPHA = 0.42; // adjust
    const BLEND_MODE = "overlay"; // "overlay","screen","multiply","source-over"
    // apply optional filter for FG
    try {
      tctx.filter = "saturate(0.95) contrast(1.02)";
    } catch (e) {
      tctx.filter = "none";
    }

    const prevComposite = tctx.globalCompositeOperation;
    const prevAlpha = tctx.globalAlpha;
    try {
      tctx.globalCompositeOperation = BLEND_MODE;
      tctx.globalAlpha = FG_ALPHA;
      // draw FG into tile canvas — but FG must be drawn at DPR scale too.
      // Fit cover the FG into tileW x tileH (DPR-scaled)
      fitCoverDraw(tctx, fgImg, tileW, tileH);
    } catch (err) {
      // fallback to alpha-only
      tctx.globalCompositeOperation = "source-over";
      tctx.globalAlpha = FG_ALPHA;
      fitCoverDraw(tctx, fgImg, tileW, tileH);
    } finally {
      tctx.globalCompositeOperation = prevComposite;
      tctx.globalAlpha = prevAlpha;
      tctx.filter = "none";
    }

    // subtle vignette to match look
    const vig = tctx.createRadialGradient(
      tileW / 2,
      tileH / 2,
      Math.min(tileW, tileH) * 0.2,
      tileW / 2,
      tileH / 2,
      Math.max(tileW, tileH),
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.12)");
    tctx.globalCompositeOperation = "multiply";
    tctx.fillStyle = vig;
    tctx.fillRect(0, 0, tileW, tileH);
    tctx.globalCompositeOperation = "source-over";

    // rounded corners mask (destination-in) — keeps transparency outside corners
    const radius = Math.round(Math.min(tileW, tileH) * 0.03);
    const mask = document.createElement("canvas");
    mask.width = tileW;
    mask.height = tileH;
    const mctx = mask.getContext("2d");
    mctx.fillStyle = "#fff";
    mctx.beginPath();
    mctx.moveTo(radius, 0);
    mctx.lineTo(tileW - radius, 0);
    mctx.quadraticCurveTo(tileW, 0, tileW, radius);
    mctx.lineTo(tileW, tileH - radius);
    mctx.quadraticCurveTo(tileW, tileH, tileW - radius, tileH);
    mctx.lineTo(radius, tileH);
    mctx.quadraticCurveTo(0, tileH, 0, tileH - radius);
    mctx.lineTo(0, radius);
    mctx.quadraticCurveTo(0, 0, radius, 0);
    mctx.closePath();
    mctx.fill();

    tctx.globalCompositeOperation = "destination-in";
    tctx.drawImage(mask, 0, 0);
    tctx.globalCompositeOperation = "source-over";

    // draw bottom-left number pill (note: coordinates in DPR-scaled pixels)
    const padding = Math.round(Math.min(tileW, tileH) * 0.04);
    const fontSize = Math.round(Math.min(tileW, tileH) * 0.12);
    tctx.font = `700 ${fontSize}px Inter, sans-serif`;
    tctx.textAlign = "left";
    tctx.textBaseline = "bottom";

    const numberText = String(index + 1);
    const metrics = tctx.measureText(numberText);
    const textW = metrics.width;
    const pillW = textW + padding * 2;
    const pillH = Math.round(fontSize + padding * 0.6);
    const pillX = padding;
    const pillY = tileH - padding;
    const pillRadius = Math.round(pillH * 0.45);

    tctx.save();
    tctx.shadowColor = "rgba(0,0,0,0.45)";
    tctx.shadowBlur = Math.max(4, Math.min(tileW, tileH) * 0.008);
    tctx.shadowOffsetY = 2;

    tctx.fillStyle = "rgba(0,0,0,0.64)";
    tctx.beginPath();
    tctx.moveTo(pillX + pillRadius, pillY - pillH);
    tctx.lineTo(pillX + pillW - pillRadius, pillY - pillH);
    tctx.quadraticCurveTo(
      pillX + pillW,
      pillY - pillH,
      pillX + pillW,
      pillY - pillH + pillRadius,
    );
    tctx.lineTo(pillX + pillW, pillY);
    tctx.lineTo(pillX, pillY);
    tctx.closePath();
    tctx.fill();

    tctx.fillStyle = "#fff";
    tctx.lineWidth = Math.max(1, Math.min(tileW, tileH) * 0.006);
    tctx.strokeStyle = "rgba(0,0,0,0.35)";
    tctx.strokeText(
      numberText,
      pillX + padding,
      pillY - Math.round(padding * 0.05),
    );
    tctx.fillText(
      numberText,
      pillX + padding,
      pillY - Math.round(padding * 0.05),
    );
    tctx.restore();

    // export PNG — tileCanvas is DPR-scaled pixels. If you want standard CSS-size PNG (non-DPR), you can scale down,
    // but higher DPI is better for print. We'll export at DPR resolution.
    const blob = await new Promise((res) =>
      tileCanvas.toBlob(res, "image/png", 0.92),
    );
    if (!blob) throw new Error("Failed to create tile blob");

    // Optional: if you prefer a smaller file for upload, you can draw tileCanvas into a second canvas at 1x (tileCssW x tileCssH)
    // and export that. For now we return DPR-scaled File for best quality.
    return new File([blob], `mosaic_tile_${index + 1}.png`, {
      type: "image/png",
    });
  };

  const revealOneRandomTile = (dataUrl) => {
    const empty = [];
    for (let i = 0; i < tiles.length; i++) if (!tiles[i]) empty.push(i);
    if (!empty.length) return;

    const pick = empty[Math.floor(Math.random() * empty.length)];

    setAnimatingImage(dataUrl);
    setTargetTileIndex(pick);

    // schedule phases, store ids for cleanup
    timeoutIdsRef.current.push(
      setTimeout(
        () => setAnimationPhase("covconter"),
        ANIMATION_CONFIG.initialDelay * 1000,
      ),
    );
    timeoutIdsRef.current.push(
      setTimeout(
        () => setAnimationPhase("hold"),
        (ANIMATION_CONFIG.initialDelay + ANIMATION_CONFIG.coverDuration) * 1000,
      ),
    );
    timeoutIdsRef.current.push(
      setTimeout(
        () => setAnimationPhase("shrink"),
        (ANIMATION_CONFIG.initialDelay +
          ANIMATION_CONFIG.coverDuration +
          ANIMATION_CONFIG.coverHoldDuration) *
          1000,
      ),
    );

    // reveal and set tile
    timeoutIdsRef.current.push(
      setTimeout(
        () => {
          setAnimationPhase("reveal");
          const next = tiles.slice();
          next[pick] = dataUrl;
          setTiles(next);
          setLastRevealedIndex(pick);

          // create masked tile file and upload (fire-and-forget)
          (async () => {
            try {
              const file = await createMaskedTileFile(dataUrl, pick);
              // call API (server expects only the file in form-data)
              await uploadImageMosaic(file);
              // optional: if your server returns a hosted URL and you want to use it:
              // const resp = await uploadImageMosaic(file);
              // if (resp && resp.url) {
              //   setTiles(prev => { const out = prev.slice(); out[pick] = resp.url; return out; });
              // }
            } catch (err) {
              console.error("Tile creation/upload failed for index", pick, err);
            }
          })();
        },
        (ANIMATION_CONFIG.initialDelay +
          ANIMATION_CONFIG.coverDuration +
          ANIMATION_CONFIG.coverHoldDuration +
          ANIMATION_CONFIG.shrinkDuration) *
          1000,
      ),
    );

    // cleanup end of run
    timeoutIdsRef.current.push(
      setTimeout(() => {
        setAnimatingImage(null);
        setTargetTileIndex(null);
        setAnimationPhase(null);

        timeoutIdsRef.current.push(
          setTimeout(() => setLastRevealedIndex(null), 1000),
        );

        // notify parent
        try {
          if (typeof onRevealComplete === "function") {
            onRevealComplete();
          }
        } catch (err) {
          console.error("onRevealComplete threw:", err);
        }
      }, totalAnimationTime * 1000),
    );
  };

  // When imageURL prop changes -> reveal one random tile (unless wall is full)
  useEffect(() => {
    if (imageURL && !isFull) {
      revealOneRandomTile(imageURL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageURL]);

  // cleanup on unmount or dimension change
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

  // Reset handler: if parent provided onReset, call it (parent may clear tiles)
  const handleReset = () => {
    if (!propTiles) {
      setTiles(Array(totalTiles).fill(null));
    } else {
      if (onReset) onReset();
    }
    setLastRevealedIndex(null);
    setAnimatingImage(null);
    setTargetTileIndex(null);
    setAnimationPhase(null);
    clearAllTimeouts();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden   ">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full  mx-auto   overflow-hidden shadow-2xl"
        style={{ height: "100vh" }}
      >
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={MosaicBG}
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Animating Image Overlay */}
        <AnimatePresence>
          {animatingImage && targetTileIndex !== null && (
            <motion.div
              className="absolute inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Full screen flash effect */}
              {animationPhase === "contain" && (
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.9, 0] }}
                  transition={{
                    duration: ANIMATION_CONFIG.coverDuration,
                    times: [0, 0.5, 1],
                    ease: "easeInOut",
                  }}
                />
              )}

              {/* Animating image - now uses left/top for accurate positioning */}
              <motion.div
                className="absolute overflow-hidden"
                style={{
                  borderRadius:
                    animationPhase === "shrink" || animationPhase === "reveal"
                      ? "0.75rem"
                      : "1rem",
                  position: "absolute",
                  left: "0%",
                  top: "0%",
                }}
                initial={{
                  width: "0%",
                  height: "0%",
                  left: "0%",
                  top: "0%",
                  scale: 0.8,
                  rotate: 0,
                }}
                animate={
                  animationPhase === "contain"
                    ? {
                        width: "100%",
                        height: "100%",
                        left: "0%",
                        top: "0%",
                        scale: 1,
                        rotate: 0,
                      }
                    : animationPhase === "hold"
                      ? {
                          width: "100%",
                          height: "100%",
                          left: "0%",
                          top: "0%",
                          scale: [1, 1.02, 1],
                          rotate: 0,
                        }
                      : animationPhase === "shrink" ||
                          animationPhase === "reveal"
                        ? {
                            width: `${tileWidthPct}%`,
                            height: `${tileHeightPct}%`,
                            ...getTileLeftTop(targetTileIndex),
                            scale: 1,
                            rotate: 720,
                          }
                        : {}
                }
                transition={
                  animationPhase === "contain"
                    ? {
                        duration: ANIMATION_CONFIG.coverDuration,
                        ease: [0.22, 1, 0.36, 1],
                      }
                    : animationPhase === "hold"
                      ? {
                          duration: ANIMATION_CONFIG.coverHoldDuration,
                          scale: {
                            duration: ANIMATION_CONFIG.coverHoldDuration,
                            repeat: 0,
                            ease: "easeInOut",
                          },
                        }
                      : animationPhase === "shrink" ||
                          animationPhase === "reveal"
                        ? {
                            duration: ANIMATION_CONFIG.shrinkDuration,
                            ease: [0.65, 0, 0.35, 1],
                            rotate: {
                              duration: ANIMATION_CONFIG.shrinkDuration,
                              ease: [0.65, 0, 0.35, 1],
                            },
                          }
                        : {}
                }
              >
                <img
                  src={animatingImage}
                  alt="Animating"
                  className="w-full h-full object-cover"
                />

                {/* Glow effect during animation */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={
                    animationPhase === "contain"
                      ? {
                          boxShadow:
                            "0 0 80px 30px rgba(168,85,247,0.9), inset 0 0 60px rgba(255,255,255,0.4)",
                        }
                      : animationPhase === "hold"
                        ? {
                            boxShadow: [
                              "0 0 80px 30px rgba(168,85,247,0.9), inset 0 0 60px rgba(255,255,255,0.4)",
                              "0 0 100px 40px rgba(168,85,247,1), inset 0 0 80px rgba(255,255,255,0.5)",
                              "0 0 80px 30px rgba(168,85,247,0.9), inset 0 0 60px rgba(255,255,255,0.4)",
                            ],
                          }
                        : animationPhase === "shrink" ||
                            animationPhase === "reveal"
                          ? {
                              boxShadow:
                                "0 0 40px 15px rgba(168,85,247,0.6), inset 0 0 20px rgba(255,255,255,0.2)",
                            }
                          : {}
                  }
                  transition={
                    animationPhase === "hold"
                      ? {
                          duration: ANIMATION_CONFIG.coverHoldDuration,
                          ease: "easeInOut",
                        }
                      : {
                          duration: 0.5,
                        }
                  }
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tiles */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          }}
        >
          {tiles.map((src, index) => {
            const isRevealed = Boolean(src);
            const isLatest = lastRevealedIndex === index;

            return (
              <motion.div
                key={index}
                className="relative overflow-hidden"
                initial={false}
                animate={{
                  backgroundColor: isRevealed
                    ? "rgba(0,0,0,0)"
                    : "rgba(0,0,0,0.99)",
                }}
              >
                {isRevealed && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      duration: ANIMATION_CONFIG.revealDuration,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <img
                      src={src}
                      alt={`Tile ${index}`}
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        opacity: 0.4,
                      }}
                    />
                    {isLatest && (
                      <>
                        {/* Expanding ring effect */}
                        <motion.div
                          className="absolute inset-0"
                          initial={{
                            opacity: 1,
                            scale: 0.8,
                          }}
                          animate={{
                            opacity: 0,
                            scale: 1.5,
                          }}
                          transition={{
                            duration: ANIMATION_CONFIG.particleDuration,
                            ease: "easeOut",
                          }}
                          style={{
                            boxShadow:
                              "inset 0 0 0 4px rgba(255,255,255,0.8), 0 0 40px rgba(168,85,247,1)",
                          }}
                        />

                        {/* Inner glow */}
                        <motion.div
                          className="absolute inset-0"
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 0 }}
                          transition={{
                            duration: ANIMATION_CONFIG.particleDuration * 1.2,
                            ease: "easeOut",
                          }}
                          style={{
                            background:
                              "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)",
                          }}
                        />

                        {/* Particle burst */}
                        {[...Array(12)].map((_, i) => {
                          const angle = (i * Math.PI * 2) / 12;
                          return (
                            <motion.div
                              key={i}
                              className="absolute w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"
                              style={{
                                left: "50%",
                                top: "50%",
                                marginLeft: "-6px",
                                marginTop: "-6px",
                              }}
                              initial={{
                                x: 0,
                                y: 0,
                                opacity: 1,
                                scale: 1,
                              }}
                              animate={{
                                x: Math.cos(angle) * 80,
                                y: Math.sin(angle) * 80,
                                opacity: 0,
                                scale: 0,
                              }}
                              transition={{
                                duration: ANIMATION_CONFIG.particleDuration,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            />
                          );
                        })}
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Grid Lines */}
        <div
          className="absolute inset-0 grid pointer-events-none"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          }}
        >
          {Array.from({ length: totalTiles }).map((_, i) => (
            <div key={`grid-${i}`} className="border border-white/5" />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
