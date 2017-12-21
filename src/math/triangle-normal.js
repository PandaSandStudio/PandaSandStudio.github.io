export const getTriangleNormal = triangle => {
  const p1x = triangle[1][0] - triangle[0][0];
  const p1y = triangle[1][1] - triangle[0][1];
  const p1z = triangle[1][2] - triangle[0][2];

  const p2x = triangle[2][0] - triangle[0][0];
  const p2y = triangle[2][1] - triangle[0][1];
  const p2z = triangle[2][2] - triangle[0][2];

  const p3x = p1y * p2z - p1z * p2y;
  const p3y = p1z * p2x - p1x * p2z;
  const p3z = p1x * p2y - p1y * p2x;

  const len = Math.sqrt(p3x * p3x + p3y * p3y + p3z * p3z);
  
  return len === 0
    ? vec3.create()
    : vec3.fromValues(p3x / len, p3y / len, p3z / len);
};
