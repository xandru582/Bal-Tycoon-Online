import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, formatNumber } from '../stores/gameStore';
import { ActionButton, MiniChart } from '../components/ui/GlassCard';
import {
  WorkerType, WORKER_HIRING_COST, WORKER_SALARY, FACILITY_TEMPLATES,
} from '../core/economy/Company';
import { PRODUCTS } from '../data/products';
import type { Worker, Facility } from '../types/index';

// ─── Tokens ─────────────────────────────────────────────────────
const T = {
  bg:       'rgba(6,9,18,0.99)',
  surface:  'rgba(12,16,28,0.97)',
  card:     'rgba(16,21,36,0.95)',
  border:   'rgba(255,255,255,0.07)',
  borderHi: 'rgba(255,255,255,0.13)',
  t1: '#eef2f8', t2: '#8a9ab5', t3: '#475569',
  green: '#10b981', amber: '#f59e0b', red: '#f43f5e',
  violet: '#8b5cf6', orange: '#f97316', blue: '#3b82f6',
  mono: "'JetBrains Mono', monospace",
};

// ─── Tier config ─────────────────────────────────────────────────
const TIERS = [
  { min:1,  label:'STARTUP',     color:'#f97316', glow:'rgba(249,115,22,0.15)',  icon:'🚀' },
  { min:3,  label:'PYME',        color:'#3b82f6', glow:'rgba(59,130,246,0.15)', icon:'🏪' },
  { min:5,  label:'EMPRESA',     color:'#10b981', glow:'rgba(16,185,129,0.15)', icon:'🏢' },
  { min:7,  label:'CORPORACIÓN', color:'#8b5cf6', glow:'rgba(139,92,246,0.15)', icon:'🏛️' },
  { min:9,  label:'MEGACORP',    color:'#f59e0b', glow:'rgba(245,158,11,0.15)', icon:'🌐' },
];
function getTier(lvl: number) {
  let t = TIERS[0];
  for (const tier of TIERS) { if (lvl >= tier.min) t = tier; }
  return t;
}

// ─── Worker avatar palette ────────────────────────────────────────
const AVATAR_COLORS = ['#f59e0b','#10b981','#8b5cf6','#f43f5e','#3b82f6','#f97316','#ec4899','#14b8a6'];
function avatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h<<5)-h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Icons ──────────────────────────────────────────────────────
const W_ICON:  Record<string,string> = { junior:'👷', senior:'⚙️', manager:'👔', specialist:'🔬' };
const W_LABEL: Record<string,string> = { junior:'Junior', senior:'Senior', manager:'Manager', specialist:'Especialista' };
const W_TAGLINE: Record<string,string> = {
  junior:     'Mano de obra base. Bajo coste, buena rotación.',
  senior:     'El motor del equipo. Alta habilidad inicial.',
  manager:    'Multiplica la moral y la coordinación del equipo.',
  specialist: 'Élite técnico. Reduce tiempos de producción.',
};
const F_ICON: Record<string,string> = { factory:'🏭', office:'💻', warehouse:'📦', lab:'🔬' };
const F_COLOR: Record<string,string> = { factory:T.orange, office:T.blue, warehouse:T.amber, lab:T.violet };

// ─── R&D catalog ────────────────────────────────────────────────
const RD = [
  { id:'rd1', icon:'🤖', name:'Automatización',     cost:5_000,    lvl:1, tag:'+10% vel. producción',   desc:'Software de control y cintas de montaje.' },
  { id:'rd2', icon:'🚚', name:'Logística Avanzada',  cost:18_000,   lvl:2, tag:'+15% efic. instalaciones',desc:'Optimización de rutas y almacén.' },
  { id:'rd3', icon:'🎯', name:'Gestión de Talento',  cost:45_000,   lvl:3, tag:'+20% moral equipo',      desc:'Upskilling, bienestar y cultura de empresa.' },
  { id:'rd4', icon:'🧠', name:'IA Predictiva',       cost:120_000,  lvl:4, tag:'+25% valor contratos',   desc:'Análisis de demanda y pricing dinámico.' },
  { id:'rd5', icon:'⚡', name:'Robótica Industrial', cost:350_000,  lvl:6, tag:'+40% velocidad total',   desc:'Fabricación autónoma de alta precisión.' },
  { id:'rd6', icon:'👑', name:'Dominio Sectorial',   cost:1_200_000,lvl:8, tag:'+50% reputación',        desc:'Reconocimiento como referente absoluto.' },
];

// ─── Tiny helpers ────────────────────────────────────────────────
const fx  = (v: number) => formatNumber(v);
const pct = (v: number, max=100) => `${Math.round(Math.min(100,(v/max)*100))}%`;
const sc  = (v: number, good: number, warn: number) =>
  v >= good ? T.green : v >= warn ? T.amber : T.red;

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 10px' }}>
      <div style={{ height:1, flex:1, background:T.border }}/>
      <span style={{ fontSize:9, letterSpacing:2, color:T.t3, textTransform:'uppercase' }}>{label}</span>
      <div style={{ height:1, flex:1, background:T.border }}/>
    </div>
  );
}

function Bar({ v, max=100, c, h=4 }: { v:number; max?:number; c:string; h?:number }) {
  return (
    <div style={{ height:h, background:'rgba(255,255,255,0.07)', borderRadius:h, overflow:'hidden' }}>
      <div style={{ width:pct(v,max), height:'100%', background:c, borderRadius:h, transition:'width 0.7s ease' }}/>
    </div>
  );
}

