import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, MessageSquare, ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";
import { submitToAPI } from "../api/uploadAPI";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

// ── Shared token values (mirrors :root vars) ─────────────────
const T = {
  surface0: "#FFFFFF",
  surface50: "#FBF8F5",
  surface100: "#F5EFE7",
  surface200: "#EDE4D8",
  brand50: "#FFF5EB",
  brand200: "#FFC88A",
  brand500: "#E8731A",
  brand600: "#C45A0C",
  inkPrimary: "#1C1611",
  inkSecondary: "#4A3728",
  inkTertiary: "#7D6A56",
  inkDisabled: "#B0A090",
  error: "#C0392B",
  errorSubtle: "#FDEDEB",
  fontDisplay: "'Playfair Display', Georgia, serif",
  fontBody: "'DM Sans', sans-serif",
  shadowCard: "0 2px 12px rgba(28,22,17,0.08)",
  shadowHover: "0 8px 28px rgba(232,115,26,0.18)",
  shadowGlow: "0 0 0 3px rgba(232,115,26,0.25)",
};

export default function SubmitFormScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const imagePreview = location.state?.image;
  const file = location.state?.file;

  const [fields, setFields] = useState({ fullName: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null); // "fullName"| null

  if (!imagePreview) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.surface50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 340,
            background: T.surface0,
            borderRadius: 16,
            border: `1px solid ${T.surface200}`,
            padding: 24,
            textAlign: "center",
            boxShadow: T.shadowCard,
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: T.inkTertiary,
              fontFamily: T.fontBody,
              marginBottom: 16,
            }}
          >
            No photo found. Please capture one first.
          </p>
          <button onClick={() => navigate("/")} style={btnPrimaryStyle}>
            Go to Camera
          </button>
        </div>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!fields.fullName.trim()) e.fullName = "Full name is required.";
    else if (fields.fullName.trim().length < 2)
      e.fullName = "Name must be at least 2 characters.";

    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await submitToAPI({
        name: fields.fullName.trim(),
        image: file, // ✅ THIS is the real fix
      });

      console.log("On API Call : ", result);

      if (result.success) {
        toast.success("Submitted successfully!");

        navigate("/camera");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFields((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const inputStyle = (field) => ({
    width: "100%",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    fontFamily: T.fontBody,
    background: T.surface0,
    color: T.inkPrimary,
    outline: "none",
    border: `1.5px solid ${
      errors[field] ? T.error : focused === field ? T.brand500 : T.surface200
    }`,
    boxShadow:
      focused === field
        ? errors[field]
          ? `0 0 0 3px rgba(192,57,43,0.1)`
          : T.shadowGlow
        : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box",
  });

  return (
    <>
      <style>{formCss}</style>
      <div
        style={{
          minHeight: "100vh",
          background: T.surface50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 12px",
            background: T.surface50,
            borderBottom: `1px solid ${T.surface200}`,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: T.surface100,
              border: `1px solid ${T.surface200}`,
              color: T.inkSecondary,
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={17} />
          </button>

          {/* Brand pill */}
          {/* <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,

              padding: "5px 13px",
              borderRadius: 999,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={logo}
                alt="logo"
                style={{
                  width: "auto",
                  height: 48,
                  objectFit: "contain",
                  opacity: 0.5,
                }}
              />
            </div>
          </div> */}

          <div style={{ width: 38 }} />
        </motion.header>

        {/* ── Scrollable content ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "24px 16px 40px",
          }}
        >
          {/* Centred card on desktop */}
          <div style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              {/* ── Title ── */}
              <motion.div variants={item}>
                <h1
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: "1.7rem",
                    fontWeight: 700,
                    color: T.inkPrimary,
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  Your Details
                </h1>
                <p
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 14,
                    color: T.inkTertiary,
                    marginTop: 6,
                  }}
                >
                  Add your name to go with this photo.
                </p>
              </motion.div>

              {/* ── Photo preview row ── */}
              <motion.div
                variants={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: T.surface100,
                  border: `1px solid ${T.surface200}`,
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: 10,
                    overflow: "hidden",
                    flexShrink: 0,
                    border: `1px solid ${T.surface200}`,
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Captured"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>

                {/* Label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: T.fontBody,
                      fontSize: 14,
                      fontWeight: 600,
                      color: T.inkPrimary,
                      margin: 0,
                    }}
                  >
                    Photo ready
                  </p>
                  <p
                    style={{
                      fontFamily: T.fontBody,
                      fontSize: 12,
                      color: T.inkTertiary,
                      marginTop: 3,
                    }}
                  >
                    Fill in your details below to submit.
                  </p>
                </div>

                {/* Retake */}
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    flexShrink: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: T.fontBody,
                    padding: "7px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: T.surface0,
                    border: `1px solid ${T.surface200}`,
                    color: T.inkSecondary,
                    transition: "background 0.15s",
                  }}
                >
                  Retake
                </button>
              </motion.div>

              {/* ── Form card ── */}
              <motion.div
                variants={item}
                style={{
                  background: T.surface0,
                  borderRadius: 16,
                  border: `1px solid ${T.surface200}`,
                  boxShadow: T.shadowCard,
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                {/* Full Name */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      color: T.inkSecondary,
                      fontFamily: T.fontBody,
                    }}
                  >
                    <User
                      size={14}
                      style={{ color: T.brand500, flexShrink: 0 }}
                    />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fields.fullName}
                    onChange={handleChange("fullName")}
                    placeholder="Enter your FullName."
                    maxLength={80}
                    autoComplete="name"
                    style={inputStyle("fullName")}
                    onFocus={() => setFocused("fullName")}
                    onBlur={() => setFocused(null)}
                  />
                  <AnimatePresence>
                    {errors.fullName && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                          fontSize: 12,
                          color: T.error,
                          fontFamily: T.fontBody,
                          margin: 0,
                        }}
                      >
                        {errors.fullName}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: T.surface200 }} />

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="sp-submit-btn"
                  style={{
                    ...btnPrimaryStyle,
                    opacity: loading ? 0.7 : 1,
                    pointerEvents: loading ? "none" : "auto",
                  }}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                        }}
                      />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Submit
                    </>
                  )}
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

const btnPrimaryStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "13px 20px",
  background: "#E8731A",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
  cursor: "pointer",
  boxShadow: "0 4px 18px rgba(232,115,26,0.35)",
  transition: "background 0.15s",
};

const formCss = `
  .sp-submit-btn:hover { background: #C45A0C !important; }
  .sp-submit-btn:active { background: #9E4208 !important; transform: scale(0.98); }
`;
