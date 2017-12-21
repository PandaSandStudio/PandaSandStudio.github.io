import { WorkerManager } from '../web-worker-manager.js';

let uid = 0;

export class TerrainGenerator {
  constructor() {
    this.workerManager = new WorkerManager('src/worker/terrain/terrain-generator.worker.js');
    this.resolving = {};

    for (const worker of this.workerManager.getAllWorkers()) {
      worker.addEventListener('message', e => this.resolveCallback(e.data.id, e.data.result));
    }
  }

  resolveCallback(id, result) {
    this.resolving[id](result);
  }

  generate(scene, args) {
    return new Promise(resolve => {
      const worker = this.workerManager.getAvaliableWorker();
      const id = uid++;

      worker.postMessage(JSON.stringify({ args, id }));

      this.resolving[id] = resolve;
    });
  }
}
