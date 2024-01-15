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

            return this.batchUpdate(()=>{
                this.state.error = null
                this.state.value = ''
            }).then(()=>{
                this.focusInput();
            })
        }

        this.state.error = 'Min length is 4 letters.';
        this.focusInput();
    }

    onKeyDown($event) {
        $event.code === 'Enter'
            ? this.addItem()
            : this.state.error = null;
    }

    focusInput(){
        this.view.ref('input').focus();
    }

    get help(){
        return this.state.value
            ? `${this.state.value}  ...hmm sounds interesting.`
            : 'Describe the new item'
    }

    get template() {
        return `
            <div class="form-wrapper">
                <div class="form">
                    <input 
                        autofocus
                        type="text" 
                        placeholder="Add Item..."
                        onkeydown="onKeyDown($event)"
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
                    data-bind:text="help" class="info">
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
                color: #818283;
            }
            button{
                padding: 1.4rem;
                display: inline-flex;
                border-radius: .3rem;
                line-height: 1.6rem;
                font-size: 1.6rem;
            }
            </style>
        `;
    }
}