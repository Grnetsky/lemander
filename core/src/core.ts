import {Canvas} from "./canvas";
import {Meta2dData, Meta2dStore, UseStore} from "./store";
import {Options} from "../options";
import {s8} from "./utils/uuid";
import {globalStore} from "./store/global";
import {Pen} from "./pen";
import {commonPens} from "./diagrams";

export class Meta2d {
  canvas: Canvas
  store: Meta2dStore
  websocket:WebSocket
  data():Meta2dData{
    return {} as Meta2dData
  }
  constructor(ele:HTMLElement | string,opts:Options = {}) {
    this.store = UseStore(s8()) // 使用数据仓库 有则加载 无则创建
    this.setOptions(opts); // 初始化设置
    this.setDataByOptions(opts)  // 从传入设置项中初始化数据
    this.init(ele,opts) // 初始化2
    globalThis.meta2d = this // 挂载到全局对象 window
    this.register(commonPens())
    // this.registerCanvasDraw()
    // this.initEventFns() // 初始化事件函数
    // this.store.emitter.on("*",this.onEvent)
  }
  ondrop(e){
    console.log(e)
  }

  private setOptions(opts: Options = {}) {
    // this.store.options = Object.assign(this.store.options, opts); // 加载设置到数据仓库中
  }


  // 从传入设置项中初始化数据
  private setDataByOptions(opts: Options = {}) {
    const {
      textColor,
      color,
      activeColor,
      activeBackground,
      fromArrow,
      toArrow,
    } = opts
    // 从传入的设置中获取数据
    this.store.data = Object.assign(this.store.data, {
      textColor,
      color,
      activeColor,
      activeBackground,
      fromArrow,
      toArrow,
    });
  }

   init(ele: HTMLElement | string, opts: Options) {
    if(typeof ele === 'string'){
      // 创建canvas
      this.canvas = new Canvas(
        this,
        document.getElementById(ele),
        this.store
      )
    }else{
      this.canvas = new Canvas(this,ele,this.store)
    }
    this.resize()
     this.canvas.listen() // 子canvas开始监听事件
  }

   resize(width?:number, height?:number) {
    this.canvas.resize(width, height)
  }

  //TODO 暂留 生命周期
  // ...
  save(){

  }

  // 在meta2dd身上注册相关图形
  private register(path2dFns: {
      [key:string]: (pen: Pen, ctx: CanvasRenderingContext2D)=> Path2D
    }) {
      Object.assign(globalStore.path2dDraws, path2dFns)
    console.log(globalStore.path2dDraws,"gggggggggggggggggggggggggggggggggggggggg")
    }

  registerCanvasDraw(drawFns: {  //注册画布
    [key: string]: (ctx: CanvasRenderingContext2D, pen: Pen) => void;
  }) {
    Object.assign(globalStore.canvasDraws, drawFns);
  }

}

