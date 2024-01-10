import Directive from "./Directive.js";
import Component from "../components/Component.js";

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
    }

    bind(){
        this.bindExpression(this.modifiers.dataName);
    }

    getChildren(){
        return Array
            .from(this.element.parentElement.children)
            .filter((child)=>!child.isSameNode(this.element));
    }

    createChild(stateVal){
        const child = this.element.content.firstElementChild.cloneNode();

        const connectedCallback = ({target})=>{
            target.setState(this.modifiers.itemName,  stateVal);
            child.removeEventListener('connected',connectedCallback);
        }
        child.addEventListener('connected',connectedCallback);

        return child;
    }

    /**
     * @param {Object} value
     * @param {HTMLElement} child
     */
    getChildKey(value, child){

        if(child.dataset.id){
            return child.dataset.id;
        }

        if(!child.dataset.key){
            throw new Error(`ForLoop (${this.expression}) requires data-key="${this.modifiers.itemName}.{your_id}" attribute.`)
        }

        //console.log(child.attributes['data-key'])

        // this.toExpression()
        //
        // if(!value[keyName]){
        //     throw new Error(`ForLoop (${this.expression}) data-key="${keyName}" has no matching property in loop item.`)
        // }
        //
        // child.dataset.key
        //data-prop:item="item"
        //data-key="item.id"
    }

    execute(){
        const value = this.evaluate();
        const children = this.getChildren();


        if(!children.length){
            const children = value.map((stateVal)=>this.createChild(stateVal));
            this.element.parentElement.append(...children);

            //children
            return;
        }

        // create | setKey | appendChild |

        // [0, 1, undefined, 3]

        value.forEach( (stateVal, index)=>{

            if(typeof children.at(index) === 'undefined'){
                const child = this.createChild(stateVal);
                this.element.parentElement.appendChild(child);
                //this.getChildKey(stateVal, child);
                return;
            }
            this.updateChild(children.at(index), index, stateVal);
        });

        if(value.length < children.length){
            children.slice(value.length).forEach((child, index)=>{
                child.remove()
            });
        }
    }

    updateChild(child,index,stateVal){
        if(child instanceof Component){
            child.setState(this.modifiers.itemName,  stateVal);
        }
    }
}