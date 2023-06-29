import pkg from "../../package.json";
import {Pen} from "../pen";

export const globalStore: {
  anchors: { [key:string]: (pen:Pen) => void} // 锚点
  version:string;
  path2dDraws: { //TODO 2d画布  作用？
    [key: string]: (pen: Pen, ctx?: CanvasRenderingContext2D) => Path2D;
  };
  canvasDraws: { //TODO canvas画布？ 作用？
    [key: string]: (ctx: CanvasRenderingContext2D, pen: Pen) => void;
  };
}  = {
  version:pkg.version,
  anchors:{},
  path2dDraws:{},
  canvasDraws:{}
}