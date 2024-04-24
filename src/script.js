import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import GUI from "lil-gui"
import earthVertexShader from "./shaders/earth/vertex.glsl"
import earthFragmentShader from "./shaders/earth/fragment.glsl"

import atmosphereVertexShader from "./shaders/atmosphere/vertex.glsl"
import atmosphereFragmentShader from "./shaders/atmosphere/fragment.glsl"

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()

/**
 * Earth
 *
 */

const earthParameters = {}
earthParameters.atmosphereDayColor = "#00aaff"
earthParameters.atmosphereTwilightColor = "#ff6600"

gui.addColor(earthParameters, "atmosphereDayColor").onChange(() => {
  earthMaterial.uniforms.uAtmosphereDayColor.value.set(
    earthParameters.atmosphereDayColor
  )
  atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(
    earthParameters.atmosphereDayColor
  )
})

gui.addColor(earthParameters, "atmosphereTwilightColor").onChange(() => {
  earthMaterial.uniforms.uAtmosphereTwilightColor.value.set(
    earthParameters.atmosphereTwilightColor
  )

  atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(
    earthParameters.atmosphereTwilightColor
  )
})

// TEXTURES
const earthDayTexture = textureLoader.load("./earth/day.jpg")
earthDayTexture.colorSpace = THREE.SRGBColorSpace
earthDayTexture.anisotropy = 8

const earthNightTexture = textureLoader.load("./earth/night.jpg")
earthNightTexture.colorSpace = THREE.SRGBColorSpace
earthNightTexture.anisotropy = 8

const earthSpecularCloudsTexture = textureLoader.load(
  "./earth/specularClouds.jpg"
)
earthSpecularCloudsTexture.anisotropy = 8

const config = {
  amountOfClouds: 0.5,
}

gui
  .add(config, "amountOfClouds")
  .min(0)
  .max(1)
  .step(0.01)
  .name("Amount of clouds")
  .onChange(() => {
    earthMaterial.uniforms.uAmountOfClouds.value = config.amountOfClouds
    console.log(config.amountOfClouds)
    console.log(earthMaterial.uniforms.uAmountOfClouds.value)
  })

// Mesh
const earthGeometry = new THREE.SphereGeometry(2, 64, 64)
const earthMaterial = new THREE.ShaderMaterial({
  vertexShader: earthVertexShader,
  fragmentShader: earthFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uDayTexture: new THREE.Uniform(earthDayTexture),
    uNightTexture: new THREE.Uniform(earthNightTexture),
    uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uAmountOfClouds: new THREE.Uniform(config.amountOfClouds),
    uAtmosphereDayColor: {
      value: new THREE.Color(earthParameters.atmosphereDayColor),
    },
    uAtmosphereTwilightColor: {
      value: new THREE.Color(earthParameters.atmosphereTwilightColor),
    },
  },
})
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
scene.add(earth)

// ATMOSHPERE

const atmosphereMaterial = new THREE.ShaderMaterial({
  vertexShader: atmosphereVertexShader,
  fragmentShader: atmosphereFragmentShader,
  side: THREE.BackSide,
  transparent: true,
  uniforms: {
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uAtmosphereDayColor: {
      value: new THREE.Color(earthParameters.atmosphereDayColor),
    },
    uAtmosphereTwilightColor: {
      value: new THREE.Color(earthParameters.atmosphereTwilightColor),
    },
  },
})
const atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial)
atmosphere.scale.set(1.04, 1.04, 1.04)
scene.add(atmosphere)

// SUN
//
// Since the sunSpherical radius is set to 1, sunDirection length should be 1, meaning it’s already normalized.
const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5)
const sunDirection = new THREE.Vector3()

// Debug
const debugSun = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.1, 2),
  new THREE.MeshBasicMaterial()
)
scene.add(debugSun)

// Update
const updateSun = () => {
  // update the sunDirection according to the sunSpherical using the setFromSpherical() method
  sunDirection.setFromSpherical(sunSpherical)
  // with the radius being 1 and the Earth's radius being 2, the mesh is still inside the Earth.
  debugSun.position.copy(sunDirection).multiplyScalar(5)

  //update uniform
  earthMaterial.uniforms.uSunDirection.value.copy(sunDirection)
  atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection)
}

updateSun()

gui.add(sunSpherical, "phi").min(0).max(Math.PI).onChange(updateSun)

gui.add(sunSpherical, "theta").min(-Math.PI).max(Math.PI).onChange(updateSun)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
}

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.position.x = 12
camera.position.y = 5
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
renderer.setClearColor("#000011")

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  earth.rotation.y = elapsedTime * 0.1

  // Update uniforms
  earthMaterial.uniforms.uTime.value = elapsedTime * 0.1

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
