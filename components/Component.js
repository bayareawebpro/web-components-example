import {uuid, toType} from "../utilities/index.js";
import Compiler from "../utilities/Compiler.js";

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
        this.lockedForStateUpdate = true;
        this.dependencies = new Map;
        this.view = new Compiler(this);
        this.errorHandler = this.log.bind(this);
        this.renderedCallback = this.rendered.bind(this);
        this.props = this.watch(this.props || {});
        this.state = this.watch(this.data);
        this.attachShadow({
            mode: 'open',
            delegatesFocus: true
        });
    }

    get data() {
        return {};
    }

    setup() {
        // Setup Listeners
    }

    updated() {
        // ?
    }

    beforeDestroy() {
        // Destroy Listeners
    }

    render(_) {
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
            set: (target, key, value) => {

                const oldHash = this.dependencies.get(key);
                const newHash = JSON.stringify(value);
                const expired = target[key];

                if (oldHash === newHash) {
                    if (this.logMutations) {
                        this.log(`State Valid: ${key}`);
                    }
                    return true;
                }

                this.dependencies.set(key, newHash);

                target[key] = value;

                this.update().then(()=>{
                    if (this.logMutations) {
                        this.log(`State Mutated: ${key}`, value);
                    }
                    if(typeof callback === 'function'){
                        callback(value, expired)
                    }
                }).catch(this.log.bind(this))

                return true;
            }
        })
    }

    async update() {
        if (this.lockedForStateUpdate) {
            return;
        }

        this.performanceMark('compile');

        await (
            this.view.compiled
                ? this.view.updateCompiled()
                : this.view.compile(this.render(this.view))
        ).then(this.renderedCallback).catch(this.errorHandler);
    }

    rendered(){
        this.performanceMeasure('compile', 'rendered');
        this.updated()
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

        this.log(`${start}:${end} in ${measurement.duration}ms`);

        performance.clearMarks(first);
        performance.clearMarks(last);
        performance.clearMeasures(measure);
    }

    log(event, data) {

        if (event.constructor.name.includes('Error') || event.constructor.name.includes('Exception')) {
            return console.error(`${this.constructor.name}:`, event);
        }

        if(this.debug || this.measurePerformance){
            if (data) {
                console.info(`${this.constructor.name}: ${event}`, data);
            } else {
                console.debug(`${this.constructor.name}: ${event}`);
            }
        }
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
                this.update().catch(this.errorHandler);
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
            this.$emit('connected');
        });
    }

    disconnectedCallback() {
        this.beforeDestroy();
        this.dependencies = null;
        this.props = null;
        this.state = null;
        this.view = null;
    }
}