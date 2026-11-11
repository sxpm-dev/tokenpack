/**
 * Lazy entry point — runs only after the user clicks the "Open 3D preview"
 * button. Bundled by esbuild into assets/mod-lazy-three.js as an IIFE that
 * registers `window.__BENCH_LAZY.initScene`. The bootloader's loadLazy()
 * calls initScene(root, bitmaps) once all lazy assets are loaded.
 *
 * Builds a ring of textured boxes using our lazy PNG images as materials,
 * spins them once, renders to a canvas inside the dialog.
 */
import * as THREE from 'three'

declare global {
  interface Window {
    __BENCH_LAZY?: {
      initScene?: (root: HTMLElement, bitmaps: readonly ImageBitmap[]) => void
    }
  }
}

const bag = (window.__BENCH_LAZY = window.__BENCH_LAZY ?? {})

bag.initScene = (root, bitmaps) => {
  const w = root.clientWidth || 600
  const h = root.clientHeight || 360

  const scene = new THREE.Scene()

  scene.background = new THREE.Color(0x0e0e10)

  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)

  camera.position.set(0, 1.5, 6)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true })

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(w, h, false)
  root.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)

  scene.add(ambient)
  const point = new THREE.PointLight(0xffffff, 1.4)

  point.position.set(3, 4, 5)
  scene.add(point)

  const ring = new THREE.Group()
  const count = Math.max(8, Math.min(bitmaps.length, 36))
  const radius = 2.6
  const geo = new THREE.BoxGeometry(0.7, 0.7, 0.7)
  const meshes: THREE.Mesh[] = []

  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2
    const bitmap = bitmaps[i % bitmaps.length]
    const tex = bitmap ? new THREE.CanvasTexture(bitmap) : null

    if (tex) {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true
    }
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.4,
      metalness: 0.1,
      color: tex ? 0xffffff : new THREE.Color().setHSL(i / count, 0.6, 0.5),
    })
    const mesh = new THREE.Mesh(geo, mat)

    mesh.position.set(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.4, Math.sin(angle) * radius)
    mesh.rotation.y = -angle
    ring.add(mesh)
    meshes.push(mesh)
  }
  scene.add(ring)

  // Spin a couple of frames so it's visibly 3D, then render the final frame.
  let frame = 0
  const totalFrames = 90

  function step(): void {
    ring.rotation.y = (frame / totalFrames) * Math.PI * 0.5
    for (let i = 0; i < meshes.length; i += 1) {
      const m = meshes[i]

      if (!m) continue
      m.rotation.x += 0.01
      m.rotation.y += 0.012
    }
    renderer.render(scene, camera)
    frame += 1
    if (frame < totalFrames) {
      requestAnimationFrame(step)
    } else {
      window.dispatchEvent(new CustomEvent('bench:lazy:scene-rendered'))
    }
  }

  step()
}
