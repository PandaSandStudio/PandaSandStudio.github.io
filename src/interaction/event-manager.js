export class EventManager {
  constructor(context, bindings) {
    if (!bindings) {
      [ context, bindings ] = [ this, context ];
    }
    
    this.bindings = [];
    
    for (let name in bindings) {
      name = name.toLowerCase();
      
      if (name === 'keycontrols') {
        const controls = bindings[name];
        
        this.on('keydown', controls.keydown.bind(controls));
        this.on('keyup', controls.keyup.bind(controls));
        
        return;
      }
      
      if (typeof bindings[name] === 'object') {
        this.on(name, bindings[name].callback.bind(bindings[name].context || context));
      } else {
        this.on(name, bindings[name].bind(context));
      }
    }
  }
  
  on(name, callback) {
    this.bindings.push([ name.toLowerCase(), callback ]);
  }
  
  bind() {
    for (const [ name, callback ] of this.bindings) {
      document.addEventListener(name, callback);
    }
  }
  
  unbind() {
    for (const [ name, callback ] of this.bindings) {
      document.removeEventListener(name, callback);
    }
  }
}
