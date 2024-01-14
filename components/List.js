import Component from "./Component.js";
import {uuid, factory} from "../utilities/index.js";


export default class List extends Component {

    constructor(props) {
        super(props);
        this.debug = this.measurePerformance = true;
        this.logMutations = true;
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

            this.state.items.unshift({
                id: uuid(),
                index: 0,
                value: event.detail.value
            });

            this.state.items.splice(1, 1, {
                id: uuid(),
                index: 1,
                value: 'update index 1'
            });

            this.state.items.splice(3, 1, {
                id: uuid(),
                index: 2,
                value: 'update index 2'
            });

            this.state.items.splice(5, 1,{
                id: uuid(),
                index: 5,
                value: 'update index 5'
            });

            // const first = this.state.items[0];
            // const last = this.state.items[this.state.items.length-1];
            //
            //
            // if(!this.state.updated){
            //     first.value = 'first'
            //     last.value = 'last'
            //     this.state.updated = true
            // }
            // this.state.items = this.state.items
            //     .toSpliced(0, 1,  last)
            //     .toSpliced(this.state.items.length-1, 1,  first);
            // this.state.items.push({
            //     id: uuid(),
            //     value: event.detail.value
            // });

            this.log('Added Row');
        }).then(()=>this.view.ref('ul').scrollTo(0, 0))
    }

    updateItem({detail}) {
        const index = this.state.items.findIndex((item) => item.id === detail.id);
        this.state.items.splice(index, 1, detail);
        this.log('Updated Row');
    }

    removeItem({detail}) {
        this.state.items = this.state.items.filter((item) => item.id !== detail.id);
        this.log('Removed Row', detail);
    }

    get template() {
        return `
        <custom-list-form></custom-list-form>
        <div class="list-info">
            <span data-bind:text="state.items.length"></span> items
        </div>
        <ul>
            <template 
                data-if="state.items.length > 0" 
                data-for="item of state.items">
                <custom-list-item 
                    data-bind:key="item.id"
                    data-state:item="item">
                </custom-list-item>
            </template>
            <li data-else>
                Add items...
            </li>
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
                overflow-x: hidden;
                scroll-behavior: smooth;
                border-radius: 0.6rem;
                box-shadow: rgba(0,0,0,0.3) inset 0 0 5px;
                padding: 0.9rem;
            }
            li{
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                border-radius: 4px;
                background-color: #fefefe;
                color: #3a6073;
                align-self: center;
                gap: 0.4rem;
                flex-grow: 1;
                font-size: 1.6rem;
            }
            </style>
        `;
    }
}