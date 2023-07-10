import {Point} from "./src/point";

export interface Options {
  anchorRadius: any;
  anchorBackground: string | CanvasGradient | CanvasPattern;
  anchorColor: string | CanvasGradient | CanvasPattern;
  hoverAnchorColor?: string;
  version?: number,
  fontSize?: number,
  textColor?:string
  color?:string
  hoverColor?:string
  activeColor?:string
  activeBackground?:string
  fromArrow?:string
  defaultAnchors?:Point[]
  toArrow?:string
  lineHeight?:number
  dockColor?: string;
  hoverBackground?:string
  interval?: number
}

export const defaultOptions = {
  defaultAnchors: [
    {
      x: 0.5,
      y: 0,
    },
    {
      x: 1,
      y: 0.5,
    },
    {
      x: 0.5,
      y: 1,
    },
    {
      x: 0,
      y: 0.5,
    },
  ],
  version:1.0,
  fontSize: 16,
  textColor: "#454545",
  color:"#222",
  anchorRadius: 4,
  hoverAnchorColor: '#FF4101',
  anchorBackground: '#fff',
  hoverColor: 'rgba(39,141,248,0.50)',
  activeColor: '#ff3cf0',
  lineHeight: 1.5,
  interval: 30
}