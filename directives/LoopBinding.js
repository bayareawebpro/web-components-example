import Directive from "./Directive.js";
import Compiler from "../utilities/Compiler.js";

const statements = {
    ARR: ' of ',
    OBJ: ' in ',
}

/**
 * @class LoopBinding
 * @property {Modifiers} modifiers
 * @property {HTMLTemplateElement} loopedElement
 * @property {Array} childKeys
 * @property {string} childKeyName
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

        if (this.element instanceof HTMLTemplateElement) {
            this.loopedElement = this.element.content.firstElementChild;
        } else {
            this.loopedElement = this.element;
        }

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
            keyGetter
        };
    }

    /**
     * Create an expression to get the iterable object.
     */
    bind() {
        this.bindExpression(this.modifiers.dataName);
    }

    /**
     * Get the Key Name specified by the looped element.
     */
    getKeyName(itemName) {
        if (!this.loopedElement.dataset['bind:key']) {
            throw new Error(`ForLoop (${this.expression}) requires data-key="${itemName}.{id}" attribute.`)
        }
        return this.loopedElement.dataset['bind:key'];
    }

    /**
     * Create a new child element and map it with the compiler.
     */
    createChild(stateVal) {
        return this.compiler.mapElement(this.loopedElement.cloneNode(true), {
            scope: this.createLoopIterationScope(stateVal)
        });
    }

    /**
     * Crate a unique scope for every loop iteration.
     * with an object property that matches
     * the key used in the loop scope.
     * @param value
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

        if (this.compiler.status === 'rendering') {
            return
        }
        this.updateChildren(this.evaluate());
    }

    createChildren(values) {

        for (const [index, item] of values.entries()) {
            /**
             * Move Blocking Process to Background
             * Delay rendering of nodes slightly to improve performance.
             */
            requestIdleCallback(() => {

                if(index % 100){
                    console.log(this.compiler.status)
                }
                const [child, config] = this.createChild(item);
                this.compiler.append(child);
                this.compiler.update(config);
            });
        }
    }


    updateChildren(values) {

        let previous = null;
        const itemKeysIndex = [];
        const elementsIndex = [];
        const createConfigs = [];
        const renderConfigs = [];
        const itemKeysArray = values.map((item)=>this.getKey(item));

        /**
         * Walk elements and build indexes.
         * Remove children that no longer exist.
         */
        this.compiler.walk(this.loopedElement.localName, (child) => {
            if (!itemKeysArray.includes(child.getAttribute('key'))) {
                this.compiler.remove(child);
                return;
            }
            itemKeysIndex.push(child.getAttribute('key'));
            elementsIndex.push(child);
        });

        /**
         * Iterate the array items and check if the child exists. Update children that have an index mismatch.
         * Create new children and append after the last child seen, or fallback to the parent element.
         */
        for (const [index,item] of values.entries()) {

            const key = this.getKey(item);

            if (itemKeysIndex.includes(key)) {
                const child = elementsIndex.at(index);

                if(itemKeysIndex.at(index) === key){
                    previous = child;
                    continue;
                }

                const config = this.compiler.elements.get(child);
                config.scope = this.createLoopIterationScope(item);
                renderConfigs.push(config);
                previous = child;
                continue;
            }

            const [newChild, newConfig] = this.createChild(item);
            renderConfigs.push(newConfig);
            itemKeysIndex.splice(index, 0, key);
            elementsIndex.splice(index, 0, newChild);
            createConfigs.push({child: newChild, sibling: previous || this.element});
            previous = newChild;
        }

        for(const createConfig of createConfigs){
            const {child, sibling} = createConfig;
            sibling.insertAdjacentElement('afterend', child);
        }

        this.compiler.update(...renderConfigs);
    }
}