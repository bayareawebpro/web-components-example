import DataBinding from "../directives/DataBinding.js";
import LoopBinding from "../directives/LoopBinding.js";
import EventBinding from "../directives/EventBinding.js";
import ModelBinding from "../directives/ModelBinding.js";
import StateBinding from "../directives/StateBinding.js";
import ConditionBinding from "../directives/ConditionBinding.js";
import Queue from "./Queue.js";


export default class Compiler {


    constructor(scope, root = undefined) {
        this.prevCond = undefined;
        this.elements = new Map;
        this.queue = new Queue;
        this.scope = scope;
        this.root = root;
    }

    get status() {

        if (this.elements.size === 0) {
            return 'ready';
        }

        if (this.queue.hasJobs) {
            return 'rendering';
        }

        return 'rendered';
    }

    compile(html, styles) {

        this.template = document.createElement('template');

        this.template.innerHTML = `
        <link rel="stylesheet" href="./shared.css">
        ${styles.replace(/^\s+/gm, '')}
        ${html}
        `;

        this.mapElements(this.template.content.querySelectorAll(`*`));

        this.root.append(this.template.content);

    }

    mapElements(nodeList) {
        for (const node of nodeList) {
            this.mapElement(node);
        }
    }

    mapElement(node, config = {scope: this.scope}) {

        if (this.elements.has(node)) {
            return;
        }

        config.dirs = [];
        config.node = node;

        // Some attributes are not iterable.
        const attributes = Array.from(node.attributes);

        try {
            for (const attr of attributes) {

                const name = attr.localName;
                if (name.startsWith('data-state')) {
                    config.dirs.push(new StateBinding(this, node, attr, config));

                } else if (name.startsWith('data-if')) {
                    config.dirs.push(this.prevCond = new ConditionBinding(this, node, attr, config));

                } else if (name.startsWith('data-else')) {
                    config.dirs.push((new ConditionBinding(this, node, attr, config)).inverseExpression(this.prevCond));

                } else if (name.startsWith('data-for')) {
                    config.dirs.push(new LoopBinding(this, node, attr, config));

                } else if (name.startsWith('data-bind')) {
                    config.dirs.push(new DataBinding(this, node, attr, config));

                } else if (name.startsWith('data-model')) {
                    config.dirs.push(new ModelBinding(this, node, attr, config));

                } else if (name.startsWith('on')) {
                    config.dirs.push(new EventBinding(this, node, attr, config));
                }
            }
        } catch (error) {
            this.handleError(error)
        }

        if (config.dirs.length) {

            if (customElements.get(node.localName)) {
                customElements.upgrade(node)
            }

            this.elements.set(node, config);
        }

        return [node, config];
    }

    /**
     * @param {Object} configs
     * @return {Promise<void>}
     */

    update(...configs) {

        configs = (configs.length ? configs : this.elements.values());

        for (const config of configs) {

            config.dirs.forEach((binding) => {
                /**
                 * Allow state binding to be executed.
                 */
                if (binding instanceof StateBinding) {
                    binding.execute();
                }

                /**
                 * If element or it's ancestor has
                 * data-compile=false, don't render changes.
                 */
                else if (binding instanceof ConditionBinding) {
                    binding.execute();
                    if (binding.isSuspended || binding.isContainedBySuspend) {
                        return false;
                    }
                }

                /**
                 * Event bindings are executed before
                 * the element is appended to the document.
                 */
                else if (!(binding instanceof EventBinding)) {

                    this.queue.addJob(()=>{
                        binding.execute();
                    });
                }
            });

        }
        return this.processJobs();
    }

    /**
     * @return {Promise<void>}
     */
     processJobs() {

        if (this.scope.performanceMark instanceof Function) {
            this.scope.performanceMark('compile');
        }

        return this.queue.work()
            .catch((error)=>{
                if (this.scope.debug) {
                    this.handleError(error)
                }
            }).finally(()=>{
                if (this.scope.performanceMeasure instanceof Function) {
                    this.scope.performanceMeasure('compile', 'render');
                }
            });
    }

    handleError(error) {
        if (this.scope.errorHandler instanceof Function) {
            return this.scope.errorHandler(error);
        }
        throw error;
    }

    /**
     * @param {HTMLElement} element
     */
    remove(element) {
        this.elements.delete(element);
        element.remove();
    }

    /**
     * @param {[HTMLElement|DocumentFragment]} children
     */
    append(...children) {
        this.root.append(...children);
    }

    /**
     * @param {[HTMLElement|DocumentFragment]} children
     */
    prepend(...children) {
        this.root.prepend(...children);
    }

    /**
     * @param {string} selector
     */
    ref(selector) {
        return this.root.querySelector(selector)
    }

    /**
     * @param {string} selector
     * @param {Function} callback
     * @return {this}
     */
    walk(selector = '*', callback) {
        return this.walkElements(this.root.querySelectorAll(selector), callback)
    }

    /**
     * @param {NodeList|HTMLCollection} elements
     * @param {Function} callback
     * @return {this}
     */
    walkElements(elements, callback) {

        elements = elements instanceof NodeList ? elements.entries() : elements

        for (const [index, child] of elements) {
            callback(child, index);
        }
        return this
    }

    encode(value) {
        return JSON
            .stringify(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
    }

}


