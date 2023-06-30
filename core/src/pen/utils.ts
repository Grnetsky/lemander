import {Pen} from "./pen";
import {s8} from "../utils";


export function randomId(pen: Pen) {
  pen.id = s8();
}
