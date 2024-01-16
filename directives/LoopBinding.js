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
 * @property {Map} keys
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
        this.keys = new Map;

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

        this.queue = [];
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

        if (this.compiler.status === 'ready') {
            return this.createChildren(this.evaluate());
        }

        if(this.queue.length){
            for (const cancel of this.queue.reverse()) {
                queueMicrotask(cancel);
            }
        }

        this.updateChildren(this.evaluate());
    }

    /**
     * @param {Array} values
     */
    createChildren(values) {
        this.queue = values.map((item, index)=>{
            return whenIdle(() => {
                this.queue.splice(index, 1);
                const [child, config] = this.createChild(item);
                queueMicrotask(()=>this.compiler.append(child));
                queueMicrotask(()=>this.compiler.update(config));
            });
        })
    }

    /**
     * @param {Array} values
     */
    updateChildren(values) {

        let previousElement = null;
        const createConfigs = [];
        const renderConfigs = [];
        const itemKeysIndex = [];
        const elementsIndex = [];
        const itemKeysArray = values.map((item)=>this.getKey(item));

        /**
         * Walk looped element and build indexes.
         * Cleanup children that no longer exist.
         */
        this.compiler.walk(this.iterableSelector, (child) => {
            const key = child.getAttribute('key');
            if (!itemKeysArray.includes(key)) {
                this.compiler.remove(child);
                return;
            }
            itemKeysIndex.push(key);
            elementsIndex.push(child);
        });

        /**
         * Iterate the array items and check if the key exists and the index of the item, matches the key.
         * Update children that have a key index mismatch. Create new children and append after the last
         * child seen, or fallback to the parent element.
         */
        for (const [index,item] of values.entries()) {

            const key = this.getKey(item);

            if (itemKeysIndex.includes(key)) {
                const child = elementsIndex.at(index);

                if(itemKeysIndex.at(index) === key){
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
            itemKeysIndex.splice(index, 0, key);
            elementsIndex.splice(index, 0, newChild);
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