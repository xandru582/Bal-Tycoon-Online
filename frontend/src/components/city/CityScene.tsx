import { Suspense, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Grid } from "@react-three/drei";
import * as THREE from "three";
import BuildingMesh, { Building } from "./BuildingMesh";
import AuctionPanel from "./AuctionPanel";

interface Props {
  buildings: Building[];
  onBidPlaced?: () => void;
}

// Animated roaming light that simulates a passing vehicle
function CityLight() {
  const ref = useRef<THREE.PointLight>(null!);
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta * 0.15;
    if (ref.current) {
      ref.current.position.x = Math.sin(t.current) * 40;
      ref.current.position.z = Math.cos(t.current * 0.7) * 40;
    }
  });
  return <pointLight ref={ref} position={[0, 3, 0]} intensity={12} color="#ff6030" distance={25} decay={2} />;
}

import { useRef } from "react";

export default function CityScene({ buildings, onBidPlaced }: Props) {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.9 }}
        camera={{ position: [42, 28, 42], fov: 48 }}
        style={{ background: "#03050e" }}
      >
        <Suspense fallback={null}>
          {/* Atmosphere */}
          <fog attach="fog" args={["#03050e", 60, 200]} />
          <color attach="background" args={["#03050e"]} />

          {/* Lighting — nocturnal city */}
          <ambientLight intensity={0.08} color="#1a2a4a" />
          <directionalLight
            position={[30, 60, 30]} intensity={0.6} color="#b0c8ff"
            castShadow shadow-mapSize={[2048, 2048]}
            shadow-camera-far={200} shadow-camera-near={0.5}
          />
          {/* Cool moonlight fill from opposite side */}
          <directionalLight position={[-40, 30, -40]} intensity={0.25} color="#4060a0" />
          {/* Warm city center glow */}
          <pointLight position={[0, 2, 0]} intensity={8} color="#ff8c30" distance={60} decay={2} />
          {/* Cyan tech light */}
          <pointLight position={[20, 15, 20]} intensity={6} color="#00aaff" distance={50} decay={2} />
          {/* Moving light */}
          <CityLight />

          {/* Stars — lots of them */}
          <Stars radius={200} depth={80} count={6000} factor={5} fade speed={0.5} />

          {/* Ground — wet asphalt look */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, -0.01, 0]}>
            <planeGeometry args={[400, 400]} />
            <meshStandardMaterial color="#050810" metalness={0.7} roughness={0.15} />
          </mesh>

          {/* City grid streets */}
          <Grid
            args={[200, 200]}
            cellSize={6}
            cellThickness={0.25}
            cellColor="#0d1a30"
            sectionSize={24}
            sectionThickness={0.7}
            sectionColor="#102040"
            fadeDistance={130}
            fadeStrength={1.2}
            position={[0, 0.01, 0]}
          />

          {/* Buildings */}
          {buildings.map(b => (
            <BuildingMesh
              key={b.id}
              building={b}
              selected={selectedBuilding?.id === b.id}
              onSelect={setSelectedBuilding}
            />
          ))}

          {/* Camera controls */}
          <OrbitControls
            maxPolarAngle={Math.PI / 2.15}
            minDistance={8}
            maxDistance={110}
            target={[0, 4, 0]}
            enableDamping
            dampingFactor={0.06}
          />
        </Suspense>
      </Canvas>

      {/* Auction overlay panel */}
      {selectedBuilding && (
        <AuctionPanel
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
          onBidPlaced={() => { onBidPlaced?.(); setSelectedBuilding(null); }}
        />
      )}

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 16, left: 16,
        display: "flex", gap: 8, flexWrap: "wrap",
      }}>
        {[
          ["skyscraper", "#00d4ff", "Torre"],
          ["bank", "#f59e0b", "Banco"],
          ["mall", "#10b981", "Centro Com."],
          ["office", "#8b5cf6", "Oficina"],
          ["factory", "#f97316", "Fábrica"],
          ["landmark", "#f43f5e", "Monumento"],
        ].map(([, color, label]) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 8px", borderRadius: 6,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 10, color: "#aaa" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Click hint */}
      <div style={{
        position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
        padding: "6px 14px", borderRadius: 20,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.08)",
        fontSize: 11, color: "var(--text-muted)",
      }}>
        Clic en un edificio para ver detalles y pujar
      </div>
    </div>
  );
}
