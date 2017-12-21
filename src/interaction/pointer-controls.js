export class PointerControls {
  constructor(eventManager, element) {
    this.eventManager = eventManager;
    
    this.changeEvents = [
      'mozpointerlockchange',
      'pointerlockchange'
    ];
    
    this.isPointerElementNames = [
      'pointerLockElement',
      'mozPointerLockElement'
    ];
    
    this.bind(element);
  }
  
  bind(element) {
    this.element = element;
    this.element.requestPointerLock =
      this.element.requestPointerLock ||
      this.element.mozRequestPointerLock;
    
    for (const event of this.changeEvents) {
      document.addEventListener(event, () => this.pointerLockChanged());
    }
    
    this.element.addEventListener('click', () => this.requestPointerLock());
  }
  
  requestPointerLock() {
    this.element.requestPointerLock();
  }
  
  pointerLockChanged() {
    if (this.isPointerElementNames.some(name => document[name] === this.element)) {
      this.bindEvents();
    } else {
      this.unbindEvents();
    }
  }
  
  bindEvents() {
    this.eventManager.bind();
  }
  
  unbindEvents() {
    this.eventManager.unbind();
  }
}

