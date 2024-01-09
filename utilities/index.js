export function factory(times, callback) {
    const values = [];
    while (times > 0) {
        values.push(callback());
        times--;
    }
    return values;
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