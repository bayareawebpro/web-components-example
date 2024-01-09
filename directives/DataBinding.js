import Directive from "./Directive.js";

export default class DataBinding extends Directive {

    execute() {

        const evaluated = this.evaluate();

        if (this.modifiers === 'text') {
            return this.element.innerText = evaluated
        }

        if (this.modifiers === 'value') {
            return this.element[this.modifiers] = evaluated
        }

        if (typeof evaluated === 'boolean') {
            return this.element.toggleAttribute(this.modifiers, evaluated)
        }

        this.element.setAttribute(this.modifiers, evaluated)
    }
}