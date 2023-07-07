
import { square } from './square'
import { circle } from "./circle";
import { svgPath } from "./svgPath";
import {triangle, triangleAnchors} from "./triangle";

export function commonPens (){
  return {
    square,
    circle,
    svgPath,
    triangle,
  }
}

export function commonAnchors() {
  return {
    triangle: triangleAnchors,
  };
}