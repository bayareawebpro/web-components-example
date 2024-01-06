export class View {

    static parseEventHandlers = [
        'onfocus',
        'onblur',
        'onclick',
        'oninput',
        'onchange',
        'onmouseenter',
        'onmouseover',
        'onmousedown',
        'onmouseup',
        'oninvalid',
        'onkeyup',
        'onkeypress',
        'onkeydown',
        'onscroll',
        'onwheel',
        'ontoggle',
        'onreset',
        'onpaste',
        'ondrag',
        'ondragstart',
        'ondragenter',
        'ondragover',
        'ondragleave',
        'ondragend',
        'ondrop',
    ];

    constructor(component, scopes = {}) {
        this.component = component;
        this.scopes = scopes;
        this.template = document.createElement('template');
        this.isCompiled = false;
    }

    scopeValue(key) {
        const scopes = [
            this.scopes,
            this.component,
            this.component.props,
            this.component.state,
        ]
        for(const scope of scopes){
            if (scope.hasOwnProperty(key) || scope[key]) {
                return scope[key]
            }
        }
        return null
    }

    compile(html) {
        this.template.innerHTML = `
        ${this.component.styles}
        ${html.trim()}
        `
        this.mapEventCallbacks(this.template.content)

        this.isCompiled = true;

        return this.template.content
    }

    mapEventCallbacks(templateContent) {
        //const nodes = this.template.content.querySelectorAll('*')

        const usesEvents = templateContent.querySelectorAll(`*`)

        this.constructor.parseEventHandlers.forEach((event) => {

            for(const element of usesEvents){

                if(!element.hasAttribute(event)){
                    continue;
                }

                const methodName = element.getAttribute(event);

                const method = this.scopeValue(`${methodName}`.replace('()', ''))

                if (typeof method !== 'function') {
                    throw new Error(`Undefined method ${methodName} in <${element.tagName.toLowerCase()}> ${event} handler`);
                }

                element.setAttribute(event, null)
                element.addEventListener(event.replace('on', ''), method.bind(this.component))
            }
        })
    }

    // wrapExpression(expression){
    //     const closure = new Function(`return (${expression});`)
    //     closure.bind(this.scope)
    //     return closure
    // }

    walk(selector, callback){

        const children = this.component.shadowRoot.querySelectorAll(selector);

        for(const [index, child] of children.entries()){
            callback(child, index);
        }
        return this
    }

    find(selector){
        return this.component.shadowRoot.querySelector(selector)
    }

    if(truthy, html) {
        return `${truthy ? html() : ''}`
    }

    each(items, callback) {
       return `${items.map(callback).join('')}`
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