import Directive from "./Directive.js";
import Compiler from "../utilities/Compiler.js";
import Component from "../components/Component.js";

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
        return this.compiler.mapElement(this.loopedElement.cloneNode(true), {
            scope: this.createLoopIterationScope(stateVal)
        });
    }

    /**
     * Set the scope for every loop iteration.
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
     * @param {Object} item
     */
    getItemKey(item) {
        return this.childKeyGetter(this.createLoopIterationScope(item));
    }

    execute() {

        if (this.compiler.status === 'ready') {
            return this.createChildren(this.evaluate());
        }

        if (this.compiler.status !== 'rendered') {
            return;
        }

        const values = this.evaluate();
        const children = this.getChildren();

        if (values.length < children.length) {
            this.removeChildren(values, children);
        } else if (values.length > children.length) {
            this.insertChildren(values, children);
        } else if (values.length === children.length) {
            this.updateChildren(values, children);
        }
    }

    getChildren() {
        return Array.from(this.compiler.elements.entries());
    }

    createChildren(values) {
        this.compiler.status = 'compiling';
        console.log('createChildren');
        for (const item of values) {
            setTimeout(() => {
                const [child, config] = this.createChild(item);
                queueMicrotask(() => {
                    this.compiler.append(child);
                    this.compiler.update(config);
                })
            })
        }
    }

    removeChildren(values, children) {
        console.log('removeChildren');
        const keys = values.map((item) => this.getItemKey(item));

        for (const [child] of children) {
            if (!keys.includes(child.getAttribute('key'))) {
                this.compiler.remove(child);
            }
        }
        // this.compiler.walk(this.loopedElement.localName, (child) => {
        //     if (!keys.includes(child.getAttribute('key'))) {
        //     }
        // })
    }

    insertChildren(values, children) {
        console.log('insertChildren')

        const lookup = new Map;
        for (const [child, config] of children) {
            lookup.set(child.getAttribute('key'), [child, config])
        }

        const mapped = values.map((item, index) => {
            const key = this.getItemKey(item);
            const [child, config] = (lookup.has(key) ? lookup.get(key) : this.createChild(item));
            return {
                index: index,
                exists: child.hasAttribute('key'),
                removed: child.hasAttribute('key'),
                key,
                config,
                child,
            };
        });

        const changes = []
        for (const item of mapped) {
            if (item.exists) {
                continue;
            }

            const index = mapped.indexOf(item);

            const entry = {
                ...item, previous: mapped.at(index - 1),
            };

            if (index === 0 && !entry.exists) {
                this.compiler.prepend(entry.child);
                changes.push(entry.config);
                continue;
            }
            if (!entry.exists && entry.previous) {
                entry.previous.child.insertAdjacentElement('afterend', entry.child);
                changes.push(entry.config);
            }
        }
        if(changes.length){
            this.compiler.update(...changes);
        }
    }

    updateChildren(values, children) {

        console.log('updateChildren')

        const lookup = new Map;
        for (const [index, value] of values.entries()) {
            lookup.set(index, value)
        }

        const changes = []

        this.compiler.walk(this.loopedElement.localName, (el, index) => {

            const item = lookup.get(index);
            const key = this.getItemKey(item);

            if (key !== el.getAttribute('key')) {
                const config = this.compiler.elements.get(el);
                config.scope = this.createLoopIterationScope(item);
                changes.push(config);
            }
        })

        if(changes.length){
            this.compiler.update(...changes);
        }
        // const elements = new Map;
        // for(const [child, config] of children){
        //     elements.set(child.getAttribute('key'), [child, config])
        // }
        //
        // const mapped = values.map((item, index) => {
        //     const key = this.getItemKey(item);
        //     const [child, config] = elements.get(key);
        //     return  {
        //         index: index,
        //         key,
        //         config,
        //         child,
        //     };
        // });

        // const changed = [];
        //
        // const elementKeys = children.map(([child]) => child.getAttribute('key'));
        //
        // for (const [index, item] of values.entries()) {
        //     if (elementKeys.at(index) === this.getItemKey(item)) {
        //         continue;
        //     }
        //     const [child, config] = children.at(index);
        //     config.scope = this.createItemScope(item);
        //     changed.push(config);
        // }
        //
        // if (changed.length) {
        //     this.compiler.update(...changed);
        // }
    }
}