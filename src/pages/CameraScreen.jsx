import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera as CameraIcon,
  CheckCircle,
  RefreshCw,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CameraScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [phase, setPhase] = useState("idle");
  const [preview, setPreview] = useState(null);
  const [imgFile, setImgFile] = useState(null);

  // ── Only treat as landscape on genuine mobile rotation (< 900px wide)
  // Desktop wide screens should NEVER trigger landscape layout
  const [isLandscape, setIsLandscape] = useState(false);
  useEffect(() => {
    const check = () => {
      const mq = window.matchMedia("(orientation: landscape)");
      const isMobileWidth = window.innerWidth < 900;
      setIsLandscape(mq.matches && isMobileWidth);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleStart = () => {
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleFileCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgFile(file);
    setPreview(url);
    setPhase("preview");
  };

  const handleRetake = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setImgFile(null);
    setPhase("idle");
  };

  const handleSubmit = async () => {
    if (!preview) return;
    setPhase("processing");
    try {
      await new Promise((res) => setTimeout(res, 600));
      navigate("/form", {
        state: {
          image: preview,
          file: imgFile,
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      setPhase("preview");
    }
  };

  return (
    <div className="cr">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileCapture}
        style={{ display: "none" }}
      />
      <style>{css}</style>

      <AnimatePresence mode="wait">
        {/* ══════ IDLE */}
        {phase === "idle" && (
          <motion.div
            key="idle"
            className="cr-idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="cr-idle-inner">
              {/* <motion.div
                className="cr-brand"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    padding: 20,
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={logo}
                    alt="logo"
                    style={{
                      width: "auto",
                      height: 58,
                      objectFit: "contain",
                      opacity: 0.5,
                    }}
                  />
                </div>
              </motion.div> */}

              <motion.div
                className="cr-idle-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.15,
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <CameraIcon size={44} strokeWidth={1.2} />
              </motion.div>

              <motion.h1
                className="cr-idle-title"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                Photo Capture
              </motion.h1>

              <motion.p
                className="cr-idle-sub"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                Stand in good light facing the camera.
                <br />
                Take a clear photo to proceed.
              </motion.p>

              <motion.button
                className="cr-btn-primary"
                onClick={handleStart}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                whileTap={{ scale: 0.97 }}
              >
                <CameraIcon size={18} /> Open Camera
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ══════ PREVIEW */}
        {phase === "preview" && preview && (
          <motion.div
            key="preview"
            className="cr-fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <img src={preview} alt="Captured" className="cr-preview-img" />

            {/* Corner guides */}
            <div className="cr-corner cr-corner-tl" />
            <div className="cr-corner cr-corner-tr" />
            <div className="cr-corner cr-corner-bl" />
            <div className="cr-corner cr-corner-br" />

            {/* Captured badge — top left */}
            <motion.div
              className="cr-badge"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CheckCircle size={13} /> Photo captured
            </motion.div>

            {/* Action bar */}
            <motion.div
              className={`cr-action-bar${isLandscape ? " cr-action-bar-landscape" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 280,
                damping: 26,
              }}
            >
              <motion.button
                className="cr-btn-ghost"
                onClick={handleRetake}
                whileTap={{ scale: 0.97 }}
              >
                <RefreshCw size={17} /> Retake
              </motion.button>
              <motion.button
                className="cr-btn-primary cr-btn-wide"
                onClick={handleSubmit}
                whileTap={{ scale: 0.97 }}
              >
                <Upload size={17} /> Use this photo
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* ══════ PROCESSING */}
        {phase === "processing" && (
          <motion.div
            key="processing"
            className="cr-idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="cr-idle-inner">
              <motion.div
                className="cr-spinner cr-spinner-lg"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              />
              <p className="cr-idle-sub" style={{ marginTop: 20 }}>
                Processing photo…
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cr {
    position: fixed; inset: 0;
    background: #0a0a0a;
    font-family: 'DM Sans', sans-serif;
    overflow: hidden;
    overscroll-behavior: none;
  
  }
  .cr-fullscreen { position: absolute; inset: 0; }
.cr-preview-img {
  position: absolute;

  /* Define the frame area explicitly */
  top: 60px;
  bottom: 140px;
  left: 40px;
  right: 40px;

  width: calc(100% - 80px);
  height: calc(100% - 200px);

  object-fit: contain;

  /* 🔥 Critical fix */
  max-width: 100%;
  max-height: 100%;

  margin: auto;
}
  /* Spinner */
  .cr-spinner {
    width: 36px; height: 36px; border-radius: 50%;
    border: 3px solid rgba(232,115,26,0.2);
    border-top-color: #E8731A;
  }
  .cr-spinner-lg {
    width: 56px; height: 56px; border-width: 4px;
    border-color: rgba(232,115,26,0.15);
    border-top-color: #E8731A;
  }

  /* Corner guides */
  .cr-corner {
    position: absolute; width: 30px; height: 30px;
    border-color: #E8731A; border-style: solid;
    z-index: 10; pointer-events: none;
  }
  .cr-corner-tl { top: 22px; left: 22px; border-width: 2.5px 0 0 2.5px; border-radius: 5px 0 0 0; }
  .cr-corner-tr { top: 22px; right: 22px; border-width: 2.5px 2.5px 0 0; border-radius: 0 5px 0 0; }
  .cr-corner-bl { bottom: 100px; left: 22px; border-width: 0 0 2.5px 2.5px; border-radius: 0 0 0 5px; }
  .cr-corner-br { bottom: 100px; right: 22px; border-width: 0 2.5px 2.5px 0; border-radius: 0 0 5px 0; }

  /* Top bar */
  .cr-topbar {
    position: absolute; top: 0; left: 0; right: 0;
    padding: 16px 20px;
    display: flex; justify-content: flex-end; align-items: center;
    background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%);
    z-index: 20; pointer-events: none;
  }
  .cr-topbar > * { pointer-events: auto; }

  /* Brand pill */
  .cr-brand {
    display: inline-flex; align-items: center; gap: 6px;
   
    color: #E8731A;
    padding: 5px 13px; border-radius: 999px;
    font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .cr-brand-dark {
    background: rgba(0,0,0,0.45);
    border-color: rgba(232,115,26,0.45);
    color: #FFA54F;
    backdrop-filter: blur(8px);
  }

  /* Captured badge */
  .cr-badge {
    position: absolute; top: 20px; left: 20px;
    display: flex; align-items: center; gap: 6px;
    background: rgba(0,0,0,0.55); color: #fff;
    padding: 7px 13px; border-radius: 999px;
    font-size: 0.75rem; backdrop-filter: blur(8px);
    border: 1px solid rgba(232,115,26,0.35);
    z-index: 20;
  }

  /* Action bar — always bottom on desktop & portrait mobile */
  .cr-action-bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 20px 24px 44px;
    background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%);
    display: flex; align-items: center; gap: 12px;
    z-index: 20;
  }
  /* Only applies on actual mobile landscape (width < 900px) */
  .cr-action-bar-landscape {
    top: 0; right: 0; bottom: 0; left: auto;
    width: 160px; padding: 24px 14px;
    background: linear-gradient(to left, rgba(0,0,0,0.75) 0%, transparent 100%);
    flex-direction: column; justify-content: center;
  }
  .cr-action-bar-landscape .cr-btn-primary,
  .cr-action-bar-landscape .cr-btn-ghost {
    width: 100%; padding: 12px 10px; font-size: 0.8rem;
  }

  /* Buttons */
  .cr-btn-primary {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 22px;
    background: #E8731A; color: #fff;
    border: none; border-radius: 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem; font-weight: 600;
    cursor: pointer; transition: background 0.15s;
    touch-action: manipulation; flex-shrink: 0;
    box-shadow: 0 4px 20px rgba(232,115,26,0.4);
  }
  .cr-btn-primary:hover  { background: #C45A0C; }
  .cr-btn-primary:active { background: #9E4208; }
  .cr-btn-wide { flex: 1; }

  .cr-btn-ghost {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 14px 18px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.22);
    border-radius: 14px; color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem; font-weight: 500;
    cursor: pointer; transition: background 0.15s;
    backdrop-filter: blur(6px);
    touch-action: manipulation; flex-shrink: 0;
  }
  .cr-btn-ghost:hover { background: rgba(255,255,255,0.18); }

  /* Idle / Processing */
  .cr-idle {
    position: absolute; inset: 0;
    background: #FBF8F5;
    display: flex; align-items: center; justify-content: center;
  }
  .cr-idle-inner {
    display: flex; flex-direction: column;
    align-items: center; gap: 18px;
    padding: 40px 28px; text-align: center;
    max-width: 380px; width: 100%;
  }
  .cr-idle-icon {
    width: 100px; height: 100px; border-radius: 50%;
    background: #1C1611;
    display: flex; align-items: center; justify-content: center;
    color: #E8731A;
    box-shadow: 0 8px 32px rgba(232,115,26,0.22), 0 2px 8px rgba(28,22,17,0.12);
  }
  .cr-idle-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem; font-weight: 700;
    color: #1C1611; line-height: 1.1;
  }
  .cr-idle-sub {
    font-size: 0.93rem; color: #7D6A56; line-height: 1.7;
  }
`;
