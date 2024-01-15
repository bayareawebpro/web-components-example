export default function make(name){
    if (!'Worker' in window) {
        throw new Error('Worker API not available.');
    }

    const worker = new Worker(`/utilities/${name}.js`);

    /**
     * worker.listen(()=>{
     *     //
     * }).catch(()=>{
     *     //
     * });
     *
     * worker.dispatch(data);
     *
     * worker.terminate();
     */
    return {
        listen(callback, errorHandler){

            worker.addEventListener('message',callback);

            return {
                catch(errorHandler){
                    worker.addEventListener('error',errorHandler);
                    worker.addEventListener('messageerror',errorHandler);
                }
            }
        },
        dispatch(data){
            worker.postMessage(structuredClone(data));
        },
        terminate(){
            worker.terminate();
        }
    }
}