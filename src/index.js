import { Scene } from "./core/scene.js";
import { TerrainShader } from "./view/shaders/terrain-shader.js";
import { WaterShader } from "./view/shaders/water-shader.js";
import { PlayerCamera } from "./view/player-camera.js";
import { FlyingCamera } from "./view/flying-camera.js";
import { DirectionalLight } from "./view/directional-light.js";
import { Fog } from "./view/fog.js";
import { Timer } from "./core/timer.js";
import { FiringEvent } from "./core/events.js";
import { Curve } from "./core/curve.js";
import { Entity } from "./core/entity.js";
import { InfiniteTerrain } from "./core/infinite-terrain.js";
import { KeyControls } from "./interaction/key-controls.js";
import { EventManager } from "./interaction/event-manager.js";

const scene = new Scene("canvas");

const canvas = scene.getCanvas();
const gl = scene.getGlContext();
const width = window.innerWidth;
const height = window.innerHeight;
const clippingPlanes = vec2.fromValues(0.1, 500);
const skyColor = [1, 1, 1];

scene.setClearColor(vec4.fromValues(...skyColor, 1));
scene.setAmbientColor(vec3.fromValues(0.4, 0.4, 0.4));
scene.setDirectionalLight(
  new DirectionalLight({
    direction: vec3.fromValues(0, 1.6, 1.48),
    color: vec3.fromValues(0.9, 0.9, 0.84),
  })
);
scene.setFog(
  new Fog({
    distance: clippingPlanes[1],
    power: 1.8,
    color: vec3.fromValues(...skyColor),
  })
);
scene.setCamera(
  new PlayerCamera({
    horizontalSpeed: 13 / 60,
    verticalSpeed: 2.3,
    constantJumpSpeed: 0.09,
    maxFallSpeed: 4,
    gravity: 0.08,
    drag: 0.8,
    element: canvas,
    fov: 75,
    aspect: width / height,
    near: clippingPlanes[0],
    far: clippingPlanes[1],
  })
);

const terrain = new InfiniteTerrain({
  scene,
  renderDistance: clippingPlanes[1],
  bufferDistance: clippingPlanes[1],
  waterLevel: 0.376,
  waterColor: [0.604 + 0.44, 0.867 + 0.44, 0.851 + 0.44],
  depth: 63,
  width: 63,
  lodLevels: 2,
  triangleSize: 1,
  maxHeight: 125,
  noiseFineness: 300,
  noiseSlope: 0.84,
  lacunarity: 3,
  persistance: 0.25,
  octaves: 5,
  minNoiseHeight: 0,
  specularReflectivity: 0.3,
  shineDamping: 10,
  regions: [
    {
      height: 1 / 7,
      color: [201, 178, 99].map((x) => x / 255),
      blend: 0.6,
    },
    {
      height: 1.5 / 7,
      color: [164, 155, 98].map((x) => x / 255),
      blend: 0.6,
    },
    {
      height: 2.2 / 7,
      color: [164, 155, 98].map((x) => x / 255),
      blend: 0.6,
    },
    {
      height: 3 / 7,
      color: [229, 219, 164].map((x) => x / 255),
      blend: 0.6,
    },
    {
      height: 4.5 / 7,
      color: [135, 184, 82].map((x) => x / 255),
      blend: 0.6,
    },
    {
      height: 5.6 / 7,
      color: [120, 120, 120].map((x) => x / 255),
      blend: 0.6,
    },
    {
      height: 7 / 7,
      color: [200, 200, 210].map((x) => x / 255),
      blend: 0.6,
    },
  ],
  heightCurve: [
    [0, 0],
    [1, 1],
  ],
});

const terrainShader = new TerrainShader({ gl });
const waterShader = new WaterShader({
  gl,
  scene,
  reflectionWidth: 1024,
  reflectionHeight: 1024,
  refractionWidth: 1024,
  refractionHeight: 1024,
  reflectOffset: 0.1,
  refractOffset: 1,
  waveLength: 100.0,
  waveAmplitude: 0.08,
  waveSlowdown: 6000.0,
  specularReflectivity: 1.0,
  shineDamping: 20.0,
  fresnelReflectivity: 0.7,
  minBlueness: 0.35,
  maxBlueness: 0.7,
  murkyDepth: 30.0,
  elevation: terrain.getHeightAtWater(),
});

terrain.update(scene.getCamera().getPosition());

new Timer({
  update(dt, total) {
    const ndt = (dt * 60) / 1000;
    const offset = 10;
    const camera = scene.getCamera();

    camera.update(ndt);

    const height = terrain.getHeightAt(camera.getPosition()) + offset;

    if (camera.getY() < height) {
      camera.setY(height);
      camera.enableJumping();
    } else {
      camera.disableJumping();
    }

    if (terrain.isUnderwater(camera.getY() - offset * 0.8)) {
      if (camera.getVelocity()[1] < -0.1) {
        camera.getVelocity()[1] = -0.1;
      }

      camera.setHorizontalSpeed(camera.getOriginalHorizontalSpeed() / 4);
      camera.disableJumping();
    } else {
      camera.resetHorizontalSpeed();
    }

    if (terrain.isUnderwater(camera.getY() - offset)) {
      camera.enableConstantJumping();
    } else {
      camera.disableConstantJumping();
    }

    terrain.update(camera.getPosition());
    scene.update();

    scene.enableClippingPlane();
    waterShader.bindReflectionFramebuffer(scene);
    camera.reflectY(terrain.getHeightAtWater());
    terrainShader.render(scene);
    waterShader.unbindFramebuffer();

    waterShader.bindRefractionFramebuffer(scene);
    camera.reflectY(terrain.getHeightAtWater());
    terrainShader.render(scene);
    waterShader.unbindFramebuffer();

    scene.disableClippingPlane();
    terrainShader.clearAll(...scene.getClearColor());
    terrainShader.render(scene);
    waterShader.render(scene);

    document.querySelector(".debug").innerHTML = `
      <b>Press "C" To Toggle Debugger</b><br>
      player ${Array.from(camera.getPosition()).map(Math.round).join(" ")}<br>
      velocity ${Array.from(camera.getVelocity())
        .map((x) => x.toFixed(4))
        .join(" ")}<br>
      fps ${Math.round(1000 / dt)}<br>
      entities ${scene.entities.length}<br>
      chunks ${scene.terrainChunks.length}<br>
    `;
  },
}).init();

new EventManager({
  keycontrols: new KeyControls().listen("C", () => {
    document.querySelector(".debug").style.display =
      document.querySelector(".debug").style.display === "none"
        ? "block"
        : "none";
  }),
}).bind();

new FiringEvent("resize", (e) => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  scene.getCamera().setAspect(width / height);

  gl.canvas.width = width;
  gl.canvas.height = height;
});
