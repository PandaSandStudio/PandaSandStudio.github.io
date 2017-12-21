export class Scene {
  constructor(canvas) {
    if (typeof canvas === 'string') {
      canvas = document.querySelector(canvas);
    }

    this.canvas = canvas;
    this.gl = this.canvas.getContext('webgl')
      || this.canvas.getContext('experimental-webgl');

    this.entities = [];
    this.terrainChunks = [];

    this.camera = null;
    this.directionalLight = null;
    this.ambientColor = null;
    this.particleOverlay = null;
    this.clearColor = null;
    this.fog = null;
    this.clippingPlane = vec4.create();
    this.useClippingPlane = false;
  }

  update() {
    for (const entity of this.entities) {
      entity.calculateWorldMatrix();
    }
  }

  add(entity) {
    this.entities.push(entity);
  }

  remove(entity) {
    if (typeof entity === 'string') {
      entity = this.getEntityByName(entity);
    }

    const index = this.entities.indexOf(entity);

    if (index !== -1) {
      this.entities.splice(index, 1);
    }
  }
  
  addTerrainChunk(chunk) {
    this.terrainChunks.push(chunk);
  }
  
  removeTerrainChunk(chunk) {
    const index = this.terrainChunks.indexOf(chunk);
    
    if (index !== -1) {
      this.terrainChunks.splice(index, 1);
    }
  }
  
  setClippingPlane(plane) {
    this.clippingPlane = plane;
  }
  
  getClippingPlane() {
    return this.clippingPlane;
  }
  
  enableClippingPlane() {
    this.useClippingPlane = true;
  }
  
  disableClippingPlane() {
    this.useClippingPlane = false;
  }
  
  isUsingClippingPlane() {
    return this.useClippingPlane;
  }
  
  getTerrainChunks() {
    return this.terrainChunks;
  }

  getEntities() {
    return this.entities;
  }

  getEntityByName(name) {
    return this.entities.find(entity => entity.name === name);
  }

  get(name) {
    return this.getEntityByName(name);
  }

  getCanvas() {
    return this.canvas;
  }

  getGlContext() {
    return this.gl;
  }

  setFog(fog) {
    this.fog = fog;
  }

  getFog() {
    return this.fog;
  }

  setParticleOverlay(overlay) {
    this.particleOverlay = overlay;
  }

  getParticleOverlay() {
    return this.particleOverlay;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  getCamera() {
    return this.camera;
  }

  setDirectionalLight(light) {
    this.directionalLight = light;
  }

  getDirectionalLight() {
    return this.directionalLight;
  }

  setAmbientColor(color) {
    this.ambientColor = color;
  }

  getAmbientColor() {
    return this.ambientColor;
  }

  setClearColor(color) {
    this.clearColor = color;
  }

  getClearColor() {
    return this.clearColor;
  }
}
