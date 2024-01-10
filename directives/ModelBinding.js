import Directive from "./Directive.js";

export default class ModelBinding extends Directive {

    bind() {
        this.bindExpression(`${this.expression} = ($value !== undefined ? $value : ${this.expression})`, '$value');
        this.element.addEventListener('input', this.executeEvent.bind(this));
    }

    executeEvent($event) {
        if(this.evaluated !== $event.target.value){
            this.evaluate($event.target.value);
        }
    }

    execute() {
        const currentValue = this.evaluated;
        const newValue = this.evaluate(undefined);
        if(newValue !== currentValue){
            this.element['value'] = newValue;
        }
    }
}