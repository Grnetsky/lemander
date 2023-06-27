import pkg from "../../package.json";
import {Pen} from "../pen";

export const globalStore: {
  anchors: { [key:string]: (pen:Pen) => void} // 锚点
  version:string;
}  = {
  version:pkg.version,
  anchors:{}
}