import { useRef, useState, useMemo } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export interface Building {
  id: string;
  name: string;
  building_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  scale_y: number;
  base_price: number;
  cps_base: number;
  level: number;
  owner_id?: string | null;
  owner_name?: string | null;
  owner_clan_color?: string | null;
  owner_clan_tag?: string | null;
  display_image_url?: string | null;
  display_text?: string | null;
  for_sale?: boolean;
  sale_price?: number | null;
  passive_bonus_type?: string;
  passive_bonus_value?: number;
}

interface Props {
  building: Building;
  selected: boolean;
  onSelect: (b: Building) => void;
}

const TYPE_CONFIG: Record<string, { color: string; accent: string; w: number; d: number }> = {
  skyscraper: { color: "#060d1a", accent: "#00d4ff", w: 3.2, d: 3.2 },
  bank:       { color: "#0e0900", accent: "#f59e0b", w: 4.0, d: 4.0 },
  mall:       { color: "#030f09", accent: "#10b981", w: 5.0, d: 5.0 },
  office:     { color: "#0a0614", accent: "#8b5cf6", w: 3.6, d: 3.6 },
  factory:    { color: "#0f0600", accent: "#f97316", w: 4.5, d: 4.5 },
  landmark:   { color: "#0c0410", accent: "#f43f5e", w: 5.0, d: 5.0 },
};

// Randomly lit windows on the front face
function WindowFace({ h, w, d, color }: { h: number; w: number; d: number; color: string }) {
  const windows = useMemo(() => {
    const cols = Math.max(2, Math.floor(w / 0.75));
    const rows = Math.max(2, Math.floor(h / 0.8));
    const result: { x: number; y: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.45) {
          result.push({
            x: -w / 2 + 0.35 + c * ((w - 0.5) / Math.max(1, cols - 1)),
            y: 0.6 + r * ((h - 0.8) / Math.max(1, rows - 1)),
          });
        }
      }
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);

  return (
    <>
      {windows.map((win, i) => (
        <mesh key={i} position={[win.x, win.y, d / 2 + 0.02]}>
          <planeGeometry args={[0.16, 0.24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.95} transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  );
}

export default function BuildingMesh({ building, selected, onSelect }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const cfg = TYPE_CONFIG[building.building_type] ?? TYPE_CONFIG.office;
  const accent = building.owner_clan_color ?? cfg.accent;
  const h = building.scale_y;
  const w = cfg.w;
  const d = cfg.d;
  const isTall = building.building_type === "skyscraper" || building.building_type === "landmark";

  return (
    <group
      ref={groupRef}
      position={[building.position_x, 0, building.position_z]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(building); }}
    >
      {/* Base plinth */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[w + 0.8, 0.3, d + 0.8]} />
        <meshStandardMaterial color="#08101e" metalness={0.6} roughness={0.6} />
      </mesh>

      {/* Main body */}
      <mesh position={[0, h / 2 + 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={selected ? "#0d1c34" : hovered ? "#0a1628" : cfg.color}
          emissive={accent}
          emissiveIntensity={selected ? 0.2 : hovered ? 0.08 : 0.02}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>

      {/* Lit windows on front face */}
      <group position={[0, 0.3, 0]}>
        <WindowFace h={h} w={w} d={d} color="#fffde0" />
      </group>

      {/* 4 corner accent strips */}
      {([[-w / 2, d / 2], [w / 2, d / 2], [-w / 2, -d / 2], [w / 2, -d / 2]] as [number, number][]).map(([cx, cz], i) => (
        <mesh key={i} position={[cx, h / 2 + 0.3, cz]}>
          <boxGeometry args={[0.07, h + 0.15, 0.07]} />
          <meshStandardMaterial
            color={accent} emissive={accent}
            emissiveIntensity={selected ? 1.4 : hovered ? 0.7 : 0.3}
          />
        </mesh>
      ))}

      {/* Rooftop cap */}
      <mesh position={[0, h + 0.31, 0]}>
        <boxGeometry args={[w, 0.1, d]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={selected ? 1.8 : hovered ? 1.0 : 0.5} />
      </mesh>

      {/* Ground-level neon strip */}
      <mesh position={[0, 0.31, 0]}>
        <boxGeometry args={[w + 0.15, 0.05, d + 0.15]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={selected ? 1.0 : 0.35} transparent opacity={0.7} />
      </mesh>

      {/* Antenna for tall buildings */}
      {isTall && h > 8 && (
        <>
          <mesh position={[0, h + 0.3 + h * 0.18, 0]}>
            <cylinderGeometry args={[0.035, 0.07, h * 0.35, 5]} />
            <meshStandardMaterial color="#1a2338" metalness={0.9} roughness={0.15} />
          </mesh>
          <mesh position={[0, h + 0.3 + h * 0.36, 0]}>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshStandardMaterial color="#ff2255" emissive="#ff2255" emissiveIntensity={1.2} />
          </mesh>
        </>
      )}

      {/* Clan tag badge */}
      {building.owner_clan_tag && (
        <Html position={[0, h * 0.65 + 0.3, d / 2 + 0.3]} distanceFactor={24} transform occlude>
          <div style={{
            background: "rgba(0,0,0,0.88)", border: `1px solid ${accent}55`,
            borderRadius: 4, padding: "2px 7px", fontSize: 8,
            color: accent, fontWeight: 800, letterSpacing: 1, whiteSpace: "nowrap",
          }}>
            [{building.owner_clan_tag}]
          </div>
        </Html>
      )}

      {/* Tooltip on hover/select */}
      {(hovered || selected) && (
        <Html position={[0, h + 1.5, 0]} center distanceFactor={30}>
          <div style={{
            background: "rgba(4,6,14,0.96)", border: `1px solid ${accent}99`,
            borderRadius: 10, padding: "8px 12px", fontSize: 11, color: "#eef2f8",
            whiteSpace: "nowrap", backdropFilter: "blur(16px)",
            boxShadow: `0 0 20px ${accent}44`,
            pointerEvents: "none",
          }}>
            <div style={{ fontWeight: 800, color: accent, marginBottom: 3 }}>{building.name}</div>
            {building.owner_name
              ? <div style={{ color: "#94a3b8" }}>👤 {building.owner_name}</div>
              : <div style={{ color: "#475569", fontStyle: "italic" }}>Sin dueño · ¡puja!</div>
            }
            {building.passive_bonus_type && (
              <div style={{ color: "#10b981", marginTop: 3, fontSize: 10 }}>
                ✦ {building.passive_bonus_type.replace(/_/g, " ")} +{building.passive_bonus_value}
              </div>
            )}
            {selected && (
              <div style={{ color: "#f59e0b", marginTop: 4, fontSize: 9, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 4 }}>
                Haz click de nuevo para pujar →
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
