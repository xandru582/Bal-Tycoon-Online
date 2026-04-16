import { useState } from "react";
import { motion } from "framer-motion";
import { Building } from "./BuildingMesh";
import api from "../../lib/api";
import { formatNumber, useGameStore } from "../../stores/gameStore";
import { useAuthStore } from "../../stores/authStore";

interface Props {
  building: Building;
  onClose: () => void;
  onBidPlaced: () => void; // re-used as "onAction" callback
}

const TYPE_ICON: Record<string, string> = {
  skyscraper: "🏙️", bank: "🏦", mall: "🏪", office: "🏢", factory: "🏭", landmark: "🏛️",
};

export default function AuctionPanel({ building, onClose, onBidPlaced }: Props) {
  const { credits, setServerState } = useGameStore();
  const { user } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saleInput, setSaleInput] = useState("");
  const [showSaleInput, setShowSaleInput] = useState(false);
  const [customizeText, setCustomizeText] = useState(building.display_text ?? "");
  const [customizeUrl, setCustomizeUrl] = useState(building.display_image_url ?? "");
  const [showCustomize, setShowCustomize] = useState(false);

  const myId = user?.id;
  const isOwner = !!myId && building.owner_id === myId;
  const isFree  = !building.owner_id;
  const isForSaleByOther = !isOwner && building.for_sale && !!building.owner_id;

  const upgradeCost = isOwner && building.level < 10
    ? Math.ceil(building.base_price * 1.8 * building.level)
    : null;
  const currentCps = building.cps_base * building.level;

  const act = async (endpoint: string, body?: object) => {
    setBusy(true); setError("");
    try {
      const res = await api.post(`/buildings/${building.id}/${endpoint}`, body ?? {});
      if (res.data.success) {
        setServerState({ credits: res.data.credits, creditsPerSecond: res.data.creditsPerSecond });
        onBidPlaced();
      }
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  const handleCustomize = async () => {
    setBusy(true); setError("");
    try {
      await api.put(`/buildings/${building.id}/customize`, { display_text: customizeText, display_image_url: customizeUrl });
      onBidPlaced();
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  const handleListForSale = async () => {
    const price = parseFloat(saleInput);
    if (isNaN(price) || price <= 0) { setError("Precio inválido"); return; }
    await act("list-for-sale", { price });
  };

  const accent = building.owner_clan_color ?? "#00d4ff";

  const btn = (color: string): React.CSSProperties => ({
    flex: 1, padding: "9px 6px", borderRadius: 8, cursor: busy ? "not-allowed" : "pointer",
    background: `${color}18`, border: `1px solid ${color}44`,
    color, fontWeight: 700, fontSize: 11, fontFamily: "inherit",
    opacity: busy ? 0.6 : 1,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        position: "absolute", top: 16, right: 16, width: 310,
        background: "rgba(6,10,22,0.97)", backdropFilter: "blur(30px)",
        border: "1px solid rgba(0,212,255,0.2)", borderRadius: 16,
        padding: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.85)",
        color: "#e2e8f0", fontFamily: "inherit",
        display: "flex", flexDirection: "column", gap: 12,
        maxHeight: "calc(100vh - 80px)", overflowY: "auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: accent }}>
            {TYPE_ICON[building.building_type] ?? "🏢"} {building.name}
          </div>
          <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1, marginTop: 2 }}>
            {building.building_type.toUpperCase()} · {isOwner ? "TUYO" : isFree ? "LIBRE" : building.for_sale ? "EN VENTA" : "OCUPADO"}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
          color: "#64748b", cursor: "pointer", width: 26, height: 26,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          flexShrink: 0,
        }}>✕</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "9px 11px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 8, color: "#64748b", letterSpacing: 1.2, fontWeight: 700 }}>INGRESOS</div>
          <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2, color: "#34d399" }}>+{formatNumber(currentCps)} Đ/s</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "9px 11px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 8, color: "#64748b", letterSpacing: 1.2, fontWeight: 700 }}>PRECIO BASE</div>
          <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2 }}>Đ {formatNumber(building.base_price)}</div>
        </div>
        {(isOwner || building.owner_id) && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "9px 11px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 8, color: "#64748b", letterSpacing: 1.2, fontWeight: 700 }}>NIVEL</div>
            <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2 }}>{building.level} / 10</div>
          </div>
        )}
        {upgradeCost && (
          <div style={{ background: "rgba(167,139,250,0.05)", borderRadius: 8, padding: "9px 11px", border: "1px solid rgba(167,139,250,0.15)" }}>
            <div style={{ fontSize: 8, color: "#64748b", letterSpacing: 1.2, fontWeight: 700 }}>MEJORA</div>
            <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2, color: "#a78bfa" }}>Đ {formatNumber(upgradeCost)}</div>
          </div>
        )}
      </div>

      {/* Owner info */}
      {building.owner_id && (
        <div style={{ padding: "8px 11px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 11 }}>
          <span style={{ color: "#64748b" }}>Propietario: </span>
          <span style={{ color: accent, fontWeight: 700 }}>{building.owner_name ?? "Desconocido"}</span>
          {building.owner_clan_tag && <span style={{ color: "#64748b" }}> [{building.owner_clan_tag}]</span>}
        </div>
      )}

      {/* Display image */}
      {building.display_image_url && (
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          <img src={building.display_image_url} alt="" style={{ width: "100%", maxHeight: 90, objectFit: "cover" }} />
          {building.display_text && (
            <div style={{ padding: "5px 9px", fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>{building.display_text}</div>
          )}
        </div>
      )}

      {/* For-sale price */}
      {building.for_sale && building.sale_price && (
        <div style={{ padding: "8px 11px", borderRadius: 8, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", fontSize: 11 }}>
          <span style={{ color: "#64748b" }}>Precio de venta: </span>
          <span style={{ color: "#34d399", fontWeight: 800 }}>Đ {formatNumber(building.sale_price)}</span>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 11, color: "#f43f5e", padding: "6px 10px", background: "rgba(244,63,94,0.08)", borderRadius: 6 }}>
          {error}
        </div>
      )}

      {/* ── Actions ── */}

      {/* Buy free building */}
      {isFree && (
        <button
          disabled={busy || credits < building.base_price}
          onClick={() => act("buy")}
          style={{ ...btn("#f59e0b"), opacity: credits < building.base_price ? 0.4 : busy ? 0.6 : 1 }}
        >
          🏗️ Comprar · Đ {formatNumber(building.base_price)}
        </button>
      )}

      {/* Buy from player */}
      {isForSaleByOther && building.sale_price && (
        <button
          disabled={busy || credits < building.sale_price}
          onClick={() => act("buy-from-player")}
          style={{ ...btn("#34d399"), opacity: credits < building.sale_price ? 0.4 : busy ? 0.6 : 1 }}
        >
          🤝 Comprar de {building.owner_name} · Đ {formatNumber(building.sale_price)}
        </button>
      )}

      {/* Owner actions */}
      {isOwner && (
        <>
          {/* Upgrade */}
          {upgradeCost && building.level < 10 && (
            <button
              disabled={busy || credits < upgradeCost}
              onClick={() => act("upgrade")}
              style={{ ...btn("#a78bfa"), opacity: credits < upgradeCost ? 0.4 : busy ? 0.6 : 1 }}
            >
              ⬆️ Mejorar a Niv {building.level + 1} · Đ {formatNumber(upgradeCost)}
            </button>
          )}
          {building.level >= 10 && (
            <div style={{ textAlign: "center", padding: "8px", color: "#00d4ff", fontSize: 11, fontWeight: 700 }}>✨ Nivel máximo</div>
          )}

          {/* Customize toggle */}
          <button onClick={() => setShowCustomize(p => !p)} style={btn("#34d399")}>
            ✏️ Personalizar
          </button>
          {showCustomize && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                value={customizeText}
                onChange={e => setCustomizeText(e.target.value)}
                placeholder="Texto / banner..."
                maxLength={200}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 7, boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 11, fontFamily: "inherit", outline: "none" }}
              />
              <input
                value={customizeUrl}
                onChange={e => setCustomizeUrl(e.target.value)}
                placeholder="URL imagen (https://...)"
                style={{ width: "100%", padding: "7px 10px", borderRadius: 7, boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 11, fontFamily: "inherit", outline: "none" }}
              />
              <button disabled={busy} onClick={handleCustomize} style={{ ...btn("#34d399"), flex: "none" }}>
                💾 Guardar
              </button>
            </div>
          )}

          {/* List / delist for sale */}
          {building.for_sale ? (
            <button disabled={busy} onClick={() => act("delist")} style={btn("#f97316")}>
              🚫 Retirar de venta
            </button>
          ) : (
            <>
              <button onClick={() => setShowSaleInput(p => !p)} style={btn("#f59e0b")}>
                💰 Poner en venta
              </button>
              {showSaleInput && (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="number"
                    value={saleInput}
                    onChange={e => setSaleInput(e.target.value)}
                    placeholder={`Mín. Đ ${formatNumber(building.base_price)}`}
                    style={{ flex: 1, padding: "7px 10px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 11, fontFamily: "inherit", outline: "none" }}
                  />
                  <button disabled={busy} onClick={handleListForSale} style={{ ...btn("#f59e0b"), flex: "none", padding: "7px 12px" }}>OK</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      <div style={{ fontSize: 9, color: "#334155", textAlign: "center" }}>
        Tus créditos: Đ {formatNumber(credits)}
      </div>
    </motion.div>
  );
}
