import {uuid} from "../utilities/index.js";

export default class Skeleton extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({
            mode: 'open',
        })
        this.uuid = uuid();
        this.shadowRoot.innerHTML = `<div>test </div>`
    }
}