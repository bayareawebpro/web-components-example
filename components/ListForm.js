import Component from "./Component.js";
export default class ListForm extends Component {

    get data() {
        return {
            error: []
        }
    }

    addItem() {

        const {value} = this.view.find('input')

        if (!value) {
            this.state.error = 'Text is required.'
            return;
        }

        this.state.error = null

        this.$emit('custom-list:add', {value})
    }
    clearErrors() {
        this.batchUpdate(()=>{
            if(this.state.error){
                this.state.error = null
                this.view.find('[part="errors"]').replaceChildren()
            }
        }, false)
    }

    render(_) {

        const {
            error,
        } = this.state;

        return `
            <div part="form-wrapper">
                <div part="form">
                    <input 
                        type="text" 
                        part="input"
                        placeholder="Add Item..."
                        autofocus="autofocus"
                        onkeydown="clearErrors()"
                    />
                    <button part="btn-add" type="button" onclick="addItem()">
                        Add Item
                    </button>
                </div>
                ${_.if(error, () => `
                    <p part="errors">
                        ${error}
                    </p>
                `)}
            </div>
        `;
    }

    get styles() {
        return `
            <style>
            [part="form-wrapper"]{
                margin: 0 0 2rem 0;
                padding: 0 0 2rem 0;
                border-bottom: 1px solid #ddd;
            }
            [part="form"]{
                display: flex;
                justify-content: center;
                gap: 0.6rem;
            }
            [part="errors"]{
                margin: 0.4rem 0;
                padding: 0;
                color: red;
                list-style: none;
                font-weight: bold;
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
            
            [part="btn-add"]{
                background-color: #006699;
            }
            [part="btn-add"]:hover{
                background-color: #0080c4;
            }
            </style>
        `;
    }
}