import {createOffScreen} from "./offscreen";
import {Canvas} from "./canvas";

export class MagnifierCanvas {
  canvas = document.createElement("canvas")
  magnifierScreen = createOffScreen()
  offscreen = createOffScreen()
  magnifierSize: number = 300
  magnifier:boolean = false; // 是否开启放大镜
  constructor(
    parentCanvas: Canvas,
    parentElement:HTMLElement,

    ) {
  }
}