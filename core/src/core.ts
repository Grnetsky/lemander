import {Canvas} from "./canvas";
import {clearStore, Meta2dData, Meta2dStore, UseStore} from "./store";
import {Options} from "../options";
import {s8} from "./utils/uuid";
import {globalStore, registerAnchors} from "./store/global";
import {Pen} from "./pen";
import {commonAnchors, commonPens} from "./diagrams";
import {deepCopy} from "../../utils/deepCopy";

export class Meta2d {
  canvas: Canvas
  store: Meta2dStore
  websocket: WebSocket
  registerAnchors = registerAnchors
  constructor(ele: HTMLElement | string, opts: Options = {}) {
    this.store = UseStore(s8()) // 使用数据仓库 有则加载 无则创建
    this.setOptions(opts); // 初始化设置
    this.setDataByOptions(opts)  // 从传入设置项中初始化数据
    this.init(ele, opts) // 初始化2
    globalThis.meta2d = this // 挂载到全局对象 window
    // @ts-ignore
    this.register(commonPens())
    // this.registerCanvasDraw()
    this.registerAnchors(commonAnchors()); // 注册Anchors锚点

    // this.initEventFns() // 初始化事件函数
    // this.store.emitter.on("*",this.onEvent)
  }

  ondrop(e) {
    console.log(e)
  }

  private setOptions(opts: Options = {}) {
    this.store.options = Object.assign(this.store.options, opts); // 加载设置到数据仓库中
  }

  data(): Meta2dData {
    const data: Meta2dData = deepCopy(this.store.data); // 深拷贝 数据仓库中的数据
    const {pens, paths} = this.store.data;
    // TODO: 未在 delete 时清除，避免撤销等操作。
    // 清除一些未使用到的 paths
    data.paths = {}; // TODO path属性的作用？
    for (const pathId in paths) {
      if (Object.prototype.hasOwnProperty.call(paths, pathId)) {
        if (pens.find((pen) => pen.pathId === pathId)) {
          data.paths[pathId] = paths[pathId];
        }
      }
    }
    return data;
  }

  open(data?) {
    this.clear()
    if (data) {
      Object.assign(this.store.data, data);
      this.store.data.pens = [];
      // 第一遍赋初值
      for (const pen of data.pens) {
        if (!pen.id) {
          pen.id = s8();
        }
        !pen.calculative && (pen.calculative = {canvas: this.canvas});
        this.store.pens[pen.id] = pen;
      }
      for (const pen of data.pens) {
        this.canvas.makePen(pen);
      }
    }
    this.render();
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
    if (typeof ele === 'string') {
      // 创建canvas
      this.canvas = new Canvas(
        this,
        document.getElementById(ele),
        this.store
      )
    } else {
      this.canvas = new Canvas(this, ele, this.store)
    }
    this.resize()
    this.canvas.listen() // 子canvas开始监听事件
  }

  resize(width?: number, height?: number) {
    this.canvas.resize(width, height)
  }

  //TODO 暂留 生命周期
  // ...
  save() {

  }

  // 在meta2dd身上注册相关图形
  private register(path2dFns: {
    [key: string]: (pen: Pen, ctx: CanvasRenderingContext2D) => Path2D
  }) {
    Object.assign(globalStore.path2dDraws, path2dFns)
  }

  registerCanvasDraw(drawFns: {  //注册画布
    [key: string]: (ctx: CanvasRenderingContext2D, pen: Pen) => void;
  }) {
    Object.assign(globalStore.canvasDraws, drawFns);
  }

  private render() {
    this.canvas.render()
  }

  clear() {
    clearStore(this.store);

  }

  isCombine(pen: Pen) {
    if (pen.name === 'combine') {
      return true;
    }
    if (pen.children && pen.children.length > 0) {
      return true;
    }
    return false;
  }
}
