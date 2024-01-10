import DataBinding from "../directives/DataBinding.js";
import LoopBinding from "../directives/LoopBinding.js";
import EventBinding from "../directives/EventBinding.js";
import ModelBinding from "../directives/ModelBinding.js";
import ConditionBinding from "../directives/ConditionBinding.js";
import StateBinding from "../directives/StateBinding.js";

export default class Compiler {

    constructor(scope, root = undefined) {
        this.template = document.createElement('template');
        this.prevCond = undefined;
        this.elements = new Map;
        this.compiled = false;
        this.scope = scope;
        this.root = root;
    }

    async compile(html, styles) {

        if(styles){
            await this.addStyleSheet(styles.trim());
        }

        if(html){
            this.template.innerHTML = html.trim();
        }

        this.mapElements(this.template.content.querySelectorAll(`*`));

        this.root.replaceChildren(this.template.content);

        await this.updateCompiled();
    }

    mapElements(nodeList) {
        for (const node of nodeList) {
            this.mapElement(node);
        }
    }

    mapElement(node, config = {scope: this.scope}){

        if(this.elements.has(node)){
            return;
        }

        config.dirs = []

        // Some attributes are not iterable.
        const attributes = Array.from(node.attributes);

        for (const attr of attributes) {

            const name = attr.localName;

            if (name.startsWith('data-if')) {
                config.dirs.push(this.prevCond = new ConditionBinding(node, attr, config.scope));
            } else if (name.startsWith('data-else')) {
                config.dirs.push((new ConditionBinding(node, attr, config.scope)).inverseExpression(this.prevCond));
                this.prevCond = null
            } else if (name.startsWith('data-for')) {
                config.dirs.push(new LoopBinding(node, attr, config.scope));
            } else if (name.startsWith('on')) {
                config.dirs.push(new EventBinding(node, attr, config.scope));
            } else if (name.startsWith('data-bind')) {
                config.dirs.push(new DataBinding(node, attr, config.scope));
            } else if (name.startsWith('data-model')) {
                config.dirs.push(new ModelBinding(node, attr, config.scope));
            }else if (name.startsWith('data-state')) {
                config.dirs.push(new StateBinding(node, attr, config.scope));
            }
        }

        if (config.dirs.length) {
            this.elements.set(node, config);
        }

        return node;
    }

    async updateCompiled(...elements) {

        const jobs = []

        elements = elements.length ? elements : this.elements.values()

        for (const config of elements) {
            config.dirs.forEach((binding) => {
                if (!(binding instanceof EventBinding)) {
                    jobs.push(this.createJob(binding));
                }
            });
        }

        await Promise.allSettled(jobs).then((results)=>{

            this.compiled = true;

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
            try {
                binding.execute();
                resolve();
            } catch (error) {
                reject(error);
            }
        })
    }

    async addStyleSheet(css) {
        const sheet = new CSSStyleSheet();
        await sheet.replace(css.replace('<style>', '').replace('</style>', ''));
        this.root.adoptedStyleSheets = [sheet];
    }

    /**
     * @param {HTMLElement} element
     */
    remove(element){
        this.elements.delete(element);
        element.remove();
    }

    /**
     * @param {HTMLElement} children
     */
    append(...children){
        if(!this.compiled){
            this.mapElements(children);
        }
        this.root.append(...children);
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


