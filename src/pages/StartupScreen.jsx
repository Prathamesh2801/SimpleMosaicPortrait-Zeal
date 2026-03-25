import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Monitor, Aperture, ArrowRight, Sparkles } from "lucide-react";

// ─── Destination cards data ───────────────────────────────────────────────
const DESTINATIONS = [
  {
    id: "camera",
    path: "/camera",
    Icon: Camera,
    badge: "Guest",
    headline: "Take your photo",
    sub: "Strike a pose, pick a scene, and send it to the big screen.",
    accent: "#f3ecd2",
    accentDark: "#c8b88a",
    tag: "USER FLOW",
  },
  {
    id: "tv",
    path: "/tv",
    Icon: Monitor,
    badge: "Display",
    headline: "Open TV screen",
    sub: "Full-screen live display. Open this on the venue monitor.",
    accent: "#d4e8ff",
    accentDark: "#7ab3e0",
    tag: "DISPLAY",
  },
];

// ─── Particle dots ────────────────────────────────────────────────────────
function FloatingDots() {
  const dots = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: 5 + (i * 37.3) % 92,
    y: 5 + (i * 53.7) % 88,
    size: 2 + (i % 3),
    delay: (i * 0.22) % 3,
    duration: 4 + (i % 4),
  }));

  return (
    <div className="ss-dots-layer" aria-hidden>
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="ss-dot"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
          animate={{ opacity: [0.08, 0.3, 0.08], y: [0, -10, 0] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Destination Card ─────────────────────────────────────────────────────
function DestCard({ dest, index, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  const { Icon, headline, sub, accent, accentDark, tag, badge, path } = dest;

  return (
    <motion.button
      className="ss-card"
      onClick={() => onNavigate(path)}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 + index * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.975 }}
      style={{ "--accent": accent, "--accent-dark": accentDark }}
    >
      {/* Tag label */}
      <span className="ss-card-tag">{tag}</span>

      {/* Icon bubble */}
      <motion.div
        className="ss-card-icon-wrap"
        animate={{ scale: hovered ? 1.08 : 1, rotate: hovered ? 6 : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
      >
        <Icon size={28} strokeWidth={1.4} />
      </motion.div>

      {/* Text */}
      <div className="ss-card-body">
        <div className="ss-card-badge">{badge}</div>
        <h2 className="ss-card-headline">{headline}</h2>
        <p className="ss-card-sub">{sub}</p>
      </div>

      {/* Arrow */}
      <motion.div
        className="ss-card-arrow"
        animate={{ x: hovered ? 5 : 0, opacity: hovered ? 1 : 0.45 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <ArrowRight size={20} strokeWidth={1.8} />
      </motion.div>

      {/* Hover glow */}
      <motion.div
        className="ss-card-glow"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      />
    </motion.button>
  );
}

// ─── StartupScreen ────────────────────────────────────────────────────────
export default function StartupScreen() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const handleNavigate = (path) => {
    if (leaving) return;
    setLeaving(true);
    // Short pause so the exit animation plays before route change
    setTimeout(() => navigate(path), 380);
  };

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          className="ss-root"
          key="startup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35 }}
        >
          <style>{css}</style>
          <FloatingDots />

          {/* ── Orbs ── */}
          <div className="ss-orb ss-orb-1" />
          <div className="ss-orb ss-orb-2" />

          {/* ── Header ── */}
          <motion.header
            className="ss-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="ss-logo"
              whileHover={{ rotate: 15 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Aperture size={22} strokeWidth={1.5} />
            </motion.div>
            <span className="ss-logo-name">SceneSnap</span>
            <motion.div
              className="ss-live-chip"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              <span className="ss-live-dot" />
              LIVE
            </motion.div>
          </motion.header>

          {/* ── Hero ── */}
          <main className="ss-main">
            <motion.div
              className="ss-hero"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ss-hero-eyebrow">
                <Sparkles size={13} strokeWidth={1.8} />
                <span>Photo Experience</span>
              </div>
              <h1 className="ss-hero-title">
                Step into<br />the scene.
              </h1>
              <p className="ss-hero-sub">
                Capture your moment, compose it on a background,<br />
                and watch it appear on the big screen instantly.
              </p>
            </motion.div>

            {/* ── Cards ── */}
            <div className="ss-cards">
              {DESTINATIONS.map((dest, i) => (
                <DestCard key={dest.id} dest={dest} index={i} onNavigate={handleNavigate} />
              ))}
            </div>
          </main>

          {/* ── Footer ── */}
          <motion.footer
            className="ss-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <span>Powered by SceneSnap UK</span>
            <span className="ss-footer-sep">·</span>
            <span>Open /tv on the venue display</span>
          </motion.footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Root ── */
  .ss-root {
    position: fixed; inset: 0;
    min-height: 100dvh;
    background: linear-gradient(145deg, #f5edd8 0%, #f9f4ea 45%, #ece0c4 100%);
    font-family: 'DM Sans', sans-serif;
    display: flex; flex-direction: column;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Orbs ── */
  .ss-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
  }
  .ss-orb-1 {
    width: 600px; height: 600px;
    top: -200px; right: -160px;
    background: radial-gradient(circle, rgba(200,184,138,0.28) 0%, transparent 70%);
  }
  .ss-orb-2 {
    width: 400px; height: 400px;
    bottom: -120px; left: -80px;
    background: radial-gradient(circle, rgba(160,200,220,0.22) 0%, transparent 70%);
  }

  /* ── Floating dots ── */
  .ss-dots-layer {
    position: absolute; inset: 0;
    pointer-events: none; overflow: hidden;
  }
  .ss-dot {
    position: absolute;
    border-radius: 50%;
    background: #1a1a1a;
  }

  /* ── Header ── */
  .ss-header {
    position: relative; z-index: 10;
    padding: 22px 28px;
    display: flex; align-items: center; gap: 10px;
  }
  .ss-logo {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: #1a1a1a;
    color: #f3ecd2;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    cursor: default; flex-shrink: 0;
  }
  .ss-logo-name {
    font-family: 'Syne', sans-serif;
    font-size: 1rem; font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.01em;
    flex: 1;
  }
  .ss-live-chip {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px;
    background: rgba(26,26,26,0.08);
    border: 1px solid rgba(26,26,26,0.1);
    border-radius: 999px;
    font-size: 0.6rem; font-weight: 600;
    color: #555;
    letter-spacing: 0.1em;
    font-family: 'DM Sans', sans-serif;
  }
  .ss-live-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #22c55e;
    display: block;
  }

  /* ── Main ── */
  .ss-main {
    flex: 1;
    position: relative; z-index: 10;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 20px 24px;
    gap: 40px;
  }

  /* ── Hero ── */
  .ss-hero {
    text-align: center;
    display: flex; flex-direction: column;
    align-items: center; gap: 14px;
    max-width: 520px;
  }
  .ss-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 13px;
    background: rgba(26,26,26,0.07);
    border: 1px solid rgba(26,26,26,0.09);
    border-radius: 999px;
    font-size: 0.72rem; font-weight: 500;
    color: #7a6a50;
    letter-spacing: 0.04em;
  }
  .ss-hero-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(2.4rem, 6vw, 3.8rem);
    font-weight: 800;
    color: #1a1a1a;
    line-height: 1.0;
    letter-spacing: -0.03em;
  }
  .ss-hero-sub {
    font-size: clamp(0.85rem, 2vw, 0.97rem);
    color: #8a7660;
    line-height: 1.65;
    font-weight: 400;
    max-width: 400px;
  }

  /* ── Cards ── */
  .ss-cards {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    max-width: 700px;
  }

  .ss-card {
    position: relative;
    flex: 1; min-width: 260px; max-width: 320px;
    background: rgba(255,255,255,0.72);
    border: 1px solid rgba(255,255,255,0.9);
    border-radius: 22px;
    padding: 26px 24px 24px;
    display: flex; flex-direction: column; gap: 16px;
    cursor: pointer;
    overflow: hidden;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.8) inset,
      0 8px 32px rgba(0,0,0,0.06),
      0 2px 8px rgba(0,0,0,0.04);
    backdrop-filter: blur(12px);
    text-align: left;
    transition: box-shadow 0.25s, border-color 0.25s;
  }
  .ss-card:hover {
    box-shadow:
      0 1px 0 rgba(255,255,255,0.8) inset,
      0 16px 48px rgba(0,0,0,0.1),
      0 4px 16px rgba(0,0,0,0.06);
    border-color: var(--accent-dark, rgba(255,255,255,0.9));
  }

  /* Tag */
  .ss-card-tag {
    font-size: 0.6rem; font-weight: 700;
    letter-spacing: 0.12em;
    color: #aaa;
    font-family: 'DM Sans', sans-serif;
  }

  /* Icon */
  .ss-card-icon-wrap {
    width: 58px; height: 58px;
    border-radius: 16px;
    background: #1a1a1a;
    color: var(--accent, #f3ecd2);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    flex-shrink: 0;
  }

  /* Body */
  .ss-card-body {
    display: flex; flex-direction: column; gap: 6px;
    flex: 1;
  }
  .ss-card-badge {
    display: inline-block;
    font-size: 0.65rem; font-weight: 600;
    letter-spacing: 0.08em;
    color: #fff;
    background: #1a1a1a;
    padding: 2px 8px;
    border-radius: 5px;
    width: fit-content;
    margin-bottom: 2px;
  }
  .ss-card-headline {
    font-family: 'Syne', sans-serif;
    font-size: 1.18rem; font-weight: 700;
    color: #1a1a1a;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  .ss-card-sub {
    font-size: 0.82rem;
    color: #8a7660;
    line-height: 1.55;
  }

  /* Arrow */
  .ss-card-arrow {
    align-self: flex-end;
    color: #1a1a1a;
    margin-top: auto;
  }

  /* Hover glow */
  .ss-card-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 40%, var(--accent, rgba(243,236,210,0.4)) 0%, transparent 65%);
    pointer-events: none;
    z-index: -1;
    border-radius: inherit;
  }

  /* ── Footer ── */
  .ss-footer {
    position: relative; z-index: 10;
    padding: 16px 24px;
    display: flex; align-items: center; justify-content: center;
    gap: 8px;
    font-size: 0.72rem;
    color: #b0a08a;
    letter-spacing: 0.04em;
  }
  .ss-footer-sep { opacity: 0.5; }

  /* ── Mobile ── */
  @media (max-width: 580px) {
    .ss-header { padding: 16px 20px; }
    .ss-main { padding: 16px 16px; gap: 28px; }
    .ss-cards { gap: 10px; }
    .ss-card { min-width: 100%; max-width: 100%; }
    .ss-hero-sub br { display: none; }
  }
`;
