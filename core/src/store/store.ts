import {Pen} from "../pen";
import {globalStore} from "./global";
import {Options} from "../../options";
import mitt, {Emitter} from "mitt";
import {Point} from "../point";
export interface Meta2dStore {
    options: Options
    data: Meta2dData
    emitter: Emitter,
    pens:{
        [key:string]: Pen
    }
}
export interface Meta2dData {
    origin?: Point
    pens?: Pen[]  // 图元
    paths?: { [key:string] : string} // 图纸使用到的sbgPath
    x?: number // x坐标
    y?: number // y坐标
    scale?: number // 缩放
    width?: number
    height?: number
    // 标尺 暂不做

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
            histories: [],// 步骤记录
            pens: {},
            path2dMap: new WeakMap(),
            animateMap: new WeakMap(),
            active: [],
            animates: new Set(),
            options: {},
            emitter: mitt(),
            bindDatas: {},
        } as Meta2dStore
    };

}