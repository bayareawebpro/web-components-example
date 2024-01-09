export default class Directive{

    constructor(component, element, {localName, value}) {
        this.attribute = undefined;
        this.directive = undefined;
        this.modifiers = undefined;
        this.component = undefined;
        this.callback = undefined;
        this.evaluated = undefined;
        this.component = component;
        this.parse(element, localName, value);
        this.bind();
    }

    parseName(name){
        return name.replace('data-', '').split(':');
    }

    parse(element, localName, value){
        const [directive, modifiers] = this.parseName(localName);
        this.modifiers = modifiers || null;
        this.directive = directive;
        this.attribute = localName;
        this.expression = value;
        this.element = element;
    }

    bind() {
        if(this.expression){
            this.callback = this.wrapExpression(this.expression);
        }
    }

    newExpression(expression) {
        this.callback = this.wrapExpression(this.expression = expression);
        return this;
    }

    wrapExpression(exp, ...data) {
        return new Function('$scope', ...data, `with($scope){ return (${exp}) }`);
    }

    evaluate(...data){
        return this.evaluated = this.callback?.call(this.component, this.component,...data);
    }
}