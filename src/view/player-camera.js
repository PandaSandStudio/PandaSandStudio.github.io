import { PointerControls } from '../interaction/pointer-controls.js';
import { EventManager } from '../interaction/event-manager.js';
import { KeyControls } from '../interaction/key-controls.js';
import { Frustum } from './frustum.js';

const temp = vec3.create();
const origin = vec3.fromValues(0, 0, 0);
const UP = vec3.fromValues(0, 1, 0);

export class PlayerCamera {
  constructor({
    horizontalSpeed,
    verticalSpeed,
    constantJumpSpeed,
    maxFallSpeed,
    gravity,
    drag,
    element,
    fov,
    aspect,
    near,
    far
  }) {
    this.jumpKey = 'SPACE';
    
    this.keyControls = new KeyControls(this);
    this.keyControls.listen(this.jumpKey, this.jump);
    
    this.eventManager = new EventManager(this, {
      mousemove: this.onmousemove,
      keycontrols: this.keyControls
    });
    
    this.gameElement = element;
    this.pointerControls = new PointerControls(this.eventManager, this.gameElement);
    
    this.velocity = vec3.create();
    this.position = vec3.fromValues(0, 0, -10);
    
    this.rotation = vec2.create();
    this.maxFallSpeed = maxFallSpeed;
    this.originalHorizontalSpeed = horizontalSpeed;
    this.horizontalSpeed = this.originalHorizontalSpeed;
    this.verticalSpeed = verticalSpeed;
    this.constantJumpSpeed = constantJumpSpeed;
    this.gravity = gravity;
    this.drag = drag;
    this.canJump = false;
    this.constantJumpEnabled = false;
    this.sensitivity = 180;
    
    this.keyBindings = {
      'W UP_ARROW': vec3.fromValues(0, 0, -1),
      'S DOWN_ARROW': vec3.fromValues(0, 0, 1),
      'D RIGHT_ARROW': vec3.fromValues(1, 0, 0),
      'A LEFT_ARROW': vec3.fromValues(-1, 0, 0)
    };
    
    this.fov = fov * Math.PI / 180;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    
    this.lookAtMatrix = mat4.create();
    this.projectionMatrix = mat4.create();
    this.projectionViewMatrix = mat4.create();
    this.frustum = new Frustum();
    
    this.calculateProjectionMatrix();
    this.calculateLookAtMatrix();
    this.calculateFrustum();
  }
  
  setHorizontalSpeed(horizontalSpeed) {
    this.horizontalSpeed = horizontalSpeed;
  }
  
  resetHorizontalSpeed() {
    this.horizontalSpeed = this.originalHorizontalSpeed;
  }
  
  getOriginalHorizontalSpeed() {
    return this.originalHorizontalSpeed;
  }
  
  enableJumping() {
    this.canJump = true;
  }
  
  disableJumping() {
    this.canJump = false;
  }
  
  enableConstantJumping() {
    this.constantJumpEnabled = true;
  }
  
  disableConstantJumping() {
    this.constantJumpEnabled = false;
  }
  
  setAspect(aspect) {
    this.aspect = aspect;
    this.calculateProjectionMatrix();
  }
  
  onmousemove(e) {
    this.rotation[0] += e.movementY * this.sensitivity / 600;
    this.rotation[1] -= e.movementX * this.sensitivity / 600;
    
    this.rotation[0] = Math.max(Math.min(this.rotation[0], 89), -89);
  }
  
  getRotationVector() {
    const x = this.rotation[1] * Math.PI / 180;
    const y = this.rotation[0] * Math.PI / 180;
    
    const cy = Math.cos(y);
    const cx = Math.cos(x);
    const sy = Math.sin(y);
    const sx = Math.sin(x);
    
    return vec3.set(temp, cy * sx, sy, cy * cx);
  }
  
  jump() {
    if (this.canJump) {
      this.velocity[1] = this.verticalSpeed;
    }
  }
  
  update(dt) {
    for (const key in this.keyBindings) {
      if (this.keyControls.isPressed(key)) {
        vec3.rotateY(temp, this.keyBindings[key], origin, this.rotation[1] * Math.PI / 180);
        vec3.scale(temp, temp, this.horizontalSpeed);
        vec3.add(this.velocity, this.velocity, temp);
      }
    }
    
    if (this.constantJumpEnabled && this.keyControls.isPressed(this.jumpKey)) {
      this.velocity[1] += this.constantJumpSpeed * dt;
    }
    
    this.velocity[1] -= this.gravity * dt;
    
    if (this.velocity[1] < -this.maxFallSpeed) {
      this.velocity[1] = -this.maxFallSpeed;
    }
    
    vec3.scale(temp, this.velocity, dt);
    vec3.add(this.position, this.position, temp);
    
    this.velocity[0] *= this.drag;
    this.velocity[2] *= this.drag;
    
    this.calculateLookAtMatrix();
    this.calculateFrustum();
  }
  
  reflectY(y) {
    this.position[1] -= 2 * (this.position[1] - y);
    this.rotation[0] *= -1;
    
    this.calculateLookAtMatrix();
    this.calculateFrustum();
  }
  
  calculateProjectionMatrix() {
    mat4.perspective(
      this.projectionMatrix,
      this.fov,
      this.aspect,
      this.near,
      this.far
    );
  }

  calculateLookAtMatrix() {
    const lookAtMatrix = this.lookAtMatrix;
    const position = this.position;
    const rotation = this.getRotationVector();

    mat4.lookAt(
      lookAtMatrix,
      position,
      vec3.sub(temp, position, rotation),
      UP
    );
  }
  
  calculateFrustum() {
    const projectionViewMatrix = mat4.multiply(
      this.projectionViewMatrix,
      this.projectionMatrix,
      this.lookAtMatrix
    );
    
    this.frustum.set(projectionViewMatrix);
  }
  
  setX(x) {
    this.position[0] = x;
    this.calculateLookAtMatrix();
    this.calculateFrustum();
  }
  
  setY(y) {
    this.position[1] = y;
    this.calculateLookAtMatrix();
    this.calculateFrustum();
  }
  
  setZ(z) {
    this.position[2] = z;
    this.calculateLookAtMatrix();
    this.calculateFrustum();
  }
  
  getX() {
    return this.position[0];
  }
  
  getY() {
    return this.position[1];
  }
  
  getZ() {
    return this.position[2];
  }
  
  getFrustum() {
    return this.frustum;
  }

  getNearZ() {
    return this.near;
  }

  getFarZ() {
    return this.far;
  }
  
  getNearFarPlanes() {
    return vec2.fromValues(this.near, this.far);
  }

  getProjectionMatrix() {
    return this.projectionMatrix;
  }

  getViewMatrix() {
    return this.lookAtMatrix;
  }

  getPosition() {
    return this.position;
  }
  
  getVelocity() {
    return this.velocity;
  }
}
