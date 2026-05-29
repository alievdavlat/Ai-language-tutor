import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm'
import type { AvatarEmotion, AvatarProps } from './types'
import Avatar3D from './Avatar3D'

interface VRMAvatarProps extends AvatarProps {
  /** URL or path to a `.vrm` model. */
  modelUrl: string
}

function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Map our 4 emotions onto VRM preset expression names. */
const EMOTION_EXPRESSION: Record<AvatarEmotion, string | null> = {
  neutral: null,
  happy: 'happy',
  thinking: 'relaxed',
  concerned: 'sad'
}

/**
 * Phase 12 (Variant A) — renders a VRM 3D avatar with TTS-driven lip-sync,
 * idle blink / breathing / gaze. Falls back to the procedural {@link Avatar3D}
 * when WebGL is unavailable or the model fails to load, so the app never
 * shows a blank avatar.
 */
export default function AvatarVRM({ mouthOpen, emotion = 'neutral', name, modelUrl }: VRMAvatarProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number>(0)
  const stateRef = useRef({ mouthOpen, emotion })
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    stateRef.current.mouthOpen = mouthOpen
    stateRef.current.emotion = emotion
  }, [mouthOpen, emotion])

  useEffect(() => {
    const host = hostRef.current
    if (!host || !modelUrl) {
      setFailed(true)
      return
    }
    if (!webglSupported()) {
      setFailed(true)
      return
    }

    let disposed = false
    setFailed(false)
    setLoading(true)

    const width = host.clientWidth
    const height = host.clientHeight || 400

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 20)
    camera.position.set(0, 1.35, 1.25)
    camera.lookAt(0, 1.35, 0)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)

    const key = new THREE.DirectionalLight(0xffffff, 1.6)
    key.position.set(1, 2, 2)
    const fill = new THREE.DirectionalLight(0x88aaff, 0.5)
    fill.position.set(-2, 1, 1)
    scene.add(key, fill, new THREE.AmbientLight(0xffffff, 0.6))

    // Gaze target the avatar's eyes track.
    const lookTarget = new THREE.Object3D()
    lookTarget.position.set(0, 1.35, 1.25)
    scene.add(lookTarget)

    let vrm: VRM | null = null
    let last = performance.now()
    let blinkT = 0
    let nextBlink = 2 + Math.random() * 3

    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))

    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return
        const loaded = gltf.userData.vrm as VRM | undefined
        if (!loaded) {
          setFailed(true)
          return
        }
        vrm = loaded
        VRMUtils.removeUnnecessaryVertices(vrm.scene)
        VRMUtils.combineSkeletons(vrm.scene)
        // VRM 0.x models face -Z; rotate so they face the camera (+Z).
        VRMUtils.rotateVRM0(vrm)
        if (vrm.lookAt) vrm.lookAt.target = lookTarget
        scene.add(vrm.scene)

        // Frame the camera on the head if the humanoid exposes it.
        const head = vrm.humanoid?.getNormalizedBoneNode('head')
        if (head) {
          const p = new THREE.Vector3()
          head.getWorldPosition(p)
          camera.position.set(0, p.y, 1.2)
          camera.lookAt(0, p.y, 0)
          lookTarget.position.set(0, p.y, 1.2)
        }
        setLoading(false)
      },
      undefined,
      () => {
        if (!disposed) setFailed(true)
      }
    )

    const setExpr = (v: VRM, applyMouth: number, emo: AvatarEmotion, blink: number): void => {
      const em = v.expressionManager
      if (!em) return
      em.setValue('aa', Math.min(1, Math.max(0, applyMouth)))
      em.setValue('blink', blink)
      for (const name of ['happy', 'sad', 'angry', 'relaxed', 'surprised']) {
        em.setValue(name, 0)
      }
      const active = EMOTION_EXPRESSION[emo]
      if (active) em.setValue(active, 0.6)
    }

    const animate = (): void => {
      rafRef.current = requestAnimationFrame(animate)
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      if (vrm) {
        // Idle sway + gentle gaze wander.
        vrm.scene.rotation.y = Math.sin(now / 2600) * 0.04
        lookTarget.position.x = Math.sin(now / 3300) * 0.25
        lookTarget.position.y = (camera.position.y || 1.35) + Math.sin(now / 4100) * 0.1

        // Blink scheduling.
        blinkT += dt
        let blink = 0
        if (blinkT > nextBlink) {
          const into = blinkT - nextBlink
          if (into < 0.12) blink = into / 0.12
          else if (into < 0.24) blink = 1 - (into - 0.12) / 0.12
          else {
            blinkT = 0
            nextBlink = 2 + Math.random() * 3
          }
        }

        setExpr(vrm, stateRef.current.mouthOpen, stateRef.current.emotion, blink)
        vrm.update(dt)
      }

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = (): void => {
      const w = host.clientWidth
      const h = host.clientHeight || 400
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(handleResize)
    ro.observe(host)

    return () => {
      disposed = true
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      if (vrm) VRMUtils.deepDispose(vrm.scene)
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [modelUrl])

  // Fall back to the procedural avatar on any failure.
  if (failed) {
    return <Avatar3D mouthOpen={mouthOpen} emotion={emotion} name={name} />
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div ref={hostRef} className="relative w-full max-w-[360px] aspect-[3/4]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            Loading 3D avatar…
          </div>
        )}
      </div>
      {name && <p className="text-sm text-slate-400 mt-2">{name}</p>}
    </div>
  )
}
