export class Bounds {
  constructor(min, max) {
    this.min = min;
    this.max = max;
  }

  offset(position) {
    vec3.add(this.min, this.min, position);
    vec3.add(this.max, this.max, position);
  }

  getMin() {
    return this.min;
  }

  getMax() {
    return this.max;
  }
}
