export function deepCopy<T>(o:T,keepCalc = false){  if (Array.isArray(o)) {
    const arr = [] as T & any[];
    o.forEach((item) => {
        arr.push(deepCopy(item, keepCalc));
    });
    return arr;
} else if (typeof o === 'object') {
    if (o === null) {
        return null;
    } else if (o.constructor === RegExp) {
        return o;
    }
    const _o = {} as T;
    for (const key in o) {
        if (
            ['canvas', 'lastFrame'].includes(key) ||
            o[key] instanceof HTMLImageElement ||
            o[key] instanceof HTMLMediaElement
        ) {
            continue;
        } else if (key === 'calculative' && !keepCalc) {
            continue;
        } else if (key === 'singleton') {
            if (keepCalc) {
                _o[key] = {} as any;
            } else {
                _o[key] = o[key];
            }
            continue;
        }
        _o[key] = deepCopy(o[key], keepCalc);
    }
    return _o;
}
    return o;
}

