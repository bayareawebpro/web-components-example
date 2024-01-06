import {View} from "../utilities/View.js";
import toType from "../utilities/Types.js";

export default class Component extends HTMLElement {

    static observedAttributes = [
        // prop names
    ];

    constructor() {
        super();
        this.props = {};
        this.state = {};
        this.debug = true;
        this.measurePerformance = true;
        this.lockedForStateUpdate = false;
        this.attachShadow({mode: 'open'});
        this.view = new View(this);
    }

    get data() {
        return {

        }
    }

    setup() {
        // Setup Listeners
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

    watch(state = {}, config = {}){
        return new Proxy(state, config)
    }

    update() {
        if(this.lockedForStateUpdate){
            return;
        }

        performance.clearMeasures(`${this.constructor.name}:compile`);
        performance.clearMeasures(`${this.constructor.name}:render`);
        performance.clearMarks(`${this.constructor.name}:compile`);
        performance.clearMarks(`${this.constructor.name}:render`);

        if(this.measurePerformance){
            performance.mark(`${this.constructor.name}:compile`);
        }

        const rendered = this.render(this.view);

        if(!(rendered instanceof View)){
            this.shadowRoot.replaceChildren(this.view.compile(rendered))
        }

        if(this.measurePerformance){
            performance.mark(`${this.constructor.name}:render`);

            const measurement = performance.measure(
                `${this.constructor.name}:render`,
                `${this.constructor.name}:compile`
            );

            this.log(`Rendered in ${measurement.duration.toFixed(2)}ms`);
        }
    }

    toError(error){
        return new Error(`${this.constructor.name}: ${error}`);
    }

    log(event, data){
        if(this.debug){
            if(data){
                console.log(`${this.constructor.name}: ${event}`, data);
            }else{
                console.log(`${this.constructor.name}: ${event}`);
            }
        }
    }

    $emit(event, detail = {}, config = {}){
        this.dispatchEvent(new CustomEvent(event, {
            cancelable: false,
            composed: true,
            bubbles: true,
            ...config,
            detail
        }));
    }

    batchUpdate(callback, reRender = true){
        if(typeof callback === 'function'){
            //this.log('Locked for batch update.')
            this.lockedForStateUpdate = true;

            callback();

            //this.log('UnLocked for render.')
            this.lockedForStateUpdate = false;

            if(reRender){
                this.update();
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const {realName, realValue} = toType(name, newValue)

        const existingValue = this.props[realName] || null

        this.props[realName] = realValue

        const methodName = `${realName}AttributeChanged`;

        if(typeof this[methodName] === 'function'){
            this[methodName](realValue, existingValue)
        }
    }

    connectedCallback() {
        this.batchUpdate(()=>{
            this.setup();
            this.state = new Proxy(this.data, {
                get: (target, prop) => {
                    return prop in target ? target[prop] : null;
                },
                set: (target, key, value) => {
                    target[key] = value
                    this.log(`state.${key} mutated`)
                    this.update()
                    return true;
                }
            })
        });
    }

    disconnectedCallback() {
        this.log('destroyed.')
        this.props = {}
        this.state = {}
    }
}