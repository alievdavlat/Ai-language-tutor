import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { Avatar3DConfig } from '@shared/types'

/**
 * A configurable, draggable procedural head — the live preview for the Avatar
 * Studio (#54). Shares its construction style with the speaking-page Avatar3D
 * but rebuilds from an Avatar3DConfig and supports mouse-drag rotation.
 */
function buildScene(host: HTMLDivElement, cfg: Avatar3DConfig): {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  body: THREE.Group
} {
  const width = host.clientWidth
  const height = host.clientHeight || 400

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(cfg.background)

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
  camera.position.set(0, 1.5, 2.6)
  camera.lookAt(0, 1.5, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(width, height)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  host.appendChild(renderer.domElement)

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
  keyLight.position.set(2, 4, 3)
  const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4)
  fillLight.position.set(-3, 1, 2)
  scene.add(keyLight, fillLight, new THREE.AmbientLight(0xffffff, 0.4))

  const body = new THREE.Group()
  scene.add(body)

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 0.9, 24),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.outfitColor), roughness: 0.7 })
  )
  torso.position.y = 0.6

  const skinColor = new THREE.Color(cfg.skinTone)
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.12, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 })
  )
  neck.position.y = 1.15

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 32, 32),
    new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.55 })
  )
  head.position.y = 1.5
  head.scale.set(1, cfg.headRoundness, 1)

  // Hair styles.
  const hairMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.hairColor), roughness: 0.9 })
  if (cfg.hairStyle !== 'bald') {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      hairMat
    )
    cap.position.y = 1.56
    cap.scale.set(1.02, 1.1, 1.02)
    body.add(cap)

    if (cfg.hairStyle === 'long') {
      const back = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2.2), hairMat)
      back.position.set(0, 1.42, -0.04)
      back.scale.set(1.05, 1.4, 1.0)
      body.add(back)
    }
    if (cfg.hairStyle === 'bun') {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 20), hairMat)
      bun.position.set(0, 1.82, -0.06)
      body.add(bun)
    }
  }

  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), eyeWhite)
  leftEye.position.set(-0.085, 1.55, 0.24)
  const rightEye = leftEye.clone()
  rightEye.position.x = 0.085

  const pupilMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.eyeColor), roughness: 0.3 })
  const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 12), pupilMat)
  leftPupil.position.set(-0.085, 1.55, 0.27)
  const rightPupil = leftPupil.clone()
  rightPupil.position.x = 0.085

  const browMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.hairColor), roughness: 0.9 })
  const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.012), browMat)
  leftBrow.position.set(-0.085, 1.615, 0.26)
  const rightBrow = leftBrow.clone()
  rightBrow.position.x = 0.085

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.09, 16),
    new THREE.MeshStandardMaterial({ color: skinColor.clone().multiplyScalar(0.92), roughness: 0.5 })
  )
  nose.rotation.x = Math.PI
  nose.position.set(0, 1.5, 0.28)

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.03, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x9b3d3a, roughness: 0.8 })
  )
  mouth.position.set(0, 1.41, 0.265)

  body.add(torso, neck, head, leftEye, rightEye, leftPupil, rightPupil, leftBrow, rightBrow, nose, mouth)

  return { scene, camera, renderer, body }
}

function disposeScene(state: ReturnType<typeof buildScene>, host: HTMLDivElement): void {
  if (state.renderer.domElement.parentElement === host) host.removeChild(state.renderer.domElement)
  state.renderer.dispose()
  state.scene.traverse((obj) => {
    const m = obj as THREE.Mesh
    if (m.geometry) m.geometry.dispose()
    const mat = m.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
    else mat?.dispose()
  })
}

export default function AvatarStudioCanvas({ config }: { config: Avatar3DConfig }): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number>(0)
  const dragRef = useRef({ dragging: false, lastX: 0, rotY: 0, auto: true })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const state = buildScene(host, config)
    const drag = dragRef.current

    const animate = (): void => {
      rafRef.current = requestAnimationFrame(animate)
      if (drag.auto && !drag.dragging) drag.rotY += 0.004
      state.body.rotation.y = drag.rotY
      state.renderer.render(state.scene, state.camera)
    }
    animate()

    const onDown = (e: PointerEvent): void => {
      drag.dragging = true
      drag.auto = false
      drag.lastX = e.clientX
    }
    const onMove = (e: PointerEvent): void => {
      if (!drag.dragging) return
      drag.rotY += (e.clientX - drag.lastX) * 0.01
      drag.lastX = e.clientX
    }
    const onUp = (): void => { drag.dragging = false }

    const el = state.renderer.domElement
    el.style.cursor = 'grab'
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    const handleResize = (): void => {
      const w = host.clientWidth
      const h = host.clientHeight || 400
      state.renderer.setSize(w, h)
      state.camera.aspect = w / h
      state.camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(handleResize)
    ro.observe(host)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      disposeScene(state, host)
    }
  }, [config])

  return <div ref={hostRef} className="w-full h-full min-h-[360px] rounded-2xl overflow-hidden" />
}
