import DataBinding from "../directives/DataBinding.js";
import LoopBinding from "../directives/LoopBinding.js";
import EventBinding from "../directives/EventBinding.js";
import ModelBinding from "../directives/ModelBinding.js";
import StateBinding from "../directives/StateBinding.js";
import ConditionBinding from "../directives/ConditionBinding.js";
import Directive from "../directives/Directive.js";


export default class Compiler {


    constructor(scope, root = undefined) {
        this.prevCond = undefined;
        this.elements = new Map;
        this.status = 'ready';
        this.scope = scope;
        this.root = root;
    }

    compile(html, styles) {

        this.template = document.createElement('template');
        this.template.innerHTML = `
        <link rel="stylesheet" href="/shared.css">
        ${styles.trim()}
        ${html.trim()}
        `;

        this.mapElements(this.template.content.querySelectorAll(`*`));

        this.root.append(this.template.content);

        this.status = 'compiled';
    }

    mapElements(nodeList) {
        for (const node of nodeList) {
            this.mapElement(node);
        }
    }

    mapElement(node, config = {scope: this.scope}){
        this.status = 'compiling';

        if(this.elements.has(node)){
            return;
        }


        config.dirs = [];
        config.node = node;

        // Some attributes are not iterable.
        const attributes = Array.from(node.attributes);

        try{
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
        }catch (error){
            this.handleError(error)
        }

        if (config.dirs.length) {

            if(customElements.get(node.localName)){
                customElements.upgrade(node)
            }

            this.elements.set(node, config);
        }

        return [node, config];
    }

    update(...elements) {

        this.status = 'rendering';

        elements = (elements.length ? elements : this.elements.values());

        const jobs = [];

        for (const config of elements) {

            let bypassRender = false

            for(const binding of config.dirs){

                if(binding instanceof StateBinding){
                    binding.execute();
                    continue;
                }

                if(binding instanceof ConditionBinding){
                    binding.execute();
                    bypassRender = binding.shouldNotRender()
                    continue;
                }

                if (!(binding instanceof EventBinding) && bypassRender === false) {
                    jobs.push(this.createJob(binding));
                }
            }
        }
        this.processJobs(jobs);
    }

    /**
     * @param {Directive|Object} task
     * @return {Promise<void>}
     */
    createJob(task){
        return new Promise((resolve, reject) => {
            queueMicrotask(() => {
                try {
                    if(task instanceof Directive){
                        task.execute();
                    }else if(task instanceof Function){
                        task();
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        })
    }

    processJobs(jobs){

        if(this.scope.performanceMark instanceof Function){
            this.scope.performanceMark('compile');
        }

        return Promise.allSettled(jobs).then((results)=>{

            this.status = 'rendered';

            if(this.scope instanceof HTMLElement){
                delete this.scope.dataset.cloak;
            }

            if(this.scope.performanceMeasure instanceof Function){
                this.scope.performanceMeasure('compile', 'render');
            }

            if(!this.scope.debug){
                return;
            }

            const failed = results.find(({status})=> status === 'rejected');
            if(failed){
                this.handleError(failed.reason)
            }
        });
    }

    handleError(error){
        if(this.scope.errorHandler instanceof Function){
            return this.scope.errorHandler(error);
        }
        throw error;
    }

    /**
     * @param {HTMLElement} element
     */
    remove(element){
        this.elements.delete(element);
        element.remove();
    }

    /**
     * @param {[HTMLElement|DocumentFragment]} children
     */
    append(...children){
        this.root.append(...children);
    }

    /**
     * @param {[HTMLElement|DocumentFragment]} children
     */
    prepend(...children){
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