function Kpi({ icon, label, value, color, sub }: { icon:string; label:string; value:string|number; color?:string; sub?:string }) {
  return (
    <div style={{ textAlign:'center', padding:'14px 8px' }}>
      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:16, fontWeight:900, color:color??T.t1, fontFamily:T.mono, letterSpacing:'-0.5px' }}>{value}</div>
      <div style={{ fontSize:10, color:T.t3, marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:9, color:color??T.t3, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function Signal({ label, value, color, sub, progress, progressMax }: {
  label:string; value:string; color:string; sub?:string; progress?:number; progressMax?:number;
}) {
  return (
    <div style={{ padding:'12px 14px', background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid ${color}`, borderRadius:'0 10px 10px 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: progress!==undefined?6:0 }}>
        <span style={{ fontSize:11, color:T.t2 }}>{label}</span>
        <span style={{ fontSize:16, fontWeight:900, color, fontFamily:T.mono }}>{value}</span>
      </div>
      {progress !== undefined && <Bar v={progress} max={progressMax} c={color} h={3}/>}
      {sub && <div style={{ fontSize:9, color:T.t3, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

// ─── Worker Card ─────────────────────────────────────────────────
function WorkerCard({ w, onFire }: { w: Worker; onFire: ()=>void }) {
  const [hover, setHover] = useState(false);
  const initials = w.name.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();
  const ac       = avatarColor(w.name);
  const lvl      = (w as any).workerLevel ?? 1;
  const mc       = sc(w.morale, 70, 40);
  const mood     = w.morale > 70 ? '😊' : w.morale > 40 ? '😐' : '😟';
  const daysHere = (w as any).hiredOn !== undefined ? `Día ${w.hiredOn}+` : '';

  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        background: hover ? 'rgba(255,255,255,0.05)' : T.card,
        border:`1px solid ${hover ? T.borderHi : T.border}`,
        borderRadius:12, padding:'12px 14px',
        display:'flex', alignItems:'center', gap:12,
        transition:'all 0.15s', cursor:'default',
      }}
    >
      {/* Avatar */}
      <div style={{
        width:42, height:42, borderRadius:10, flexShrink:0,
        background:`${ac}22`, border:`2px solid ${ac}55`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:14, fontWeight:900, color:ac, fontFamily:T.mono,
      }}>{initials}</div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
          <span style={{ fontSize:13, fontWeight:800, color:T.t1, letterSpacing:'-0.2px' }}>{w.name}</span>
          <span style={{ fontSize:9, fontWeight:700, color:T.violet, background:'rgba(139,92,246,0.15)', padding:'1px 5px', borderRadius:3 }}>
            Nv.{lvl}
          </span>
          <span style={{ marginLeft:'auto', fontSize:14 }}>{mood}</span>
        </div>
        <div style={{ fontSize:10, color:T.t3, marginBottom:6 }}>
          {W_ICON[w.role.toLowerCase()]??'👤'} {w.role}
          {daysHere && <span style={{ marginLeft:8 }}>📅 {daysHere}</span>}
        </div>
        {/* Skill + morale bars */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px' }}>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:9, color:T.t3 }}>Habilidad</span>
              <span style={{ fontSize:9, color:T.violet, fontFamily:T.mono }}>{w.skillLevel.toFixed(1)}</span>
            </div>
            <Bar v={w.skillLevel} max={10} c={T.violet} h={3}/>
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:9, color:T.t3 }}>Moral</span>
              <span style={{ fontSize:9, color:mc, fontFamily:T.mono }}>{Math.round(w.morale)}%</span>
            </div>
            <Bar v={w.morale} c={mc} h={3}/>
          </div>
        </div>
      </div>

      {/* Salary + fire */}
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontSize:12, fontWeight:800, color:T.red, fontFamily:T.mono, marginBottom:6 }}>
          €{fx(w.salary)}<span style={{ fontSize:9, fontWeight:400 }}>/mes</span>
        </div>
        <button onClick={onFire} style={{
          fontSize:9, padding:'4px 8px', borderRadius:6,
          background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.25)',
          color:'rgba(244,63,94,0.7)', cursor:'pointer', letterSpacing:0.5,
        }}>DESPEDIR</button>
      </div>
    </motion.div>
  );
}

// ─── Facility Card ───────────────────────────────────────────────
function FacilityCard({ f, credits, onUpgrade }: { f: Facility; credits: number; onUpgrade: ()=>void }) {
  const upgCost   = Math.floor(f.monthlyCost * 10 * (1+f.upgrades.length*0.5));
  const canUpg    = credits >= upgCost;
  const bonusPct  = Math.round((f.productionBonus-1)*100);
  const fc        = F_COLOR[f.type] ?? T.amber;
  const icon      = F_ICON[f.type] ?? '🏢';
  const utilPct   = Math.min(100, (f.currentUtilization/Math.max(1,f.capacity))*100);

  return (
    <motion.div
      initial={{ opacity:0, scale:0.97 }}
      animate={{ opacity:1, scale:1 }}
      style={{
        background:T.card, border:`1px solid ${T.border}`,
        borderRadius:14, overflow:'hidden',
      }}
    >
      {/* Color header strip */}
      <div style={{
        background:`linear-gradient(135deg, ${fc}18, ${fc}06)`,
        borderBottom:`1px solid ${fc}22`,
        padding:'14px 16px',
        display:'flex', alignItems:'center', gap:10,
      }}>
        <span style={{ fontSize:28 }}>{icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:800, color:T.t1 }}>{f.name}</div>
          <div style={{ display:'flex', gap:6, marginTop:3 }}>
            {f.upgrades.length > 0 && (
              <span style={{ fontSize:9, fontWeight:700, color:T.violet, background:'rgba(139,92,246,0.15)', padding:'1px 5px', borderRadius:3 }}>
                +{f.upgrades.length} mejoras
              </span>
            )}
            <span style={{ fontSize:9, color:fc, background:`${fc}15`, padding:'1px 5px', borderRadius:3 }}>
              +{bonusPct}% vel
            </span>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:12, fontWeight:800, color:T.red, fontFamily:T.mono }}>€{fx(f.monthlyCost)}</div>
          <div style={{ fontSize:9, color:T.t3 }}>/mes</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'12px 16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <div style={{ fontSize:9, color:T.t3, marginBottom:3 }}>Capacidad total</div>
            <div style={{ fontSize:15, fontWeight:900, color:T.t1, fontFamily:T.mono }}>{f.capacity}<span style={{ fontSize:10, fontWeight:400 }}> u.</span></div>
          </div>
          <div>
            <div style={{ fontSize:9, color:T.t3, marginBottom:3 }}>Utilización</div>
            <div style={{ fontSize:15, fontWeight:900, color:fc, fontFamily:T.mono }}>{Math.round(utilPct)}<span style={{ fontSize:10, fontWeight:400 }}>%</span></div>
          </div>
        </div>
        <Bar v={utilPct} c={fc} h={5}/>
        <div style={{ marginTop:12 }}>
          <ActionButton
            onClick={onUpgrade}
            disabled={!canUpg}
            variant={canUpg ? 'purple' : 'ghost'}
            style={{ width:'100%', fontSize:11 }}
          >
            {canUpg ? `🔧 Mejorar — €${fx(upgCost)}` : `€${fx(upgCost - credits)} más para mejorar`}
          </ActionButton>
          <div style={{ fontSize:9, color:T.t3, textAlign:'center', marginTop:4 }}>
            Siguiente mejora: cap ×1.25 · +10% velocidad
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
type Tab = 'overview' | 'team' | 'assets' | 'strategy';

export default function CompanyView() {
  const {
    engine, credits, _rev,
    hireWorker, fireWorker, addFacility, upgradeFacility, queueProduction,
  } = useGameStore();
  const company = engine.playerCompany;
  const [tab, setTab]       = useState<Tab>('overview');
  const [rdBought, setRdBought] = useState<Record<string,boolean>>({});
  const [hiring, setHiring]   = useState(false);
  const [building, setBuilding] = useState(false);

  if (!company) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:T.t3 }}>
      Sin empresa inicializada.
    </div>
  );

  // ── Derived ────────────────────────────────────────────────────
  const tier       = getTier(company.level);
  const xpMax      = company.level * 1000;
  const xpPct      = Math.min(100, (company.xp / xpMax) * 100);
  const salaries   = company.workers.reduce((s,w)=>s+w.salary, 0);
  const facCosts   = company.facilities.reduce((s,f)=>s+f.monthlyCost, 0);
  const burn       = salaries + facCosts;
  const runway     = burn > 0 ? Math.floor(credits / (burn/30)) : 9999;
  const morale     = company.workers.length > 0
    ? Math.round(company.workers.reduce((s,w)=>s+w.morale,0)/company.workers.length) : 0;
  const eff        = Math.round(company.getWorkerEfficiency());
  const netWorth   = company.calculateNetWorth();
  const summary    = company.getFinancialSummary();
  const profHist   = company.financialHistory.slice(-30).map(r=>r.profit);
  const topSector  = Object.entries(company.reputation).sort((a,b)=>b[1]-a[1])[0];
  const capTotal   = company.facilities.reduce((s,f)=>s+f.capacity, 0);
  const capUsed    = company.productionQueue.reduce((s,t)=>s+t.quantity, 0);

  // ── R&D ────────────────────────────────────────────────────────
  const buyRd = (rd: typeof RD[0]) => {
    if (rdBought[rd.id] || company.level < rd.lvl || credits < rd.cost) return;
    useGameStore.setState(s => {
      const nc = s.credits - rd.cost;
      if (s.engine.playerCompany) s.engine.playerCompany.cash = nc;
      return { credits: nc, _rev: s._rev + 1 };
    });
    setRdBought(p => ({...p, [rd.id]: true}));
  };

  // ── Tab config ─────────────────────────────────────────────────
  const TABS: Array<{ id:Tab; label:string; icon:string; badge?:number }> = [
    { id:'overview',  label:'Overview',   icon:'📊' },
    { id:'team',      label:'Equipo',     icon:'👥', badge:company.workers.length },
    { id:'assets',    label:'Activos',    icon:'🏭', badge:company.facilities.length },
    { id:'strategy',  label:'Estrategia', icon:'🔬', badge:Object.values(rdBought).filter(Boolean).length||undefined },
  ];

  // ── Layout ─────────────────────────────────────────────────────
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:T.bg, overflow:'hidden' }}>

      {/* ══ COMPANY IDENTITY HEADER ═══════════════════════════════ */}
      <div style={{
        flexShrink:0,
        background:`linear-gradient(135deg, rgba(8,11,22,0.99) 0%, rgba(${tier.color==='#f97316'?'40,20,8':'tier.color==="#3b82f6"?30:20'},15,40,0.99) 100%)`,
        borderBottom:`1px solid ${tier.color}20`,
        padding:'16px 20px',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {/* Logo */}
          <div style={{
            width:56, height:56, borderRadius:16, flexShrink:0,
            background:`${tier.color}15`, border:`2px solid ${tier.color}50`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:26, boxShadow:`0 0 24px ${tier.glow}`,
          }}>{tier.icon}</div>

          {/* Name + tier + XP */}
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:20, fontWeight:900, color:T.t1, letterSpacing:'-0.4px' }}>
                {company.name}
              </span>
              <span style={{
                fontSize:10, fontWeight:800, letterSpacing:1.5, padding:'3px 8px', borderRadius:5,
                color:tier.color, background:`${tier.color}18`, border:`1px solid ${tier.color}40`,
              }}>{tier.label}</span>
              <span style={{
                fontSize:10, fontWeight:700, letterSpacing:1, padding:'3px 7px', borderRadius:5,
                color:T.violet, background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.3)',
              }}>Nv.{company.level}</span>
            </div>
            {/* XP progress */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
                <div style={{
                  width:`${xpPct}%`, height:'100%', borderRadius:3,
                  background:`linear-gradient(90deg, ${tier.color}80, ${tier.color})`,
                  transition:'width 1s ease', boxShadow:`0 0 8px ${tier.glow}`,
                }}/>
              </div>
              <span style={{ fontSize:10, color:tier.color, fontFamily:T.mono, flexShrink:0 }}>
                {Math.floor(company.xp).toLocaleString()} / {xpMax.toLocaleString()} XP
              </span>
            </div>
          </div>

          {/* Net worth — the number you work toward */}
          <div style={{
            textAlign:'right', flexShrink:0, padding:'8px 16px',
            background:`${tier.color}08`, border:`1px solid ${tier.color}20`, borderRadius:12,
          }}>
            <div style={{ fontSize:9, color:T.t3, letterSpacing:1.5, textTransform:'uppercase', marginBottom:2 }}>
              Patrimonio
            </div>
            <div style={{ fontSize:26, fontWeight:900, color:tier.color, fontFamily:T.mono, lineHeight:1 }}>
              €{fx(netWorth)}
            </div>
            <div style={{ fontSize:10, color:T.t3, marginTop:2 }}>
              {summary.profit30d >= 0
                ? <span style={{ color:T.green }}>+€{fx(summary.profit30d)}</span>
                : <span style={{ color:T.red }}>-€{fx(Math.abs(summary.profit30d))}</span>
              }
              <span style={{ marginLeft:4 }}>/ 30d</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ TABS ════════════════════════════════════════════════ */}
      <div style={{
        flexShrink:0, display:'flex', gap:0,
        background:'rgba(8,11,22,0.98)', borderBottom:`1px solid ${T.border}`,
        padding:'0 12px',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            display:'flex', alignItems:'center', gap:6, padding:'10px 16px',
            background:'transparent', border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
            color: tab===t.id ? tier.color : T.t2,
            borderBottom: tab===t.id ? `2px solid ${tier.color}` : '2px solid transparent',
            transition:'all 0.12s', position:'relative',
          }}>
            <span style={{ fontSize:14 }}>{t.icon}</span>
            <span>{t.label}</span>
            {t.badge !== undefined && t.badge > 0 && (
              <span style={{
                fontSize:9, fontWeight:800, minWidth:16, height:16, borderRadius:8,
                background: tab===t.id ? tier.color : T.t3,
                color: tab===t.id ? '#000' : '#fff',
                display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px',
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══ CONTENT ═════════════════════════════════════════════ */}
      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity:0, y:6 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-6 }}
            transition={{ duration:0.15 }}
          >

            {/* ╔═══════════════════════════════════════════╗
                ║  OVERVIEW — CEO briefing                  ║
                ╚═══════════════════════════════════════════╝ */}
            {tab === 'overview' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                {/* 5 KPIs */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
                  {[
                    { icon:'👥', label:'Equipo',       value:company.workers.length,              color:T.t1 },
                    { icon:'🏭', label:'Instalaciones', value:company.facilities.length,            color:T.t1 },
                    { icon:'😊', label:'Moral',         value:`${morale}%`,                        color:sc(morale,70,40) },
                    { icon:'⚡', label:'Eficiencia',    value:`${eff}%`,                           color:sc(eff,60,30) },
                    { icon:'📋', label:'En producción', value:company.productionQueue.length,        color:T.violet },
                  ].map(k=>(
                    <div key={k.label} style={{
                      background:T.card, border:`1px solid ${T.border}`, borderRadius:12,
                    }}>
                      <Kpi {...k} />
                    </div>
                  ))}
                </div>

                {/* Health signals */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <Signal
                      label="💵 Runway"
                      value={runway > 999 ? '∞' : `${runway}d`}
                      color={sc(runway,60,20)}
                      progress={Math.min(runway,120)} progressMax={120}
                      sub={runway < 20 ? '🚨 Peligro — aumenta ingresos urgente' : runway < 60 ? '⚠️ Vigilar tesorería' : '✅ Posición financiera sólida'}
                    />
                    <Signal
                      label="📈 Beneficio 30d"
                      value={`${summary.profit30d>=0?'+':'-'}€${fx(Math.abs(summary.profit30d))}`}
                      color={summary.profit30d>=0 ? T.green : T.red}
                      progress={Math.max(0,summary.profitMargin)} progressMax={50}
                      sub={`Margen: ${summary.profitMargin.toFixed(1)}% · €${fx(summary.averageDailyRevenue)}/día`}
                    />
                    <Signal
                      label="😊 Moral del equipo"
                      value={`${morale}%`}
                      color={sc(morale,70,40)}
                      progress={morale}
                      sub={morale<40 ? '🚨 Equipo desmotivado — productividad baja' : morale<70 ? '⚠️ Mejorable' : '✅ Equipo motivado'}
                    />
                    <Signal
                      label="🏭 Capacidad usada"
                      value={capTotal>0 ? `${Math.round((capUsed/capTotal)*100)}%` : '—'}
                      color={T.violet}
                      progress={capUsed} progressMax={Math.max(1,capTotal)}
                      sub={capTotal===0 ? 'Construye instalaciones para producir' : `${capUsed} / ${capTotal} unidades en cola`}
                    />
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {/* P&L chart */}
                    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:14, flex:1 }}>
                      <div style={{ fontSize:10, color:T.t3, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>
                        Beneficio diario · 30 días
                      </div>
                      {profHist.length > 3
                        ? <MiniChart data={profHist} color={profHist[profHist.length-1]>=0?T.green:T.red} height={90}/>
                        : <div style={{ height:90, display:'flex', alignItems:'center', justifyContent:'center', color:T.t3, fontSize:12 }}>
                            Acumulando histórico...
                          </div>
                      }
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:10 }}>
                        {[
                          { l:'Ingresos',  v:`+€${fx(summary.revenue30d)}`,             c:T.green },
                          { l:'Gastos',    v:`-€${fx(summary.expenses30d)}`,             c:T.red },
                          { l:'Margen',    v:`${summary.profitMargin.toFixed(1)}%`,      c:T.amber },
                        ].map(k=>(
                          <div key={k.l} style={{ textAlign:'center', padding:'7px 4px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                            <div style={{ fontSize:12, fontWeight:800, color:k.c, fontFamily:T.mono }}>{k.v}</div>
                            <div style={{ fontSize:9, color:T.t3, marginTop:2 }}>{k.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Costs breakdown */}
                    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:14 }}>
                      <div style={{ fontSize:10, color:T.t3, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>
                        Gastos operativos
                      </div>
                      {burn === 0 ? (
                        <div style={{ textAlign:'center', color:T.t3, fontSize:12, padding:'12px 0' }}>Sin gastos todavía</div>
                      ) : (<>
                        <div style={{ marginBottom:8 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                            <span style={{ fontSize:11, color:T.t2 }}>👥 Nóminas</span>
                            <span style={{ fontSize:11, color:T.red, fontFamily:T.mono }}>€{fx(salaries)}/mes</span>
                          </div>
                          <Bar v={salaries} max={burn} c={T.red} h={4}/>
                        </div>
                        <div style={{ marginBottom:10 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                            <span style={{ fontSize:11, color:T.t2 }}>🏭 Instalaciones</span>
                            <span style={{ fontSize:11, color:T.orange, fontFamily:T.mono }}>€{fx(facCosts)}/mes</span>
                          </div>
                          <Bar v={facCosts} max={burn} c={T.orange} h={4}/>
                        </div>
                        <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:10, display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontSize:12, fontWeight:700 }}>Total</span>
                          <span style={{ fontSize:14, fontWeight:900, color:T.red, fontFamily:T.mono }}>€{fx(burn)}/mes</span>
                        </div>
                      </>)}
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                {company.inventory.size > 0 && (
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:14 }}>
                    <div style={{ fontSize:10, color:T.t3, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>
                      Stock en almacén
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {Array.from(company.inventory.entries()).map(([id,qty])=>{
                        const prod = PRODUCTS[id];
                        return (
                          <div key={id} style={{
                            display:'flex', alignItems:'center', gap:8,
                            background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
                            borderRadius:8, padding:'8px 12px',
                          }}>
                            <span style={{ fontSize:18 }}>{prod?.icon??'📦'}</span>
                            <div>
                              <div style={{ fontSize:10, color:T.t2 }}>{prod?.name??id}</div>
                              <div style={{ fontSize:14, fontWeight:900, color:T.green, fontFamily:T.mono }}>{qty}<span style={{ fontSize:9, fontWeight:400 }}>u.</span></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Production queue */}
                {company.productionQueue.length > 0 && (
                  <div style={{ background:T.card, border:`1px solid rgba(16,185,129,0.2)`, borderRadius:12, padding:14 }}>
                    <div style={{ fontSize:10, color:T.green, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>
                      ⚙️ En producción
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {company.productionQueue.map((task,i)=>{
                        const prod = PRODUCTS[task.productId];
                        const done = Math.round(((task.totalDays-task.daysRemaining)/task.totalDays)*100);
                        return (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:16 }}>{prod?.icon??'📦'}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                                <span style={{ fontSize:11, fontWeight:700 }}>{task.quantity}× {prod?.name??task.productId}</span>
                                <span style={{ fontSize:10, color:T.green, fontFamily:T.mono }}>{task.daysRemaining}d restantes</span>
                              </div>
                              <Bar v={done} c={T.green} h={4}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reputation */}
                {topSector && topSector[1] > 0 && (
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:14 }}>
                    <div style={{ fontSize:10, color:T.t3, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>
                      Reputación por sector
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 20px' }}>
                      {Object.entries(company.reputation).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([s,v])=>{
                        const c = v>=80?T.amber:v>=50?T.green:T.violet;
                        return (
                          <div key={s}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                              <span style={{ fontSize:10, color:T.t2 }}>{s}</span>
                              <span style={{ fontSize:10, color:c, fontFamily:T.mono }}>{v.toFixed(0)}/100{v>=80?' 🌟':''}</span>
                            </div>
                            <Bar v={v} c={c} h={3}/>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ╔═══════════════════════════════════════════╗
                ║  TEAM                                     ║
                ╚═══════════════════════════════════════════╝ */}
            {tab === 'team' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                {/* Hire CTA */}
                <div style={{
                  background: hiring ? `${tier.color}08` : T.card,
                  border:`1px solid ${hiring ? tier.color+'40' : T.border}`,
                  borderRadius:12, overflow:'hidden',
                }}>
                  <button
                    onClick={()=>setHiring(h=>!h)}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'14px 16px', background:'transparent', border:'none', cursor:'pointer',
                      color:T.t1, fontSize:13, fontWeight:700,
                    }}
                  >
                    <span>➕ Contratar nuevo empleado</span>
                    <span style={{ color:T.t3 }}>{hiring ? '▲' : '▼'}</span>
                  </button>
                  <AnimatePresence>
                    {hiring && (
                      <motion.div
                        initial={{ height:0, opacity:0 }}
                        animate={{ height:'auto', opacity:1 }}
                        exit={{ height:0, opacity:0 }}
                        style={{ overflow:'hidden' }}
                      >
                        <div style={{ padding:'0 16px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, borderTop:`1px solid ${T.border}` }}>
                          {Object.values(WorkerType).map(type=>{
                            const cost   = WORKER_HIRING_COST[type];
                            const salary = WORKER_SALARY[type];
                            const afford = credits >= cost;
                            return (
                              <div key={type} style={{
                                display:'flex', gap:10, alignItems:'flex-start', marginTop:10,
                                padding:'12px 14px',
                                background: afford ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                                border:`1px solid ${afford ? T.borderHi : T.border}`, borderRadius:10,
                                opacity: afford ? 1 : 0.5,
                              }}>
                                <span style={{ fontSize:24, flexShrink:0, marginTop:2 }}>{W_ICON[type]}</span>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:13, fontWeight:800, marginBottom:2 }}>{W_LABEL[type]}</div>
                                  <div style={{ fontSize:10, color:T.t3, marginBottom:6 }}>{W_TAGLINE[type]}</div>
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                    <span style={{ fontSize:10, color:T.red, fontFamily:T.mono }}>€{fx(salary)}/mes</span>
                                    <ActionButton
                                      onClick={()=>hireWorker(type)}
                                      disabled={!afford}
                                      variant={afford ? 'success' : 'ghost'}
                                      style={{ fontSize:11, padding:'5px 10px' }}
                                    >
                                      Contratar €{fx(cost)}
                                    </ActionButton>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Summary strip */}
                {company.workers.length > 0 && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                    {[
                      { icon:'👥', label:'Empleados',   value:company.workers.length,    color:T.t1 },
                      { icon:'😊', label:'Moral media', value:`${morale}%`,              color:sc(morale,70,40) },
                      { icon:'⚡', label:'Eficiencia',  value:`${eff}%`,                 color:sc(eff,60,30) },
                      { icon:'💸', label:'Nóminas/mes', value:`€${fx(salaries)}`,        color:T.red },
                    ].map(k=>(
                      <div key={k.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10 }}>
                        <Kpi {...k}/>
                      </div>
                    ))}
                  </div>
                )}

                {/* Worker cards */}
                {company.workers.length === 0 ? (
                  <div style={{
                    textAlign:'center', padding:'50px 0', color:T.t3,
                    background:T.card, border:`1px solid ${T.border}`, borderRadius:12,
                  }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>Sin equipo todavía</div>
                    <div style={{ fontSize:12 }}>Contrata tu primer empleado arriba</div>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {company.workers.map(w=>(
                      <WorkerCard key={w.id} w={w} onFire={()=>fireWorker(w.id)}/>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ╔═══════════════════════════════════════════╗
                ║  ASSETS — Facilities + Production         ║
                ╚═══════════════════════════════════════════╝ */}
            {tab === 'assets' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                {/* Build CTA */}
                <div style={{
                  background: building ? `${tier.color}08` : T.card,
                  border:`1px solid ${building ? tier.color+'40' : T.border}`,
                  borderRadius:12, overflow:'hidden',
                }}>
                  <button
                    onClick={()=>setBuilding(b=>!b)}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'14px 16px', background:'transparent', border:'none', cursor:'pointer',
                      color:T.t1, fontSize:13, fontWeight:700,
                    }}
                  >
                    <span>🏗️ Construir instalación</span>
                    <span style={{ color:T.t3 }}>{building ? '▲' : '▼'}</span>
                  </button>
                  <AnimatePresence>
                    {building && (
                      <motion.div
                        initial={{ height:0, opacity:0 }}
                        animate={{ height:'auto', opacity:1 }}
                        exit={{ height:0, opacity:0 }}
                        style={{ overflow:'hidden' }}
                      >
                        <div style={{ padding:'0 16px 16px', borderTop:`1px solid ${T.border}` }}>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginTop:12 }}>
                            {Object.entries(FACILITY_TEMPLATES).map(([id,tmpl])=>{
                              const afford   = credits >= tmpl.purchaseCost;
                              const bonusPct = Math.round((tmpl.productionBonus-1)*100);
                              const fc       = F_COLOR[tmpl.type]??T.amber;
                              return (
                                <div key={id} style={{
                                  textAlign:'center', padding:'12px 8px',
                                  background: afford ? `${fc}08` : 'rgba(255,255,255,0.02)',
                                  border:`1px solid ${afford ? fc+'30' : T.border}`,
                                  borderRadius:10, opacity: afford ? 1 : 0.45,
                                }}>
                                  <div style={{ fontSize:24, marginBottom:4 }}>{F_ICON[tmpl.type]??'🏢'}</div>
                                  <div style={{ fontSize:11, fontWeight:700, marginBottom:2 }}>{tmpl.name}</div>
                                  <div style={{ fontSize:9, color:T.t3, marginBottom:2 }}>Cap: {tmpl.capacity}u</div>
                                  <div style={{ fontSize:9, color:fc, marginBottom:6 }}>+{bonusPct}% vel</div>
                                  <div style={{ fontSize:9, color:T.red, fontFamily:T.mono, marginBottom:8 }}>€{fx(tmpl.monthlyCost)}/mes</div>
                                  <ActionButton
                                    onClick={()=>addFacility(id)}
                                    disabled={!afford}
                                    variant={afford ? 'primary' : 'ghost'}
                                    style={{ width:'100%', fontSize:10, padding:'5px 0' }}
                                  >
                                    €{fx(tmpl.purchaseCost)}
                                  </ActionButton>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Facility cards */}
                {company.facilities.length === 0 ? (
                  <div style={{
                    textAlign:'center', padding:'50px 0', color:T.t3,
                    background:T.card, border:`1px solid ${T.border}`, borderRadius:12,
                  }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>🏭</div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>Sin instalaciones todavía</div>
                    <div style={{ fontSize:12 }}>Las instalaciones aceleran la producción</div>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {company.facilities.map(f=>(
                      <FacilityCard key={f.id} f={f} credits={credits} onUpgrade={()=>upgradeFacility(f.id)}/>
                    ))}
                  </div>
                )}

                {/* Production section */}
                <Divider label="Producción" />

                {/* Queue */}
                {company.productionQueue.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:4 }}>
                    {company.productionQueue.map((task,i)=>{
                      const prod = PRODUCTS[task.productId];
                      const fac  = company.facilities.find(f=>f.id===task.facilityId);
                      const done = Math.round(((task.totalDays-task.daysRemaining)/task.totalDays)*100);
                      return (
                        <div key={i} style={{
                          background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.2)',
                          borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:12,
                        }}>
                          <span style={{ fontSize:22 }}>{prod?.icon??'📦'}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontSize:12, fontWeight:700 }}>{task.quantity}× {prod?.name??task.productId}</span>
                              <span style={{ fontSize:11, color:T.green, fontFamily:T.mono }}>{task.daysRemaining}d</span>
                            </div>
                            <Bar v={done} c={T.green} h={4}/>
                            {fac && <div style={{ fontSize:9, color:T.t3, marginTop:3 }}>
                              {F_ICON[fac.type]??'🏭'} {fac.name} · +{Math.round((fac.productionBonus-1)*100)}% velocidad
                            </div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Launch production */}
                {company.facilities.length > 0 && (
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:14 }}>
                    <div style={{ fontSize:10, color:T.t3, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>
                      Lanzar producción
                    </div>
                    {Object.entries(PRODUCTS).filter(([,p])=>p.productionChain).length === 0 ? (
                      <div style={{ textAlign:'center', color:T.t3, fontSize:12, padding:'16px 0' }}>
                        No hay recetas disponibles.
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:8 }}>
                        {Object.entries(PRODUCTS).filter(([,p])=>p.productionChain).map(([id,prod])=>{
                          const chain  = prod.productionChain!;
                          const bestFac = [...company.facilities].sort((a,b)=>b.productionBonus-a.productionBonus)[0];
                          const canMake = chain.inputs.every(inp=>(company.inventory.get(inp.productId)??0)>=inp.quantity);
                          return (
                            <div key={id} style={{
                              background: canMake ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                              border:`1px solid ${canMake ? 'rgba(16,185,129,0.25)' : T.border}`,
                              borderRadius:10, padding:'11px 12px',
                            }}>
                              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                                <span style={{ fontSize:20 }}>{prod.icon??'📦'}</span>
                                <span style={{ fontSize:12, fontWeight:700 }}>{prod.name}</span>
                              </div>
                              <div style={{ fontSize:10, color:T.t3, marginBottom:2 }}>
                                {chain.inputs.map(inp=>{
                                  const have = company.inventory.get(inp.productId)??0;
                                  return <span key={inp.productId} style={{ color:have>=inp.quantity?T.green:T.red, marginRight:6 }}>
                                    {inp.productId} ×{inp.quantity}
                                  </span>;
                                })}
                              </div>
                              <div style={{ fontSize:9, color:T.amber, marginBottom:8 }}>⏱ {chain.timeInDays}d base</div>
                              <ActionButton
                                onClick={()=>bestFac&&queueProduction(id,1,bestFac.id)}
                                disabled={!canMake||!bestFac}
                                variant={canMake ? 'success' : 'ghost'}
                                style={{ width:'100%', fontSize:10, padding:'5px 0' }}
                              >
                                {canMake ? 'Producir ×1' : 'Sin materiales'}
                              </ActionButton>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ╔═══════════════════════════════════════════╗
                ║  STRATEGY — R&D + Roadmap + Reputation    ║
                ╚═══════════════════════════════════════════╝ */}
            {tab === 'strategy' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                {/* R&D tree */}
                <div style={{
                  background:`linear-gradient(135deg, rgba(12,16,28,0.99), rgba(18,10,38,0.99))`,
                  border:'1px solid rgba(139,92,246,0.25)', borderRadius:14, padding:16,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <span style={{ fontSize:28 }}>🔬</span>
                    <div>
                      <div style={{ fontSize:15, fontWeight:900 }}>Árbol Tecnológico</div>
                      <div style={{ fontSize:11, color:T.t3, marginTop:1 }}>
                        {Object.values(rdBought).filter(Boolean).length}/{RD.length} investigaciones · empresa nivel {company.level}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {RD.map((rd,idx)=>{
                      const bought   = rdBought[rd.id]??false;
                      const locked   = company.level < rd.lvl;
                      const prevDone = idx===0 || (rdBought[RD[idx-1].id]??false);
                      const blocked  = idx>0 && !prevDone;
                      const canBuy   = !bought && !locked && !blocked && credits>=rd.cost;

                      return (
                        <motion.div
                          key={rd.id}
                          initial={{ opacity:0, x:-10 }}
                          animate={{ opacity:1, x:0 }}
                          transition={{ delay:idx*0.04 }}
                          style={{
                            display:'flex', alignItems:'center', gap:14, padding:'13px 16px',
                            background: bought ? 'rgba(16,185,129,0.07)' : canBuy ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
                            border:`1px solid ${bought ? 'rgba(16,185,129,0.4)' : canBuy ? 'rgba(139,92,246,0.4)' : T.border}`,
                            borderRadius:11, opacity: (locked||blocked)&&!bought ? 0.4 : 1,
                          }}
                        >
                          <span style={{ fontSize:28, flexShrink:0 }}>{rd.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                              <span style={{ fontSize:13, fontWeight:800 }}>{rd.name}</span>
                              {bought && <span style={{ fontSize:9, fontWeight:700, color:T.green, background:'rgba(16,185,129,0.15)', padding:'1px 6px', borderRadius:4 }}>ACTIVO</span>}
                              {locked  && <span style={{ fontSize:9, fontWeight:700, color:T.amber, background:'rgba(245,158,11,0.12)', padding:'1px 6px', borderRadius:4 }}>Nv.{rd.lvl} req.</span>}
                            </div>
                            <div style={{ fontSize:10, color:T.t3, marginBottom:3 }}>{rd.desc}</div>
                            <div style={{ fontSize:11, fontWeight:700, color:T.violet }}>{rd.tag}</div>
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            {bought ? (
                              <span style={{ fontSize:26 }}>✅</span>
                            ) : (<>
                              <div style={{ fontSize:13, fontWeight:800, color:canBuy?T.violet:T.t3, fontFamily:T.mono, marginBottom:6 }}>
                                €{fx(rd.cost)}
                              </div>
                              <ActionButton
                                onClick={()=>buyRd(rd)}
                                disabled={!canBuy}
                                variant={canBuy ? 'purple' : 'ghost'}
                                style={{ fontSize:11, padding:'5px 12px' }}
                              >
                                {locked ? `🔒 Nv.${rd.lvl}` : blocked ? 'Anterior primero' : 'Investigar'}
                              </ActionButton>
                            </>)}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Level roadmap */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:10, color:T.t3, letterSpacing:1.5, textTransform:'uppercase', marginBottom:14 }}>
                    Roadmap de crecimiento
                  </div>
                  <div>
                    {([
                      { lvl:1,  desc:'Startup — acceso a I+D básico',           bonus:'×1.0 CPS' },
                      { lvl:2,  desc:'PYME emergente — logística optimizada',    bonus:'×1.11 CPS' },
                      { lvl:3,  desc:'PYME consolidada — gestión de talento',    bonus:'×1.22 CPS' },
                      { lvl:4,  desc:'Empresa — IA predictiva de mercados',      bonus:'×1.33 CPS' },
                      { lvl:5,  desc:'Empresa senior — producción a escala',     bonus:'×1.44 CPS' },
                      { lvl:6,  desc:'Pre-corporación — robótica industrial',    bonus:'×1.55 CPS' },
                      { lvl:7,  desc:'Corporación — poder real de mercado',      bonus:'×1.66 CPS' },
                      { lvl:8,  desc:'Corporación — dominio sectorial',          bonus:'×1.77 CPS' },
                      { lvl:9,  desc:'Pre-megacorp — influencia global',         bonus:'×1.88 CPS' },
                      { lvl:10, desc:'🌐 MEGACORP — cima del mundo empresarial', bonus:'×2.0 CPS'  },
                    ] as Array<{ lvl:number; desc:string; bonus:string }>).map((m,i,arr)=>{
                      const done    = company.level > m.lvl;
                      const current = company.level === m.lvl;
                      return (
                        <div key={m.lvl} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                            <div style={{
                              width:30, height:30, borderRadius:'50%',
                              background: done ? `${tier.color}30` : current ? `${tier.color}18` : 'rgba(255,255,255,0.04)',
                              border:`2px solid ${done||current ? tier.color : 'rgba(255,255,255,0.08)'}`,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:10, fontWeight:900, color:done||current?tier.color:T.t3,
                            }}>{done?'✓':m.lvl}</div>
                            {i < arr.length-1 && (
                              <div style={{ width:2, height:18, background:done?`${tier.color}50`:'rgba(255,255,255,0.06)', marginTop:2 }}/>
                            )}
                          </div>
                          <div style={{ paddingBottom:14, flex:1, opacity:company.level<m.lvl?0.35:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                              <span style={{ fontSize:12, color:current?T.t1:done?T.t2:T.t3, fontWeight:current?700:400 }}>
                                {m.desc}
                              </span>
                              {current && <span style={{ fontSize:9, fontWeight:800, color:tier.color, background:`${tier.color}18`, padding:'1px 6px', borderRadius:4 }}>AHORA</span>}
                            </div>
                            <div style={{ fontSize:10, color:tier.color, fontFamily:T.mono }}>{m.bonus}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sector reputation */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:10, color:T.t3, letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>
                    Reputación sectorial
                  </div>
                  {Object.values(company.reputation).every(v=>v<=0) ? (
                    <div style={{ textAlign:'center', color:T.t3, fontSize:12, padding:'16px 0' }}>
                      Completa contratos para ganar reputación
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 20px' }}>
                      {Object.entries(company.reputation).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([s,v])=>{
                        const c = v>=80?T.amber:v>=50?T.green:T.violet;
                        return (
                          <div key={s}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                              <span style={{ fontSize:11, color:T.t2 }}>{s}</span>
                              <span style={{ fontSize:11, color:c, fontFamily:T.mono }}>{v.toFixed(0)}/100{v>=80?' 🌟':''}</span>
                            </div>
                            <Bar v={v} c={c} h={4}/>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8, fontSize:10, color:T.t3 }}>
                    Rep &gt;50 → contratos de mayor valor · Rep &gt;80 → contratos premium exclusivos
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
