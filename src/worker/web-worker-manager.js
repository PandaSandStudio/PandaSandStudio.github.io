export class WorkerManager {
  constructor(url) {
    this.inactiveWorkers = [];
    this.activeWorkers = [];
    this.maxWorkers = navigator.hardwareConcurrency;

    for (let i = 0; i < this.maxWorkers; i++) {
      this.inactiveWorkers[i] = new Worker(url);
    }
  }

  getAvaliableWorker() {
    if (this.inactiveWorkers.length === 0) {
      const worker = this.activeWorkers.shift();
      this.activeWorkers.push(worker);
      
      return worker;
    }

    const worker = this.inactiveWorkers.pop();
    this.activeWorkers.push(worker);

    return worker;
  }

  disableWorker(worker) {
    const index = this.activeWorkers.indexOf(worker);

    this.activeWorkers.splice(index, 1);
    this.inactiveWorkers.push(worker);
  }

  getAllWorkers() {
    return [...this.activeWorkers, ...this.inactiveWorkers];
  }
}
