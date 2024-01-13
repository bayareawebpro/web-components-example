import {uuid, toType} from "../utilities/index.js";
import Compiler from "../utilities/Compiler.js";

/**
 * @module Component
 */
export default class Component extends HTMLElement {

    static observedAttributes = [
        // prop names
    ];

    constructor() {
        super();
        this.uuid = uuid();
        this.debug = false;
        this.logMutations = false;
        this.measurePerformance = false;
        this.lockedForStateUpdate = false;
        this.errorHandler = this.error.bind(this);
        this.props = this.watch(this.props || {});
        this.state = this.watch(this.data);
        this.view = new Compiler(this, this.attachShadow({
            mode: 'open',
            delegatesFocus: true
        }));
    }

    get data() {
        return {};
    }

    setup() {
        // Setup Listeners
    }

    beforeDestroy() {
        // Destroy Listeners
    }

    get template() {
        return ``;
    }

    get styles() {
        return `
            <style>
            
            </style>
        `;
    }

    setState(name, value) {
        this.state[name] = value;
    }

    watch(state = {}, callback) {
        return new Proxy(state, {
            get: (target, prop) => {
                return prop in target ? target[prop] : null;
            },
            set: (target, key, newVal) => {

                const oldVal = target[key];

                const oldHash = JSON.stringify(oldVal);
                const newHash = JSON.stringify(newVal);

                if (oldHash === newHash) {
                    if (this.logMutations) {
                        this.log(`State Valid: ${key}`, {oldHash, newHash});
                    }
                    return true;
                }

                target[key] = newVal;

                if (this.logMutations) {
                    this.log(`State Mutated: ${key}`);
                }

                if(!this.lockedForStateUpdate){
                    this.batchUpdate().then(()=>{
                        if(callback instanceof Function){
                            callback(newVal, oldVal)
                        }
                    })
                }
                return true;
            }
        })
    }

    performanceMark(name){
        if (!this.measurePerformance) return;
        performance.mark(`${this.uuid}:${name}`);
    }

    performanceMeasure(start, end){
        if (!this.measurePerformance) return;

        this.performanceMark(end);

        const measure = `${this.uuid}:${start}:${end}`;
        const first = `${this.uuid}:${start}`;
        const last = `${this.uuid}:${end}`;

        const measurement = performance.measure(measure, first, last);

        this.log(`${start}:${end} in ${measurement.duration.toFixed(2)}ms`);
        performance.clearMeasures(measure);
        performance.clearMarks(first);
        performance.clearMarks(last);
    }

    log(event, ...data) {
        if(!this.debug) return;
        console.info(`${this.constructor.name}: ${event}`, ...data);
    }

    error(...data) {
        return console.error(`${this.constructor.name}:`, ...data);
    }

    dump(event, ...data) {
        console.info(`${this.constructor.name}:`, ...data);
    }

    $emit(event, detail = {}, config = {}) {
        this.dispatchEvent(new CustomEvent(event, {
            cancelable: false,
            composed: true,
            bubbles: true,
            ...config,
            detail
        }));
    }

    batchUpdate(callback = null, reRender = true) {
        this.lockedForStateUpdate = true;

        if(callback instanceof Function){
            callback();
        }

        this.lockedForStateUpdate = false;

        if (reRender) {
            return this.view.update().catch(this.errorHandler);
        }

        return Promise.resolve();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const {realName, realValue} = toType(name, newValue)
        this.props[realName] = realValue
    }

    connectedCallback() {
        setTimeout( ()=>{
            this.setup();
            this.view.compile(this.template, this.styles);
            this.batchUpdate(() => {
                this.$emit('connected')
            });
        });
    }

    disconnectedCallback() {
        this.beforeDestroy();
    }
}