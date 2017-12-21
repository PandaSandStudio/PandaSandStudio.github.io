export class Fog {
  constructor({ distance, color, power }) {
    this.distance = distance;
    this.color = color;
    this.power = power;
  }
  
  getDistance() {
    return this.distance;
  }
  
  getColor() {
    return this.color;
  }
  
  getPower() {
    return this.power;
  }
}
