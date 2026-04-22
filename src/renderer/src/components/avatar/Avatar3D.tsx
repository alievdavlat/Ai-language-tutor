import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { AvatarEmotion, AvatarProps } from './types'

interface AvatarRefs {
  mouth: THREE.Mesh
  leftBrow: THREE.Mesh
  rightBrow: THREE.Mesh
  leftEye: THREE.Mesh
  rightEye: THREE.Mesh
  body: THREE.Group
}

interface SceneState {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  refs: AvatarRefs
}

function buildScene(host: HTMLDivElement): SceneState {
  const width = host.clientWidth
  const height = host.clientHeight || 400

  const scene = new THREE.Scene()
  scene.background = null

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
  camera.position.set(0, 1.55, 2.8)
  camera.lookAt(0, 1.5, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(width, height)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  host.appendChild(renderer.domElement)

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
  keyLight.position.set(2, 4, 3)
  const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4)
  fillLight.position.set(-3, 1, 2)
  scene.add(keyLight, fillLight, new THREE.AmbientLight(0xffffff, 0.35))

  const body = new THREE.Group()
  scene.add(body)

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 0.9, 24),
    new THREE.MeshStandardMaterial({ color: 0x3b4a66, roughness: 0.7 })
  )
  torso.position.y = 0.6

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.12, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0xe0a478, roughness: 0.6 })
  )
  neck.position.y = 1.15

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd9b8, roughness: 0.55 })
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), skinMat)
  head.position.y = 1.5
  head.scale.set(1, 1.15, 1)

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.29, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x3a281c, roughness: 0.9 })
  )
  hair.position.y = 1.56
  hair.scale.set(1.02, 1.1, 1.02)

  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), eyeWhite)
  leftEye.position.set(-0.085, 1.55, 0.24)
  const rightEye = leftEye.clone()
  rightEye.position.x = 0.085

  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1a2b4a, roughness: 0.3 })
  const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 12), pupilMat)
  leftPupil.position.set(-0.085, 1.55, 0.27)
  const rightPupil = leftPupil.clone()
  rightPupil.position.x = 0.085

  const browMat = new THREE.MeshStandardMaterial({ color: 0x2a1f16, roughness: 0.9 })
  const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.012), browMat)
  leftBrow.position.set(-0.085, 1.615, 0.26)
  const rightBrow = leftBrow.clone()
  rightBrow.position.x = 0.085

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.09, 16),
    new THREE.MeshStandardMaterial({ color: 0xe8b48a, roughness: 0.5 })
  )
  nose.rotation.x = Math.PI
  nose.position.set(0, 1.5, 0.28)

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.03, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x3d1f1a, roughness: 0.8 })
  )
  mouth.position.set(0, 1.41, 0.265)

  body.add(torso, neck, head, hair, leftEye, rightEye, leftPupil, rightPupil, leftBrow, rightBrow, nose, mouth)

  return {
    scene,
    camera,
    renderer,
    refs: { mouth, leftBrow, rightBrow, leftEye, rightEye, body }
  }
}

function applyEmotion(refs: AvatarRefs, emotion: AvatarEmotion): void {
  const browY = emotion === 'concerned' ? 1.605 : emotion === 'happy' ? 1.622 : 1.615
  const browTilt = emotion === 'concerned' ? 0.15 : emotion === 'thinking' ? 0.1 : 0
  refs.leftBrow.position.y = browY
  refs.rightBrow.position.y = browY
  refs.leftBrow.rotation.z = browTilt
  refs.rightBrow.rotation.z = -browTilt
}

function applyMouthOpen(mouth: THREE.Mesh, amount: number): void {
  mouth.scale.y = 1 + amount * 6
  mouth.position.y = 1.41 - amount * 0.015
}

function disposeScene(state: SceneState, host: HTMLDivElement): void {
  host.removeChild(state.renderer.domElement)
  state.renderer.dispose()
  state.scene.traverse((obj) => {
    const m = obj as THREE.Mesh
    if (m.geometry) m.geometry.dispose()
    const mat = m.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
    else mat?.dispose()
  })
}

export default function Avatar3D({ mouthOpen, emotion = 'neutral', name }: AvatarProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number>(0)
  const stateRef = useRef({ mouthOpen, emotion })

  useEffect(() => {
    stateRef.current.mouthOpen = mouthOpen
    stateRef.current.emotion = emotion
  }, [mouthOpen, emotion])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = buildScene(host)
    let blinkT = 0
    let last = performance.now()

    const animate = (): void => {
      rafRef.current = requestAnimationFrame(animate)
      const now = performance.now()
      const dt = (now - last) / 1000
      last = now
      blinkT += dt

      scene.refs.body.rotation.y = Math.sin(now / 1400) * 0.02

      if (blinkT > 5) blinkT = 0
      const blink = blinkT > 4.9 ? Math.max(0.05, 1 - (blinkT - 4.9) * 20) : 1
      scene.refs.leftEye.scale.y = blink
      scene.refs.rightEye.scale.y = blink

      applyMouthOpen(scene.refs.mouth, stateRef.current.mouthOpen)
      applyEmotion(scene.refs, stateRef.current.emotion)

      scene.renderer.render(scene.scene, scene.camera)
    }
    animate()

    const handleResize = (): void => {
      const w = host.clientWidth
      const h = host.clientHeight || 400
      scene.renderer.setSize(w, h)
      scene.camera.aspect = w / h
      scene.camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(handleResize)
    ro.observe(host)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      disposeScene(scene, host)
    }
  }, [])

  return (
    <div className="flex flex-col items-center w-full">
      <div ref={hostRef} className="w-full max-w-[360px] aspect-[3/4]" />
      {name && <p className="text-sm text-slate-400 mt-2">{name}</p>}
    </div>
  )
}
