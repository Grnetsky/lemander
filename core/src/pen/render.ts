import {Pen} from "./pen";
import {Meta2dStore} from "../store";
import {calcCenter, calcRelativeRect, calcRightBottom, Rect} from "../rect";
import {globalStore} from "../store/global";
import {Point} from "../point";

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
  ctx.save() // 保存状态
  ctx.translate(0.5, 0.5) // canvas 1像素容易模糊 偏移0.5让线不模糊 https://www.cnblogs.com/10manongit/p/12855766.html
  const store = pen.calculative.canvas.store;

  ctx.beginPath() // 开始路径
  let fill
  if (pen.calculative.hover) {
    ctx.strokeStyle = pen.hoverColor || store.options.hoverColor;
    fill = pen.hoverBackground || store.options.hoverBackground;
    ctx.fillStyle = fill;
  } else if (pen.calculative.active) {
    ctx.strokeStyle = pen.activeColor || store.options.activeColor;
    fill = pen.activeBackground || store.options.activeBackground;
    ctx.fillStyle = fill;
  }else {
    let stroke = pen.calculative.color || getGlobalColor(store);

    ctx.strokeStyle = stroke;

  }
  ctxDrawPath(true,ctx, pen, store)
  ctx.closePath()
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
    if(pen.type){
      if (pen.calculative.active && !pen.calculative.pencil ) {
        renderLineAnchors(ctx, pen);
      }
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


// 计算图元是否在视图中 是否可见 暂时都设置为true
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

export function getAllChildren(pen: Pen, store: Meta2dStore): Pen[] {
  if (!pen || !pen.children) {
    return [];
  }
  const children: Pen[] = [];
  pen.children.forEach((id) => {
    const child = store.pens[id];
    if (child) {
      children.push(child);
      children.push(...getAllChildren(child, store));
    }
  });
  return children;
}


//pen 需要设置的图元 pt 锚点坐标
export function calcWorldPointOfPen(pen: Pen, pt: Point) {
  const p :Point = {...pt}
  const { x, y, width, height} = pen.calculative.worldRect
  p.x = x + width * pt.x
  p.y = y + height * pt.y
  if(pt.prev){
    p.prev = {
      penId : pen.id,
      connectTo: pt.connectTo,
      x: x + width *pt.prev.x,
      y: y +width* pt.prev.y
    }
  }
  if(pt.next){
    p.next = {
      penId : pen.id,
      connectTo: pt.connectTo,
      x: x + width *pt.prev.x,
      y: y +width* pt.prev.y
    }
  }
  console.log("计算锚点",p)

  return p
}

export function calcWordAnchors(pen:Pen){
  const store = pen.calculative.canvas.store // 获取全局存储对象
  let anchors: Point[] = [] // 初始化
  if(pen.anchors){
    pen.anchors.forEach((anchor)=>{
      anchors.push(calcWorldPointOfPen(pen,anchor))
    })
  }
  if (
    !anchors.length &&
    !pen.type &&
    !pen.calculative.canvas.parent.isCombine(pen)
  ) {
    const { x, y, width, height } = pen.calculative.worldRect;
    anchors = store.options.defaultAnchors.map((anchor, index) => {
      return {
        id: `${index}`,
        penId: pen.id,
        x: x + width * anchor.x,
        y: y + height * anchor.y,
      };
    });
  }

  if (!pen.type || pen.anchors) {
    pen.calculative.worldAnchors = anchors;
  }
  if (pen.calculative.activeAnchor && anchors.length) {
    pen.calculative.activeAnchor = anchors.find((a) => {
      a.id === pen.calculative.activeAnchor.id;
    });
  }
}
export function renderAnchor(
  ctx: CanvasRenderingContext2D,
  pt: Point,
  pen: Pen
) {
  if (!pt) {
    return;
  }

  const active = pen.calculative.activeAnchor === pt;
  let r = 4;
  if (pen.calculative.lineWidth > 3) {
    r = pen.calculative.lineWidth;
  }
  if (active) {
    if (pt.prev) {
      ctx.save();
      ctx.strokeStyle = '#4dffff';
      ctx.beginPath();
      ctx.moveTo(pt.prev.x, pt.prev.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.prev.x, pt.prev.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (pt.next) {
      ctx.save();
      ctx.strokeStyle = '#0b5bee';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.next.x, pt.next.y);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.next.x, pt.next.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export function renderLineAnchors(ctx: CanvasRenderingContext2D, pen: Pen) {
  const store = pen.calculative.canvas.store;
  console.log("renderLineAnchors")
  ctx.save();
  ctx.lineWidth = 1;
  ctx.fillStyle = pen.activeColor || store.options.activeColor;
  pen.calculative.worldAnchors.forEach((pt) => {
      renderAnchor(ctx, pt, pen);
  });
  ctx.restore();
}

// 给组件设置hover
export function setHover(pen: Pen, hover = true) {
  if (!pen) {
    return;
  }
  const store = pen.calculative.canvas.store;
  pen.calculative.hover = hover;
  if (pen.children) {
    pen.children.forEach((id) => {
      // 子节点没有自己的独立hover，继承父节点hover
      if (
        store.pens[id]?.hoverColor == undefined &&
        store.pens[id]?.hoverBackground == undefined
      ) {
        setHover(store.pens[id], hover);
      }
    });
  }
}
