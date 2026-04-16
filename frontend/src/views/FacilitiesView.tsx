import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { GlassCard } from '../components/ui/GlassCard';
import { FACILITY_TEMPLATES } from '../core/economy/Company';

export default function FacilitiesView() {
  const { engine, credits, addFacility } = useGameStore();
  const company = engine.playerCompany;

  if (!company) return null;

  return (
    <div style={{ paddingRight: 8, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Infraestructura Física</h2>
          <p style={{ color: "hsl(var(--c-text-2))" }}>Adquiere laboratorios, oficinas y fábricas reales para expandir tu producción.</p>
      </div>

      <h3 style={{ fontSize: 13, color: "hsl(var(--c-text-2))", letterSpacing: 1, marginBottom: 16 }}>CATÁLOGO INMOBILIARIO</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        {Object.entries(FACILITY_TEMPLATES).map(([id, template]) => {
          const canAfford = credits >= template.purchaseCost;
          return (
            <GlassCard key={id}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{template.name}</div>
              <div style={{ fontSize: 11, color: "hsl(var(--c-text-2))", height: 32 }}>{template.description}</div>
              <div style={{ fontSize: 12, color: "hsl(var(--c-text-2))", marginTop: 8 }}>Capacidad: {template.capacity} u.</div>
              <div style={{ fontSize: 12, color: "hsl(var(--c-text-2))" }}>Mantenimiento: Đ{template.monthlyCost}/m</div>
              
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--c-text-1))" }}>Đ {template.purchaseCost}</div>
                 <motion.button
                   whileHover={canAfford ? { scale: 1.05 } : {}}
                   whileTap={canAfford ? { scale: 0.95 } : {}}
                   onClick={() => addFacility(id)}
                   disabled={!canAfford}
                   style={{
                     padding: "6px 12px", borderRadius: 4, border: "none",
                     background: canAfford ? "hsl(var(--c-warning))" : "hsla(var(--c-border), 0.5)",
                     color: canAfford ? "#000" : "hsl(var(--c-text-3))",
                     fontWeight: 700, cursor: canAfford ? "pointer" : "not-allowed"
                   }}
                 >
                   COMPRAR
                 </motion.button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <h3 style={{ fontSize: 13, color: "hsl(var(--c-text-2))", letterSpacing: 1, marginBottom: 16 }}>PROPIEDADES ADQUIRIDAS ({company.facilities.length})</h3>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {company.facilities.map((f) => (
           <GlassCard key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: "hsl(var(--c-text-2))" }}>Bonus Prod: +{Math.round((f.productionBonus - 1) * 100)}%</div>
              </div>
              <div style={{ textAlign: "right" }}>
                 <div style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--c-danger))" }}>- Đ{f.monthlyCost}/m</div>
              </div>
           </GlassCard>
        ))}
        {company.facilities.length === 0 && <p style={{ color: "hsl(var(--c-text-3))" }}>Sin propiedades activas.</p>}
      </div>
    </div>
  );
}
