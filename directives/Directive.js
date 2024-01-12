

/**
 * @param {undefined|Object} config
 * @param {HTMLElement} element
 * @param {Attr} attr
 *
 * @property {undefined|string} attribute
 * @property {undefined|string} expression
 * @property {string} directive
 * @property {undefined|string|Object} modifiers
 * @property {undefined|Function} callback
 * @property {undefined|*} evaluated
 */
export default class Directive{

    constructor(element, attr, config) {
        this.element = element;
        this.config = config;
        this.callback = undefined;
        this.evaluated = undefined;
        this.attribute = attr.localName;
        this.expression = attr.value;
        const [directive, modifiers] = this.parseName(attr.localName);
        this.directive = directive;
        this.modifiers = modifiers || undefined;
        this.parse();
        this.bind();
    }

    parse(){
        // Child Class Override.
    }

    bind() {
        this.bindExpression();
    }

    /**
     * @param {string} name
     * @return {string[]}
     */
    parseName(name){
        return name.replace('data-', '').split(':');
    }

    /**
     * @param {string|null} exp
     * @param {...string} data
     * @return {this}
     */
    bindExpression(exp = null, ...data) {

        this.expression = (exp || this.expression);

        if(this.expression){
            this.callback = this.createExpression(this.expression, ...data);
        }

        return this;
    }

    /**
     * @param {string} exp
     * @param {...string} data
     * @return {Function}
     */
    createExpression(exp, ...data) {
        return new Function('$scope', ...data, `with($scope){ return (${exp}) }`);
    }

    /**
     * @param {Function} callback
     * @param {...*} data
     * @return {*}
     */
    callExpression(callback, ...data){
        return callback?.call(this.config.scope, this.config.scope,...data);
    }

    /**
     * @param {...*} data
     * @return {*}
     */
    evaluate(...data){
        return this.evaluated = this.callExpression(this.callback, ...data);
    }

    get styles(){
        return getComputedStyle(this.element);
    }

    get elementVisible(){
        return this.styles.display !== 'none'
    }
}