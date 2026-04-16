import React, { useState } from 'react';
import { useGameStore, formatNumber } from '../stores/gameStore';
import { GlassCard, StatCard, ActionButton, TabBar, ProgressBar, Badge } from '../components/ui/GlassCard';

// ─────────────────────────────────────────────────────────────
// Static data: NPC contact cards
// ─────────────────────────────────────────────────────────────
const NPC_CONTACTS = [
  {
    id: 'npc_01', name: 'Elena Morrow', role: 'Ministra de Comercio', icon: '🏛️',
    faction: 'Gobierno',
    description: 'Acceso privilegiado a contratos gubernamentales y regulaciones favorables.',
    influenceCost: 100, unlockBonus: 'Contratos gubernamentales +20% valor',
    tier: 1,
  },
  {
    id: 'npc_02', name: 'Viktor Sanz', role: 'Banquero de Inversión', icon: '🏦',
    faction: 'Finanzas',
    description: 'Facilita líneas de crédito y acceso a fondos de capital riesgo.',
    influenceCost: 150, unlockBonus: 'Tipos de interés -15%',
    tier: 1,
  },
  {
    id: 'npc_03', name: 'Lena Park', role: 'Directora de The Nexus Herald', icon: '📰',
    faction: 'Medios',
    description: 'Controla la narrativa mediática. Puede darte cobertura positiva o hundirte.',
    influenceCost: 200, unlockBonus: 'Reputación pública +30',
    tier: 2,
  },
  {
    id: 'npc_04', name: 'Omar Reyes', role: 'Líder Sindical', icon: '✊',
    faction: 'Trabajo',
    description: 'Evita huelgas y mantiene la moral del personal elevada con su apoyo.',
    influenceCost: 120, unlockBonus: 'Moral empleados +20%, sin huelgas',
    tier: 1,
  },
  {
    id: 'npc_05', name: 'Priya Khatri', role: 'CEO de NovaTech', icon: '🤝',
    faction: 'Tecnología',
    description: 'Alianza tecnológica. Acceso compartido a patentes e I+D colaborativa.',
    influenceCost: 300, unlockBonus: 'I+D compartida, patentes cruzadas',
    tier: 2,
  },
  {
    id: 'npc_06', name: 'Dominic Luca', role: 'Comisario de la UE de Mercados', icon: '🇪🇺',
    faction: 'Internacional',
    description: 'Abre las puertas del mercado europeo y evita investigaciones antimonopolio.',
    influenceCost: 500, unlockBonus: 'Acceso mercados UE, protección regulatoria',
    tier: 3,
  },
  {
    id: 'npc_07', name: 'Isabella Chen', role: 'Jefa del Crimen Organizado', icon: '🕶️',
    faction: 'Sombra',
    description: 'Operaciones que el dinero blanco no puede comprar. Riesgo muy alto.',
    influenceCost: 800, unlockBonus: 'Sabotaje a rivales, contratos ilegales lucrativos',
    tier: 3,
  },
  {
    id: 'npc_08', name: 'Alexei Volkov', role: 'Oligarca de Energía', icon: '⚡',
    faction: 'Recursos',
    description: 'Control sobre el suministro energético de toda la región. Poder real.',
    influenceCost: 1000, unlockBonus: 'Costes energéticos -40%, ventaja extractiva',
    tier: 4,
  },
];

