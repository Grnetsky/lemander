import {Point} from "../point";
import {Pen} from "../pen";
import {rotatePoint} from "../../../../../Desktop/蔡豪/meta2d.js/packages/core/src/point/point";

export interface Rect { // 定义矩形
    x?: number; // 横坐标
    y?: number; // 纵坐标
    ex?: number; // endx endy
    ey?: number;
    width?: number; // 宽度
    height?: number; // 高度
    rotate?: number; // 旋转角度
    center?: Point; // 中间点
}


/**
 * 计算相对点 ，anchors 中的值都是百分比
 * @param pt 绝对坐标
 * @param worldRect 图形外接矩形
 * @returns 相对坐标点
 */
export function calcRelativePoint(pt: Point, worldRect: Rect){

    const { x, y, width, height } = worldRect;
    const { penId, connectTo } = pt;
    const point: Point = Object.assign({}, pt, {
        x: width ? (pt.x - x) / width : 0,
        y: height ? (pt.y - y) / height : 0,
    });
    if (pt.prev) {
        point.prev = {
            penId,
            connectTo,
            x: width ? (pt.prev.x - x) / width : 0,
            y: height ? (pt.prev.y - y) / height : 0,
        };
    }
    if (pt.next) {
        point.next = {
            penId,
            connectTo,
            x: width ? (pt.next.x - x) / width : 0,
            y: height ? (pt.next.y - y) / height : 0,
        };
    }
    return point;
}

// 计算图像右边框位置
export function calcRightBottom(rect: Rect) {
    rect.ex = rect.x + rect.width;
    rect.ey = rect.y + rect.height;
}

// 计算图像中心点坐标
export function calcCenter(rect: Rect) {
    if (!rect.center) {
        rect.center = {} as Point;
    }
    rect.center.x = rect.x + rect.width / 2;
    rect.center.y = rect.y + rect.height / 2;
}
export function calcRelativeRect(rect, worldRect){
    const relRect: Rect = {
        x: (rect.x - worldRect.x) / worldRect.width,
        y: (rect.y - worldRect.y) / worldRect.height,
        width: rect.width / worldRect.width,
        height: rect.height / worldRect.height,
    };
    calcRightBottom(relRect);
    return relRect;

}

//
export function pointInSimpleRect(pt: Point, rect: Rect, r = 0) {
    const { x, y, ex, ey } = rect;
    return pt.x >= x - r && pt.x <= ex + r && pt.y >= y - r && pt.y <= ey + r;
}

export function pointInRect(pt:Point,rect: Rect){
    if(!rect)return
    if(rect.ex == null)calcRightBottom(rect)
    // 若图像没有旋转
    if(!rect.rotate || rect.rotate % 360 === 0){
        // console.log(pt.x,pt.y,rect.x,rect.ex,rect.y,rect.ey)

        return pt.x >rect.x && pt.x<rect.ex && pt.y>rect.y && pt.y < rect.ey  // 判断核心
    }
    // 若图像已经旋转
    if(!rect.center)calcCenter(rect)
    const points = [
        { x: rect.x, y: rect.y },
        { x: rect.ex, y: rect.y },
        { x: rect.ex, y: rect.ey },
        { x: rect.x, y: rect.ey },
    ]
    points.forEach((item)=>{
        rotatePoint(item,rect.rotate,rect.center)
    })
    return pointInVertices(pt,points)
}
export function translateRect(rect: Rect | Pen, x: number, y: number) {
    console.log("translateRect",x,y,rect.x,rect.y)
    rect.x += x;
    rect.y += y;
    rect.ex += x;
    rect.ey += y;

    if (rect.center) {
        rect.center.x += x;
        rect.center.y += y;
    }
    return rect
}

export function rectToPoints(rect: Rect) {
    const pts = [
        { x: rect.x, y: rect.y },
        { x: rect.ex, y: rect.y },
        { x: rect.ex, y: rect.ey },
        { x: rect.x, y: rect.ey },
    ];

    if (rect.rotate) {
        if (!rect.center) {
            calcCenter(rect);
        }
        pts.forEach((pt) => {
            rotatePoint(pt, rect.rotate, rect.center);
        });
    }
    return pts;
}
