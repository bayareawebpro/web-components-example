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
        this.dependencies = new Map;
        this.measurePerformance = false;
        this.lockedForStateUpdate = false;
        this.errorHandler = this.errorHandler.bind(this);
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

                const oldHash = this.dependencies.get(key);
                const newHash = JSON.stringify(newVal);

                if (oldHash === newHash) {
                    if (this.logMutations) {
                        this.log(`State Valid: ${key}`);
                    }
                    return true;
                }


                this.dependencies.set(key, newHash);
                target[key] = newVal;

                if (this.logMutations) {
                    this.log(`State Mutated: ${key}`);
                }

                this.update()

                if(typeof callback === 'function'){
                    callback(newVal, oldVal)
                }

                return true;
            }
        })
    }

    update() {
        if (this.lockedForStateUpdate) {
            return;
        }

        this.performanceMark('compile');

        try{
            this.view.rendered
                ? this.view.updateCompiled()
                : this.view.compile(this.template, this.styles)
        }catch (error){
            this.errorHandler(error);
        }
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

        performance.clearMarks(first);
        performance.clearMarks(last);
        performance.clearMeasures(measure);
    }

    log(event, ...data) {
        if(!this.debug) return;
        console.debug(`${this.constructor.name}: ${event}`, ...data);
    }

    errorHandler(...data) {
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

    batchUpdate(callback, reRender = true) {
        if (typeof callback === 'function') {
            this.lockedForStateUpdate = true;
            callback.call();
            this.lockedForStateUpdate = false;
            if (reRender) {
                this.update();
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const {realName, realValue} = toType(name, newValue)
        this.props[realName] = realValue
    }

    connectedCallback() {
        this.setup();
        this.batchUpdate(() => {
            this.$emit('connected')
        });
    }

    disconnectedCallback() {
        this.beforeDestroy();
        this.errorHandler = undefined;
        this.renderedCallback = undefined;
        this.dependencies = undefined;
        this.props = undefined;
        this.state = undefined;
        this.view = undefined;
    }
}