// ─────────────────────────────────────────────────────────────
// Static data: Press headlines (generated based on game state)
// ─────────────────────────────────────────────────────────────
function generateHeadlines(credits: number, day: number, workers: number, contracts: number) {
  const headlines: { icon: string; title: string; sub: string; sentiment: 'positive' | 'negative' | 'neutral' }[] = [];

  if (credits > 1000000) {
    headlines.push({ icon: '💰', title: 'Aetheria Syndicate supera el millón en activos', sub: 'La empresa consolida su posición en el mercado', sentiment: 'positive' });
  }
  if (workers > 5) {
    headlines.push({ icon: '👥', title: `${workers} empleados en nómina — el equipo crece`, sub: 'Expansión de personal a buen ritmo', sentiment: 'positive' });
  }
  if (contracts > 3) {
    headlines.push({ icon: '📋', title: 'La red de contratos B2B se consolida', sub: 'Clientes satisfechos, reputación en alza', sentiment: 'positive' });
  }
  if (day > 50) {
    headlines.push({ icon: '🗓️', title: `${day} días en el mercado sin bajar la guardia`, sub: 'Resiliencia empresarial probada', sentiment: 'neutral' });
  }
  if (credits < 1000) {
    headlines.push({ icon: '⚠️', title: 'Sindicalistas alertan sobre liquidez de la empresa', sub: 'Fondos al límite, según fuentes cercanas', sentiment: 'negative' });
  }
  if (headlines.length === 0) {
    headlines.push({ icon: '📰', title: 'Aetheria Syndicate — debut silencioso en el sector', sub: 'El mercado observa con cautela a la nueva empresa', sentiment: 'neutral' });
  }
  return headlines;
}

// ─────────────────────────────────────────────────────────────
// Static data: Social events calendar
// ─────────────────────────────────────────────────────────────
const EVENTS_CALENDAR = [
  { id: 'ev_01', name: 'Cumbre de CEOs de Aetheria', icon: '🏙️', day: 30, cost: 10000, influenceGain: 50, happinessBoost: 5, description: 'Networking de alto nivel. Un discurso memorable puede cambiar todo.' },
  { id: 'ev_02', name: 'Gala Benéfica de la Fundación Arte', icon: '🎭', day: 45, cost: 25000, influenceGain: 80, happinessBoost: 8, description: 'Visibilidad ante la élite cultural y política de la ciudad.' },
  { id: 'ev_03', name: 'Foro Económico de Nueva Vista', icon: '📊', day: 60, cost: 50000, influenceGain: 150, happinessBoost: 10, description: 'El Davos local. Decide políticas económicas y cierra acuerdos secretos.' },
  { id: 'ev_04', name: 'Torneo de Golf Benéfico Ejecutivo', icon: '⛳', day: 75, cost: 15000, influenceGain: 40, happinessBoost: 12, description: 'Donde los negocios reales se cierran entre hoyos.' },
  { id: 'ev_05', name: 'Regata Anual del Club Náutico', icon: '⛵', day: 90, cost: 30000, influenceGain: 60, happinessBoost: 10, description: 'La élite marítima de Aetheria. Competición y alianzas.' },
  { id: 'ev_06', name: 'Conferencia Internacional de Tecnología', icon: '💡', day: 120, cost: 75000, influenceGain: 200, happinessBoost: 8, description: 'Anuncia tu visión tecnológica ante inversores globales.' },
  { id: 'ev_07', name: 'Subasta Sotheby\'s Edición Especial', icon: '🖼️', day: 150, cost: 100000, influenceGain: 100, happinessBoost: 15, description: 'Adquiere piezas únicas y demuestra tu cultura ante la aristocracia.' },
  { id: 'ev_08', name: 'Summit Global de Sostenibilidad', icon: '🌍', day: 180, cost: 200000, influenceGain: 300, happinessBoost: 12, description: 'Posicionarte como líder sostenible ante inversores ESG globales.' },
];

