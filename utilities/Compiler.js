import DataBinding from "../directives/DataBinding.js";
import LoopBinding from "../directives/LoopBinding.js";
import EventBinding from "../directives/EventBinding.js";
import ModelBinding from "../directives/ModelBinding.js";
import ConditionBinding from "../directives/ConditionBinding.js";

export default class Compiler {

    constructor(component) {
        this.template = document.createElement('template');
        this.component = component;
        this.elements = new WeakMap;
        this.compiled = false;
        this.nodes = null;
    }

    async compile(html) {
        await this.addStyleSheet(this.component.styles.trim());
        this.template.innerHTML = html.trim();
        this.mapElements();
        this.component.shadowRoot.replaceChildren(this.template.content);
        this.nodes = this.component.shadowRoot.querySelectorAll(`*`);
        await this.updateCompiled();
        this.compiled = true;
    }

    mapElements() {

        const nodes = this.template.content.querySelectorAll(`*`);

        let ifCondition = null
        for (const element of nodes) {

            const attrs = [];

            // Some attributes are not iterable.
            const attributes = Array.from(element.attributes);

            for (const attribute of attributes) {
                if (attribute.localName.startsWith('on')) {
                    attrs.push(new EventBinding(this.component, element, attribute));
                } else if (attribute.localName.startsWith('data-bind')) {
                    attrs.push(new DataBinding(this.component, element, attribute));
                } else if (attribute.localName.startsWith('data-model')) {
                    attrs.push(new ModelBinding(this.component, element, attribute));
                } else if (attribute.localName.startsWith('data-if')) {
                    attrs.push(ifCondition = new ConditionBinding(this.component, element, attribute));
                } else if (attribute.localName.startsWith('data-else')) {
                    const condition = new ConditionBinding(this.component, element, attribute);
                    attrs.push(condition.newExpression(`!${ifCondition.expression}`));
                    ifCondition = null
                } else if (attribute.localName.startsWith('data-for')) {
                    attrs.push(new LoopBinding(this.component, element, attribute));
                }
            }
            if (attrs.length) {
                this.elements.set(element, {attrs})
            }
        }
    }

    async updateCompiled() {

        const jobs = [];

        for (const node of this.nodes) {

            if (!this.elements.has(node)) {
                continue;
            }

            const {attrs} = this.elements.get(node);

            const createJob = (callback) => {
                jobs.push(new Promise((resolve) => {
                    try {
                        callback();
                        resolve();
                    } catch (error) {
                        this.component.log(error);
                    }
                }));
            }

            attrs.forEach((binding) => {
                if (binding instanceof EventBinding) {
                    return;
                }
                createJob(binding.execute.bind(binding));
            });
        }

        await Promise.allSettled(jobs).catch((error)=>{
            this.component.log(error)
        });
    }

    async addStyleSheet(css) {
        const sheet = new CSSStyleSheet();
        await sheet.replace(css.replace('<style>', '').replace('</style>', ''));
        this.component.shadowRoot.adoptedStyleSheets = [sheet];
    }

    ref(selector) {
        return this.component.shadowRoot.querySelector(selector)
    }

    walk(selector, callback) {
        const children = this.component.shadowRoot.querySelectorAll(selector);

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


