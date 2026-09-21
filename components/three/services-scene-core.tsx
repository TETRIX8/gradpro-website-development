'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Lightformer } from '@react-three/drei'
import * as THREE from 'three'

const damp = THREE.MathUtils.damp

const ACCENTS = ['#c8ff1f', '#a78bfa', '#4f7cff', '#c8ff1f', '#a78bfa', '#4f7cff']

function Chrome({ color = '#e0e2ea', roughness = 0.16 }: { color?: string; roughness?: number }) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={0.92}
      roughness={roughness}
      clearcoat={1}
      clearcoatRoughness={0.05}
      envMapIntensity={1.5}
    />
  )
}

/** Six meshes; the active one scales in while others collapse — a morph-like swap. */
function Morpher({ active }: { active: number }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  const light = useRef<THREE.PointLight>(null)
  const color = useRef(new THREE.Color(ACCENTS[0]))

  useFrame((state, delta) => {
    refs.current.forEach((g, i) => {
      if (!g) return
      const target = i === active ? 1 : 0
      const s = damp(g.scale.x, target, 5, delta)
      g.scale.setScalar(Math.max(0.0001, s))
      g.rotation.y += delta * (i === active ? 0.35 : 0.1)
      g.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.15
    })
    if (light.current) {
      color.current.lerp(new THREE.Color(ACCENTS[active % ACCENTS.length]), 1 - Math.exp(-4 * delta))
      light.current.color.copy(color.current)
    }
  })

  return (
    <>
      <pointLight ref={light} intensity={8} position={[0, -0.6, 1.4]} distance={5} />
      <group ref={(el) => { refs.current[0] = el }}>
        <mesh>
          <torusKnotGeometry args={[0.85, 0.3, 200, 36, 2, 3]} />
          <Chrome />
        </mesh>
      </group>
      <group ref={(el) => { refs.current[1] = el }}>
        {[-1, 0, 1].map((i) => (
          <mesh key={i} position={[i * 0.35, -i * 0.3, i * 0.4]} rotation={[0, 0, i * 0.2]}>
            <boxGeometry args={[2.2, 1.3, 0.1]} />
            <Chrome color={i === 0 ? '#e7e9f0' : '#9497a8'} roughness={0.2} />
          </mesh>
        ))}
      </group>
      <group ref={(el) => { refs.current[2] = el }}>
        <mesh>
          <icosahedronGeometry args={[1.25, 1]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={0.9}
            thickness={1.4}
            ior={1.4}
            roughness={0.08}
            attenuationColor="#4f7cff"
            attenuationDistance={2}
            envMapIntensity={1.6}
          />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.55, 0]} />
          <Chrome />
        </mesh>
      </group>
      <group ref={(el) => { refs.current[3] = el }}>
        <mesh rotation={[0.6, 0, 0]}>
          <torusGeometry args={[1.05, 0.3, 48, 140]} />
          <Chrome color="#c9ccd8" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.45, 48, 48]} />
          <meshBasicMaterial color="#c8ff1f" toneMapped={false} />
        </mesh>
      </group>
      <group ref={(el) => { refs.current[4] = el }}>
        <mesh rotation={[0.4, 0.5, 0]}>
          <boxGeometry args={[1.6, 1.6, 1.6]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={0.92}
            thickness={1.8}
            ior={1.5}
            roughness={0.05}
            attenuationColor="#a78bfa"
            attenuationDistance={2.5}
            envMapIntensity={1.6}
          />
        </mesh>
        <mesh rotation={[0.4, 0.5, 0]}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <Chrome />
        </mesh>
      </group>
      <group ref={(el) => { refs.current[5] = el }}>
        <mesh>
          <capsuleGeometry args={[0.5, 1.4, 12, 48]} />
          <Chrome />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.25, 0.02, 12, 120]} />
          <meshBasicMaterial color="#4f7cff" toneMapped={false} />
        </mesh>
      </group>
    </>
  )
}

function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y = damp(group.current.rotation.y, state.pointer.x * 0.35, 3, delta)
    group.current.rotation.x = damp(group.current.rotation.x, -state.pointer.y * 0.25, 3, delta)
  })
  return <group ref={group}>{children}</group>
}

export function ServicesSceneCore({
  active,
  low,
  paused = false,
}: {
  active: number
  low: boolean
  paused?: boolean
}) {
  return (
    <Canvas
      frameloop={paused ? 'never' : 'always'}
      dpr={low ? [1, 1] : [1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 38 }}
      gl={{ antialias: !low, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <Environment resolution={256} frames={1} background={false}>
        <Lightformer intensity={0.6} color="#5a5e70" scale={[40, 40, 1]} position={[0, 0, -12]} />
        <Lightformer intensity={0.5} color="#3a3d4a" scale={[40, 40, 1]} position={[0, 0, 12]} rotation={[0, Math.PI, 0]} />
        <Lightformer intensity={3} color="#c8ff1f" position={[-5, 2, -2]} rotation={[0, Math.PI / 3, 0]} scale={[6, 3, 1]} />
        <Lightformer intensity={2.5} color="#a78bfa" position={[5, -1, -1]} rotation={[0, -Math.PI / 3, 0]} scale={[5, 4, 1]} />
        <Lightformer intensity={5} color="#ffffff" position={[0, 5, 1]} rotation={[-Math.PI / 2, 0, 0]} scale={[4, 2, 1]} />
      </Environment>
      <Rig>
        <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.7}>
          <Morpher active={active} />
        </Float>
      </Rig>
    </Canvas>
  )
}
