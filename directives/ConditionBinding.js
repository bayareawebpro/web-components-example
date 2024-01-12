import Directive from "./Directive.js";

export default class ConditionBinding extends Directive {

    parse() {
        this.modifiers = {display: this.styles.display};
    }

    update(visible){
        this.element.style.display = visible ? this.modifiers.display : 'none'
    }

    execute(){
        this.update(this.evaluate());
    }

    /**
     * @param {ConditionBinding|null} prevCondition
     * @return {this}
     */
    inverseExpression(prevCondition){

        if(prevCondition.directive !== 'if'){
            throw new Error(`ConditionBinding ${this.attribute} does not have corresponding data-if directive.`);
        }

        this.callback = this.createExpression(this.expression = `!${prevCondition.expression}`);
        return this;
    }
}