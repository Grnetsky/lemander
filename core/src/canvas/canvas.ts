import {Meta2d} from "../core";
import {Meta2dStore} from "../store";

export class Canvas {
  parentElement:HTMLElement // 父元素
  w:number // 宽度
  h:number // 高度
  constructor(
    parent:Meta2d,
    parentEle:HTMLElement,
    store:Meta2dStore
  ) {
    this.parentElement = parentEle
  }
  resize(width:number, height:number){

  }

  // TODO 暂留 监听各个事件
  listen() {

  }
}