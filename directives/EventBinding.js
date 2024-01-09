import Directive from "./Directive.js";

export default class EventBinding extends Directive {

    bind() {
        this.callback = this.wrapExpression(this.expression, '$event');
        this.element.removeAttribute(this.attribute);
        this.element.addEventListener(this.attribute.replace('on', ''), this.execute.bind(this));
    }

    execute($event){
        this.evaluate($event);
    }
}