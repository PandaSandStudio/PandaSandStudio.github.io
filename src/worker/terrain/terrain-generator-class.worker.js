importScripts('/libs/noise.js');

class TerrainGenerator {
  constructor({
    depth,
    triangleSize,
    width,
    position,
    maxHeight,
    minNoiseHeight,
    noiseFineness,
    noiseSeed,
    noiseSlope,
    noiseOffset,
    lacunarity,
    persistance,
    octaves,
    regions,
    heightCurve = [
      [0, 0],
      [1, 1]
    ]
  }) {
    this.depth = depth + 1;
    this.width = width + 1;
    this.triangleSize = triangleSize;
    this.maxHeight = maxHeight;
    this.minNoiseHeight = minNoiseHeight;
    this.noiseFineness = noiseFineness;
    this.noiseSlope = noiseSlope;
    this.lacunarity = lacunarity;
    this.persistance = persistance;
    this.octaves = octaves;
    this.heightCurve = heightCurve;

    this.totalWidth = this.width * this.triangleSize;
    this.totalDepth = this.depth * this.triangleSize;
    this.position = [
      position[0] - this.totalWidth / 2,
      position[1] - this.totalDepth / 2
    ];

    this.regions = regions.sort((a, b) => a.height - b.height);
    this.heightScalar = this.getHeightScalar();

    this.noiseFactor = 1 / noiseFineness;
    this.noise = this.createNoiseFunction(noiseSeed, 'simplex', 2);
    this.noiseOffset = noiseOffset;

    const arrayBufferLength = (this.width - 1) * (this.depth - 1) * 18;

    this.arrayBuffers = {
      vertices: new ArrayBuffer(arrayBufferLength * Float32Array.BYTES_PER_ELEMENT),
      colors: new ArrayBuffer(arrayBufferLength * Float32Array.BYTES_PER_ELEMENT),
      normals: new ArrayBuffer(arrayBufferLength * Float32Array.BYTES_PER_ELEMENT)
    };

    this.vertices = new Float32Array(this.arrayBuffers.vertices);
    this.normals = new Float32Array(this.arrayBuffers.normals);
    this.colors = new Float32Array(this.arrayBuffers.colors);

    this.generate();
  }
  
  evaluateHeightCurve(points, x) {
    const value = this.heightCurveRecursive(points, 0, points.length - 1, x);
    
    return Math.min(Math.max(value, 0), 1);
  }
  
  heightCurveRecursive(points, i, j, x) {
    if (i === j) {
      return points[i][1];
    }
    
    const a = points[j][0] - x;
    const b = this.heightCurveRecursive(points, i, j - 1, x);
    
    const c = x - points[i][0];
    const d = this.heightCurveRecursive(points, i + 1, j, x);
    
    const e = points[j][0];
    const f = points[i][0];
    
    return (a * b + c * d) / (e - f);
  }
  
  createNoiseFunction(seed, func, dimensions) {
    return (...coords) => noise[String(func) + String(dimensions)](...coords);
  }

  generate() {
    this.generateVertices();
    this.flattenVertices();
    this.generateNormals();
    this.generateColors();
  }

  generateVertices() {
    const {
      vertices,
      lacunarity,
      persistance,
      octaves
    } = this;

    let pointer = 0;

    for (let j = 0; j < this.width; j++) {
      for (let i = 0; i < this.depth; i++) {
        const x = this.position[0] + i * this.triangleSize;
        const z = this.position[1] + j * this.triangleSize;

        let amplitude = 1;
        let frequency = 1;
        let noiseHeight = 0;

        for (let k = 0; k < octaves; k++) {
          const sampleX = x * frequency;
          const sampleZ = z * frequency;

          const noiseX = sampleX * this.noiseFactor + this.noiseOffset;
          const noiseZ = sampleZ * this.noiseFactor + this.noiseOffset;

          const rawNoiseValue = this.noise(noiseX, noiseZ);
          const normalizedValue = Math.pow((rawNoiseValue + 1) / 2, this.noiseSlope);
          const withCurveApplied = this.evaluateHeightCurve(this.heightCurve, normalizedValue);
          const mappedValue = withCurveApplied * 2 - 1;

          const noiseValue = mappedValue * this.maxHeight * this.heightScalar;

          noiseHeight += noiseValue * amplitude;
          amplitude *= persistance;
          frequency *= lacunarity;
        }

        const normalized = this.normalizeHeight(noiseHeight);
        const clamped = Math.max(normalized, this.minNoiseHeight);

        const y = this.unnormalizeHeight(clamped);

        vertices[pointer++] = x;
        vertices[pointer++] = y;
        vertices[pointer++] = z;
      }
    }
  }
  
