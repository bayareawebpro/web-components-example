import Component from "./Component.js";
import {uuid, factory} from "../utilities/index.js";


export default class List extends Component {

    constructor(props) {
        super(props);
        this.debug = this.measurePerformance = true;
    }

    static observedAttributes = [
        'items:encoded'
    ];

    get data() {
        return {
            items: this.props.items || factory(500, () => ({
                id: uuid(),
                value: uuid(),
            }))
        }
    }

    setup() {
        this.addEventListener('custom-list:add', this.addItem);
        this.addEventListener('custom-list:update', this.updateItem);
        this.addEventListener('custom-list:remove', this.removeItem);
    }


    beforeDestroy() {
        this.removeEventListener('custom-list:add', this.addItem);
        this.removeEventListener('custom-list:update', this.updateItem);
        this.removeEventListener('custom-list:remove', this.removeItem);
    }

    addItem(event) {
        this.batchUpdate(() => {
            const row = {
                id: uuid(),
                value: event.detail.value
            }
            this.state.items.unshift(row);
            this.log('Added Row', row);
            this.view.ref('ul').scrollTo(0, 0);
        })
    }

    updateItem({detail}) {
        this.batchUpdate(() => {
            const index = this.state.items.findIndex((item) => item.id === detail.id);
            this.state.items.splice(index, 1, detail);
            this.log('Updated Row', detail);
        }, false)
    }

    removeItem({detail}) {
        this.batchUpdate(() => {
            const index = this.state.items.findIndex((item) => item.id === detail.id);
            this.state.items.splice(index, 1);
            this.log('Removed Row', detail);
        })
    }

    get template() {
        return `
            <div class="wrapper">
                <custom-list-form></custom-list-form>
                <div class="list-info">
                    <span data-bind:text="state.items.length"></span> items
                </div>
                <ul>
                    <template data-for="item of state.items">
                        <custom-list-item 
                            data-bind:key="item.id"
                            data-state:item="item">
                        </custom-list-item>
                    </template>
                </ul>
            </div>
        `;
    }

    get styles() {
        return `
            <style>
            :host{
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
                max-height: 100vh;
            }
            .wrapper{
                padding: 2rem;
                background-color: #f3f3f3;
                text-align: left;
            }
            
            .list-info{
                padding: 0.2rem 0;
                flex-shrink: 0;
            }
            
            ul{
                list-style: none;
                flex-direction: column;
                overflow-y: scroll;
                scroll-behavior: smooth;
                flex-grow: 1;
                box-shadow: rgba(0,0,0,0.3) inset 0 0 5px;
                padding: 0.9rem;
                max-height: 100%;
            }
            </style>
        `;
    }
}