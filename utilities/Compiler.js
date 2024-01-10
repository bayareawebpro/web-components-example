import DataBinding from "../directives/DataBinding.js";
import LoopBinding from "../directives/LoopBinding.js";
import EventBinding from "../directives/EventBinding.js";
import ModelBinding from "../directives/ModelBinding.js";
import ConditionBinding from "../directives/ConditionBinding.js";

export default class Compiler {

    constructor(scope, root = undefined) {
        this.template = document.createElement('template');
        this.elements = new WeakMap;
        this.compiled = false;
        this.scope = scope;
        this.root = root;
        this.nodes = [];
    }

    async compile(html, styles) {

        if(styles){
            await this.addStyleSheet(styles.trim());
        }

        this.template.innerHTML = html.trim();

        this.mapElements(this.template.content.querySelectorAll(`*`));

        this.root.replaceChildren(this.template.content);

        this.nodes = this.root.querySelectorAll(`*`);

        await this.updateCompiled();

        this.compiled = true;
    }

    mapElements(nodeList = null) {

        let prevCondition = null;

        for (const el of nodeList) {

            if(this.elements.has(el)){
                continue;
            }

            const config = {
                dirs: []
            }

            // Some attributes are not iterable.
            const attributes = Array.from(el.attributes);

            for (const attr of attributes) {

                const name = attr.localName;

                if (name.startsWith('data-if')) {
                    config.dirs.push(prevCondition = new ConditionBinding(el, attr, this.scope));

                } else if (name.startsWith('data-else')) {

                    config.dirs.push((new ConditionBinding(el, attr, this.scope)).inverseExpression(prevCondition));

                    prevCondition = null

                } else if (name.startsWith('data-for')) {
                    config.dirs.push(new LoopBinding(el, attr, this.scope));
                } else if (name.startsWith('on')) {
                    config.dirs.push(new EventBinding(el, attr, this.scope));
                } else if (name.startsWith('data-bind')) {
                    config.dirs.push(new DataBinding(el, attr, this.scope));
                } else if (name.startsWith('data-model')) {
                    config.dirs.push(new ModelBinding(el, attr, this.scope));
                }
            }

            if (config.dirs.length) {
                this.elements.set(el, config);
                //this.nodes.push(el);
            }
        }
    }

    async updateCompiled(nodeList = null) {

        const jobs = []

        nodeList = (nodeList || this.nodes);

        for (const node of nodeList) {

            if (!this.elements.has(node)) {
                continue;
            }

            const {dirs} = this.elements.get(node);

            dirs.forEach((binding) => {
                if (!(binding instanceof EventBinding)) {
                    jobs.push(this.createJob(binding));
                }
            });
        }

        await Promise.allSettled(jobs);
    }

    /**
     * @param binding
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


