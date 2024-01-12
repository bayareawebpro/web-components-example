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
            items: this.props.items || factory(1000)
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
            this.view.ref('ul').scrollTo(0, 0);
            this.log('Added Row');
        })
    }

    updateItem({detail}) {
        const index = this.state.items.findIndex((item) => item.id === detail.id);
        this.state.items.splice(index, 1, detail);
        this.log('Updated Row');
    }

    removeItem({detail}) {
        this.state.items = this.state.items.filter((item) => item.id !== detail.id);
        this.log('Removed Row');
    }

    get template() {
        return `
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
        `;
    }

    get styles() {
        return `
            <style>
            :host{
                height: 100%;
                background-color: #fefefe;
                text-align: left;
                padding: 2rem;
                display: flex;
                flex-direction: column;
                flex-grow: 1;
            }
            .list-info{
                padding: 0.2rem 0;
                flex-shrink: 1;
            }
            ul{
                list-style: none;
                flex-direction: column;
                overflow-y: scroll;
                scroll-behavior: smooth;
                box-shadow: rgba(0,0,0,0.3) inset 0 0 5px;
                padding: 0.9rem;
            }
            </style>
        `;
    }
}