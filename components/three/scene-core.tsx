'use client'

import { useEffect, useRef } from 'react'
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber'
import {
  Environment,
  Float,
  Lightformer,
  MeshDistortMaterial,
} from '@react-three/drei'
import * as THREE from 'three'

export type ShapeVariant = 'blob' | 'sphere' | 'slabs' | 'portal' | 'ring' | 'cube'

type SceneProps = {
  variant?: ShapeVariant
  /** 0–1 overall intensity; mobile passes a lower value */
  quality?: 'high' | 'low'
  reduced?: boolean
  /** Parallax multiplier for scroll-driven vertical drift */
  parallax?: number
  className?: string
  interactive?: boolean
  /** Stop the render loop while off-screen */
  paused?: boolean
}

const damp = THREE.MathUtils.damp

/** Studio-like environment built from Lightformers — no external HDR fetch. */
function Studio() {
  return (
    <Environment resolution={256} frames={1} background={false}>
      {/* soft grey dome so chrome never reads as pure black */}
      <Lightformer intensity={0.6} color="#5a5e70" scale={[40, 40, 1]} position={[0, 0, -12]} />
      <Lightformer intensity={0.5} color="#3a3d4a" scale={[40, 40, 1]} position={[0, 0, 12]} rotation={[0, Math.PI, 0]} />
      <Lightformer
        intensity={3}
        color="#c8ff1f"
        position={[-5, 2, -2]}
        rotation={[0, Math.PI / 3, 0]}
        scale={[6, 3, 1]}
      />
      <Lightformer
        intensity={2.5}
        color="#a78bfa"
        position={[5, -1, -1]}
        rotation={[0, -Math.PI / 3, 0]}
        scale={[5, 4, 1]}
      />
      <Lightformer
        intensity={1.5}
        color="#4f7cff"
        position={[0, -5, 2]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[6, 6, 1]}
      />
      <Lightformer
        intensity={5}
        color="#ffffff"
        position={[0, 5, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[4, 2, 1]}
      />
    </Environment>
  )
}

function Chrome(props: ThreeElements['meshPhysicalMaterial']) {
  return (
    <meshPhysicalMaterial
      color="#e0e2ea"
      metalness={0.92}
      roughness={0.16}
      clearcoat={1}
      clearcoatRoughness={0.1}
      envMapIntensity={1.3}
      {...props}
    />
  )
}

function Glass(props: ThreeElements['meshPhysicalMaterial']) {
  return (
    <meshPhysicalMaterial
      color="#ffffff"
      transmission={0.95}
      thickness={1.6}
      ior={1.45}
      roughness={0.05}
      metalness={0}
      clearcoat={1}
      envMapIntensity={1.8}
      attenuationColor="#a78bfa"
      attenuationDistance={2.5}
      {...props}
    />
  )
}

function Shape({ variant, low }: { variant: ShapeVariant; low: boolean }) {
  switch (variant) {
    case 'sphere':
      return (
        <group>
          <mesh>
            <sphereGeometry args={[1.15, low ? 48 : 96, low ? 48 : 96]} />
            <Glass />
          </mesh>
          <mesh rotation={[Math.PI / 2.6, 0.4, 0]}>
            <torusGeometry args={[1.5, 0.012, 16, 160]} />
            <meshBasicMaterial color="#c8ff1f" toneMapped={false} />
          </mesh>
          <mesh rotation={[Math.PI / 1.7, -0.5, 0.5]}>
            <torusGeometry args={[1.7, 0.01, 16, 160]} />
            <meshBasicMaterial color="#a78bfa" toneMapped={false} />
          </mesh>
        </group>
      )
    case 'slabs':
      return (
        <group rotation={[0.2, -0.5, 0.15]}>
          {[-1, 0, 1].map((i) => (
            <mesh key={i} position={[i * 0.55, i * 0.25, -i * 0.5]} rotation={[0, 0, i * 0.18]}>
              <boxGeometry args={[2.4, 1.5, 0.12]} />
              <Chrome color={i === 0 ? '#e3e5ec' : '#9a9db0'} roughness={0.18} />
            </mesh>
          ))}
          <pointLight color="#c8ff1f" intensity={6} position={[0, -0.2, 0.6]} distance={3} />
        </group>
      )
    case 'portal':
      return (
        <group rotation={[0.1, -0.35, 0]}>
          <mesh>
            <boxGeometry args={[2.2, 3, 0.35]} />
            <meshStandardMaterial color="#14161d" roughness={0.9} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[1.5, 2.3, 0.5]} />
            <meshBasicMaterial color="#08090d" />
          </mesh>
          <mesh position={[0, 0, 0.2]}>
            <planeGeometry args={[1.56, 2.36]} />
            <meshBasicMaterial color="#a78bfa" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.21]}>
            <planeGeometry args={[1.44, 2.24]} />
            <meshBasicMaterial color="#08090d" />
          </mesh>
          <pointLight color="#a78bfa" intensity={10} position={[0, 0, 1.2]} distance={4} />
        </group>
      )
    case 'ring':
      return (
        <mesh rotation={[0.6, 0.2, 0]}>
          <torusGeometry args={[1.1, 0.34, low ? 32 : 64, low ? 80 : 160]} />
          <Chrome />
        </mesh>
      )
    case 'cube':
      return (
        <group rotation={[0.5, 0.6, 0]}>
          <mesh>
            <boxGeometry args={[1.6, 1.6, 1.6]} />
            <Glass attenuationColor="#c8ff1f" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            <Chrome />
          </mesh>
        </group>
      )
    case 'blob':
    default:
      return (
        <mesh>
          <torusKnotGeometry args={[0.85, 0.32, low ? 128 : 260, low ? 24 : 48, 2, 3]} />
          <MeshDistortMaterial
            color="#e4e6ee"
            metalness={0.92}
            roughness={0.14}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={1.3}
            distort={low ? 0.2 : 0.34}
            speed={1.3}
          />
        </mesh>
      )
  }
}

