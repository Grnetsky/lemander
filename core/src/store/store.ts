import {Pen} from "../pen";
import {globalStore} from "./global";
import {Options} from "../../options";
import mitt, {Emitter} from "mitt";
import {Point} from "../point";
export interface Meta2dStore {
    options: Options
    data: Meta2dData
    emitter: Emitter,
    hover?: Pen
    hoverAnchor?: Point
    center:Point
    pointAt?: Point
    dpiRatio?: number;
    historyIndex?:number
    histories?: []
    active?:Pen[]
    pens:{
        [key:string]: Pen
    }
    path2dMap: WeakMap<Pen, Path2D> // path2d hash表
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
    color?: string
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
    return{
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
        options: { },
        emitter: mitt(),
        bindDatas: {},
    } as Meta2dStore; // as 断言

}

export const clearStore = (store: Meta2dStore) => {
    store.data = {
        x: 0,
        y: 0,
        scale: 1,
        pens: [],
        origin: { x: 0, y: 0 },
        center: { x: 0, y: 0 },
        paths: {},
    };
    store.pens = {};
    store.histories = [];
    store.historyIndex = null;
    store.path2dMap = new WeakMap();
    store.active = [];
    store.hover = undefined;
    store.lastHover = undefined;
};
