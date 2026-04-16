import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { GlassCard } from '../components/ui/GlassCard';

export default function DiplomacyView() {
  const { engine } = useGameStore();

  return (
    <div style={{ paddingRight: 8, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Sindicatos Rivales</h2>
          <p style={{ color: "hsl(var(--c-text-2))" }}>Monitoriza a las Inteligencias Artificiales corporativas que operan en Nueva Vista.</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {engine.rivals.map((rival) => {
          const comp = engine.rivalCompanies.get(rival.id);
          const netWorth = comp ? comp.calculateNetWorth() : rival.cashReserves;

          return (
            <GlassCard key={rival.id} style={{ display: "flex", flexDirection: "row", gap: 24, alignItems: "center" }}>
              <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: `linear-gradient(135deg, hsla(var(--c-primary), 0.2), transparent)`,
                  border: `2px solid hsla(var(--c-primary), 0.5)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 900, color: "hsl(var(--c-primary))"
              }}>
                 {rival.companyName.charAt(0)}
              </div>
              
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: 18, fontWeight: 900, color: "hsl(var(--c-text-1))" }}>{rival.companyName}</div>
                 <div style={{ fontSize: 12, color: "hsl(var(--c-text-2))", letterSpacing: 1, textTransform: "uppercase" }}>{rival.name} • Sector: {rival.sector}</div>
                 
                 <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <div style={{ fontSize: 13 }}><span style={{ color: "hsl(var(--c-text-2))" }}>Agresividad:</span> <strong style={{ color: rival.aggressionLevel > 0.6 ? "hsl(var(--c-danger))" : "hsl(var(--c-warning))" }}>{Math.round(rival.aggressionLevel * 100)}%</strong></div>
                    <div style={{ fontSize: 13 }}><span style={{ color: "hsl(var(--c-text-2))" }}>Estrategia:</span> <strong>{rival.strategy.toUpperCase()}</strong></div>
                    <div style={{ fontSize: 13 }}><span style={{ color: "hsl(var(--c-text-2))" }}>Empleados:</span> <strong>{comp?.workers.length ?? 0}</strong></div>
                 </div>
              </div>

              <div style={{ textAlign: "right" }}>
                 <div style={{ fontSize: 12, color: "hsl(var(--c-text-2))" }}>Patrimonio Neto</div>
                 <div className="font-mono" style={{ fontSize: 24, fontWeight: 800, color: "hsl(var(--c-text-1))" }}>Đ {netWorth.toLocaleString()}</div>
                 {rival.lastAction && (
                    <div style={{ fontSize: 11, color: "hsl(var(--c-success))", marginTop: 8, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                       Último mov: {rival.lastAction}
                    </div>
                 )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
