import { Bounds } from '../core/bounds.js';
import { BufferData } from './shaders/buffer.js';

export class WaterChunk {
  constructor({
    color,
    position,
    waterBuffer,
    renderDistance,
    width,
    depth
  }) {
    this.width = width;
    this.depth = depth;
    this.color = color;
    this.position = position;
    this.waterBuffer = waterBuffer;
    this.renderDistance = renderDistance;
    this.lodLevels = this.waterBuffer.getLodLevels();
    this.lod = 0;
    
    this.bounds = new Bounds(
      vec3.fromValues(-this.width / 2, -0.01, -this.depth / 2),
      vec3.fromValues( this.width / 2,  0.01,  this.depth / 2)
    );
    this.bounds.offset([
      this.position[0], this.position[1], this.position[2]
    ]);
  }
  
  update(playerPosition) {
    const distance = this.distanceToPoint(playerPosition);
    const normalizedDistance = Math.min(distance / this.renderDistance, 1);
    
    this.lod = Math.floor((this.lodLevels - 1) * normalizedDistance);
  }
  
  distanceToPoint(point) {
    const dx = Math.max(this.bounds.min[0] - point[0], 0, point[0] - this.bounds.max[0]);
    const dy = Math.max(this.bounds.min[1] - point[1], 0, point[1] - this.bounds.max[1]);
    const dz = Math.max(this.bounds.min[2] - point[2], 0, point[2] - this.bounds.max[2]);
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  getColor() {
    return this.color;
  }
  
  getPosition() {
    return this.position;
  }
  
  getTriangleSize() {
    return this.waterBuffer.getTriangleSize(this.lod);
  }
  
  getVertices() {
    return this.waterBuffer.getVertices(this.lod);
  }
  
  getIndicators() {
    return this.waterBuffer.getIndicators(this.lod);
  }
  
  getVerticesLength() {
    return this.waterBuffer.getVerticesLength(this.lod);
  }
}

export class WaterBufferData {
  constructor({
    gl,
    width,
    depth,
    triangleSize,
    lodLevels
  }) {
    this.width = width + 1;
    this.depth = depth + 1;
    this.triangleSize = triangleSize;
    this.lodLevels = lodLevels;
    
    this.buffers = [];
    
    for (let lod = 0; lod < this.lodLevels; lod++) {
      this.buffers[lod] = this.generate(gl, lod);
    }
  }
  
  generate(gl, lod) {
    const triangleSize = this.triangleSize * Math.pow(2, lod);
    const width = this.width / Math.pow(2, lod) + 1;
    const depth = this.depth / Math.pow(2, lod) + 1;
    
    if (width !== Math.floor(width) || depth !== Math.floor(depth)) {
      throw new Error('The width or depth of the terrain is not divisible by one of the LOD values');
    }
    
    const vertices = new Float32Array((width - 1) * (depth - 1) * 12);
    const indicators = new Float32Array((width - 1) * (depth - 1) * 24);
    
    let vpointer = 0;
    let ipointer = 0;
    
    for (let j = 0; j < width - 1; j++) {
      for (let i = 0; i < depth - 1; i++) {
        const ax = (i + 0 - width / 2) * triangleSize;
        const az = (j + 0 - depth / 2) * triangleSize;
        
        const bx = (i + 1 - width / 2) * triangleSize;
        const bz = (j + 0 - depth / 2) * triangleSize;
        
        const cx = (i + 0 - width / 2) * triangleSize;
        const cz = (j + 1 - depth / 2) * triangleSize;
        
        const dx = (i + 1 - width / 2) * triangleSize;
        const dz = (j + 1 - depth / 2) * triangleSize;
        
        const a1x = ax;
        const a1z = az;
        
        const a2x = cx;
        const a2z = cz;
        
        const a3x = bx;
        const a3z = bz;
        
        const b1x = bx;
        const b1z = bz;
        
        const b2x = cx;
        const b2z = cz;
        
        const b3x = dx;
        const b3z = dz;
        
        // (0,0)    (1,0)
        // a1       a3
        // |------/
        // |    /
        // |  /
        // |/
        // a2 (0,1)
        
        vertices[vpointer++] =  a1x; // a1 - a1
        vertices[vpointer++] =  a1z; // a1 - a1
        indicators[ipointer++] =  0; // a2 - a1
        indicators[ipointer++] =  1; // a2 - a1
        indicators[ipointer++] =  1; // a3 - a1
        indicators[ipointer++] =  0; // a3 - a1
        
        vertices[vpointer++] =  a2x; // a2 - a2
        vertices[vpointer++] =  a2z; // a2 - a2
        indicators[ipointer++] =  1; // a3 - a2
        indicators[ipointer++] = -1; // a3 - a2
        indicators[ipointer++] =  0; // a1 - a2
        indicators[ipointer++] = -1; // a1 - a2
        
        vertices[vpointer++] =  a3x; // a3 - a3
        vertices[vpointer++] =  a3z; // a3 - a3
        indicators[ipointer++] = -1; // a1 - a3
        indicators[ipointer++] =  0; // a1 - a3
        indicators[ipointer++] = -1; // a2 - a3
        indicators[ipointer++] =  1; // a2 - a3
        
        //      b1 (1,0)
        //       /|
        //     /  |
        //   /    |
        // /------|
        // b2      b3
        // (0,1)   (1,1)
        
        vertices[vpointer++] =  b1x; // b1 - b1
        vertices[vpointer++] =  b1z; // b1 - b1
        indicators[ipointer++] = -1; // b2 - b1
        indicators[ipointer++] =  1; // b2 - b1
        indicators[ipointer++] =  0; // b3 - b1
        indicators[ipointer++] =  1; // b3 - b1
        
        vertices[vpointer++] =  b2x; // b2 - b2
        vertices[vpointer++] =  b2z; // b2 - b2
        indicators[ipointer++] =  1; // b3 - b2
        indicators[ipointer++] =  0; // b3 - b2
        indicators[ipointer++] =  1; // b1 - b2
        indicators[ipointer++] = -1; // b1 - b2
        
        vertices[vpointer++] =  b3x; // b3 - b3
        vertices[vpointer++] =  b3z; // b3 - b3
        indicators[ipointer++] =  0; // b1 - b3
        indicators[ipointer++] = -1; // b1 - b3
        indicators[ipointer++] = -1; // b2 - b3
        indicators[ipointer++] =  0; // b2 - b3
      }
    }
    
    const bufferData = new BufferData({
      position: {
        type: 'ARRAY_BUFFER',
        data: vertices
      },
      indicator: {
        type: 'ARRAY_BUFFER',
        data: indicators
      }
    });
    
    bufferData.bindBuffers(gl);
    
    return bufferData;
  }
  
  getTriangleSize(lod) {
    return this.triangleSize * Math.pow(2, lod);
  }
  
  getVertices(lod) {
    return this.buffers[lod].getBuffer('position');
  }
  
  getIndicators(lod) {
    return this.buffers[lod].getBuffer('indicator');
  }
  
  getVerticesLength(lod) {
    return this.buffers[lod].getLengthOf('position') / 2;
  }
  
  getLodLevels() {
    return this.lodLevels;
  }
}
