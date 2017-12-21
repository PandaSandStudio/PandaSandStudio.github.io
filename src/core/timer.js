export class Timer {
  constructor({ context, update }) {
    this.update = update.bind(context || this);
    this.animId = null;
  }
  
  init() {
    this.tick = this.tick.bind(this);
    this.last = performance.now();
    this.total = 0;
    this.animId = window.requestAnimationFrame(this.tick);
  }
  
  end() {
    if (this.animId) {
      window.cancelAnimationFrame(this.animId);
    }
    
    this.animId = null;
  }
  
  tick(time) {
    this.animId = window.requestAnimationFrame(this.tick);
    
    this.total += time - this.last;
    this.update(Math.max(Math.min(time - this.last, 70), 0.2), this.total);
    this.last = time;
  }
}
