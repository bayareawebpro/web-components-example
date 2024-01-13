import DataBinding from "../directives/DataBinding.js";
import LoopBinding from "../directives/LoopBinding.js";
import EventBinding from "../directives/EventBinding.js";
import ModelBinding from "../directives/ModelBinding.js";
import StateBinding from "../directives/StateBinding.js";
import ConditionBinding from "../directives/ConditionBinding.js";
import Component from "../components/Component.js";


export default class Compiler {

    constructor(scope, root = undefined) {
        this.prevCond = undefined;
        this.elements = new Map;
        this.status = 'ready';
        this.scope = scope;
        this.root = root;

        if(this.scope instanceof HTMLElement){
            this.scope.dataset.cloak = 'true';
        }
    }

    compile(html, styles) {

        if(styles){
            this.addStyleSheet(styles);
        }

        this.template = document.createElement('template');
        this.template.innerHTML = html.trim();

        this.mapElements( this.template.content.querySelectorAll(`*`));
        this.status = 'compiled';

        this.root.append(this.template.content);
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

        config.dirs = []

        // Some attributes are not iterable.
        const attributes = Array.from(node.attributes);

        for (const attr of attributes) {

            const name = attr.localName;

            if (name.startsWith('data-if')) {
                config.dirs.push(this.prevCond = new ConditionBinding(node, attr, config));
            } else if (name.startsWith('data-else')) {
                config.dirs.push((new ConditionBinding(node, attr, config)).inverseExpression(this.prevCond));
                this.prevCond = null
            } else if (name.startsWith('data-for')) {
                config.dirs.push(new LoopBinding(node, attr, config));
            } else if (name.startsWith('on')) {
                config.dirs.push(new EventBinding(node, attr, config));
            } else if (name.startsWith('data-bind')) {
                config.dirs.push(new DataBinding(node, attr, config));
            } else if (name.startsWith('data-model')) {
                config.dirs.push(new ModelBinding(node, attr, config));
            }else if (name.startsWith('data-state')) {
                config.dirs.push(new StateBinding(node, attr, config));
            }
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

        const jobs = []

        elements = elements.length ? elements : this.elements.values()

        for (const config of elements) {
            config.dirs.forEach((binding) => {
                if (!(binding instanceof EventBinding)) {
                    jobs.push(this.createJob(binding));
                }
            });
        }

       return this.processJobs(jobs);
    }

    processJobs(jobs){

        if(this.scope.performanceMark instanceof Function){
            this.scope.performanceMark('compile');
        }

        if(this.scope.log instanceof Function){
            this.scope.log('processJobs...');
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
                if(typeof this.scope.errorHandler === 'function'){
                    return this.scope.errorHandler(failed.reason);
                }
                throw failed.reason;
            }
        });
    }

    /**
     * @param {Object} binding
     * @return {Promise<void>}
     */
    createJob(binding){
        return new Promise((resolve, reject) => {
            queueMicrotask(() => {
                try {
                    binding.execute();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        })
    }

    addStyleSheet(css) {

        if(!css){
            return;
        }

        const styleParser = new DOMParser();

        const styleTag = styleParser
            .parseFromString(css, "text/html")
            .querySelector('style:first-of-type');

        const style = `
        [data-cloak="true"]{
            display: none;
        }
        ${styleTag.textContent}
        `;

        const sheet = new CSSStyleSheet();
        sheet.replace(style).then(()=>{
            this.root.adoptedStyleSheets = [sheet];
        });
    }

    /**
     * @param {HTMLElement} element
     */
    remove(element){
        this.elements.delete(element);
        element.remove();
    }

    /**
     * @param {HTMLElement|DocumentFragment} children
     */
    append(...children){
        this.root.append(...children);
    }

    /**
     * @param {HTMLElement|DocumentFragment} children
     */
    prepend(...children){
        this.root.prepend(...children);
    }

    ref(selector) {
        return this.root.querySelector(selector)
    }

    walk(selector, callback) {
        const children = this.root.querySelectorAll(selector);
        for (const [index, child] of children.entries()) {
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


