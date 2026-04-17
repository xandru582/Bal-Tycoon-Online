// ============================================================
// Welcome / Onboarding Modal
// Shown on first login — introduces the core gameplay loop.
// Persists completion state in localStorage.
//
// Addresses roadmap item: "In-game tutorial / onboarding flow"
// ============================================================

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "nexus-onboarding-v1-completed";

interface Step {
  icon: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: "⬡",
    title: "Bienvenido a NEXUS",
    body:
      "Estás a punto de tomar el control de un pequeño holding industrial. Tu misión: acumular créditos (Đ), influencia y construir un imperio que domine los mercados de Aetheria.",
  },
  {
    icon: "⚙️",
    title: "Producción y Mercado",
    body:
      "En Producción contratas empleados y mejoras instalaciones para generar bienes. En Mercado fijas precios y vendes. Cada sector (moda, tech, energía…) tiene su propia demanda.",
  },
  {
    icon: "📈",
    title: "Bolsa NVX",
    body:
      "La Bolsa NVX es un mercado en tiempo real contra otros jugadores. Los precios reaccionan al ciclo económico: boom, crisis, recesión. Compra bajo, vende alto.",
  },
  {
    icon: "🏴",
    title: "Rivales, Clanes y Chat",
    body:
      "Únete a un clan para coordinarte. Usa el chat global, de clan o DMs privados. Los rivales hostiles atacan cuota de mercado — responde con sabotajes o alianzas.",
  },
  {
    icon: "🏆",
    title: "Progreso y Logros",
    body:
      "El juego autoguarda cada minuto. Desbloquea logros, sube en el ranking global y, cuando estés listo, considera un reset de prestigio para bonus permanentes. ¡Suerte, magnate!",
  },
];

export default function WelcomeModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore quota errors */
    }
    onClose();
  };

  const next = () => {
    if (isLast) finish();
    else setStep(s => s + 1);
  };

  const skip = () => finish();

  return (
    <AnimatePresence>
      <motion.div
        key="welcome-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          background: "rgba(4, 8, 18, 0.82)",
          backdropFilter: "blur(14px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: '"IBM Plex Mono", "Courier New", monospace',
        }}
      >
        <motion.div
          key={`step-${step}`}
          initial={{ y: 18, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{
            width: "100%",
            maxWidth: 480,
            borderRadius: 16,
            padding: "28px 28px 20px",
            background:
              "linear-gradient(135deg, rgba(16,22,42,0.97), rgba(10,14,30,0.97))",
            border: "1px solid rgba(0,212,255,0.25)",
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
            color: "#e2e8f0",
          }}
        >
          {/* Step progress dots */}
          <div
            style={{
              display: "flex",
              gap: 6,
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 22 : 8,
                  height: 6,
                  borderRadius: 3,
                  background:
                    i === step
                      ? "#00d4ff"
                      : i < step
                      ? "rgba(0,212,255,0.5)"
                      : "rgba(255,255,255,0.12)",
                  transition: "all 0.25s",
                }}
              />
            ))}
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: 56,
              lineHeight: 1,
              marginBottom: 10,
            }}
          >
            {current.icon}
          </div>

          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: 1,
              textAlign: "center",
              marginBottom: 10,
              background:
                "linear-gradient(135deg, #00d4ff 0%, #b44fff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {current.title}
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              color: "#a9b6cc",
              textAlign: "center",
              padding: "0 6px 22px",
              minHeight: 110,
            }}
          >
            {current.body}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={skip}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                fontSize: 11,
                letterSpacing: 1,
                cursor: "pointer",
                padding: "8px 10px",
                fontFamily: "inherit",
              }}
            >
              SALTAR
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 8,
                    cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                    color: "#e2e8f0",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: 0.5,
                    fontFamily: "inherit",
                  }}
                >
                  ← Atrás
                </button>
              )}
              <button
                onClick={next}
                style={{
                  padding: "9px 22px",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: "1px solid rgba(0,212,255,0.35)",
                  background: "rgba(0,212,255,0.12)",
                  color: "#00d4ff",
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: 0.5,
                  fontFamily: "inherit",
                }}
              >
                {isLast ? "¡EMPEZAR!" : "Siguiente →"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Helpers ────────────────────────────────────────────────
export function shouldShowOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "1";
  } catch {
    return false;
  }
}

export function resetOnboarding(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
