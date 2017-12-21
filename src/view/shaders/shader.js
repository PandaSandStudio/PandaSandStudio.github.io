export class ShaderBase {
  constructor(gl, {
    vertex,
    fragment,
    info: {
      attribs,
      uniforms
    },
    render
  }) {
    this.vertexSource = vertex;
    this.fragmentSource = fragment;
    this.attribs = attribs;
    this.uniforms = uniforms;
    
    if (render) {
      this.render = render;
    }
    
    this.initProgram(gl);
  }
  
  clear(color) {
    this.gl.clearColor(...color);
    this.gl.clearDepth(1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }
  
  clearAll(r, g, b, a, w, h) {
    if (r || r === 0) {
      this.gl.clearColor(r, g, b, a);
      this.gl.clearDepth(1);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.viewport(0, 0, w || this.gl.canvas.width, h || this.gl.canvas.height);
  }
  
  clearAll2D(r, g, b, a, w, h) {
    if (r || r === 0) {
      this.gl.clearColor(r, g, b, a);
      this.gl.clearDepth(1);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.viewport(0, 0, w || this.gl.canvas.width, h || this.gl.canvas.height);
  }
  
  getLocation(location) {
    return this.locations.uniforms[location]
      || this.locations.attribs[location]
      || location;
  }
  
  enableBlending() {
    this.gl.enable(this.gl.BLEND);
  }
  
  disableBlending() {
    this.gl.disable(this.gl.BLEND);
  }
  
  enableCullFace() {
    this.gl.enable(this.gl.CULL_FACE);
  }
  
  disableCullFace() {
    this.gl.disable(this.gl.CULL_FACE);
  }
  
  disableAttribute(location) {
    this.gl.disableVertexAttribArray(this.getLocation(location));
  }
  
  enableAdditiveBlending(value) {
    if (value) {
      this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
    } else {
      this.gl.blendFunc(this.gl.ONE, this.gl.ZERO);
    }
  }
  
  setMatrix(location, matrix, numberOfComponents) {
    this.gl[`uniformMatrix${numberOfComponents}fv`](this.getLocation(location), false, matrix);
  }
  
  setBool(location, value) {
    this.gl.uniform1f(this.getLocation(location), value ? 1 : 0);
  }
  
  setVector(location, vector, numberOfComponents) {
    this.gl[`uniform${numberOfComponents}fv`](this.getLocation(location), vector);
  }
  
  setFloat(location, value) {
    this.gl.uniform1f(this.getLocation(location), value);
  }
  
  setTexture(location, texture, slot) {
    this.gl.activeTexture(this.gl[`TEXTURE${slot}`]);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.uniform1i(this.getLocation(location), slot);
  }
  
  setArrayBuffer(location, buffer, numComponents) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.vertexAttribPointer(this.getLocation(location), numComponents, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.getLocation(location));
  }
  
  setElementArrayBuffer(buffer) {
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
  }
  
  setToActiveProgram() {
    this.gl.useProgram(this.program);
  }
  
  bindFramebuffer(framebuffer) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
  }
  
  unbindFramebuffer() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  
  drawTriangles(count) {
    this.gl.drawElements(this.gl.TRIANGLES, count, this.gl.UNSIGNED_SHORT, 0);
  }
  
  drawTrianglesWithoutIndices(count) {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, count);
  }
  
  initProgram(gl) {
    this.gl = gl;
    
    this.program = this.createProgram();
    this.locations = this.calculateLocations(this.program);
  }
  
  calculateLocations(program) {
    this.locations = { attribs: {}, uniforms: {} };
    
    for (const name of this.attribs) {
      this.locations.attribs[name] = this.gl.getAttribLocation(program, name);
    }
    
    for (const name of this.uniforms) {
      this.locations.uniforms[name] = this.gl.getUniformLocation(program, name);
    }
    
    return this.locations;
  }
  
  createProgram() {
    const vertex = this.loadShader(this.gl.VERTEX_SHADER, this.vertexSource);
    const fragment = this.loadShader(this.gl.FRAGMENT_SHADER, this.fragmentSource);
    const program = this.gl.createProgram();
    
    this.gl.attachShader(program, vertex);
    this.gl.attachShader(program, fragment);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error(`ERROR: unable to initialize the shader program: ${this.gl.getProgramInfoLog(program)}`);
    }
    
    return program;
  }
  
  loadShader(type, source) {
    const shader = this.gl.createShader(type);
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(`ERROR: Shader compile failed: ${this.gl.getShaderInfoLog(shader)}`);
    }
    
    return shader;
  }
  
  render(gl) {
    throw new Error('[WebGLShaderBase] render method must be overriden');
  }
}