  flattenVertices() {
    const {
      vertices,
      width,
      depth
    } = this;
    
    const oldVertices = vertices.slice(0);
    
    let pointer = 0;
    
    for (let z = 0; z < depth - 1; z++) {
      for (let x = 0; x < width - 1; x++) {
        const a = x + z * width;
        const b = a + 1;
        const c = a + width;
        const d = c + 1;
        
        vertices[pointer++] = oldVertices[c * 3 + 0];
        vertices[pointer++] = oldVertices[c * 3 + 1];
        vertices[pointer++] = oldVertices[c * 3 + 2];
        
        vertices[pointer++] = oldVertices[b * 3 + 0];
        vertices[pointer++] = oldVertices[b * 3 + 1];
        vertices[pointer++] = oldVertices[b * 3 + 2];
        
        vertices[pointer++] = oldVertices[a * 3 + 0];
        vertices[pointer++] = oldVertices[a * 3 + 1];
        vertices[pointer++] = oldVertices[a * 3 + 2];
        
        vertices[pointer++] = oldVertices[c * 3 + 0];
        vertices[pointer++] = oldVertices[c * 3 + 1];
        vertices[pointer++] = oldVertices[c * 3 + 2];
        
        vertices[pointer++] = oldVertices[d * 3 + 0];
        vertices[pointer++] = oldVertices[d * 3 + 1];
        vertices[pointer++] = oldVertices[d * 3 + 2];
        
        vertices[pointer++] = oldVertices[b * 3 + 0];
        vertices[pointer++] = oldVertices[b * 3 + 1];
        vertices[pointer++] = oldVertices[b * 3 + 2];
      }
    }
  }

  generateNormals() {
    const {
      normals,
      vertices
    } = this;

    let pointer = 0;

    for (let i = 0; i < vertices.length; i += 3) {
      const t0 = (i + 0) * 3;
      const t1 = (i + 1) * 3;
      const t2 = (i + 2) * 3;

      const p1x = vertices[t1 + 0] - vertices[t0 + 0];
      const p1y = vertices[t1 + 1] - vertices[t0 + 1];
      const p1z = vertices[t1 + 2] - vertices[t0 + 2];

      const p2x = vertices[t2 + 0] - vertices[t0 + 0];
      const p2y = vertices[t2 + 1] - vertices[t0 + 1];
      const p2z = vertices[t2 + 2] - vertices[t0 + 2];

      const p3x = p1y * p2z - p1z * p2y;
      const p3y = p1z * p2x - p1x * p2z;
      const p3z = p1x * p2y - p1y * p2x;

      const len = Math.sqrt(p3x * p3x + p3y * p3y + p3z * p3z);
      
      for (let i = 0; i < 3; i++) {
        normals[pointer++] = p3x / len;
        normals[pointer++] = p3y / len;
        normals[pointer++] = p3z / len;
      }
    }
  }

  generateColors() {
    const {
      colors,
      vertices,
      regions
    } = this;

    let pointer = 0;

    for (let i = 0; i < vertices.length; i += 3) {
      const a = i + 0;
      const b = i + 1;
      const c = i + 2;

      const ay = vertices[a * 3 + 1];
      const by = vertices[b * 3 + 1];
      const cy = vertices[c * 3 + 1];

      const height = this.normalizeHeight(Math.max(ay, by, cy));
      let isInRegion = false;

      for (let i = 0; i < regions.length; i++) {
        const region = regions[i];
        const lastRegion = regions[i - 1];

        if (height <= region.height) {
          isInRegion = true;
          
          if (lastRegion) {
            const blend = Math.min((height - lastRegion.height) / ((region.height - lastRegion.height) * region.blend), 1);
            
            const r = lastRegion.color[0] + (region.color[0] - lastRegion.color[0]) * blend;
            const g = lastRegion.color[1] + (region.color[1] - lastRegion.color[1]) * blend;
            const b = lastRegion.color[2] + (region.color[2] - lastRegion.color[2]) * blend;
            
            for (let i = 0; i < 3; i++) {
              colors[pointer++] = r;
              colors[pointer++] = g;
              colors[pointer++] = b;
            }
          } else {
            for (let i = 0; i < 3; i++) {
              colors[pointer++] = region.color[0];
              colors[pointer++] = region.color[1];
              colors[pointer++] = region.color[2];
            }
          }
          
          break;
        }
      }

      if (!isInRegion) {
        for (let i = 0; i < 9; i++) {
          colors[pointer++] = 0;
        }
      }
    }
  }

  getHeightScalar() {
    const { persistance, octaves } = this;

    let amplitude = 1;
    let maximumPossibleHeight = 0;

    for (let i = 0; i < octaves; i++) {
      maximumPossibleHeight += amplitude;
      amplitude *= persistance;
    }

    return 1 / maximumPossibleHeight;
  }

  normalizeHeight(height) {
    return ((height / this.maxHeight) + 1) / 2;
  }

  unnormalizeHeight(height) {
    return (height * 2 - 1) * this.maxHeight;
  }

  getArrayBuffer(name) {
    return this.arrayBuffers[name];
  }

  getData() {
    return {
      colors: this.colors,
      vertices: this.vertices,
      normals: this.normals
    };
  }
}
