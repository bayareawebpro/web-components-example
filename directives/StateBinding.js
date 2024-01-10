import Directive from "./Directive.js";
import Component from "../components/Component.js";

export default class StateBinding extends Directive {

    parse(){

    }
    execute() {
        if(this.element instanceof Component){
            this.element.setState(this.expression, this.evaluate());
        }
    }
}