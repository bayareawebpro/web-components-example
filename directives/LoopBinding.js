import Directive from "./Directive.js";
import Component from "../components/Component.js";
import Compiler from "../utilities/Compiler.js";

const statements = {
    ARR: ' of ',
    OBJ: ' in ',
}

/**
 * @typedef {Object} Modifiers
 * @property {string} itemName
 * @property {string} dataName
 * @property {boolean} expectsArray
 */

/**
 * @class LoopBinding
 * @property {Modifiers} modifiers
 * @property {HTMLTemplateElement} loopedElement
 */
export default class LoopBinding extends Directive {

    parse() {

        const {ARR, OBJ} = statements;

        const expectsArray = this.expression.includes(ARR);

        const [itemName, dataName] = this.expression.split(expectsArray ? ARR : OBJ);

        this.modifiers = {
            itemName,
            dataName,
            expectsArray,
        };

        this.loopedElement = this.element.content.firstElementChild;

        this.compiler = new Compiler({
            errorHandler: this.scope.errorHandler,
        }, this.element.parentElement);
    }

    bind(){
        this.bindExpression(this.modifiers.dataName);
    }

    createChild(stateVal){

        // Set the scope for every binding.
        // with an object property that matches
        // the key used in the loop scope.
        const scope = {};
        scope[this.modifiers.itemName] = stateVal;

        //child.addEventListener('connected',({target})=>this.compiler.updateCompiled(this.compiler.elements.get(target)));
        return this.compiler.mapElement(this.loopedElement.cloneNode(), {scope});
    }

    onConnected(component, stateVal){
        component.setState(this.modifiers.itemName,  stateVal);
    }

    getChildren(){
        return Array
            .from(this.element.parentElement.children)
            .filter((child)=>!child.isSameNode(this.element));
    }

    /**
     * @param {HTMLElement} child
     * @param {Object} value
     */
    getChildKey(value, child){

        if(child.dataset?.id){
            return child.dataset.id;
        }

        if(!this.loopedElement.dataset.key){
            throw new Error(`ForLoop (${this.expression}) requires data-key="${this.modifiers.itemName}.{your_id}" attribute.`)
        }
    }

    execute(){

        const value = this.evaluate();
        const children = this.getChildren();

        if(!children.length){
            this.compiler.append(...value.slice(children.length).map((stateVal)=>this.createChild(stateVal)));
        }

        if(value.length < children.length){
            children.forEach((child, index)=>{

                const config = this.compiler.elements.get(child);

                if(child.dataset.key){
                    this.compiler.remove(child);
                    console.log(`${index} removed.`)
                }

                // if(!value.at(index)){
                //     this.compiler.remove(child);
                //     console.log(`${index} removed.`)
                // }
            });
        }
        // value.forEach((stateVal, index)=>{
        //     this.updateChild(children.at(index), index, stateVal);
        // });

        this.compiler.updateCompiled().then(()=>{
            //console.log(this.compiler)
        });
    }

    updateChild(child,index,stateVal){
        if(child instanceof Component){
            child.setState(this.modifiers.itemName,  stateVal);
        }
    }
}