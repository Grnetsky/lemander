import {Point} from "./src/point";

export interface Options {
  version?: number,
  fontSize?: number,
  textColor?:string
  color?:string
  activeColor?:string
  activeBackground?:string
  fromArrow?:string
  defaultAnchors?:Point[]
  toArrow?:string
  lineHeight?:number
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
}