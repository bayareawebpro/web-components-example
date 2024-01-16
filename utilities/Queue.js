import {whenIdle} from "./index.js";

export default class Queue {

    constructor() {
        this.jobs = [];
    }

    get hasJobs() {
        return this.jobs.length > 0;
    }

    work() {
        const jobPromises = [];

        while(this.hasJobs){

            const job = this.jobs.shift();

            jobPromises.push(new Promise((resolve)=>{
                if (job instanceof Function) {
                    queueMicrotask(() => job());
                    resolve();
                }
            }))
        }

        return Promise.allSettled(jobPromises)
    }

    /**
     * @param {Function} job
     * @return void
     */
    addJob(job) {
        this.jobs.push(job);
    }
}