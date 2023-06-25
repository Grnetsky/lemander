import {Pen} from "../pen";
import {globalStore} from "./global";
import {Options} from "../../options";
import mitt, {Emitter} from "mitt";
export interface Meta2dStore {
    options:Options
    data:Meta2dData
    emitter:Emitter
}
export interface Meta2dData {
    pens: Pen[]
}


export function UseStore(id = 'default'): Meta2dStore{
    if(!globalStore[id]){
        globalStore[id] = createStore() // 创建数据仓库
        globalStore[id].id = id
    }
    return globalStore[id]
}

function createStore(){ //
    // 创建仓库
    return {
        data:{
            data: {
                x: 0,
                y: 0,
                scale: 1,
                pens: [],
                origin: { x: 0, y: 0 },
                center: { x: 0, y: 0 },
                paths: {},
            },
            histories: [],
            pens: {},
            path2dMap: new WeakMap(),
            animateMap: new WeakMap(),
            active: [],
            animates: new Set(),
            options: {},
            emitter: mitt(),
            bindDatas: {},
        } as Meta2dStore // as 断言
    };

}