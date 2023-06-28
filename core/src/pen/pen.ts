// 定义图元基本信息
import {Point} from "../point";
import {Rect} from "../rect";

export class Pen {
  name?: string
  id?: string // 自身id
  parentId?: string // 父级id
  width?: number
  height?: number
  x?: number
  y?: number
  path?: string // svg的path 图像核心属性
  pathId?: string // path的唯一标识
  lineWidth?: number
  lineHeight?: number
  fontSize?: number
  anchors?: Point[]
  calculative?:{
    x:number
    y:number
    width?: number
    height?: number
    wordRect?: Rect
    lineWidth?: number
    rotate?: number
    inview?: boolean
  }
  image?: string
  locked?:number
  children?: []
}