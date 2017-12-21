export class Framebuffer {
  constructor({
    gl,
    scene,
    width,
    height,
    useDepthTexture
  }) {
    this.gl = gl;
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.useDepthTexture = useDepthTexture;
    
    this.framebuffer = this.createFramebuffer();
    this.colorTexture = this.createTextureAttachment(this.width, this.height);
    
    if (this.useDepthTexture) {
      this.depthTexture = this.createDepthTextureAttachment(this.width, this.height);
    } else {
      this.depthBuffer = this.createDepthBufferAttachment(this.width, this.height);
    }
    
    this.checkFramebufferStatus(gl);
    this.unbind(gl);
  }
  
  checkFramebufferStatus() {
    const gl = this.gl;
    let error = '';
    
    switch (gl.checkFramebufferStatus(gl.FRAMEBUFFER)) {
      case gl.FRAMEBUFFER_COMPLETE: return;
      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: error = 'The attachment types are mismatched or not all framebuffer attachment points are framebuffer attachment complete'; break;
      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: error = 'There is no attachment'; break;
      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: error = 'Height and width of the attachment are not the same'; break;
      case gl.FRAMEBUFFER_UNSUPORTED: error = 'The format of the attachment is not supported or if depth and stencil attachments are not the same renderbuffer'; break;
      case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: error = 'The values of gl.RENDERBUFFER_SAMPLES are different among attached renderbuffers, or are non-zero if the attached images are a mix of renderbuffers and textures'; break;
    }
    
    throw new Error('[WaterFramebuffer] WebGL Framebuffer Status Failed - ' + error);
  }
  
  createFramebuffer() {
    const framebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    
    return framebuffer;
  }
  
  createTextureAttachment(width, height) {
    const gl = this.gl;
    const texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA,
      width, height,
      0, gl.RGBA, gl.UNSIGNED_BYTE, null
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D, texture, 0
    );
    
    return texture;
  }
  
  createDepthBufferAttachment(width, height) {
    const gl = this.gl;
    const depthBuffer = gl.createRenderbuffer();
    
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(
      gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
      width, height
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER, depthBuffer
    );
    
    return depthBuffer;
  }
  
  createDepthTextureAttachment(width, height) {
    const gl = this.gl;
    
    if (!gl.getExtension('WEBGL_depth_texture')) {
      throw new Error('[WaterFramebuffer] No WebGL Depth Texture Extension');
    }
    
    const depthTexture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT,
      width, height,
      0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT,
      null
    );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
    
    return depthTexture;
  }
  
  bind() {
    const { gl, scene } = this;
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    
    gl.clearColor(...scene.getClearColor());
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.viewport(0, 0, this.width, this.height);
  }
  
  unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  
  getFramebuffer() {
    return this.framebuffer;
  }
  
  getColorTexture() {
    return this.colorTexture;
  }
  
  getDepthTexture() {
    return this.depthTexture;
  }
  
  getDepthBuffer() {
    return this.depthBuffer;
  }
}