function Rig({
  children,
  reduced,
  parallax,
  interactive,
}: {
  children: React.ReactNode
  reduced: boolean
  parallax: number
  interactive: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const scrollY = useRef(0)

  useEffect(() => {
    const onScroll = () => (scrollY.current = window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useFrame((state, delta) => {
    if (!group.current || !inner.current) return
    const t = state.clock.elapsedTime
    const px = interactive ? state.pointer.x : 0
    const py = interactive ? state.pointer.y : 0

    if (!reduced) {
      inner.current.rotation.y += delta * 0.18
      inner.current.rotation.x = Math.sin(t * 0.25) * 0.12
    }

    // Tilt toward the cursor
    group.current.rotation.y = damp(group.current.rotation.y, px * 0.45, 3, delta)
    group.current.rotation.x = damp(group.current.rotation.x, -py * 0.3, 3, delta)

    // Grow slightly when the cursor gets close to the object center
    const dist = Math.hypot(px, py)
    const target = interactive ? 1 + Math.max(0, 0.35 - dist) * 0.45 : 1
    const s = damp(group.current.scale.x, target, 4, delta)
    group.current.scale.setScalar(s)

    // Scroll parallax
    group.current.position.y = damp(
      group.current.position.y,
      (scrollY.current / (typeof window !== 'undefined' ? window.innerHeight : 1)) * parallax,
      4,
      delta,
    )
  })

  return (
    <group ref={group}>
      <group ref={inner}>{children}</group>
    </group>
  )
}

export function SceneCore({
  variant = 'blob',
  quality = 'high',
  reduced = false,
  parallax = 0.8,
  className,
  interactive = true,
  paused = false,
}: SceneProps) {
  const low = quality === 'low'
  return (
    <Canvas
      className={className}
      frameloop={paused ? 'never' : 'always'}
      dpr={low ? [1, 1] : [1, 1.6]}
      camera={{ position: [0, 0, 6.4], fov: 36 }}
      gl={{ antialias: !low, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 4]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-5, -2, 3]} intensity={0.6} color="#a78bfa" />
      <Studio />
      <Rig reduced={reduced} parallax={parallax} interactive={interactive}>
        <Float
          speed={reduced ? 0 : 1.2}
          rotationIntensity={reduced ? 0 : 0.25}
          floatIntensity={reduced ? 0 : 0.9}
          floatingRange={[-0.25, 0.25]}
        >
          <Shape variant={variant} low={low} />
        </Float>
      </Rig>
    </Canvas>
  )
}
