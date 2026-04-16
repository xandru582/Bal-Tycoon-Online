import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { GlassCard } from '../components/ui/GlassCard';
import { WorkerType, WORKER_HIRING_COST, WORKER_SALARY } from '../core/economy/Company';

export default function WorkersView() {
  const { engine, credits, hireWorker } = useGameStore();
  const company = engine.playerCompany;

  if (!company) return null;

  return (
    <div style={{ paddingRight: 8, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Recursos Humanos</h2>
          <p style={{ color: "hsl(var(--c-text-2))" }}>Contrata especialistas para automatizar y mejorar la micro-gestión del sindicato.</p>
      </div>

      {/* HIRING PANEL */}
      <h3 style={{ fontSize: 13, color: "hsl(var(--c-text-2))", letterSpacing: 1, marginBottom: 16 }}>MERCADO LABORAL</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 32 }}>
        {Object.values(WorkerType).map((type) => {
          const cost = WORKER_HIRING_COST[type];
          const salary = WORKER_SALARY[type];
          const canAfford = credits >= cost;

          return (
            <GlassCard key={type}>
              <div style={{ fontSize: 16, fontWeight: 700, textTransform: "capitalize", marginBottom: 8 }}>{type}</div>
              <div style={{ fontSize: 12, color: "hsl(var(--c-text-2))" }}>Salario Mensual: Đ{salary}</div>
              <div style={{ fontSize: 12, color: "hsl(var(--c-text-2))", marginBottom: 16 }}>Coste de Fichaje: Đ{cost}</div>
              <motion.button
                whileHover={canAfford ? { scale: 1.05 } : {}}
                whileTap={canAfford ? { scale: 0.95 } : {}}
                onClick={() => hireWorker(type)}
                disabled={!canAfford}
                style={{
                  width: "100%", padding: "8px", borderRadius: 4, border: "none",
                  background: canAfford ? "hsla(var(--c-primary), 0.2)" : "hsla(var(--c-border), 0.5)",
                  color: canAfford ? "hsl(var(--c-primary))" : "hsl(var(--c-text-3))",
                  fontWeight: 700, cursor: canAfford ? "pointer" : "not-allowed"
                }}
              >
                CONTRATAR
              </motion.button>
            </GlassCard>
          );
        })}
      </div>

      {/* ACTIVE WORKERS */}
      <h3 style={{ fontSize: 13, color: "hsl(var(--c-text-2))", letterSpacing: 1, marginBottom: 16 }}>NÓMINA ACTIVA ({company.workers.length})</h3>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {company.workers.map((worker) => (
           <GlassCard key={worker.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{worker.name} <span style={{ fontSize: 11, color: "hsl(var(--c-text-3))", marginLeft: 8 }}>[{worker.role}]</span></div>
                <div style={{ fontSize: 12, color: "hsl(var(--c-text-2))", marginTop: 4 }}>Skill Nivel {worker.skillLevel} | Moral {Math.round(worker.morale)}%</div>
              </div>
              <div style={{ textAlign: "right" }}>
                 <div style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--c-danger))" }}>- Đ{worker.salary}/m</div>
              </div>
           </GlassCard>
        ))}
        {company.workers.length === 0 && <p style={{ color: "hsl(var(--c-text-3))" }}>No tienes empleados en activo.</p>}
      </div>
    </div>
  );
}
