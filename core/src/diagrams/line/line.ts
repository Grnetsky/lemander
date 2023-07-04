import {Pen} from "../../pen";


//TODO 这个方法 作用？
export function getLineR(pen: Pen) {
  return pen?.lineWidth ? pen.lineWidth / 2 + 4 : 4;
}
