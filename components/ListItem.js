import Component from "./Component.js";

export default class ListItem extends Component {

    constructor() {
        super();
        this.debug = false;
    }

    get data() {
        return {
            editing: false,
            item: null
        }
    }

    toggleEdit() {
        this.batchUpdate(() => {
            this.state.editing = !this.state.editing
        }).then(() => {
            this.view.ref('input').focus()
        })
    }

    onUpdate() {
        this.batchUpdate(() => {
            this.$emit('custom-list:update', {...this.state.item})
            this.toggleEdit()
        })
    }

    onRemove() {

        const {item} = this.state;

        this.view.ref('li:first-of-type').classList.add("fadeOut");

        setTimeout(()=>{
            this.$emit('custom-list:remove', item);
        }, 120)
    }

    get template() {
        return `
            <li data-if="state.item">
                <div data-if="!state.editing" class="fadeInRight">
                    <div data-bind:text="state.item.index"></div>
                    <div class="preview" data-bind:text="state.item.value"></div>
                    <div class="actions">
                        <button
                            type="button"
                            class="btn-blue"
                            onclick="toggleEdit()">
                            Edit
                        </button>
                        <button
                            type="button"
                            class="btn-red"
                            onclick="onRemove()">
                            Remove
                        </button>
                    </div>
                </div>
                <div data-else class="fadeInLeft">
                   <input
                        type="text"
                        placeholder="Enter text..."
                        data-model="state.item.value">
                    <div class="actions">
                        <button
                            type="button"
                            class="btn-green"
                            onclick="onUpdate()">
                            Save
                        </button>
                        <button
                            type="button"
                            class="btn-red"
                            onclick="toggleEdit()">
                            Cancel
                        </button>
                    </div>
                </div>
            </li>
        `;
    }

    get styles() {
        return `
            <style>
            
            li > div{
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0.8rem 1rem;
                margin: 0 0 0.6rem 0;
                border-radius: 4px;
                background-color: #fefefe;
                gap: 0.4rem;
            }
            .preview{
                flex-grow: 1;
                font-size: 1.6rem;
                line-height: 1.6rem;
            }
            .actions{
                flex-shrink: 0;
                display: inline-flex;
            }
            .actions button{
                min-width: 70px;
                text-align: center;
            }
            .actions button:first-of-type{
                border-radius: .3rem 0 0 .3rem;
            }
            .actions button:last-of-type{
                border-radius: 0 .3rem .3rem 0;
            }
            input{
                padding: 0.8rem;
                line-height: 1.6rem;
                font-size: 1.6rem;
                flex-grow: 1;
            }

            
            </style>
        `;
    }
}