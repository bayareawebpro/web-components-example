import Component from "./Component.js";
import clamp from "../utilities/Numbers.js";

export default class List extends Component {

    static observedAttributes = [
        'items:encoded'
    ];

    get data() {
        return {
            visible: 0,
            loading: false,
            list: this.props.items || []
        }
    }

    setup() {
        this.addEventListener('custom-list:add', this.addItem);
        this.addEventListener('custom-list:update', this.updateItem);
        this.addEventListener('custom-list:remove', this.removeItem);
    }

    addItem({detail: {value}}) {

        this.batchUpdate(() => {
            this.state.visible = 0
            this.state.list.unshift({
                id: Math.random(), value
            })
        })
    }

    updateItem({detail: {id, value}}) {

        this.batchUpdate(() => {

            const item = this.state.list.find((item) => item.id === id);

            if (item) {
                item.value = value;
            }
        })
    }

    removeItem({detail: {id}}) {

        this.batchUpdate(() => {
            this.state.list = this.state.list.filter((value) => value.id !== id);
            this.decrementVisible();
        });
    }

    updateVisible({wheelDelta}) {
        if (wheelDelta > 0) {
            this.decrementVisible();
        } else {
            this.incrementVisible();
        }
    }

    incrementVisible() {
        this.state.visible = clamp(this.state.visible + 1, 0, this.state.list.length - 10);
    }

    decrementVisible() {
        this.state.visible = clamp(this.state.visible - 1, 0, this.state.list.length - 10);
    }

    onSave() {

        this.state.loading = true;

        setTimeout(() => this.state.loading = false, 2000);
    }

    render(_) {

        const {
            list,
            loading,
            visible
        } = this.state;


        if (!list.length) {
            return `
                <div part="wrapper">
                    <slot name="before"></slot>
                </div>
            `;
        }

        const slice = list.slice(visible, visible + 10);
        const from = clamp(visible + 1, 1, list.length - 9);
        const to = clamp(visible + 10, visible, list.length);

        return `
            <div part="wrapper">
            
                <slot name="before"></slot>
                
                ${_.if(list.length > 9, () => `
                    <div part="list-info">${from}-${to} of ${list.length} rows</div>
                `)}
                
                ${_.if(list.length, () => `

                    <ul part="list" onwheel="updateVisible">
                        ${_.each(slice, (item) => `
                            <custom-list-item
                                item:encoded="${_.encode(item)}">
                            </custom-list-item>
                        `)}
                    </ul>
                    
                    <button part="btn-save" type="button" onclick="onSave">
                        ${_.if(loading, () => `Loading`)}
                        ${_.if(!loading, () => `Save`)}
                    </button>
                `)}
            </div>
        `;
    }

    get styles() {
        return `
            <style>
            [part="wrapper"]{
                max-width: 600px;
                margin: 0 auto;
                padding: 2rem;
                background-color: #f3f3f3;
                text-align: left;
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
            
            [part="list-info"]{
                padding: 0.2rem 0;
            }
            
            [part="list"]{
                padding: 0;
                list-style: none;
            }
            [part="btn-add"]{
                background-color: #006699;
            }
            [part="btn-add"]:hover{
                background-color: #0080c4;
            }
            [part="btn-save"]{
                padding: 1.6rem 2.6rem;
                background-color: #459900;
                font-size: 2rem;
                color: white;
            }
            [part="btn-save"]:hover{
                background-color: #408c00;
            }
            </style>
        `;
    }
}