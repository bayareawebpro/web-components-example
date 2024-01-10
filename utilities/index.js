

export function factory(times) {
    const adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"],
        colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"],
        nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];

    function _random (max) { return Math.round(Math.random() * 1000) % max; }

    let data = new Array(times);
    for (let i = 0; i < times; i++) {
        data[i] = {
            id: uuid(),
            value: `${adjectives[_random(adjectives.length)]} ${colours[_random(colours.length)]} ${nouns[_random(nouns.length)]}`,
            editing: false,
        }
    }
    return data;
}

export function camelCase(str) {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
}

export function uuid(){
    return crypto.getRandomValues(new Uint32Array(4)).join('-');
}

export function toType(name, value){
    const nameArray = name.includes(':') ? name.split(':') : [name, 'string']
    const realType = [...nameArray].reverse().at(0);
    const realName = nameArray.at(0);

    const cast = {
        bool: (val) => Boolean(val),
        string: (val) => String(val),
        number: (val) => Number(val),
        encoded: (val) => JSON.parse(val),
    }

    if(typeof cast[realType] !== 'function'){
        throw new Error(`Prop Parse Error: ${realType} has no cast.`)
    }

    return {
        realName: camelCase(realName),
        realValue: cast[realType](value),
    }
}