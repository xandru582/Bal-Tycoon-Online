import React, { useState } from 'react';
import { useGameStore, formatNumber } from '../stores/gameStore';
import { GlassCard, StatCard, ProgressBar, ActionButton, TabBar, Badge } from '../components/ui/GlassCard';
import { PERSONAL_ASSETS, SOCIAL_CLUBS, LUXURY_EXPERIENCES } from '../core/economy/PersonalLife';

const EDUCATION_LABELS = { public: 'Pública', private: 'Privada', elite: 'Élite' };
const EDUCATION_COLORS = { public: 'hsl(var(--c-text-2))', private: 'hsl(var(--c-warning))', elite: 'hsl(var(--c-success))' };
const STATUS_LABELS: Record<string, string> = {
  single: 'Soltero/a', dating: 'En Pareja', married: 'Casado/a',
  separated: 'Separado/a', divorced: 'Divorciado/a',
};
const STATUS_ICONS: Record<string, string> = {
  single: '🧍', dating: '💑', married: '💍', separated: '💔', divorced: '⚖️',
};

export default function PersonalView() {
  const {
    personalManager, credits, currentDay, _rev,
    buyPersonalAsset, setPersonalSalary, proposePartner, marry, divorce,
    haveChild, upgradeChildEducation, takeVacation,
    joinSocialClub, quitSocialClub, buyExperience,
  } = useGameStore();
  const [tab, setTab] = useState('vida');
  const [salaryInput, setSalaryInput] = useState<string>('');

  const state = personalManager.state;
  const company = useGameStore.getState().engine.playerCompany;
  const companyLevel = company?.level ?? 1;

  const totalExpenses = personalManager.totalMonthlyExpenses;
  const prestigeTitle = personalManager.getPrestigeTitle();

  const handleSalaryChange = (val: string) => {
    setSalaryInput(val);
    const n = Number(val);
    if (!isNaN(n) && n >= 0) setPersonalSalary(n);
  };

  return (
    <div style={{ paddingRight: 8, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Vida Personal</h2>
        <p style={{ color: 'hsl(var(--c-text-2))', fontSize: 13 }}>
          El verdadero propósito del dinero: gastarlo. Gestiona tu estilo de vida, familia y reputación social.
        </p>
      </div>

      {/* Hero stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16, flexShrink: 0 }}>
        <StatCard label="Fortuna" value={`Đ${formatNumber(state.cash)}`} icon="💰" small color="hsl(var(--c-primary))" />
        <StatCard label="Estrés" value={`${state.stress.toFixed(0)}%`} icon="🧠" small
          color={state.stress > 70 ? 'hsl(var(--c-danger))' : state.stress > 40 ? 'hsl(var(--c-warning))' : 'hsl(var(--c-success))'} />
        <StatCard label="Felicidad" value={`${state.happiness.toFixed(0)}%`} icon="😊" small
          color={state.happiness > 80 ? 'hsl(var(--c-success))' : state.happiness < 30 ? 'hsl(var(--c-danger))' : 'hsl(var(--c-text-1))'} />
        <StatCard label="Prestigio" value={Math.floor(state.prestige)} icon="⭐" small color="hsl(var(--c-secondary))" />
        <StatCard label="Gasto/mes" value={`Đ${formatNumber(totalExpenses)}`} icon="📉" small color="hsl(var(--c-danger))" />
      </div>

      <TabBar
        tabs={[
          { id: 'vida', label: 'Vida', icon: '📊' },
          { id: 'hogar', label: 'Hogar', icon: '🏠' },
          { id: 'garaje', label: 'Garaje', icon: '🚗' },
          { id: 'coleccion', label: 'Lujos', icon: '💎' },
          { id: 'familia', label: 'Familia', icon: '👨‍👩‍👧' },
          { id: 'clubs', label: 'Clubs', icon: '🤝' },
          { id: 'experiencias', label: 'Experiencias', icon: '✨' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── VIDA (overview) ───────────────────────────────── */}
        {tab === 'vida' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Wellbeing bars */}
            <GlassCard style={{ padding: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))', marginBottom: 12 }}>BIENESTAR</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>ESTRÉS MENTAL</span>
                    <span className="font-mono" style={{ fontSize: 12, color: state.stress > 70 ? 'hsl(var(--c-danger))' : 'hsl(var(--c-text-1))' }}>
                      {state.stress.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar value={state.stress} max={100} height={10}
                    color={state.stress > 70 ? 'hsl(var(--c-danger))' : state.stress > 40 ? 'hsl(var(--c-warning))' : 'hsl(var(--c-success))'} />
                  <div style={{ fontSize: 10, color: 'hsl(var(--c-text-3))', marginTop: 3 }}>
                    {state.stress > 70 ? '⚠️ CRÍTICO: Eficiencia empresarial reducida' : state.stress > 40 ? '⚡ Moderado: bajo control' : '✅ Óptimo: eficiencia al máximo'}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>FELICIDAD</span>
                    <span className="font-mono" style={{ fontSize: 12, color: state.happiness > 80 ? 'hsl(var(--c-success))' : 'hsl(var(--c-text-1))' }}>
                      {state.happiness.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar value={state.happiness} max={100} height={10}
                    color={state.happiness > 80 ? 'hsl(var(--c-success))' : state.happiness < 30 ? 'hsl(var(--c-danger))' : 'linear-gradient(90deg, hsl(var(--c-primary)), hsl(var(--c-secondary)))'} />
                  <div style={{ fontSize: 10, color: 'hsl(var(--c-text-3))', marginTop: 3 }}>
                    {state.happiness > 80 ? '🚀 +20% eficiencia productiva' : 'Neutral — compra lujos para subir'}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Salary config + financial breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <GlassCard style={{ padding: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))', marginBottom: 10 }}>CONFIGURAR SALARIO</div>
                <div style={{ fontSize: 11, color: 'hsl(var(--c-text-2))', marginBottom: 8 }}>
                  Transferencia mensual de la empresa a tu cuenta personal.
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'hsl(var(--c-text-3))' }}>Đ</span>
                  <input
                    type="number"
                    value={salaryInput !== '' ? salaryInput : state.salary}
                    onChange={e => handleSalaryChange(e.target.value)}
                    style={{
                      flex: 1, background: 'hsla(var(--c-surface), 0.5)',
                      border: '1px solid hsla(var(--c-border), 0.5)',
                      color: 'white', padding: '6px 10px', borderRadius: 4,
                      fontFamily: 'var(--font-mono)', fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: 'hsl(var(--c-text-3))', marginTop: 6 }}>
                  Salario actual: Đ{formatNumber(state.salary)}/mes
                </div>
              </GlassCard>

              <GlassCard style={{ padding: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))', marginBottom: 10 }}>GASTOS MENSUALES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--c-text-3))' }}>🏠 Propiedades</span>
                    <span className="font-mono" style={{ color: 'hsl(var(--c-danger))' }}>-Đ{formatNumber(personalManager.totalMaintenance)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--c-text-3))' }}>🤝 Clubs</span>
                    <span className="font-mono" style={{ color: 'hsl(var(--c-danger))' }}>-Đ{formatNumber(personalManager.totalClubFees)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--c-text-3))' }}>👨‍👩‍👧 Familia</span>
                    <span className="font-mono" style={{ color: 'hsl(var(--c-danger))' }}>-Đ{formatNumber(personalManager.familyMonthlyCost)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid hsla(var(--c-border), 0.3)', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Total</span>
                    <span className="font-mono" style={{ color: 'hsl(var(--c-danger))' }}>-Đ{formatNumber(totalExpenses)}</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Prestige & Status */}
            <GlassCard style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))' }}>ESTATUS SOCIAL</div>
                <Badge color="hsl(var(--c-secondary))">{prestigeTitle}</Badge>
              </div>
              <ProgressBar value={state.prestige % 100} max={100} height={6} color="hsl(var(--c-secondary))" label={`Prestigio: ${Math.floor(state.prestige)}`} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, fontSize: 11 }}>
                <div style={{ textAlign: 'center', padding: '8px', background: 'hsla(var(--c-surface2), 0.4)', borderRadius: 6 }}>
                  <div style={{ fontSize: 18 }}>{STATUS_ICONS[state.family.status]}</div>
                  <div style={{ color: 'hsl(var(--c-text-3))', marginTop: 2 }}>Estado</div>
                  <div style={{ fontWeight: 700 }}>{STATUS_LABELS[state.family.status]}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: 'hsla(var(--c-surface2), 0.4)', borderRadius: 6 }}>
                  <div style={{ fontSize: 18 }}>👶</div>
                  <div style={{ color: 'hsl(var(--c-text-3))', marginTop: 2 }}>Hijos</div>
                  <div style={{ fontWeight: 700 }}>{state.family.kids.length}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: 'hsla(var(--c-surface2), 0.4)', borderRadius: 6 }}>
                  <div style={{ fontSize: 18 }}>🤝</div>
                  <div style={{ color: 'hsl(var(--c-text-3))', marginTop: 2 }}>Clubs</div>
                  <div style={{ fontWeight: 700 }}>{state.socialClubs.length}</div>
                </div>
              </div>
            </GlassCard>

            {/* Life Events log */}
            {state.lifeEvents.length > 0 && (
              <GlassCard style={{ padding: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))', marginBottom: 10 }}>HISTORIAL DE VIDA</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {state.lifeEvents.slice(0, 8).map((ev, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 8px', background: 'hsla(var(--c-surface2), 0.3)', borderRadius: 5 }}>
                      <span style={{ fontSize: 14 }}>{ev.icon}</span>
                      <span style={{ fontSize: 11, color: 'hsl(var(--c-text-2))' }}>{ev.text}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* ── HOGAR (real estate) ───────────────────────────── */}
        {tab === 'hogar' && (
          <AssetGrid
            assets={PERSONAL_ASSETS.filter(a => a.category === 'realEstate')}
            owned={state.assets}
            cash={state.cash}
            companyLevel={companyLevel}
            onBuy={buyPersonalAsset}
            buyLabel="Comprar Propiedad"
          />
        )}

        {/* ── GARAJE (vehicles) ─────────────────────────────── */}
        {tab === 'garaje' && (
          <AssetGrid
            assets={PERSONAL_ASSETS.filter(a => a.category === 'vehicle')}
            owned={state.assets}
            cash={state.cash}
            companyLevel={companyLevel}
            onBuy={buyPersonalAsset}
            buyLabel="Comprar Vehículo"
          />
        )}

        {/* ── COLECCIÓN (luxury + art) ──────────────────────── */}
        {tab === 'coleccion' && (
          <AssetGrid
            assets={PERSONAL_ASSETS.filter(a => a.category === 'luxury' || a.category === 'art')}
            owned={state.assets}
            cash={state.cash}
            companyLevel={companyLevel}
            onBuy={buyPersonalAsset}
            buyLabel="Adquirir"
          />
        )}

        {/* ── FAMILIA ───────────────────────────────────────── */}
        {tab === 'familia' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Partner card */}
            <GlassCard style={{ padding: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))', marginBottom: 12 }}>VIDA ROMÁNTICA</div>

              {state.family.status === 'single' || state.family.status === 'divorced' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 40 }}>💌</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>Buscar Pareja</div>
                      <div style={{ fontSize: 12, color: 'hsl(var(--c-text-3))' }}>Las citas de lujo abren puertas y reducen el estrés.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'hsla(var(--c-surface2), 0.4)', borderRadius: 6 }}>
                    <span style={{ fontSize: 12 }}>Coste de citas</span>
                    <span className="font-mono" style={{ fontWeight: 700 }}>Đ50,000</span>
                  </div>
                  <ActionButton variant="primary" onClick={proposePartner} disabled={state.cash < 50000}>
                    💌 Invitar a una Cena Exclusiva (Đ50K)
                  </ActionButton>
                </div>
              ) : state.family.status === 'dating' && state.family.partner ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{state.family.partner.name}</div>
                      <div style={{ fontSize: 12, color: 'hsl(var(--c-text-3))', marginTop: 2 }}>
                        {personalManager.getPersonalityLabel(state.family.partner.personality)}
                      </div>
                    </div>
                    <Badge color="hsl(var(--c-primary))">EN PAREJA</Badge>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span>Satisfacción</span>
                      <span className="font-mono">{state.family.partner.satisfaction.toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={state.family.partner.satisfaction} max={100} height={8}
                      color={state.family.partner.satisfaction > 60 ? 'hsl(var(--c-success))' : state.family.partner.satisfaction > 30 ? 'hsl(var(--c-warning))' : 'hsl(var(--c-danger))'} />
                  </div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))' }}>
                    Gastos: <span className="font-mono" style={{ color: 'hsl(var(--c-danger))' }}>Đ{formatNumber(state.family.partner.monthlyExpenses)}/mes</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <ActionButton variant="success" onClick={marry} disabled={state.cash < 200000} style={{ flex: 1 }}>
                      💍 Proponer Matrimonio (Đ200K)
                    </ActionButton>
                    <ActionButton variant="danger" onClick={divorce}>
                      💔 Terminar Relación
                    </ActionButton>
                  </div>
                </div>
              ) : state.family.status === 'married' && state.family.partner ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{state.family.partner.name}</div>
                      <div style={{ fontSize: 12, color: 'hsl(var(--c-text-3))', marginTop: 2 }}>
                        {personalManager.getPersonalityLabel(state.family.partner.personality)}
                      </div>
                    </div>
                    <Badge color="hsl(var(--c-success))">CASADO/A</Badge>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span>Satisfacción conyugal</span>
                      <span className="font-mono">{state.family.partner.satisfaction.toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={state.family.partner.satisfaction} max={100} height={8}
                      color={state.family.partner.satisfaction > 60 ? 'hsl(var(--c-success))' : state.family.partner.satisfaction > 30 ? 'hsl(var(--c-warning))' : 'hsl(var(--c-danger))'} />
                    <div style={{ fontSize: 10, color: 'hsl(var(--c-text-3))', marginTop: 3 }}>
                      La satisfacción baja si tienes mucho estrés. Reduce el estrés con lujos y experiencias.
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))' }}>
                    Gastos conyugales: <span className="font-mono" style={{ color: 'hsl(var(--c-danger))' }}>Đ{formatNumber(state.family.partner.monthlyExpenses)}/mes</span>
                  </div>
                  <ActionButton variant="danger" onClick={divorce} style={{ alignSelf: 'flex-start' }}>
                    ⚖️ Solicitar Divorcio (30% del patrimonio personal)
                  </ActionButton>
                </div>
              ) : null}
            </GlassCard>

            {/* Children */}
            <GlassCard style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 11, letterSpacing: 1, color: 'hsl(var(--c-text-3))' }}>HIJOS ({state.family.kids.length}/5)</div>
                {state.family.status === 'married' && state.family.kids.length < 5 && (
                  <ActionButton variant="primary" size="sm" onClick={haveChild} disabled={state.cash < 100000}>
                    👶 Tener Hijo (Đ100K)
                  </ActionButton>
                )}
              </div>

              {state.family.kids.length === 0 ? (
                <div style={{ fontSize: 12, color: 'hsl(var(--c-text-3))', textAlign: 'center', padding: '20px 0' }}>
                  {state.family.status === 'married' ? 'Sin hijos todavía. El momento perfecto está a un clic.' : 'Primero debes casarte para tener hijos.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {state.family.kids.map((kid, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'hsla(var(--c-surface2), 0.4)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 24 }}>
                          {kid.age < 5 ? '👶' : kid.age < 12 ? '🧒' : kid.age < 18 ? '👦' : '👨'}
                        </span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{kid.name}</div>
                          <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))' }}>
                            {kid.age} años · Educación: <span style={{ color: EDUCATION_COLORS[kid.education] }}>{EDUCATION_LABELS[kid.education]}</span>
                          </div>
                          <div style={{ fontSize: 10, color: 'hsl(var(--c-danger))' }}>Đ{formatNumber(kid.monthlyCost)}/mes</div>
                        </div>
                      </div>
                      {kid.education !== 'elite' && (
                        <ActionButton size="sm" variant="primary" onClick={() => upgradeChildEducation(idx)}
                          disabled={state.cash < (kid.education === 'public' ? 20000 : 100000)}>
                          🎓 {kid.education === 'public' ? 'Privada (Đ20K)' : 'Élite (Đ100K)'}
                        </ActionButton>
                      )}
                      {kid.education === 'elite' && <Badge color="hsl(var(--c-secondary))">ÉLITE ✓</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {/* ── CLUBS SOCIALES ────────────────────────────────── */}
        {tab === 'clubs' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {SOCIAL_CLUBS.map(club => {
              const isMember = state.socialClubs.includes(club.id);
              const canJoin = state.prestige >= club.minPrestige && state.cash >= club.joinFee;
              const locked = state.prestige < club.minPrestige;
              return (
                <GlassCard key={club.id} style={{
                  display: 'flex', flexDirection: 'column', gap: 12,
                  opacity: locked ? 0.5 : 1,
                  border: isMember ? '1px solid hsl(var(--c-success))' : undefined,
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 36 }}>{club.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>{club.name}</div>
                        {isMember && <Badge color="hsl(var(--c-success))">MIEMBRO</Badge>}
                      </div>
                      <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))', marginTop: 2 }}>{club.description}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, background: 'hsla(var(--c-surface2), 0.4)', padding: 8, borderRadius: 6 }}>
                    <div><span style={{ color: 'hsl(var(--c-text-3))' }}>Cuota entrada: </span><span className="font-mono">Đ{formatNumber(club.joinFee)}</span></div>
                    <div><span style={{ color: 'hsl(var(--c-text-3))' }}>Mensual: </span><span className="font-mono" style={{ color: 'hsl(var(--c-danger))' }}>-Đ{formatNumber(club.monthlyFee)}</span></div>
                    <div><span style={{ color: 'hsl(var(--c-text-3))' }}>Prestigio: </span><span style={{ color: 'hsl(var(--c-secondary))' }}>+{club.prestige}</span></div>
                    <div><span style={{ color: 'hsl(var(--c-text-3))' }}>Mín. requerido: </span><span>{club.minPrestige}</span></div>
                  </div>

                  <div style={{ fontSize: 11 }}>
                    <div style={{ color: 'hsl(var(--c-text-3))', marginBottom: 4 }}>BENEFICIOS:</div>
                    {club.perks.map((p, i) => (
                      <div key={i} style={{ padding: '2px 0', color: 'hsl(var(--c-text-2))' }}>· {p}</div>
                    ))}
                  </div>

                  {locked ? (
                    <div style={{ textAlign: 'center', fontSize: 11, color: 'hsl(var(--c-text-3))', padding: '6px 0' }}>
                      🔒 Requiere {club.minPrestige} de prestigio (tienes {Math.floor(state.prestige)})
                    </div>
                  ) : isMember ? (
                    <ActionButton variant="danger" size="sm" onClick={() => quitSocialClub(club.id)}>
                      Abandonar Club
                    </ActionButton>
                  ) : (
                    <ActionButton variant="primary" onClick={() => joinSocialClub(club.id)} disabled={!canJoin}>
                      Unirse (Đ{formatNumber(club.joinFee)})
                    </ActionButton>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* ── EXPERIENCIAS ──────────────────────────────────── */}
        {tab === 'experiencias' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {LUXURY_EXPERIENCES.map(exp => {
              const lastUsed = state.experienceCooldowns[exp.id] ?? 0;
              const daysLeft = Math.max(0, exp.cooldownDays - (currentDay - lastUsed));
              const onCooldown = lastUsed > 0 && daysLeft > 0;
              const canAfford = state.cash >= exp.cost;

              return (
                <GlassCard key={exp.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 36 }}>{exp.icon}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{exp.name}</div>
                      <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))', marginTop: 2 }}>{exp.description}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, background: 'hsla(var(--c-surface2), 0.4)', padding: 8, borderRadius: 6 }}>
                    <div><span style={{ color: 'hsl(var(--c-text-3))' }}>Coste: </span><span className="font-mono">Đ{formatNumber(exp.cost)}</span></div>
                    <div><span style={{ color: 'hsl(var(--c-text-3))' }}>Recarga: </span><span>{exp.cooldownDays}d</span></div>
                    <div style={{ color: 'hsl(var(--c-success))' }}>+{exp.happinessBoost} Felicidad</div>
                    <div style={{ color: 'hsl(var(--c-primary))' }}>-{exp.stressRelief}% Estrés</div>
                  </div>

                  {onCooldown ? (
                    <div style={{ textAlign: 'center', padding: '8px', background: 'hsla(var(--c-surface2), 0.3)', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))' }}>⏳ Disponible en</div>
                      <div className="font-mono" style={{ fontSize: 14, fontWeight: 700 }}>{Math.ceil(daysLeft)} días</div>
                    </div>
                  ) : (
                    <ActionButton variant="success" onClick={() => buyExperience(exp.id)} disabled={!canAfford}>
                      ✨ Disfrutar (Đ{formatNumber(exp.cost)})
                    </ActionButton>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Asset Grid (shared component for real estate / vehicles / luxury)
// ─────────────────────────────────────────────────────────────
function AssetGrid({ assets, owned, cash, companyLevel, onBuy, buyLabel }: {
  assets: ReturnType<typeof PERSONAL_ASSETS.filter>;
  owned: string[];
  cash: number;
  companyLevel: number;
  onBuy: (id: string) => void;
  buyLabel: string;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {assets.map(asset => {
        const isOwned = owned.includes(asset.id);
        const locked = (asset.unlockLevel ?? 1) > companyLevel;
        const canAfford = cash >= asset.cost;

        return (
          <GlassCard key={asset.id} style={{
            display: 'flex', flexDirection: 'column', gap: 12,
            opacity: locked ? 0.45 : isOwned ? 0.75 : 1,
            border: isOwned ? '1px solid hsl(var(--c-success))' : undefined,
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 36 }}>{asset.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{asset.name}</div>
                  {isOwned && <Badge color="hsl(var(--c-success))">EN PROPIEDAD</Badge>}
                </div>
                <div style={{ fontSize: 11, color: 'hsl(var(--c-text-3))', marginTop: 2 }}>{asset.description}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, background: 'hsla(var(--c-surface2), 0.4)', padding: 8, borderRadius: 6 }}>
              <div>
                <div style={{ color: 'hsl(var(--c-text-3))' }}>P. Compra</div>
                <div className="font-mono" style={{ fontWeight: 800 }}>Đ{formatNumber(asset.cost)}</div>
              </div>
              <div>
                <div style={{ color: 'hsl(var(--c-text-3))' }}>Mant. mensual</div>
                <div className="font-mono" style={{ fontWeight: 800, color: 'hsl(var(--c-danger))' }}>-Đ{formatNumber(asset.monthlyMaintenance)}</div>
              </div>
              <div style={{ color: 'hsl(var(--c-success))' }}>+{asset.happinessBoost} Felicidad</div>
              <div style={{ color: 'hsl(var(--c-secondary))' }}>+{asset.prestige} Prestigio</div>
            </div>

            {locked ? (
              <div style={{ textAlign: 'center', fontSize: 11, color: 'hsl(var(--c-text-3))', padding: '6px 0' }}>
                🔒 Requiere empresa nivel {asset.unlockLevel}
              </div>
            ) : isOwned ? (
              <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'hsl(var(--c-success))', padding: '6px 0' }}>
                ✓ Propiedad tuya
              </div>
            ) : (
              <ActionButton variant="primary" onClick={() => onBuy(asset.id)} disabled={!canAfford} style={{ width: '100%', marginTop: 'auto' }}>
                {buyLabel} (Đ{formatNumber(asset.cost)})
              </ActionButton>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}
