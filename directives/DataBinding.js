import Directive from "./Directive.js";

export default class DataBinding extends Directive {

    execute() {

        const currentValue = this.evaluated;
        const newValue = this.evaluate();

        if(newValue === currentValue){
            return;
        }

        if (this.modifiers === 'text') {
            return this.element.innerText = newValue;
        }

        if (this.modifiers === 'value') {
            return this.element[this.modifiers] = newValue;
        }

        if (typeof newValue === 'boolean') {
            return this.element.toggleAttribute(this.modifiers, newValue);
        }

        this.element.setAttribute(this.modifiers, newValue);
    }
}