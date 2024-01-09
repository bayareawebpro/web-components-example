import Directive from "./Directive.js";

export default class ConditionBinding extends Directive {

    get styles(){
        return getComputedStyle(this.element);
    }

    parse(element, localName, value) {
        super.parse(element, localName, value);
        this.modifiers = {display: this.styles.display};
    }

    update(visible){
        this.element.style.display = visible ? this.modifiers.display : 'none'
    }

    getPreviousCondition(prevMap){
        return prevMap?.attrs?.find((instance)=>{
            return instance instanceof ConditionBinding && instance.directive === 'if';
        })
    }

    execute(nextMap){
        this.update(this.evaluate());
    }
}