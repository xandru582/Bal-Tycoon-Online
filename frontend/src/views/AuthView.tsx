import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../stores/authStore";

const CHARACTERS = [
  { id: "shadow", name: "Shadow Broker", icon: "🕵️", desc: "Información como divisa" },
  { id: "titan",  name: "Iron Titan",    icon: "🏛️", desc: "Poder industrial bruto" },
  { id: "ghost",  name: "Ghost Code",    icon: "👻", desc: "Invisibilidad digital" },
  { id: "nova",   name: "Nova Surge",    icon: "⚡", desc: "Velocidad sobre todo" },
];

export default function AuthView() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [charId, setCharId] = useState("shadow");

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (mode === "login") {
      await login(email, password);
    } else {
      await register(username, email, password, charId);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    color: "var(--text-primary)", fontSize: 14, fontFamily: "var(--font-main)",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const btnStyle: React.CSSProperties = {
    width: "100%", padding: "13px", borderRadius: 10,
    background: "linear-gradient(135deg, var(--cyan), var(--purple))",
    border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
    cursor: isLoading ? "not-allowed" : "pointer",
    opacity: isLoading ? 0.7 : 1,
    fontFamily: "var(--font-main)", letterSpacing: 1,
    transition: "opacity 0.15s",
  };

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg-void)",
      backgroundImage: `
        radial-gradient(ellipse at 20% 20%, var(--bg-grad1) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 80%, var(--bg-grad2) 0%, transparent 55%)
      `,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          width: "100%", maxWidth: 440,
          background: "rgba(10,14,26,0.95)",
          border: "1px solid rgba(0,212,255,0.15)",
          borderRadius: 20,
          padding: 36,
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03) inset",
          backdropFilter: "blur(40px)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, var(--cyan), var(--purple))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, margin: "0 auto 12px",
            boxShadow: "0 0 30px rgba(0,212,255,0.3)",
          }}>⬡</div>
          <h1 className="text-gradient" style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, margin: 0 }}>
            NEXUS
          </h1>
          <p style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 3, marginTop: 4 }}>
            AETHERIA SYNDICATE
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.04)",
          borderRadius: 10, padding: 4, marginBottom: 24,
        }}>
          {(["login", "register"] as const).map(tab => (
            <button key={tab}
              onClick={() => { setMode(tab); clearError(); }}
              style={{
                flex: 1, padding: "9px", borderRadius: 7, cursor: "pointer",
                border: "none", fontFamily: "var(--font-main)", fontWeight: 700,
                fontSize: 12, letterSpacing: 1, transition: "all 0.15s",
                background: mode === tab ? "rgba(0,212,255,0.15)" : "transparent",
                color: mode === tab ? "var(--cyan)" : "var(--text-muted)",
              }}
            >
              {tab === "login" ? "ACCEDER" : "REGISTRARSE"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, display: "block", marginBottom: 6 }}>
                    NOMBRE DE AGENTE
                  </label>
                  <input
                    type="text" value={username} onChange={e => setUsername(e.target.value)}
                    style={inputStyle} placeholder="Solo letras, números y _" required
                    minLength={3} maxLength={32}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, display: "block", marginBottom: 8 }}>
                    IDENTIDAD OPERATIVA
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {CHARACTERS.map(c => (
                      <button key={c.id} type="button"
                        onClick={() => setCharId(c.id)}
                        style={{
                          padding: "10px 8px", borderRadius: 10, cursor: "pointer",
                          border: `1px solid ${charId === c.id ? "var(--border-cyan)" : "rgba(255,255,255,0.06)"}`,
                          background: charId === c.id ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)",
                          color: charId === c.id ? "var(--cyan)" : "var(--text-secondary)",
                          fontFamily: "var(--font-main)", transition: "all 0.15s",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>{c.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, display: "block", marginBottom: 6 }}>
              EMAIL
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={inputStyle} placeholder="agente@nexus.io" required
            />
          </div>

          <div>
            <label style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, display: "block", marginBottom: 6 }}>
              CONTRASEÑA
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={inputStyle} placeholder={mode === "register" ? "Mínimo 8 caracteres" : "••••••••"}
              required minLength={mode === "register" ? 8 : 1}
            />
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  padding: "10px 14px", borderRadius: 8,
                  background: "rgba(255,45,85,0.12)", border: "1px solid rgba(255,45,85,0.3)",
                  color: "var(--red)", fontSize: 12, fontWeight: 600,
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" style={btnStyle} disabled={isLoading}>
            {isLoading ? "PROCESANDO..." : mode === "login" ? "ACCEDER AL NEXUS" : "CREAR AGENTE"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 20 }}>
          {mode === "login" ? "¿Sin cuenta?" : "¿Ya eres agente?"}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); clearError(); }}
            style={{ background: "none", border: "none", color: "var(--cyan)", cursor: "pointer", fontFamily: "var(--font-main)", fontSize: 11, fontWeight: 700, marginLeft: 6 }}
          >
            {mode === "login" ? "Registrarse" : "Acceder"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
