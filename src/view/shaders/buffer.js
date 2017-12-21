const isPowerOf2 = num => num & (num - 1) === 0;

const DONE = 'done';

const BUFFER_TYPES = {
  'ARRAY_BUFFER': 'createArrayBuffer',
  'ELEMENT_ARRAY_BUFFER': 'createElementArrayBuffer',
  'TEXTURE_2D': 'createTexture2D',
  'CUSTOM': 'createCustomData'
};

const UPDATE_BUFFER_TYPES = {
  'ARRAY_BUFFER': 'updateArrayBuffer',
  'ELEMENT_ARRAY_BUFFER': 'updateElementArrayBuffer',
  'CUSTOM': 'createCustomData'
};

export class BufferData {
  constructor(data) {
    this.data = data;
    this.buffers = {};
  }

  bindBuffers(gl) {
    for (const name in this.data) {
      const { type, data, isDynamic } = this.data[name];

      if (name === DONE) continue;

      if (!BUFFER_TYPES[type]) {
        throw new Error(`[WebGLShader] The type provided (${type}) is not a valid buffer type (${
          Object.keys(BUFFER_TYPES).join(', ')
        })`);
      }

      this.buffers[name] = this[BUFFER_TYPES[type]](gl, data, isDynamic);
    }

    if (this.data[DONE]) {
      this.data[DONE](this.buffers, this.data);
    }
  }

  updateBuffers(newData, gl) {
    for (const name in newData) {
      this.data[name].data = newData[name];

      const { type, data } = this.data[name];

      if (!UPDATE_BUFFER_TYPES[type]) {
        throw new Error(`[WebGLShader] The type provided (${type}) is not a valid update buffer type (${
          Object.keys(UPDATE_BUFFER_TYPES).join(', ')
        })`);
      }

      this.buffers[name] = this[UPDATE_BUFFER_TYPES[type]](this.buffers[name], gl, data);
    }
  }

  createCustomData(gl, data) {
    return data;
  }

  createArrayBuffer(gl, data, isDynamic) {
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      data instanceof Float32Array ? data : new Float32Array(data),
      isDynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW
    );

    return buffer;
  }

  updateArrayBuffer(buffer, gl, data) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      data instanceof Float32Array ? data : new Float32Array(data),
      gl.DYNAMIC_DRAW
    );

    return buffer;
  }

  createElementArrayBuffer(gl, data, isDynamic) {
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      data instanceof Uint16Array ? data : new Uint16Array(data),
      isDynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW
    );

    return buffer;
  }

  updateElementArrayBuffer(buffer, gl, data) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      data instanceof Uint16Array ? data : new Uint16Array(data),
      gl.DYNAMIC_DRAW
    );

    return buffer;
  }

  createTexture2D(gl, image) {
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    return texture;
  }

  getOriginalData() {
    return this.data;
  }

  getBuffers() {
    return this.buffers;
  }

  getBuffer(name) {
    return this.buffers[name];
  }
  
  getLengthOf(name) {
    return this.data[name].data.length;
  }
}
