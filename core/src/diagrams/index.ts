
import { square } from './square'
import { circle } from "./circle";
import { svgPath } from "./svgPath";
import {triangle} from "./triangle";

export function commonPens (){
  return {
    square,
    circle,
    svgPath,
    triangle,
  }
}