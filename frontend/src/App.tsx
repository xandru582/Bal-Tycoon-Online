import { useState, useEffect, Component, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore, formatNumber } from "./stores/gameStore";
import { useAuthStore } from "./stores/authStore";
import { useChatStore } from "./stores/chatStore";
import { useGameSync } from "./hooks/useGameSync";
import { getSocket } from "./lib/socket";
import ChatPanel from "./components/chat/ChatPanel";
import WelcomeModal, { shouldShowOnboarding } from "./components/onboarding/WelcomeModal";

// Views
import AuthView from "./views/AuthView";
import DashboardView from "./views/DashboardView";
import ProductionView from "./views/ProductionView";
import MarketView from "./views/MarketView";
import StockExchangeView from "./views/StockExchangeView";
import RivalsView from "./views/RivalsView";
import AchievementsView from "./views/AchievementsView";
import PersonalView from "./views/PersonalView";
import SocialView from "./views/SocialView";
import ClanView from "./views/ClanView";
import CityView from "./views/CityView";
import SearchView from "./views/SearchView";

const NAV_ITEMS = [
  { id: "Dashboard",     icon: "🏠", label: "Dashboard" },
  { id: "Producción",    icon: "⚙️", label: "Producción" },
  { id: "Mercado",       icon: "📦", label: "Mercado" },
  { id: "Vida Personal", icon: "🥂", label: "Vida Personal" },
  { id: "Esfera Social", icon: "👑", label: "Esfera Social" },
  { id: "Bolsa",         icon: "📈", label: "Bolsa NVX" },
  { id: "Rivales",       icon: "⚔️", label: "Rivales" },
  { id: "Clanes",        icon: "🏴", label: "Clanes" },
  { id: "Ciudad",        icon: "🏙️", label: "Ciudad 3D" },
  { id: "Buscar",        icon: "🔍", label: "Buscar" },
  { id: "Logros",        icon: "🏆", label: "Logros" },
];

