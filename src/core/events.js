export class Event {
  constructor(name, callback, context = window) {
    this.name = name;
    this.callback = callback;
    this.context = context;
    
    this.context.addEventListener(this.name, this.callback, false);
  }
  
  unbind() {
    this.context.removeEventListener(this.name, this.callback, false);
  }
}

export class FiringEvent extends Event {
  constructor(name, callback, context = window) {
    super(name, callback, context);
    
    callback.call(context);
  }
}
