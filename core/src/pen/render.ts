import {Pen} from "./pen";
import {Meta2dStore} from "../store";

export function calcPenRect(pen: Pen) {

}

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

// 渲染图元
export function renderPen(ctx: CanvasRenderingContext2D, pen: Pen) {
  ctx.save() // 保存状态
  ctx.translate(0.5, 0.5) // canvas 1像素容易模糊 偏移0.5让线不模糊 https://www.cnblogs.com/10manongit/p/12855766.html
  ctx.beginPath() // 开始路径
  ctxFlip(ctx, pen) //TODO 暂留 不知其作用 暂留

  if (pen.calculative.rotate && pen.name !== 'line') {
    ctxRotate(ctx, pen);
  }
  if (pen.calculative.lineWidth > 1) ctx.lineWidth = pen.calculative.lineWidth

}