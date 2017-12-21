export class Noise {
  constructor(seed, func, dimensions) {
    this.setSeed(seed);
    this.configure(func, dimensions);
  }
  
  configure(func, dimensions) {
    this.func = func;
    this.dimensions = String(dimensions);
  }
  
  generate(...coords) {
    return noise[this.func + this.dimensions](...coords);
  }
  
  setSeed(seed) {
    this.seed = seed;
    noise.seed(seed);
  }
  
  getSeed() {
    return this.seed;
  }
}