// ── THEMES ────────────────────────────────────────────────────────
const THEMES = [
  {
    id: "void",
    label: "Void",
    swatch: ["#06080f", "#f59e0b", "#8b5cf6"],
    vars: {
      "--bg-void": "#06080f", "--bg-deep": "#090c18", "--bg-base": "#0c1020",
      "--bg-surface": "#101522", "--bg-elevated": "#141b2e", "--bg-float": "#1a2338",
      "--bg-grad1": "rgba(245,158,11,0.06)", "--bg-grad2": "rgba(139,92,246,0.07)",
      "--bg-grad3": "rgba(16,185,129,0.04)",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    swatch: ["#020c1e", "#3b82f6", "#8b5cf6"],
    vars: {
      "--bg-void": "#020c1e", "--bg-deep": "#040f28", "--bg-base": "#071432",
      "--bg-surface": "#0a1a3e", "--bg-elevated": "#0e2050", "--bg-float": "#132760",
      "--bg-grad1": "rgba(59,130,246,0.07)", "--bg-grad2": "rgba(139,92,246,0.08)",
      "--bg-grad3": "rgba(99,102,241,0.05)",
    },
  },
  {
    id: "forest",
    label: "Bosque",
    swatch: ["#020a06", "#10b981", "#34d399"],
    vars: {
      "--bg-void": "#020a06", "--bg-deep": "#041009", "--bg-base": "#06160c",
      "--bg-surface": "#091e11", "--bg-elevated": "#0d2716", "--bg-float": "#11311c",
      "--bg-grad1": "rgba(16,185,129,0.08)", "--bg-grad2": "rgba(52,211,153,0.06)",
      "--bg-grad3": "rgba(245,158,11,0.03)",
    },
  },
  {
    id: "nebula",
    label: "Nebulosa",
    swatch: ["#08020e", "#c084fc", "#f43f5e"],
    vars: {
      "--bg-void": "#08020e", "--bg-deep": "#0e0418", "--bg-base": "#130622",
      "--bg-surface": "#18082c", "--bg-elevated": "#1f0d38", "--bg-float": "#261244",
      "--bg-grad1": "rgba(192,132,252,0.08)", "--bg-grad2": "rgba(244,63,94,0.06)",
      "--bg-grad3": "rgba(139,92,246,0.05)",
    },
  },
  {
    id: "magma",
    label: "Magma",
    swatch: ["#100402", "#f97316", "#f59e0b"],
    vars: {
      "--bg-void": "#100402", "--bg-deep": "#180604", "--bg-base": "#200907",
      "--bg-surface": "#280d0a", "--bg-elevated": "#32110d", "--bg-float": "#3c1610",
      "--bg-grad1": "rgba(249,115,22,0.09)", "--bg-grad2": "rgba(245,158,11,0.06)",
      "--bg-grad3": "rgba(244,63,94,0.04)",
    },
  },
  {
    id: "slate",
    label: "Slate",
    swatch: ["#080c12", "#94a3b8", "#64748b"],
    vars: {
      "--bg-void": "#080c12", "--bg-deep": "#0c1118", "--bg-base": "#111820",
      "--bg-surface": "#162030", "--bg-elevated": "#1c2a3e", "--bg-float": "#22334c",
      "--bg-grad1": "rgba(148,163,184,0.04)", "--bg-grad2": "rgba(100,116,139,0.05)",
      "--bg-grad3": "rgba(59,130,246,0.03)",
    },
  },
];

function applyTheme(themeId: string) {
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute("data-theme", themeId);
  localStorage.setItem("nexus-theme", themeId);
}

const PHASE_COLORS: Record<string, string> = {
  boom: 'var(--green)',
  growth: '#50fa7b',
  stable: 'var(--text-secondary)',
  slowdown: 'var(--gold)',
  recession: 'var(--orange)',
  crisis: 'var(--red)',
};

// Inner game UI — only rendered when authenticated
function GameApp() {
  const [view, setView] = useState("Dashboard");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem("nexus-theme") ?? "void");
  const [showChat, setShowChat] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => shouldShowOnboarding());
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const { unreadCount } = useChatStore();

  // Detect mobile
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Sync game state from server via WebSocket
  useGameSync();

  // Apply saved theme on mount
  useEffect(() => {
    applyTheme(activeTheme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect socket on mount
  useEffect(() => {
    getSocket();
  }, []);

  const handleTheme = (id: string) => {
    setActiveTheme(id);
    applyTheme(id);
    setShowThemePicker(false);
  };

  const { logout, user } = useAuthStore();

  const {
    credits, influence, creditsPerSecond, tick, currentDay, engine,
    toastQueue, dismissToast, notifications, achievements,
    personalManager,
  } = useGameStore();

  // Game loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameId: number;
    const loop = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      tick(delta);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [tick]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastQueue.length > 0) {
      const t = setTimeout(() => dismissToast(), 3500);
      return () => clearTimeout(t);
    }
  }, [toastQueue, dismissToast]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const phase = engine.indicators.phase;
  const stress = personalManager.state.stress;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", overflow: "hidden" }}>

      {/* Welcome / Onboarding Modal (first-login only) */}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      {/* Toast Notifications */}
      <AnimatePresence>
        {toastQueue.length > 0 && (
          <motion.div
            key={toastQueue[0].id}
            initial={{ y: -90, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: -90, opacity: 0, x: "-50%" }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={dismissToast}
            style={{
              position: "fixed", top: 14, left: "50%", zIndex: 9999,
              padding: "12px 24px 12px 16px",
              borderRadius: 12,
              background: toastQueue[0].type === 'achievement'
                ? "linear-gradient(135deg, rgba(0,212,255,0.95), rgba(180,79,255,0.95))"
                : toastQueue[0].type === 'danger'
                ? "rgba(255,45,85,0.92)"
                : toastQueue[0].type === 'success'
                ? "rgba(57,255,20,0.15)"
                : "rgba(17,24,39,0.95)",
              border: `1px solid ${toastQueue[0].type === 'achievement' ? 'rgba(0,212,255,0.5)' : toastQueue[0].type === 'danger' ? 'rgba(255,45,85,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: "#fff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
              backdropFilter: "blur(24px)",
              cursor: "pointer",
              display: "flex", gap: 12, alignItems: "center",
              minWidth: 280, maxWidth: 420,
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>{toastQueue[0].icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 0.3 }}>
                {toastQueue[0].type === 'achievement' ? '🎉 LOGRO: ' : ''}{toastQueue[0].title}
              </div>
              <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{toastQueue[0].message}</div>
            </div>
            <div style={{ fontSize: 10, opacity: 0.4, flexShrink: 0 }}>✕</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ────────────────────────────────────────────── */}
      <div className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, var(--cyan), var(--purple))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, boxShadow: "0 0 16px var(--cyan-glow)",
              flexShrink: 0,
            }}>
              ⬡
            </div>
            <div style={{ flex: 1 }}>
              <h1 className="text-gradient" style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, lineHeight: 1 }}>
                NEXUS
              </h1>
              <p style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 2.5, marginTop: 1 }}>
                AETHERIA SYNDICATE
              </p>
            </div>

            {/* Theme toggle button */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setShowThemePicker(p => !p)}
                title="Cambiar fondo"
                style={{
                  width: 28, height: 28, borderRadius: 7, cursor: "pointer",
                  border: `1px solid ${showThemePicker ? "var(--border-cyan)" : "var(--border-subtle)"}`,
                  background: showThemePicker ? "var(--cyan-subtle)" : "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, transition: "all 0.15s",
                  color: showThemePicker ? "var(--cyan)" : "var(--text-muted)",
                }}
              >
                🎨
              </button>

              {/* Floating picker panel */}
              <AnimatePresence>
                {showThemePicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -6 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    style={{
                      position: "fixed",
                      top: 72,
                      left: 16,
                      zIndex: 9000,
                      background: "rgba(10,14,26,0.97)",
                      border: "1px solid var(--border-muted)",
                      borderRadius: 12,
                      padding: 10,
                      boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
                      backdropFilter: "blur(32px)",
                      width: 200,
                    }}
                  >
                    <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>
                      TEMA DE FONDO
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                      {THEMES.map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => handleTheme(theme.id)}
                          title={theme.label}
                          style={{
                            padding: "9px 4px", borderRadius: 9, cursor: "pointer",
                            border: `1px solid ${activeTheme === theme.id ? "var(--border-cyan)" : "var(--border-faint)"}`,
                            background: activeTheme === theme.id ? "var(--cyan-subtle)" : "rgba(255,255,255,0.03)",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                            transition: "all 0.15s",
                          }}
                        >
                          <div style={{ display: "flex", gap: 2 }}>
                            {theme.swatch.map((c, i) => (
                              <div key={i} style={{
                                width: i === 0 ? 12 : 6, height: 12, borderRadius: 3,
                                background: c,
                              }} />
                            ))}
                          </div>
                          <div style={{
                            fontSize: 8, fontWeight: 700, letterSpacing: 0.3,
                            color: activeTheme === theme.id ? "var(--cyan)" : "var(--text-muted)",
                            fontFamily: "var(--font-main)",
                          }}>
                            {theme.label.toUpperCase()}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Day + Phase indicator */}
        <div style={{
          padding: "8px 16px",
          borderBottom: "1px solid var(--border-faint)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10,
        }}>
          <span style={{ color: "var(--text-muted)", letterSpacing: 1 }}>DÍA {currentDay}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: PHASE_COLORS[phase] ?? "var(--text-muted)", boxShadow: `0 0 6px ${PHASE_COLORS[phase] ?? 'transparent'}` }} />
            <span style={{ color: PHASE_COLORS[phase] ?? "var(--text-muted)", fontWeight: 700, letterSpacing: 0.5 }}>
              {phase.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`nav-item ${view === item.id ? "active" : ""}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === "Logros" && unlockedCount > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: "1px 5px",
                  background: "var(--purple-subtle)", color: "var(--purple)",
                  borderRadius: 4, border: "1px solid var(--purple-dim)",
                  letterSpacing: 0.3,
                }}>
                  {unlockedCount}
                </span>
              )}
              {view === item.id && <div className="nav-active-bar" />}
            </button>
          ))}
        </div>

        {/* Stress indicator */}
        {stress > 40 && (
          <div style={{
            margin: "0 10px",
            padding: "8px 10px",
            borderRadius: 8,
            background: stress > 70 ? "rgba(255,45,85,0.12)" : "rgba(255,107,53,0.1)",
            border: `1px solid ${stress > 70 ? "rgba(255,45,85,0.3)" : "rgba(255,107,53,0.25)"}`,
            marginBottom: 6,
          }}>
            <div style={{ fontSize: 9, color: stress > 70 ? "var(--red)" : "var(--orange)", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
              {stress > 70 ? "⚠ ESTRÉS CRÍTICO" : "⚡ ESTRÉS ELEVADO"}
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${stress}%`, background: stress > 70 ? "var(--red)" : "var(--orange)", borderRadius: 2, transition: "width 0.5s" }} />
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3 }}>{stress.toFixed(0)}% — eficiencia reducida</div>
          </div>
        )}

        {/* Chat toggle button */}
        <div style={{ padding: "8px 10px", borderTop: "1px solid var(--border-faint)" }}>
          <button
            onClick={() => setShowChat(s => !s)}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${showChat ? "var(--border-cyan)" : "var(--border-faint)"}`,
              background: showChat ? "var(--cyan-subtle)" : "rgba(255,255,255,0.03)",
              color: showChat ? "var(--cyan)" : "var(--text-secondary)",
              fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 11,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "all 0.15s",
            }}
          >
            <span>💬 CHAT</span>
            {(unreadCount ?? 0) > 0 && (
              <span style={{
                background: "var(--red)", color: "#fff", borderRadius: 10,
                padding: "1px 6px", fontSize: 9, fontWeight: 800,
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* User info + logout */}
        <div style={{ padding: "8px 10px", borderTop: "1px solid var(--border-faint)", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
            background: "rgba(0,212,255,0.1)", border: "1px solid var(--border-cyan)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: "var(--cyan)", fontWeight: 700,
          }}>
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.username ?? "Agente"}
            </div>
            {user?.clan_tag && (
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>[{user.clan_tag}]</div>
            )}
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            style={{
              width: 26, height: 26, borderRadius: 6, cursor: "pointer",
              border: "1px solid rgba(255,45,85,0.3)", background: "rgba(255,45,85,0.07)",
              color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, flexShrink: 0,
            }}
          >⏏</button>
        </div>

      </div>

      {/* ── CHAT FLOATING PANEL ────────────────────────────────── */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={isMobile ? "chat-mobile-fullscreen" : ""}
            style={isMobile ? {} : {
              position: "fixed",
              right: 16,
              bottom: 16,
              width: 360,
              height: 500,
              zIndex: 9000,
              background: "#0b0f1e",
              border: "1px solid rgba(0,212,255,0.2)",
              borderRadius: 16,
              boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ChatPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE BOTTOM NAV ──────────────────────────────────── */}
      <nav className="mobile-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-item ${view === item.id ? "active" : ""}`}
            onClick={() => setView(item.id)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label.split(" ")[0]}</span>
          </button>
        ))}
        <button
          className={`mobile-nav-item ${showChat ? "active" : ""}`}
          onClick={() => setShowChat(s => !s)}
        >
          <span className="icon">💬</span>
          <span className="label">Chat{(unreadCount ?? 0) > 0 ? ` (${unreadCount})` : ""}</span>
        </button>
      </nav>

      {/* ── MAIN AREA ──────────────────────────────────────────── */}
      <div className={isMobile ? "mobile-main" : ""} style={{ flex: 1, display: "flex", flexDirection: "column", padding: isMobile ? "8px" : "10px 10px 10px 0", minWidth: 0, overflow: "hidden" }}>

        {/* Top Bar */}
        <div className="topbar">
          {/* View title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 18,
              background: "rgba(0,212,255,0.08)", border: "1px solid var(--border-cyan)",
            }}>
              {NAV_ITEMS.find(n => n.id === view)?.icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.3 }}>
                {NAV_ITEMS.find(n => n.id === view)?.label ?? view}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1 }}>NEXUS · DÍA {currentDay}</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div className="topbar-stat">
              <div className="topbar-label">CRÉDITOS</div>
              <div className="topbar-value glow-cyan" style={{ color: "var(--cyan)", fontSize: 16 }}>
                Đ {formatNumber(credits)}
              </div>
            </div>
            <div className="topbar-stat">
              <div className="topbar-label">Đ/SEG</div>
              <div className="topbar-value" style={{ color: "var(--green)" }}>
                +{formatNumber(creditsPerSecond)}
              </div>
            </div>
            <div className="topbar-stat">
              <div className="topbar-label">INFLUENCIA</div>
              <div className="topbar-value" style={{ color: "var(--purple)" }}>
                ◆ {formatNumber(influence)}
              </div>
            </div>
            <div className="topbar-stat">
              <div className="topbar-label">LOGROS</div>
              <div className="topbar-value" style={{ color: unlockedCount > 0 ? "var(--gold)" : "var(--text-muted)" }}>
                {unlockedCount}/{achievements.length}
              </div>
            </div>
            {unreadNotifs > 0 && (
              <div style={{
                padding: "4px 10px", borderRadius: 20,
                background: "var(--cyan-subtle)", border: "1px solid var(--border-cyan)",
                fontSize: 11, color: "var(--cyan)", fontWeight: 700,
              }}>
                📬 {unreadNotifs}
              </div>
            )}
          </div>
        </div>

        {/* Content panel */}
        <div className="glass-panel" style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              style={{ position: "absolute", inset: 0, padding: 20, overflowY: "auto" }}
            >
              {view === "Dashboard"     && <DashboardView />}
              {view === "Producción"    && <ProductionView />}
              {view === "Mercado"       && <MarketView />}
              {view === "Vida Personal" && <PersonalView />}
              {view === "Esfera Social" && <SocialView />}
              {view === "Bolsa"         && <StockExchangeView />}
              {view === "Rivales"       && <RivalsView />}
              {view === "Clanes"        && <ClanView />}
              {view === "Ciudad"        && <CityView />}
              {view === "Buscar"        && <SearchView />}
              {view === "Logros"        && <AchievementsView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Global Error Boundary ─────────────────────────────────────────
interface GEBState { hasError: boolean; error: Error | null }
class GlobalErrorBoundary extends Component<{ children: ReactNode }, GEBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): GEBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("[GlobalErrorBoundary] Error capturado:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: "100vw", height: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 20,
          background: "#06080f", color: "#e2e8f0",
          fontFamily: '"IBM Plex Mono", monospace',
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f43f5e" }}>Error inesperado</div>
          <div style={{
            fontSize: 11, color: "#64748b", textAlign: "center",
            maxWidth: 440, lineHeight: 1.6,
            padding: "12px 16px", borderRadius: 8,
            background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)",
          }}>
            {this.state.error?.message ?? "Error desconocido"}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); }}
            style={{
              padding: "10px 24px", borderRadius: 8, cursor: "pointer",
              background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)",
              color: "#00d4ff", fontWeight: 700, fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Root App: auth gate ───────────────────────────────────────────
export default function App() {
  const { isAuthenticated, fetchMe } = useAuthStore();

  // On mount, try to restore session from stored token
  useEffect(() => {
    fetchMe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GlobalErrorBoundary>
      {!isAuthenticated ? <AuthView /> : <GameApp />}
    </GlobalErrorBoundary>
  );
}
