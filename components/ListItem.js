import Component from "./Component.js";

export default class ListItem extends Component {

    constructor() {
        super();
        this.debug = true;
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

        this.view.ref('li:first-of-type').classList.add("fadeOut")

        setTimeout(()=>{
            this.$emit('custom-list:remove', item)
        }, 100)
    }

    beforeDestroy() {
    }

    get template() {

        return `
            <li data-if="state.item">
                <div data-if="!state.editing" class="fadeInRight">
                    <div data-bind:text="state.item.index"></div>
                    <div class="preview" data-bind:text="state.item.value"></div>
                    <div class="actions"">
                        <button
                            part="btn-blue"
                            type="button"
                            onclick="toggleEdit()">
                            Edit
                        </button>
                        <button
                            part="btn-red"
                            type="button"
                            onclick="onRemove()">
                            Remove
                        </button>
                    </div>
                </div>
                <div data-else class="fadeInLeft">
                   <input
                        type="text"
                        part="input"
                        placeholder="Enter text..."
                        data-model="state.item.value">
                    <button
                        type="button"
                        part="btn-green"
                        onclick="onUpdate()">
                        Save
                    </button>
                    <button
                        type="button"
                        part="btn-red"
                        onclick="toggleEdit()">
                        Cancel
                    </button>
                </div>
            </li>
        `;
    }

    get styles() {
        return `
            <style>
            @keyframes fadeInRight {
                0% {
                    opacity: 0;
                    transform: translateX(20px);
                }
                100% {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes fadeInLeft {
                0% {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                100% {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes fadeOut {
                0% {
                    opacity: 1;
                }
                100% {
                    opacity: 0;
                }
            }
            .fadeInRight,
            .fadeInLeft,
            .fadeOut {
                animation-duration: 240ms;
                animation-fill-mode: both;
                -webkit-animation-duration: 240ms;
                -webkit-animation-fill-mode: both;
            }
            .fadeInLeft {
                animation-name: fadeInLeft;
                -webkit-animation-name: fadeInLeft;
            }
            .fadeInRight {
                animation-name: fadeInRight;
                -webkit-animation-name: fadeInRight;
            }
            .fadeOut {
                animation-name: fadeOut;
                -webkit-animation-name: fadeOut;
            }
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
            }
            .actions{
                flex-shrink: 0;
                display: inline-flex;
                gap: 0.4rem;
            }
            input{
                margin: 0;
                padding: 0.8rem;
                line-height: 1.6rem;
                border: 1px solid #888;
                cursor: text;
                font-size: 1.6rem;
                border-radius: 4px;
                flex-grow: 1;
            }
                        
            button{
                margin: 0;
                padding: 1.2rem;
                border: none;
                box-shadow: 0 1px 2px rgba(0,0,0, 0.3);
                cursor: pointer;
                color: white;
                display: inline-flex;
                border-radius: .3rem;
                line-height: 1.2rem;
                font-size: 1.2rem;
                transition: all 30ms ease-in-out;
            }

            [part="btn-blue"]{
                background-color: #006699;
            }
            [part="btn-blue"]:hover{
                background-color: #0080c4;
            }
            
            [part="btn-green"]{
                background-color: #459900;
                color: white;
            }
            [part="btn-green"]:hover{
                background-color: #408c00;
            }
            
            [part="btn-red"]{
                background-color: #CCC;
                color: #333;
            }
            [part="btn-red"]:hover{
                background-color: #bb0000;
                color: white;
            }
            
            </style>
        `;
    }
}