import Directive from "./Directive.js";


/**
 * @class ConditionBinding
 * @property {Modifiers} modifiers
 */
export default class ConditionBinding extends Directive {

    /**
     * @typedef {Object} Modifiers
     * @property {string} display
     * @property {string} pointerEvents
     */
    parse() {
        this.modifiers = {
            display: this.styles.display,
            pointerEvents: this.styles.pointerEvents
        };
    }

    execute(){
        if(this.evaluate()){
            this.restore();
        }else{
            this.suspend();
        }
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