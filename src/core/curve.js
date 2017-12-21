export class Curve {
  constructor(points) {
    this.points = points;
    
    if (this.points.length === 0) {
      throw new Error('[Curve] this.points.length must be greater than 0');
    }
  }
  
  p(i, j, x) {
    const { points } = this;
    
    if (i === j) {
      return points[i][1];
    }
    
    return ((points[j][0] - x) * this.p(i, j - 1, x) +
            (x - points[i][0]) * this.p(i + 1, j, x)) /
            (points[j][0] - points[i][0]);
  }
  
  evaluate(x) {
    return this.p(0, this.points.length - 1, x);
  }
}
