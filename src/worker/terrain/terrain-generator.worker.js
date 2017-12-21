importScripts('./terrain-generator-class.worker.js');

self.addEventListener('message', e => {
  const { id, args } = JSON.parse(e.data);
  const generator = new TerrainGenerator(args);
  const result = generator.getData();
  
  self.postMessage({ id, result }, [
    generator.getArrayBuffer('vertices'),
    generator.getArrayBuffer('colors'),
    generator.getArrayBuffer('normals')
  ]);
});
