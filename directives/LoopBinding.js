import Directive from "./Directive.js";
import Compiler from "../utilities/Compiler.js";

const statements = {
    ARR: ' of ',
    OBJ: ' in ',
}

/**
 * @typedef {Object} Modifiers
 * @property {string} itemName
 * @property {string} dataName
 * @property {boolean} expectsArray
 */

/**
 * @class LoopBinding
 * @property {Modifiers} modifiers
 * @property {HTMLTemplateElement} loopedElement
 * @property {Array} childKeys
 * @property {string} childKeyName
 * @property {Function} childKeyGetter
 */
export default class LoopBinding extends Directive {

    parse() {

        const {ARR, OBJ} = statements;

        const expectsArray = this.expression.includes(ARR);

        const [itemName, dataName] = this.expression.split(expectsArray ? ARR : OBJ);

        this.modifiers = {
            itemName,
            dataName,
            expectsArray,
        };

        this.compiler = new Compiler({
            log: this.config.scope.log,
            errorHandler: this.config.scope.errorHandler,
        }, this.element.parentElement);

        this.loopedElement = this.element.content.firstElementChild;

        if (!this.loopedElement.dataset['bind:key']) {
            throw new Error(`ForLoop (${this.expression}) requires data-key="${this.modifiers.itemName}.{your_id}" attribute.`)
        }

        this.childKeyName = this.loopedElement.dataset['bind:key'];
        this.childKeyGetter = this.createExpression(this.loopedElement.dataset['bind:key']);
    }

    bind() {
        this.bindExpression(this.modifiers.dataName);

    }

    createChild(stateVal) {

        const child = this.compiler.mapElement(this.loopedElement.cloneNode(true), {
            scope: this.createItemScope(stateVal)
        });

        child.addEventListener('connected', ({target}) => {
            this.compiler.updateCompiled(this.compiler.elements.get(target))
        });

        return child;
    }

    createItemScope(value) {
        // Set the scope for every loop iteration.
        // with an object property that matches
        // the key used in the loop scope.
        const scope = {};
        scope[this.modifiers.itemName] = value;
        return scope;
    }

    /**
     * @param {Object} item
     */
    getItemKey(item) {
        return this.childKeyGetter(this.createItemScope(item));
    }

    execute() {

        const values = this.evaluate();

        if (!this.compiler.rendered) {
            this.compiler.append(...values.map((stateVal) => {
                return this.createChild(stateVal);
            }));
            return;
        }

        const children = Array.from(this.compiler.elements.entries());

        if (values.length === children.length) {

            const changed = [];

            for (const [index, item] of values.entries()) {

                const key = this.getItemKey(item);
                const [child, config] = children.at(index);

                if(key !== child.getAttribute('key')){
                    config.scope = this.createItemScope(item);
                    changed.push(config);
                }
            }
            this.compiler.updateCompiled(...changed);
            return;
        }

        if (values.length < children.length) {

            const childKeys = values.map((item) => this.getItemKey(item));

            for (const [child] of children) {
                if (!childKeys.includes(child.getAttribute('key'))) {
                    this.compiler.remove(child);
                }
            }

            return;
        }

        if (values.length > children.length) {

            const elementKeys = children.map(([child]) =>child.getAttribute('key'));

            let previousKey;

            for (const [index, item] of values.entries()) {

                const key = this.getItemKey(item);

                if (elementKeys.includes(key)) {
                    //console.log(`Item ${index}: key valid`)
                    previousKey = key;
                    continue;
                }

                if (index === 0) {
                    //console.log(`Item ${index}: prepend`)
                    const child = this.createChild(item);
                    this.compiler.prepend(child);
                    //this.compiler.updateCompiled(this.compiler.elements.get(child));
                    children.unshift(child);
                    elementKeys.unshift(key);
                    previousKey = key;
                    continue;
                }

                if(index === (values.length - 1)){
                    //console.log(`Item ${index}: append`)
                    const child = this.createChild(item);
                    this.compiler.append(child);
                    //this.compiler.updateCompiled(this.compiler.elements.get(child));
                    continue;
                }

                if(!previousKey){
                    //console.log(`Item ${index}: Not Found!`)
                    continue;
                }

                const previousIndex = elementKeys.indexOf(previousKey);
                const [previousChild] = children.at(previousIndex);
                const child = this.createChild(item);

                previousChild.insertAdjacentElement('afterend', child);
                children.splice(previousIndex, 0, child);
                elementKeys.splice(previousIndex, 0, previousKey = key);
                //this.compiler.updateCompiled(this.compiler.elements.get(child));
                //console.log(`Item ${index}: inserted`)

            }
        }
    }
}