const UP = vec3.fromValues(0, 1, 0);

export class DirectionalLight {
  constructor({
    direction,
    color
  }) {
    this.tempVec3 = vec3.create();
    this.direction = vec3.normalize(vec3.create(), direction);
    this.position = vec3.fromValues(0, 0, 0);
    
    this.projectionMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    
    this.color = color;
  }
  
  setColor(color) {
    this.color = color;
  }
  
  getColor() {
    return this.color;
  }
  
  getDirection() {
    return this.direction;
  }
  
  setDirection(direction) {
    this.direction = direction;
  }
}
