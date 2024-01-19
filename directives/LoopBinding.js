import Directive from "./Directive.js";
import Compiler from "../utilities/Compiler.js";
import {whenIdle} from "../utilities/index.js";

const statements = {
    ARR: ' of ',
    OBJ: ' in ',
}

/**
 * @class LoopBinding
 * @property {Modifiers} modifiers
 * @property {HTMLTemplateElement} iterableElement
 * @property {Array} childKeys
 * @property {string} childKeyName
 * @property {string} iterableSelector
 */
export default class LoopBinding extends Directive {

    /**
     * @typedef {Object} Modifiers
     * @property {boolean} expectsArray
     * @property {string} itemName
     * @property {string} dataName
     * @property {string} keyName
     * @property {Function} keyGetter
     */
    parse() {
        this.compiler = new Compiler({
            logHandler: this.config.scope.logHandler,
            dumpHandler: this.config.scope.dumpHandler,
            errorHandler: this.config.scope.errorHandler,
        }, this.element.parentElement);

        this.iterableElement = this.getIterableElement();
        this.iterableSelector = this.getIterableSelector();

        const {ARR, OBJ} = statements;
        const expectsArray = this.expression.includes(ARR);
        const [itemName, dataName] = this.expression.split(expectsArray ? ARR : OBJ);
        const keyName = this.getKeyName(itemName);
        const keyGetter = this.createExpression(keyName);

        this.modifiers = {
            expectsArray,
            itemName,
            dataName,
            keyName,
            keyGetter,
        };
    }

    /**
     * Create an expression to get the iterable element scope.
     */
    bind() {
        this.bindExpression(this.modifiers.dataName);
    }

    getIterableSelector() {
        return `${this.element.parentElement.localName} > ${this.iterableElement.localName}`;
    }

    /**
     * Get the Key Name specified by the looped element.
     * @return {HTMLElement}
     */
    getIterableElement() {
        if (this.element instanceof HTMLTemplateElement) {
            return this.element.content.firstElementChild;
        }
        return this.element;
    }

    /**
     * Get the Key Name specified by the looped element.
     * @param {string} itemName
     */
    getKeyName(itemName) {
        if (!this.iterableElement.dataset['bind:key']) {
            throw new Error(`ForLoop (${this.expression}) requires data-key="${itemName}.{id}" attribute.`)
        }
        return this.iterableElement.dataset['bind:key'];
    }

    /**
     * Create a new child element and map it with the compiler.
     * @param {Object} stateVal
     */
    createChild(stateVal) {
        return this.compiler.mapElement(this.iterableElement.cloneNode(true), {
            scope: this.createLoopIterationScope(stateVal)
        });
    }

    /**
     * Crate a unique scope for every loop iteration.
     * with an object property that matches
     * the key used in the loop scope.
     * @param {*} value
     * @return {Object}
     */
    createLoopIterationScope(value) {
        const scope = {};
        scope[this.modifiers.itemName] = value;
        return scope;
    }

    /**
     * Get the key value from the loop iteration item.
     * @param {Object} item
     */
    getKey(item) {
        return this.modifiers.keyGetter(this.createLoopIterationScope(item));
    }

    /**
     * Execute the rendering strategy.
     */
    execute() {
        /**
         * When the compiler is in "ready" state, we can
         * simply clone and append the new elements.
         */
        if (this.compiler.status === 'ready') {
            return this.createChildren(this.evaluate());
        }

        /**
         * If the iterable object is mutated before rendering completes, causing a reflow,
         * iterate the queue of pending renders (already in reverse order) canceling each
         * and working toward the current render to prevent a race condition.
         */
        if(!this.compiler.queue.hasJobs){
            //this.compiler.queue.rejectPendingJobs();
            this.updateChildren(this.evaluate());
        }
    }

    /**
     * Wrap the items as deferred tasks using "whenIdle" wrapper.
     * @param {Object[]} values
     */
    createChildren(values) {
        for(const [index, item] of values.entries()){
            whenIdle(()=> {
                const [child, config] = this.createChild(item);
                queueMicrotask(()=>{
                    this.compiler.append(child);
                });
                queueMicrotask(()=>{
                    this.compiler.update(config);
                });
            })
        }
    }

    /**
     * @param {Array} values
     */
    updateChildren(values) {

        let previousElement = null;
        const createConfigs = [];
        const renderConfigs = [];
        const elementIndex = [];
        const elementKeyIndex = [];
        const itemKeyIndex = values.map((item)=>this.getKey(item));

        /**
         * Walk the previously rendered elements and build key indexes.
         * Cleanup children that no longer exist in the items array.
         */
        this.compiler.walk(this.iterableSelector, (child) => {
            const key = child.getAttribute('key');
            if (!itemKeyIndex.includes(key)) {
                this.compiler.remove(child);
                return;
            }
            elementKeyIndex.push(key);
            elementIndex.push(child);
        });

        /**
         * Iterate the array items and check if a child exists at each index and if the key matches.
         * If the key doesn't match (invalid state at index), map the new scope for the item at that index.
         * Create new children and append after the last child seen, or fallback to the parent element.
         */
        for (const [index,item] of values.entries()) {

            const key = this.getKey(item);

            if (elementKeyIndex.includes(key)) {
                const child = elementIndex.at(index);

                if(elementKeyIndex.at(index) === key){
                    previousElement = child;
                    continue;
                }

                const config = this.compiler.elements.get(child);
                config.scope = this.createLoopIterationScope(item);
                renderConfigs.push(config);
                previousElement = child;
                continue;
            }

            const [newChild, newConfig] = this.createChild(item);
            renderConfigs.push(newConfig);
            elementKeyIndex.splice(index, 0, key);
            elementIndex.splice(index, 0, newChild);
            createConfigs.push({newConfig, newChild, sibling: previousElement || this.element});
            previousElement = newChild;
        }

        for(const createConfig of createConfigs){
            const {newChild, sibling} = createConfig;
            sibling.insertAdjacentElement('afterend', newChild);
        }

        this.compiler.update(...renderConfigs);
    }
}