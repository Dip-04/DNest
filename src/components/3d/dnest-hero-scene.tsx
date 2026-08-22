"use client";

import { ContactShadows, Float, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useSyncExternalStore } from "react";
import type { Group } from "three";

function subscribeMedia(listener: () => void) {
  const query = matchMedia(
    "(max-width: 767px), (prefers-reduced-motion: reduce)",
  );
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function NestModel({ dark }: { dark: boolean }) {
  const group = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y +=
      (state.pointer.x * 0.16 - group.current.rotation.y) *
      Math.min(delta * 3, 1);
    group.current.rotation.x +=
      (-state.pointer.y * 0.07 - group.current.rotation.x) *
      Math.min(delta * 3, 1);
  });

  const branch = dark ? "#6f5262" : "#8b6856";
  const branchLight = dark ? "#a87887" : "#b98b6e";
  const room = dark ? "#252332" : "#f2dfcf";
  return (
    <group ref={group} rotation={[-0.08, -0.18, 0]}>
      <group scale={[1.35, 0.7, 1]} rotation={[Math.PI / 2, 0, 0]}>
        {Array.from({ length: 11 }, (_, index) => (
          <mesh
            key={index}
            rotation={[0, 0, index * 0.29]}
            position={[0, 0, (index % 3) * 0.045 - 0.05]}
          >
            <torusGeometry
              args={[
                1.48 + (index % 4) * 0.055,
                0.035 + (index % 2) * 0.012,
                8,
                72,
              ]}
            />
            <meshStandardMaterial
              color={index % 2 ? branch : branchLight}
              roughness={0.82}
            />
          </mesh>
        ))}
      </group>
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <cylinderGeometry args={[1.08, 1.27, 0.18, 48]} />
        <meshStandardMaterial color={room} roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.03, 0.18]} castShadow>
        <boxGeometry args={[1.15, 0.46, 0.5]} />
        <meshStandardMaterial
          color={dark ? "#8e6576" : "#b97a87"}
          roughness={0.72}
        />
      </mesh>
      <mesh position={[0, 0.24, 0.36]} castShadow>
        <boxGeometry args={[1.12, 0.22, 0.18]} />
        <meshStandardMaterial color={dark ? "#76546f" : "#d9a5a8"} />
      </mesh>
      <mesh position={[-0.34, 0.25, 0.47]} castShadow>
        <sphereGeometry args={[0.17, 24, 16]} />
        <meshStandardMaterial color="#e7c4a2" />
      </mesh>
      <mesh position={[0.34, 0.25, 0.47]} castShadow>
        <sphereGeometry args={[0.17, 24, 16]} />
        <meshStandardMaterial color="#9d839f" />
      </mesh>
      <group position={[0.86, 0.23, -0.16]}>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.09, 0.13, 0.62, 20]} />
          <meshStandardMaterial color={branch} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <coneGeometry args={[0.3, 0.42, 32, 1, true]} />
          <meshStandardMaterial
            color={dark ? "#dca081" : "#e3b98d"}
            emissive={dark ? "#a66a52" : "#5d321f"}
            emissiveIntensity={dark ? 1.3 : 0.25}
            side={2}
          />
        </mesh>
        <pointLight
          position={[0, 0.1, 0]}
          color="#ffd1a0"
          intensity={dark ? 2.3 : 0.65}
          distance={3}
        />
      </group>
      <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.15}>
        <mesh
          position={[-1.18, 0.72, -0.18]}
          rotation={[0, 0.2, -0.12]}
          castShadow
        >
          <boxGeometry args={[0.58, 0.72, 0.04]} />
          <meshStandardMaterial color="#f7efe7" roughness={0.9} />
          <mesh position={[0, 0.03, 0.025]}>
            <planeGeometry args={[0.43, 0.45]} />
            <meshBasicMaterial color={dark ? "#836b86" : "#c79983"} />
          </mesh>
        </mesh>
      </Float>
      <Float speed={0.9} rotationIntensity={0.06} floatIntensity={0.12}>
        <mesh
          position={[1.3, 0.85, 0.12]}
          rotation={[0, -0.22, 0.1]}
          castShadow
        >
          <boxGeometry args={[0.5, 0.62, 0.04]} />
          <meshStandardMaterial color="#f7efe7" />
          <mesh position={[0, 0.03, 0.025]}>
            <planeGeometry args={[0.36, 0.36]} />
            <meshBasicMaterial color={dark ? "#a0717c" : "#aeb9a3"} />
          </mesh>
        </mesh>
      </Float>
    </group>
  );
}

export default function DnestHeroScene() {
  const simplify = useSyncExternalStore(
    subscribeMedia,
    () =>
      matchMedia("(max-width: 767px), (prefers-reduced-motion: reduce)")
        .matches,
    () => true,
  );
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "dark";
  if (simplify)
    return (
      <div className="nest-fallback" aria-hidden>
        <span />
        <span />
        <span />
        <i />
      </div>
    );
  return (
    <Canvas
      dpr={[1, 1.35]}
      camera={{ position: [0, 1.15, 5.4], fov: 39 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={dark ? 0.65 : 1.2} />
      <directionalLight
        castShadow
        position={[-3, 5, 4]}
        intensity={dark ? 1.2 : 2.2}
        color={dark ? "#b7b5e6" : "#fff0d5"}
      />
      <pointLight
        position={[3, 2, 2]}
        intensity={dark ? 1.8 : 0.7}
        color="#db8e82"
      />
      <NestModel dark={dark} />
      <Sparkles
        count={dark ? 34 : 18}
        scale={[5, 3, 3]}
        size={1.4}
        speed={0.18}
        color={dark ? "#ffd7a5" : "#b97a87"}
      />
      <ContactShadows
        position={[0, -1.18, 0]}
        opacity={dark ? 0.42 : 0.22}
        scale={6}
        blur={2.4}
        far={3}
      />
    </Canvas>
  );
}
