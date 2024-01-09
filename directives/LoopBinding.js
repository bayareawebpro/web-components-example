import Directive from "./Directive.js";
import Component from "../components/Component.js";

export default class LoopBinding extends Directive {

    static statements = {
        ARR: ' of ',
        OBJ: ' in ',
    }

    parse(element, localName, value) {
        super.parse(element, localName, value);

        const {ARR, OBJ} = this.constructor.statements;
        const expectsArray = value.includes(ARR);
        const [itemName, dataName] = value.split(expectsArray ? ARR : OBJ);

        this.modifiers = {
            itemName,
            dataName,
            expectsArray,
        };
    }

    bind(){
        this.callback = this.wrapExpression(this.modifiers.dataName);
    }

    getChildren(){
        return Array
            .from(this.element.parentElement.children)
            .filter((child)=>!child.isSameNode(this.element));
    }

    createChild(stateVal){
        const child = this.element.content.firstElementChild.cloneNode();
        if(stateVal){
            const connectedCallback = ({target})=>{
                target.setState(this.modifiers.itemName,  stateVal);
                child.removeEventListener('connected',connectedCallback);
            }
            child.addEventListener('connected',connectedCallback);
        }
        return child;
    }

    execute(){
        const value = this.evaluate();
        const children = this.getChildren();

        value.forEach( (stateVal, index)=>{
            this.updateChild(children.at(index), index, stateVal);
        });

        if(value.length < children.length){
            children.slice(value.length).forEach((child, index)=>{
                child.remove()
            });
        }
    }

    updateChild(child,index,stateVal){
        if(typeof child === 'undefined'){
            return this.element.parentElement.appendChild(this.createChild(stateVal));
        }
        if(child instanceof Component){
            child.setState(this.modifiers.itemName,  stateVal);
        }
    }
}