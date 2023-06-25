import {Point} from "../point";

export interface Rect { // 定义矩形
    x?: number; // 横坐标
    y?: number; // 纵坐标
    ex?: number; //TODO 这是什么？？ endx endy
    ey?: number;
    width?: number; // 宽度
    height?: number; // 高度
    rotate?: number; // 旋转角度
    center?: Point; // 中间点
}