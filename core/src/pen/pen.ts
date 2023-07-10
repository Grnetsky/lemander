// 定义图元基本信息
import {Point} from "../point";
import {Rect} from "../rect";
import {Canvas} from "../canvas";
import {PenType} from "./model";

export interface Pen extends Rect{
  anchorRadius?: any;
  anchorBackground?: string | CanvasGradient | CanvasPattern;
  anchorColor?: string;
  name?: string
  type?: PenType
  prev?: Point
  rotate?: number // 旋转角度
  id?: string // 自身id
  parentId?: string // 父级id
  width?: number
  globalAlpha?: number // t透明度
  height?: number
  activeColor?: string
  hoverAnchorColor?: string;
  x?: number
  y?: number
  hoverColor?:string
  hoverBackground?: string
  path?: string // svg的path 图像核心属性
  pathId?: string // path的唯一标识
  lineWidth?: number
  lineHeight?: number
  newId?: string
  activeBackground?:string
  fontSize?: number
  anchors?: Point[]
  calculative?:{
    x?:number
    y?:number
    canvas?: Canvas //这是？
    width?: number
    height?: number
    wordRect?: Rect
    hover?:boolean
    activeAnchor?: Point
    color?:string
    borderRadius?: number
    lineWidth?: number
    rotate?: number
    inView?: boolean
    worldRect?: Rect;
    singleton?: any
    worldAnchors?: Point[],
    svgRect?: Rect
    active?: boolean
    initRect?:Rect
  }
  image?: string
  locked?:number
  children?: string[]  // 里面放的是id信息
}