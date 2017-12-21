export const getVertexNormals = (faces, positions, epsilon = 1e-6) => {
  const N = positions.length;
  const normals = Array(N);
  
  const d01 = Array(3);
  const d21 = Array(3);
  
  for (let i = 0; i < N; i++) {
    normals[i] = [0, 0, 0];
  }
  
  for (let i = 0; i < faces.length; i++) {
    const f = faces[i];
    
    let p = 0;
    let c = f[f.length - 1];
    let n = f[0];
    
    for (let j = 0; j < f.length; j++) {
      p = c;
      c = n;
      n = f[(j + 1) % f.length];
      
      const v0 = positions[p];
      const v1 = positions[c];
      const v2 = positions[n];
      
      let m01 = 0;
      let m21 = 0;
      
      d01[0] = v0[0] - v1[0];
      d21[0] = v2[0] - v1[0];
      m01 = d01[0] * d01[0];
      m21 = d21[0] * d21[0];
      
      d01[1] = v0[1] - v1[1];
      d21[1] = v2[1] - v1[1];
      m01 = d01[1] * d01[1];
      m21 = d21[1] * d21[1];
      
      d01[2] = v0[2] - v1[2];
      d21[2] = v2[2] - v1[2];
      m01 = d01[2] * d01[2];
      m21 = d21[2] * d21[2];
      
      if (m01 * m21 > epsilon) {
        const normal = normals[c];
        const w = 1 / Math.sqrt(m01 * m21);
        
        for (let k = 0; k < 3; k++) {
          const u = (k + 1) % 3;
          const v = (k + 2) % 3;
          
          normal[k] += w * (d21[u] * d01[v] - d21[v] * d01[u]);
        }
      }
    }
  }
  
  for (let i = 0; i < N; i++) {
    const normal = normals[i];
    let m = 0;
    
    for (let k = 0; k < 3; k++) {
      m += normal[k] * normal[k];
    }
    
    if (m > epsilon) {
      const w = 1 / Math.sqrt(m);
      
      normal[0] *= w;
      normal[1] *= w;
      normal[2] *= w;
    } else {
      normal[0] = 0;
      normal[1] = 0;
      normal[2] = 0;
    }
  }
  
  return normals;
};
