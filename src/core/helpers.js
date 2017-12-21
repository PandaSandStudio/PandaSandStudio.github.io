export const flatten = array => {
  const res = [];
  for (let i = 0; i < array.length; i++) {
    res.push.apply(res, array[i]);
  }
  return res;
};

export const unflatten = array => {
  const res = [];
  for (let i = 0; i < array.length; i += 3) {
    res.push([array[i], array[i + 1], array[i + 2]]);
  }
  return res;
};

export const loadImage = src => new Promise((resolve, reject) => {
  const image = new Image();
  image.src = src;
  
  image.addEventListener('load', () => {
    resolve(image);
  });
  
  image.addEventListener('error', reject);
});