// ─────────────────────────────────────────────────────────────
// VIEW
// ─────────────────────────────────────────────────────────────
export default function SocialView() {
  const { influence, credits, currentDay, rivalManager, personalManager, engine, _rev, buyIntelligence, declareRivalry } = useGameStore();
  const [tab, setTab] = useState('status');
  const [unlockedContacts, setUnlockedContacts] = useState<string[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<string[]>([]);

  const company = engine.playerCompany;
  const rivals = rivalManager.rivals;
  const workers = company?.workers.length ?? 0;
  const contracts = useGameStore.getState().contractManager.history.filter(c => c.status === 'completed').length;
  const personalState = personalManager.state;

  const headlines = generateHeadlines(credits, currentDay, workers, contracts);

  const prestigeTitle = personalManager.getPrestigeTitle();

  const handleUnlockContact = (npcId: string, cost: number) => {
    if (influence < cost) return;
    useGameStore.setState(s => ({
      influence: s.influence - cost,
      _rev: s._rev + 1,
    }));
    setUnlockedContacts(prev => [...prev, npcId]);
  };

  const handleAttendEvent = (ev: typeof EVENTS_CALENDAR[0]) => {
    if (credits < ev.cost || attendedEvents.includes(ev.id)) return;
    useGameStore.setState(s => {
      // Update happiness through personalManager, then trigger re-render
      s.personalManager.state.happiness = Math.min(100, s.personalManager.state.happiness + ev.happinessBoost);
      return {
        credits: s.credits - ev.cost,
        influence: s.influence + ev.influenceGain,
        _rev: s._rev + 1,
        notifications: [
          ...s.notifications,
          {
            id: `n_${Date.now()}`, type: 'success' as const,
            title: ev.name, message: `+${ev.influenceGain} influencia ganada. +${ev.happinessBoost} felicidad`,
            icon: ev.icon, timestamp: Date.now(), read: false,
          }
        ]
      };
    });
    setAttendedEvents(prev => [...prev, ev.id]);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 12, flexShrink: 0 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Esfera Social</h2>
        <p style={{ color: 'hsl(var(--c-text-2))', fontSize: 12 }}>
          Tu reputación pública, red de contactos y presencia en eventos de élite. El dinero abre puertas, la influencia las mantiene abiertas.
        </p>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12, flexShrink: 0 }}>
        <StatCard label="Influencia" value={`◆ ${formatNumber(influence)}`} icon="⭐" small color="hsl(var(--c-secondary))" />
        <StatCard label="Prestigio" value={Math.floor(personalState.prestige)} icon="🏅" small color="hsl(var(--c-primary))" />
        <StatCard label="Contactos" value={unlockedContacts.length} icon="🤝" small />
        <StatCard label="Eventos" value={attendedEvents.length} icon="🎭" small />
      </div>

      <TabBar
        tabs={[
          { id: 'status', label: 'Status', icon: '👑' },
          { id: 'contacts', label: 'Contactos', icon: '🤝' },
          { id: 'events', label: 'Eventos', icon: '🎭' },
          { id: 'press', label: 'Prensa', icon: '📰' },
          { id: 'rivals', label: 'Rivales', icon: '⚔️' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── STATUS ────────────────────────────────────────── */}
        {tab === 'status' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Prestige title */}
            <GlassCard style={{ padding: 16, background: 'linear-gradient(135deg, hsla(var(--c-primary), 0.1), hsla(var(--c-secondary), 0.1))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>👑 {prestigeTitle}</div>
                  <div style={{ fontSize: 13, color: 'hsl(var(--c-text-2))' }}>
                    {company?.name ?? 'Tu empresa'} · Día {currentDay} en el mercado
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono text-gradient" style={{ fontSize: 28, fontWeight: 900 }}>◆ {formatNumber(influence)}</div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))' }}>INFLUENCIA TOTAL</div>
                </div>
              </div>
            </GlassCard>

            {/* Progress to next title */}
            <GlassCard style={{ padding: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))', marginBottom: 8 }}>PROGRESIÓN DE PRESTIGIO</div>
              {[
                { min: 0, max: 5, label: 'CEO Emergente', next: 'Emprendedor' },
                { min: 5, max: 20, label: 'Emprendedor', next: 'Gerente Próspero' },
                { min: 20, max: 40, label: 'Gerente Próspero', next: 'Director Respetado' },
                { min: 40, max: 80, label: 'Director Respetado', next: 'Alto Ejecutivo' },
                { min: 80, max: 150, label: 'Alto Ejecutivo', next: 'Empresario de Élite' },
                { min: 150, max: 250, label: 'Empresario de Élite', next: 'Tycoon Global' },
                { min: 250, max: 500, label: 'Tycoon Global', next: 'Magnate Legendario' },
                { min: 500, max: 1000, label: 'Magnate Legendario', next: '∞' },
              ].map(tier => {
                const p = personalState.prestige;
                if (p < tier.min || p >= tier.max) return null;
                const progress = ((p - tier.min) / (tier.max - tier.min)) * 100;
                return (
                  <div key={tier.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700 }}>{tier.label}</span>
                      <span style={{ color: 'hsl(var(--c-text-3))' }}>Siguiente: {tier.next}</span>
                    </div>
                    <ProgressBar value={progress} max={100} height={10} color="hsl(var(--c-secondary))"
                      label={`${Math.floor(p - tier.min)} / ${tier.max - tier.min} prestigio`} />
                  </div>
                );
              })}
            </GlassCard>

            {/* Social metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <GlassCard style={{ padding: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))', marginBottom: 8 }}>CÓMO GANAR INFLUENCIA</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11 }}>
                  {[
                    { icon: '📅', tip: 'Sobrevive días en el mercado', value: '+1/día' },
                    { icon: '💼', tip: 'Contrata empleados', value: '+5/empleado' },
                    { icon: '📋', tip: 'Completa contratos', value: '+10/contrato' },
                    { icon: '📈', tip: 'Vende en el mercado global', value: '+1 por Đ10K' },
                    { icon: '🎭', tip: 'Asiste a eventos sociales', value: 'Variable' },
                    { icon: '🤝', tip: 'Desbloquea contactos de élite', value: 'Pasiva' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: 'hsla(var(--c-surface2), 0.3)', borderRadius: 5 }}>
                      <span>{item.icon} {item.tip}</span>
                      <span style={{ color: 'hsl(var(--c-success))', fontWeight: 700 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard style={{ padding: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))', marginBottom: 8 }}>PERFIL SOCIAL</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'hsl(var(--c-text-3))' }}>Estado civil</span>
                    <span style={{ fontWeight: 700 }}>{
                      personalState.family.status === 'single' ? '🧍 Soltero/a' :
                      personalState.family.status === 'dating' ? `💑 Con ${personalState.family.partner?.name}` :
                      personalState.family.status === 'married' ? `💍 Casado/a con ${personalState.family.partner?.name}` :
                      personalState.family.status === 'divorced' ? '⚖️ Divorciado/a' : '—'
                    }</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'hsl(var(--c-text-3))' }}>Hijos</span>
                    <span style={{ fontWeight: 700 }}>{personalState.family.kids.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'hsl(var(--c-text-3))' }}>Clubs sociales</span>
                    <span style={{ fontWeight: 700 }}>{personalState.socialClubs.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'hsl(var(--c-text-3))' }}>Propiedades</span>
                    <span style={{ fontWeight: 700 }}>{personalState.assets.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'hsl(var(--c-text-3))' }}>Días en mercado</span>
                    <span className="font-mono" style={{ fontWeight: 700 }}>{currentDay}</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* ── CONTACTS ──────────────────────────────────────── */}
        {tab === 'contacts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {NPC_CONTACTS.map(npc => {
              const isUnlocked = unlockedContacts.includes(npc.id);
              const canAfford = influence >= npc.influenceCost;
              const tierColors = ['hsl(var(--c-text-3))', 'hsl(var(--c-primary))', 'hsl(var(--c-warning))', 'hsl(var(--c-danger))', 'hsl(var(--c-secondary))'];

              return (
                <GlassCard key={npc.id} style={{
                  display: 'flex', flexDirection: 'column', gap: 10,
                  border: isUnlocked ? '1px solid hsl(var(--c-success))' : undefined,
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 32 }}>{npc.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800 }}>{npc.name}</div>
                          <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))', marginTop: 1 }}>{npc.role}</div>
                        </div>
                        <Badge color={tierColors[npc.tier] ?? 'hsl(var(--c-text-3))'}>{npc.faction}</Badge>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: 'hsl(var(--c-text-2))' }}>{npc.description}</div>

                  <div style={{ padding: '6px 8px', background: 'hsla(var(--c-success), 0.1)', border: '1px solid hsla(var(--c-success), 0.2)', borderRadius: 5, fontSize: 11 }}>
                    ✨ {npc.unlockBonus}
                  </div>

                  {isUnlocked ? (
                    <div style={{ textAlign: 'center', padding: '8px', color: 'hsl(var(--c-success))', fontWeight: 700, fontSize: 12 }}>
                      ✓ CONTACTO ACTIVO
                    </div>
                  ) : (
                    <ActionButton
                      variant="primary"
                      disabled={!canAfford}
                      onClick={() => handleUnlockContact(npc.id, npc.influenceCost)}
                    >
                      ◆ Cultivar contacto ({npc.influenceCost} influencia)
                    </ActionButton>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* ── EVENTS ────────────────────────────────────────── */}
        {tab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <GlassCard style={{ padding: 12 }}>
              <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))' }}>
                📅 Los eventos sociales son oportunidades únicas para ganar influencia y establecer contactos. Día actual: <strong>{currentDay}</strong>
              </div>
            </GlassCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {EVENTS_CALENDAR.map(ev => {
                const attended = attendedEvents.includes(ev.id);
                const available = currentDay >= ev.day;
                const canAfford = credits >= ev.cost;
                const daysUntil = Math.max(0, ev.day - currentDay);

                return (
                  <GlassCard key={ev.id} style={{
                    display: 'flex', flexDirection: 'column', gap: 10,
                    opacity: attended ? 0.7 : available ? 1 : 0.6,
                    border: attended ? '1px solid hsl(var(--c-success))' : undefined,
                  }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 32 }}>{ev.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>{ev.name}</div>
                        <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))', marginTop: 2 }}>{ev.description}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                      <div style={{ padding: '5px 8px', background: 'hsla(var(--c-surface2), 0.4)', borderRadius: 5 }}>
                        <div style={{ color: 'hsl(var(--c-text-3))' }}>Coste</div>
                        <div className="font-mono" style={{ fontWeight: 700 }}>Đ{formatNumber(ev.cost)}</div>
                      </div>
                      <div style={{ padding: '5px 8px', background: 'hsla(var(--c-secondary), 0.1)', borderRadius: 5 }}>
                        <div style={{ color: 'hsl(var(--c-text-3))' }}>Influencia</div>
                        <div className="font-mono" style={{ fontWeight: 700, color: 'hsl(var(--c-secondary))' }}>+{ev.influenceGain}</div>
                      </div>
                    </div>

                    {attended ? (
                      <div style={{ textAlign: 'center', padding: '8px', color: 'hsl(var(--c-success))', fontWeight: 700, fontSize: 12 }}>
                        ✓ ASISTIDO · +{ev.influenceGain} influencia ganada
                      </div>
                    ) : available ? (
                      <ActionButton variant="success" disabled={!canAfford} onClick={() => handleAttendEvent(ev)}>
                        🎭 Asistir (Đ{formatNumber(ev.cost)})
                      </ActionButton>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '8px', color: 'hsl(var(--c-text-3))', fontSize: 11 }}>
                        ⏰ Disponible en día {ev.day} ({daysUntil} días)
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PRESS ─────────────────────────────────────────── */}
        {tab === 'press' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <GlassCard style={{ padding: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))', marginBottom: 10 }}>COBERTURA MEDIÁTICA — DÍA {currentDay}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {headlines.map((h, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 8,
                    background: h.sentiment === 'positive' ? 'hsla(var(--c-success), 0.08)' :
                                h.sentiment === 'negative' ? 'hsla(var(--c-danger), 0.08)' : 'hsla(var(--c-surface2), 0.3)',
                    borderLeft: `3px solid ${h.sentiment === 'positive' ? 'hsl(var(--c-success))' : h.sentiment === 'negative' ? 'hsl(var(--c-danger))' : 'hsl(var(--c-text-3))'}`,
                  }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{h.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{h.title}</div>
                      <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))' }}>{h.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard style={{ padding: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))', marginBottom: 10 }}>CÓMO MEJORAR TU IMAGEN</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                {[
                  { icon: '🎭', text: 'Asiste a eventos sociales para cobertura positiva automática.' },
                  { icon: '🤝', text: 'Cultiva el contacto con la Directora del Herald para control editorial.' },
                  { icon: '📋', text: 'Completa contratos con alto score de rendimiento.' },
                  { icon: '💎', text: 'Tus compras de lujo también llaman la atención mediática.' },
                  { icon: '🏆', text: 'Los logros desbloqueados mejoran tu reputación pública.' },
                ].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 8px', background: 'hsla(var(--c-surface2), 0.3)', borderRadius: 5 }}>
                    <span>{tip.icon}</span>
                    <span style={{ color: 'hsl(var(--c-text-2))' }}>{tip.text}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── RIVALS ────────────────────────────────────────── */}
        {tab === 'rivals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <GlassCard style={{ padding: 12 }}>
              <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))' }}>
                ⚔️ Monitoriza a tus rivales. Compra inteligencia (Đ500) para conocer sus planes o declara rivalidad para enfrentamientos directos.
              </div>
            </GlassCard>

            {rivals.map(rival => {
              const isActiveRival = rival.relationship < -40;
              const netWorthBar = Math.min(100, (rival.netWorth / Math.max(1, credits + rival.netWorth)) * 100);
              return (
                <GlassCard key={rival.id} style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 28 }}>🏢</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>{rival.name}</div>
                        <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))', marginTop: 2 }}>
                          {rival.sector} · Nivel {rival.level} · {rival.personality.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-mono" style={{ fontSize: 14, fontWeight: 700 }}>Đ{formatNumber(rival.netWorth)} neto</div>
                      <Badge color={isActiveRival ? 'hsl(var(--c-danger))' : 'hsl(var(--c-text-3))'}>{isActiveRival ? '⚔️ RIVAL' : 'NEUTRO'}</Badge>
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <ProgressBar value={netWorthBar} max={100} height={5} label={`Patrimonio relativo estimado`}
                      color={isActiveRival ? 'hsl(var(--c-danger))' : 'hsl(var(--c-primary))'} />
                  </div>

                  {/* Relationship */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 10 }}>
                    <span style={{ color: 'hsl(var(--c-text-3))' }}>Relación</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <ProgressBar value={rival.relationship + 100} max={200} height={6}
                        color={rival.relationship > 0 ? 'hsl(var(--c-success))' : 'hsl(var(--c-danger))'} />
                      <span className="font-mono" style={{ minWidth: 30 }}>{rival.relationship}</span>
                    </div>
                  </div>

                  {/* Personality description */}
                  <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))', marginBottom: 10, padding: '5px 8px', background: 'hsla(var(--c-surface2), 0.3)', borderRadius: 5 }}>
                    {rival.personality === 'aggressive' ? '🔥 Agresivo: ataca tu mercado activamente y roba clientes.' :
                     rival.personality === 'conservative' ? '🐢 Conservador: crece lentamente pero es muy estable.' :
                     rival.personality === 'opportunist' ? '🦊 Oportunista: explota tus debilidades cuando te descuidas.' :
                     rival.personality === 'innovator' ? '💡 Innovador: desarrolla tecnología que puede superar la tuya.' :
                     rival.personality === 'copycat' ? '📋 Imitador: copia tu estrategia pero más barato.' : rival.personality}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <ActionButton variant="ghost" size="sm" onClick={() => buyIntelligence(rival.id, 500)}
                      disabled={credits < 500}>
                      🔍 Inteligencia (Đ500)
                    </ActionButton>
                    {!isActiveRival ? (
                      <ActionButton variant="danger" size="sm" onClick={() => declareRivalry(rival.id)}>
                        ⚔️ Declarar Rivalidad
                      </ActionButton>
                    ) : (
                      <Badge color="hsl(var(--c-danger))">RIVALIDAD ACTIVA</Badge>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
