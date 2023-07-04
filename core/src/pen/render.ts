import {Pen} from "./pen";
import {Meta2dStore} from "../store";
import {calcCenter, calcRelativeRect, calcRightBottom, Rect} from "../rect";
import {globalStore} from "../store/global";

// 获取全局色彩主题配置
export function getGlobalColor(store: Meta2dStore) {
  const {data, options} = store
  return data.color || options.color
}


function ctxFlip(ctx: CanvasRenderingContext2D, pen: Pen) {
  // 暂留
}


// 旋转
function ctxRotate(ctx: CanvasRenderingContext2D, pen: Pen) {

}

// 渲染图元 TODO 核心
export function renderPen(ctx: CanvasRenderingContext2D, pen: Pen) {
  console.log(pen,"renderPen000000000000000")
  ctx.save() // 保存状态
  ctx.translate(0.5, 0.5) // canvas 1像素容易模糊 偏移0.5让线不模糊 https://www.cnblogs.com/10manongit/p/12855766.html
  const store = pen.calculative.canvas.store;

  ctx.beginPath() // 开始路径
  ctxDrawPath(true,ctx, pen, store)
  ctx.stroke()
  ctxFlip(ctx, pen) //TODO 暂留 不知其作用 暂留  翻转
  if (pen.calculative?.rotate && pen.name !== 'line') {
    ctxRotate(ctx, pen);
  }
  if (pen.calculative?.lineWidth > 1) ctx.lineWidth = pen.calculative?.lineWidth
  ctx.restore()
}
export function ctxDrawPath(
  canUsePath = true,
  ctx: CanvasRenderingContext2D,
  pen: Pen,
  store: Meta2dStore,
  fill = false
){
  const path = canUsePath? store.path2dMap.get(pen) : globalStore.path2dDraws[pen.name]

  if (path){
    if(path instanceof Path2D){
      fill && ctx.fill(path)
      ctx.stroke(path)
    }else {
      path(pen,ctx)
      fill && ctx.fill();
      ctx.restore();
    }
  }
}

// TODO 暂留
export function calcWorldRects(pen: Pen){
  const store = pen.calculative.canvas.store
  let rect: Rect = {
    x: pen.x,
    y: pen.y
  }

  // 当前图元没有父级
  if(!pen.parentId){
    rect.width = pen.width
    rect.height = pen.height
    rect.rotate = pen.rotate
    calcRightBottom(rect) // 计算右边
    calcCenter(rect)
  }else {
    const parent= store.pens[pen.parentId] // 刺痛canvas的store中获取该父级图元
    let parentRect =  parent.calculative.worldRect
    if(!parentRect) parentRect = calcWorldRects(parent)
    rect.x = parentRect.x + parentRect.width * pen.x  //TODO 为什么这么算？？？
  }
  pen.calculative.worldRect = rect
  return rect
}


// 计算图元的外接矩形
export function calcPenRect(pen: Pen) {
  const worldRect = pen.calculative.worldRect;
  if (!pen.parentId) {  // 若该图元没有父级 则外接矩形大小为该图元大小
    Object.assign(pen, worldRect);
    return;
  }

  // 若该图元有父级 则绑定为父级外接矩形
  const store = pen.calculative.canvas.store;
  const parentRect = store.pens[pen.parentId].calculative.worldRect;
  Object.assign(pen, calcRelativeRect(worldRect, parentRect));  // 将书籍记录到pen中
}


// 计算图元是否在视图中 是否可见
export function calcInView(pen:Pen){
  pen.calculative.inView = true
}

// 递归设置子图元为激活状态
export function setChildrenActive(pen: Pen, active = true) {
  if (!pen.children) {
    return;
  }
  const store = pen.calculative.canvas.store;
  pen.children.forEach((id) => {
    const child: Pen = store.pens[id];
    if (child) {
      child.calculative.active = active;

      setChildrenActive(child, active);
    }
  });
}

export function getParent(pen: Pen, root?: boolean): Pen {
  if (!pen || !pen.parentId || !pen.calculative) {
    return undefined;
  }

  const store = pen.calculative.canvas.store;
  const parent = store.pens[pen.parentId];
  if (!root) {
    return parent;
  }
  return getParent(parent, root) || parent;
}