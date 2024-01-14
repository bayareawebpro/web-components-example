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
            log: this.config.scope.log,
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

        if (this.compiler.status !== 'rendered') {
            return;
        }

        this.updateChildren(this.evaluate());


        // this.compiler.worker('Worker').dispatch({method: 'sortKeys', value}, (event)=>{
        //     console.log('Worker Result', event)
        // });
    }


    updateChildren(values) {

        console.log('updateChildren')
        /**
         * Store a reference to the previous element child.
         */
        let previous = null;

        /**
         * Store changes as needed.
         */
        const changes = [];

        /**
         * Store newly created children as needed.
         */
        const create = [];

        /**
         * Create an array of the keys for access by index.
         */
        const rowLookupArray = values.map((item)=>this.getKey(item));

        /**
         * Keyed dictionary of rendered elements.
         */
        const elements = new Map;

        /**
         * Walk elements and build a map of elements.
         * Remove children that no longer exist IF the array size changed.
         * Otherwise, map existing children to a new key upon mismatch.
         * The resulting map will contain a status for each child node.
         */
        this.compiler.walkElements(this.element.parentElement.querySelectorAll(this.loopedElement.localName), (child, index) => {

            const key = child.getAttribute('key');
            const shouldDelete = rowLookupArray.length < this.compiler.elements.size;

            if (!rowLookupArray.includes(key) && shouldDelete) {
                this.compiler.remove(child);
            }
            else if (rowLookupArray.at(index) !== key) {
                elements.set(key, {
                    config: this.compiler.elements.get(child), child,
                })
            }else{
                elements.set(key, {
                    config: this.compiler.elements.get(child), child,
                })
            }
        });

        /**
         * Walk the array items and check the change status.
         * Update children that had a key mismatch above.
         * Otherwise, create new children and append after
         * the parent element or the last child seen.
         */
        for (const item of values.values()) {

            const key = this.getKey(item);

            if (elements.has(key)) {
                const {child, config, status} = elements.get(key);
                previous = child;

                if (status === 'update') {
                    config.scope = this.createLoopIterationScope(item);
                    changes.push(config);
                }
                continue;
            }

            const [child, config] = this.createChild(item);
            create.push({sibling: previous || this.element, child})
            changes.push(config);
            previous = child;
        }

        for(const task of create){
            task.sibling.insertAdjacentElement('afterend', task.child);
        }

        setTimeout(()=>{
            this.compiler.update(...changes);
        });
    }

    createChildren(values) {

        console.log('createChildren');

        for (const [index, item] of values.entries()) {
            /**
             * Move Blocking Process to Background.
             */
            setTimeout(() => {
                const [child, config] = this.createChild(item);
                queueMicrotask(() => {
                    this.compiler.append(child);
                    this.compiler.update(config);
                })
            }, Math.min(Math.pow(index, 1.5), 100))
        }
    }
}