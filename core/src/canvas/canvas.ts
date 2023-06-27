import {Meta2d} from "../core";
import {Meta2dStore} from "../store";
import {MagnifierCanvas} from "./magnifierCanvas";
import {Point} from "../point";
import {Pen} from "../pen";
import {s8} from "../utils/uuid";
import {globalStore} from "../store/global";

export class Canvas {
  canvas = document.createElement("canvas") // 创建canvas
  parentElement:HTMLElement // 父元素
  width:number // 宽度
  height:number // 高度
  store: Meta2dStore
  offscreenCanvas:HTMLCanvasElement
  magnifier: MagnifierCanvas
  constructor(
    parent:Meta2d,
    parentEle:HTMLElement,
    store:Meta2dStore
  ) {
    this.parentElement = parentEle
    this.parentElement?.appendChild(this.canvas)
    this.parentElement.style.position = 'absolute'
    this.parentElement.style.top = '0'
    this.parentElement.style.bottom = '0'
    this.parentElement.style.left = '0'
    this.parentElement.style.right = '0'
    this.canvas.style.position = 'absolute';
    this.canvas.style.backgroundRepeat = 'no-repeat';
    this.canvas.style.backgroundSize = '100% 100%';
    this.canvas.style.zIndex = '2';
  }
  resize(w:number, h:number){
    w = w || this.parentElement.clientWidth
    h = h || this.parentElement.clientHeight
    this.width = w
    this.height = h
    this.canvas.width = w
    this.canvas.height = h
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
  }

  // TODO 暂留 监听各个事件
  listen() {
    console.log("canvas監聽")
    this.canvas.ondragover = (e)=>{
      e.preventDefault();
    }
    this.canvas.ondrop = (e)=>{
      e.preventDefault();
      let metaData = JSON.parse(e.dataTransfer.getData('meta2d'))
      metaData = Array.isArray(metaData)? metaData : [metaData]
      const pt = { x:e.offsetX, y:e.offsetY } // 鼠标坐标
      this.dropPens(metaData,pt) // 放置图元
    }
  }
  // 添加图元
  private async dropPens(pens: Pen[],pt: Point) {

    for(let pen of pens){
      !pen.id && (pen.id = s8())  // 不存在id则赋值
      this.store.pens[pen.id] = pen  // 将图元记录到数据仓库
    }

    for(let pen of pens){
      if(!pen.parentId){
        // 伴随画布一起缩放
        pen.width *= this.store.data.scale
        pen.height *= this.store.data.scale
        pen.x = pt.x - pen.width / 2;
        pen.y = pt.y - pen.height / 2
      }
    }
    await this.addPens(pens)

  }

  // 添加图元
  private async addPens(pens: Pen[]) {
    // 该处可放生命周期
    for(let pen of pens){
      this.makePen(pen)
    }
  }

  private makePen(pen: Pen) {
    !pen.id && (pen.id = s8())
    this.store.data.pens.push(pen) // Meta2dData 记录pens
    this.store.pens[pen.id] = pen
    if(pen.path){
      !pen.pathId && (pen.pathId = s8()) // 设置path的唯一标识
      // 将该pen的path记录到数据仓库中
      const paths = this.store.data.paths;
      !paths[pen.pathId] && (paths[pen.pathId] = pen.path);
    }
    if (pen.lineWidth == undefined) {
      pen.lineWidth = 1;
    }
    const { fontSize, lineHeight } = this.store.options; // 从设置中读取数据
    if (!pen.fontSize) {
      pen.fontSize = fontSize;
    }
    if (!pen.lineHeight) {
      pen.lineHeight = lineHeight;
    }

    if(!pen.anchors && globalStore.anchors[pen.name]){
      !pen.anchors && (pen.anchors = [])
      globalStore.anchors[pen.name](pen)
    }
  }
}