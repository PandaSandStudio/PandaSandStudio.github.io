import { TerrainChunk } from './terrain-chunk.js';
import { TerrainGenerator } from '../worker/terrain/terrain-generator.js';
import { WaterBufferData } from '../view/water-chunk.js';

export class InfiniteTerrain {
  constructor({
    scene,
    renderDistance,
    bufferDistance,
    waterLevel,
    waterColor,
    lodLevels,
    depth,
    width,
    triangleSize,
    maxHeight,
    noiseFineness,
    noiseSlope,
    lacunarity,
    persistance,
    octaves,
    minNoiseHeight,
    specularReflectivity,
    shineDamping,
    regions,
    heightCurve = [
      [0, 0],
      [1, 1]
    ],
    noiseSeed = Math.random() * 10000,
    noiseOffset = Math.random() * 1000000
  }) {
    this.scene = scene;
    this.renderDistance = renderDistance;
    this.bufferDistance = bufferDistance;
    this.waterLevel = waterLevel;
    this.waterColor = waterColor;
    this.depth = depth;
    this.width = width;
    this.triangleSize = triangleSize;
    this.maxHeight = maxHeight;
    this.noiseFineness = noiseFineness;
    this.noiseSlope = noiseSlope;
    this.lacunarity = lacunarity;
    this.persistance = persistance;
    this.octaves = octaves;
    this.minNoiseHeight = minNoiseHeight;
    this.regions = regions;
    this.noiseSeed = noiseSeed;
    this.noiseOffset = noiseOffset;
    this.heightCurve = heightCurve;
    this.specularReflectivity = specularReflectivity;
    this.shineDamping = shineDamping;
    this.lodLevels = lodLevels;

    this.terrainGenerator = new TerrainGenerator();
    
    this.lastActiveChunks = [];
    this.chunkCache = {};
    
    this.maxVisibleBufferChunksX = Math.ceil(this.bufferDistance / (this.width * this.triangleSize));
    this.maxVisibleBufferChunksZ = Math.ceil(this.bufferDistance / (this.depth * this.triangleSize));
    
    this.maxVisibleRenderChunksX = Math.ceil(this.renderDistance / (this.width * this.triangleSize));
    this.maxVisibleRenderChunksZ = Math.ceil(this.renderDistance / (this.depth * this.triangleSize));
    
    this.waterBufferData = new WaterBufferData({
      gl: this.scene.getGlContext(),
      width: this.width,
      depth: this.depth,
      triangleSize: this.triangleSize,
      lodLevels: this.lodLevels
    });
  }

  update(playerPosition) {
    const scene = this.scene;

    for (const chunk of this.lastActiveChunks) {
      scene.removeTerrainChunk(chunk);
    }

    this.lastActiveChunks = [];

    const normalizedPosition = this.normalizePosition(playerPosition);
    const newChunkPositions = [];
    
    for (let i = -this.maxVisibleBufferChunksX; i <= this.maxVisibleBufferChunksX; i++) {
      for (let j = -this.maxVisibleBufferChunksZ; j <= this.maxVisibleBufferChunksZ; j++) {
        const x = normalizedPosition[0] + i;
        const z = normalizedPosition[1] + j;
        const hashed = this.hash(x, z);
        
        if (!this.chunkCache[hashed]) {
          const position = this.unnormalizePosition(x, z);
          
          const dx = playerPosition[0] - position[0];
          const dy = playerPosition[2] - position[1];
          
          newChunkPositions.push({
            key: hashed,
            position: this.unnormalizePosition(x, z),
            squareDistanceToPlayer: dx * dx + dy * dy
          });
        }
      }
    }
    
    newChunkPositions.sort((a, b) => a.squareDistanceToPlayer - b.squareDistanceToPlayer);
    
    for (let i = 0; i < newChunkPositions.length; i++) {
      const chunkData = newChunkPositions[i];
      
      this.chunkCache[chunkData.key] = new TerrainChunk({
        position: chunkData.position,
        scene: this.scene,
        width: this.width * this.triangleSize,
        depth: this.depth * this.triangleSize,
        maxHeight: this.maxHeight,
        terrainGenerator: this.terrainGenerator,
        waterLevel: this.getHeightAtWater(),
        waterColor: this.waterColor,
        waterBufferData: this.waterBufferData,
        renderDistance: this.renderDistance,
        specularReflectivity: this.specularReflectivity,
        shineDamping: this.shineDamping,
        triangleSize: this.triangleSize,
        args: {
          depth: this.depth,
          width: this.width,
          triangleSize: this.triangleSize,
          maxHeight: this.maxHeight,
          noiseFineness: this.noiseFineness,
          noiseSlope: this.noiseSlope,
          noiseSeed: this.noiseSeed,
          noiseOffset: this.noiseOffset,
          lacunarity: this.lacunarity,
          persistance: this.persistance,
          octaves: this.octaves,
          minNoiseHeight: this.minNoiseHeight,
          regions: this.regions,
          heightCurve: this.heightCurve
        }
      });
    }
    
    for (let i = -this.maxVisibleRenderChunksX; i <= this.maxVisibleRenderChunksX; i++) {
      for (let j = -this.maxVisibleRenderChunksZ; j <= this.maxVisibleRenderChunksZ; j++) {
        const x = normalizedPosition[0] + i;
        const z = normalizedPosition[1] + j;
        const hashed = this.hash(x, z);
        const chunk = this.chunkCache[hashed];
        
        if (chunk && chunk.alreadyHasGeometry() && chunk.isVisibleInCameraFrustum(scene.getCamera())) {
          this.lastActiveChunks.push(chunk);
          scene.addTerrainChunk(chunk);
        }
      }
    }
    
    for (const chunk of this.lastActiveChunks) {
      chunk.update(playerPosition);
    }
  }
  
  isUnderwater(positionY) {
    return positionY < this.getHeightAtWater();
  }
  
  getHeightAt(position) {
    const normalized = this.normalizePosition(position);
    const hashed = this.hash(normalized[0], normalized[1]);
    const chunk = this.chunkCache[hashed];
    
    return chunk.alreadyHasGeometry() ? chunk.getHeightAt(position) : 0;
  }

  normalizePosition(position) {
    const { width, depth, triangleSize } = this;

    return [
      Math.round(position[0] / (width * triangleSize)),
      Math.round(position[2] / (depth * triangleSize))
    ];
  }

  unnormalizePosition(x, z) {
    return [
      x * this.width * this.triangleSize,
      z * this.depth * this.triangleSize
    ];
  }

  hash(x, y) {
    return x.toFixed(0) + ',' + y.toFixed(0);
  }
  
  getHeightAtWater() {
    return (this.waterLevel * 2 - 1) * this.maxHeight;
  }
}
