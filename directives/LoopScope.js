import Directive from "./Directive.js";

export default class LoopScope extends Directive {


    parse(){
        // Child Class Override.
    }

    bind() {
        if(this.expression){
            this.createExpression(this.expression);
        }
    }
}