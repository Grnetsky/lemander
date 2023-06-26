import {Meta2d} from "../core";
import {Meta2dStore} from "../store";
import {MagnifierCanvas} from "./magnifierCanvas";

export class Canvas {
  canvas = document.createElement("canvas") // 创建canvas
  parentElement:HTMLElement // 父元素
  width:number // 宽度
  height:number // 高度
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
      console.log(JSON.parse(e.dataTransfer.getData('meta2d')))
    }
  }
}