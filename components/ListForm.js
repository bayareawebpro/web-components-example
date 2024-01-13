import Component from "./Component.js";
export default class ListForm extends Component {

    get data() {
        return {
            error: null,
            value: '',
        }
    }

    addItem() {
        const {value} = this.state

        if (value.length > 3) {
            this.$emit('custom-list:add', {value})

            this.batchUpdate(()=>{
                this.state.error = null
                this.state.value = ''
            })
            return;
        }
        this.state.error = 'Min length is 4 letters.'
    }

    get template() {
        return `
            <div class="form-wrapper">
                <div class="form">
                    <input 
                        autofocus
                        type="text" 
                        placeholder="Add Item..."
                        onkeyup="state.error = null"
                        data-model="state.value"
                    />
                    <button 
                        type="button" 
                        class="btn-blue" 
                        onclick="addItem()"
                        data-bind:disabled="!state.value">
                        Add Item
                    </button>
                </div>
                <p 
                    data-if="state.error" 
                    data-bind:text="state.error" class="error">
                </p>
                <p 
                    data-else 
                    data-bind:text="state.value" class="info">
                </p>
            </div>
        `;
    }

    get styles() {
        return `
            <style>
            .form-wrapper{
                padding: 0 0 2rem 0;
            }
            .form{
                display: flex;
                justify-content: center;
                gap: 0.6rem;
            }
            .error{
                margin: 0.4rem 0;
                padding: 0;
                color: red;
                font-weight: bold;
            }
            .info{
                margin: 0.4rem 0;
                padding: 0;
            }
            
            input{
                margin: 0;
                padding: 1rem;
                line-height: 1.6rem;
                border: 1px solid #888;
                cursor: text;
                font-size: 1.6rem;
                flex-grow: 1;
                border-radius: 4px;
            }
                        
            button{
                margin: 0;
                padding: 1.4rem;
                border: none;
                box-shadow: 0 1px 2px rgba(0,0,0, 0.3);
                cursor: pointer;
                color: white;
                display: inline-flex;
                border-radius: .3rem;
                line-height: 1.6rem;
                font-size: 1.6rem;
                transition: all 100ms ease-in-out;
            }
            button[disabled]{
                opacity: 0.5;
            }
            .btn-blue{
                background-color: #006699;
            }
            .btn-blue:hover{
                background-color: #0080c4;
            }
            </style>
        `;
    }
}