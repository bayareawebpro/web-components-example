import Directive from "./Directive.js";

export default class ConditionBinding extends Directive {

    get styles(){
        return getComputedStyle(this.element);
    }

    parse() {
        this.modifiers = {display: this.styles.display};
    }

    update(visible){
        this.element.style.display = visible ? this.modifiers.display : 'none'
    }

    execute(nextMap){
        this.update(this.evaluate());
    }
}