import { BufferData } from '../view/shaders/buffer.js';
import { WaterChunk } from '../view/water-chunk.js';
import { Bounds } from './bounds.js';

export class TerrainChunk {
  constructor({
    args,
    terrainGenerator,
    scene,
    position,
    width,
    depth,
    waterColor,
    waterLevel,
    maxHeight,
    waterBufferData,
    renderDistance,
    specularReflectivity,
    triangleSize,
    shineDamping
  }) {
    this.terrainPosition = position;
    this.width = width;
    this.depth = depth;
    this.maxHeight = maxHeight;
    this.waterColor = waterColor;
    this.waterLevel = waterLevel;
    this.waterBufferData = waterBufferData;
    this.renderDistance = renderDistance;
    this.specularReflectivity = specularReflectivity;
    this.shineDamping = shineDamping;
    this.triangleSize = triangleSize;
    this.scene = scene;

    this.bounds = new Bounds(
      vec3.fromValues(-this.width / 2, -this.maxHeight / 2, -this.depth / 2),
      vec3.fromValues( this.width / 2,  this.maxHeight / 2,  this.depth / 2)
    );
    this.bounds.offset([
      this.terrainPosition[0], 0, this.terrainPosition[1]
    ]);
    
    this.request(args, terrainGenerator);
  }
  
  update(playerPosition) {
    if (this.waterChunk) {
      this.waterChunk.update(playerPosition);
    }
  }
  
  request(args, terrainGenerator) {
    terrainGenerator
      .generate(this.scene, Object.assign(args, { position: this.terrainPosition }))
      .then(data => this.generate(data));
  }
  
  generate(result) {
    this.hasReceivedGeometry = true;
    this.verticesLength = result.vertices.length / 3;
    
    this.createBufferData(result);
    this.createWaterChunk();
  }
  
  createBufferData({ colors, normals, vertices }) {
    this.vertices = vertices;
    this.bufferData = new BufferData({
      color: {
        type: 'ARRAY_BUFFER',
        data: colors
      },
      position: {
        type: 'ARRAY_BUFFER',
        data: vertices
      },
      normal: {
        type: 'ARRAY_BUFFER',
        data: normals
      }
    });
    
    this.bufferData.bindBuffers(this.scene.getGlContext());
  }
  
  createWaterChunk() {
    this.waterChunk = new WaterChunk({
      position: vec3.fromValues(
        this.terrainPosition[0],
        this.waterLevel,
        this.terrainPosition[1]
      ),
      color: this.waterColor,
      waterBuffer: this.waterBufferData,
      renderDistance: this.renderDistance,
      width: this.width,
      depth: this.depth
    });
  }
  
  getHeightAt(position) {
    const relativeX = position[0] - this.terrainPosition[0];
    const relativeZ = position[2] - this.terrainPosition[1];
    
    const {
      vertices,
      width,
      depth,
      triangleSize
    } = this;
    
    const trianglesX = width / triangleSize;
    const trianglesZ = depth / triangleSize;
    
    const x = Math.floor(relativeX / triangleSize + trianglesX / 2);
    const z = Math.floor(relativeZ / triangleSize + trianglesZ / 2);
    
    const a = x + z * trianglesX;
    const b = a + 1;
    const c = a + trianglesX;
    const d = c + 1;
    
    const ay = vertices[a * 18 + 1];
    const by = vertices[b * 18 + 1];
    let cy = vertices[c * 18 + 1];
    let dy = vertices[d * 18 + 1];
    
    if (cy === undefined || dy === undefined) {
      cy = ay;
      dy = by;
    }
    
    const positionX = (relativeX + width / 2) / triangleSize % 1;
    const positionZ = (relativeZ + depth / 2) / triangleSize % 1;
    
    // return (ay + by + cy + dy) / 4;
    
    if (positionX <= (1 - positionZ)) {
      return this.barryCentric(
        [0, ay, 0],
        [1, by, 0],
        [0, cy, 1],
        [positionX, positionZ]
      );
    }
    
    return this.barryCentric(
      [1, by, 0],
      [1, dy, 1],
      [0, cy, 1],
      [positionX, positionZ]
    );
  }
  
  barryCentric(p1, p2, p3, pos) {
		const det = (p2[2] - p3[2]) * (p1[0] - p3[0]) + (p3[0] - p2[0]) * (p1[2] - p3[2]);
		
		const l1 = ((p2[2] - p3[2]) * (pos[0] - p3[0]) + (p3[0] - p2[0]) * (pos[1] - p3[2])) / det;
		const l2 = ((p3[2] - p1[2]) * (pos[0] - p3[0]) + (p1[0] - p3[0]) * (pos[1] - p3[2])) / det;
		const l3 = 1 - l1 - l2;
		
		return l1 * p1[1] + l2 * p2[1] + l3 * p3[1];
  }
  
// 	public static float barryCentric(Vector3f p1, Vector3f p2, Vector3f p3, Vector2f pos) {
// 		float det = (p2.z - p3.z) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.z - p3.z);
// 		float l1 = ((p2.z - p3.z) * (pos.x - p3.x) + (p3.x - p2.x) * (pos.y - p3.z)) / det;
// 		float l2 = ((p3.z - p1.z) * (pos.x - p3.x) + (p1.x - p3.x) * (pos.y - p3.z)) / det;
// 		float l3 = 1.0f - l1 - l2;
// 		return l1 * p1.y + l2 * p2.y + l3 * p3.y;
// 	}

  
  getSpecularReflectivity() {
    return this.specularReflectivity;
  }
  
  getShineDamping() {
    return this.shineDamping;
  }
  
  getWater() {
    return this.waterChunk;
  }
  
  getBuffer(bufferName) {
    return this.bufferData.getBuffer(bufferName);
  }
  
  getVerticesLength() {
    return this.verticesLength;
  }

  alreadyHasGeometry() {
    return this.hasReceivedGeometry;
  }

  isVisibleInCameraFrustum(camera) {
    return camera.getFrustum().collidesWithBounds(this.bounds);
  }
}
