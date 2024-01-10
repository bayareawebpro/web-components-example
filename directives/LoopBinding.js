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
            log: this.scope.log,
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

        const child = this.compiler.mapElement(this.loopedElement.cloneNode(true), {scope});

        child.addEventListener('connected',({target})=>{
            this.compiler.updateCompiled(this.compiler.elements.get(target))
        });
        return child;
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
            // const fragment = new DocumentFragment();
            // fragment.append(...value.map((stateVal)=>this.createChild(stateVal)));
            // this.compiler.append(fragment);
            //value.map((stateVal)=>this.createChild(stateVal))
            this.compiler.append(...value.map((stateVal)=>this.createChild(stateVal)));
            return;
        }

        // if(value.length < children.length){
        //     children.forEach((child, index)=>{
        //
        //         const config = this.compiler.elements.get(child);
        //
        //         console.log(child.dataset)
        //
        //         if(child.dataset.key){
        //             this.compiler.remove(child);
        //             console.log(`${index} removed.`)
        //         }
        //
        //         // if(!value.at(index)){
        //         //     this.compiler.remove(child);
        //         //     console.log(`${index} removed.`)
        //         // }
        //     });
        // }
        // value.forEach((stateVal, index)=>{
        //     this.updateChild(children.at(index), index, stateVal);
        // });

        if(this.compiler.rendered){
            this.compiler.updateCompiled();
        }

    }
}