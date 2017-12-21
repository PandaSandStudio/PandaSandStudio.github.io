export class Frustum {
  constructor(matrix) {
    if (matrix) {
      this.set(matrix);
    }
  }
  
  set(m) {
    this.planes = [
      [
        m[3] + m[0],
        m[7] + m[4],
        m[11] + m[8],
        m[15] + m[12]
      ],
      [
        m[3] - m[0],
        m[7] - m[4],
        m[11] - m[8],
        m[15] - m[12]
      ],
      [
        m[3] + m[1],
        m[7] + m[5],
        m[11] + m[9],
        m[15] + m[13]
      ],
      [
        m[3] - m[1],
        m[7] - m[5],
        m[11] - m[9],
        m[15] - m[13]
      ],
      [
        m[3] + m[2],
        m[7] + m[6],
        m[11] + m[10],
        m[15] + m[14]
      ],
      [
        m[3] - m[2],
        m[7] - m[6],
        m[11] - m[10],
        m[15] - m[14]
      ]
    ];
    
    for (let i = 0; i < 6; i++) {
      vec4.normalize(this.planes[i], this.planes[i]);
    }
  }

  collidesWithBounds(bounds) {
    const vmin = vec3.create();
    const vmax = vec3.create();

    const planes = this.planes;
    const box = [
      bounds.getMin(),
      bounds.getMax()
    ];

    for (let i = 0; i < 6; i++) {
      const plane = planes[i];

      const px = plane[0] > 0 ? 1 : 0;
      const py = plane[1] > 0 ? 1 : 0;
      const pz = plane[2] > 0 ? 1 : 0;

      const dp = (
        plane[0] * box[px][0] +
        plane[1] * box[py][1] +
        plane[2] * box[pz][2]
      );

      if (dp < -plane[3]) {
        return false;
      }
    }

    return true;
  }
}
