import {camelCase} from "./Strings.js";

export default function toType(name, value){
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