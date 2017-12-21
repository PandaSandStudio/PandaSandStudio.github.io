import { Framebuffer } from './framebuffer.js';

export class WaterFramebuffer {
  constructor({
    gl,
    scene,
    reflectionWidth,
    reflectionHeight,
    refractionWidth,
    refractionHeight
  }) {
    this.gl = gl;
    this.scene = scene;
    
    this.reflectionWidth = reflectionWidth;
    this.reflectionHeight = reflectionHeight;
    this.refractionWidth = refractionWidth;
    this.refractionHeight = refractionHeight;
    
    this.initializeReflectionFramebuffer();
    this.initializeRefractionFramebuffer();
  }
  
  initializeReflectionFramebuffer() {
    this.reflectionFramebuffer = new Framebuffer({
      gl: this.gl,
      scene: this.scene,
      width: this.reflectionWidth,
      height: this.reflectionHeight
    });
  }
  
  initializeRefractionFramebuffer() {
    this.refractionFramebuffer = new Framebuffer({
      gl: this.gl,
      scene: this.scene,
      width: this.refractionWidth,
      height: this.refractionHeight,
      useDepthTexture: true
    });
  }
  
  bindReflectionFramebuffer() {
    this.reflectionFramebuffer.bind();
  }
  
  bindRefractionFramebuffer() {
    this.refractionFramebuffer.bind();
  }
  
  unbindFramebuffer() {
    this.reflectionFramebuffer.unbind();
    this.refractionFramebuffer.unbind();
  }
  
  getReflectionTexture() {
    return this.reflectionFramebuffer.getColorTexture();
  }
  
  getRefractionTexture() {
    return this.refractionFramebuffer.getColorTexture();
  }
  
  getRefractionDepthTexture() {
    return this.refractionFramebuffer.getDepthTexture();
  }
}
