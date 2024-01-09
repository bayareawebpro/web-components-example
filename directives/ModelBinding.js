import Directive from "./Directive.js";

export default class ModelBinding extends Directive {

    bind() {
        this.callback = this.wrapExpression(`${this.expression} = ($value || ${this.expression})`, '$value');
        this.element.addEventListener('input', this.executeEvent.bind(this));
    }

    executeEvent($event) {
        this.evaluate($event.target.value);
    }

    execute() {
        this.element['value'] = this.evaluate(false);
    }
}