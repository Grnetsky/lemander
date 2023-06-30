import {Meta2d} from "../core";
import {Meta2dStore} from "../store";
import {MagnifierCanvas} from "./magnifierCanvas";
import {Point} from "../point";
import {Pen} from "../pen";
import {s8} from "../utils/uuid";
import {globalStore} from "../store/global";
import {createOffScreen} from "./offscreen";
import {calcInView, calcPenRect, calcWorldRects, getGlobalColor, renderPen} from "../pen/render"
import {randomId} from "../pen/utils";
import {calcRelativePoint} from "../rect";

export class Canvas {
  canvas = document.createElement("canvas") // 创建canvas
  parentElement:HTMLElement // 父元素
  width:number // 宽度
  height:number // 高度
  offscreen = createOffScreen() as HTMLCanvasElement
  magnifier: MagnifierCanvas
  private lastRender: number = 0
  private renderTimer: number = 0
  timer: any
  constructor(
    public parent:Meta2d,
    public parentEle:HTMLElement,
    public store:Meta2dStore
  ) {
    this.parentElement = parentEle
    this.parentElement?.appendChild(this.canvas)
    this.parentElement.style.position = 'absolute'
    this.parentElement.style.top = '0'
    this.parentElement.style.bottom = '0'
    this.parentElement.style.left = '0'
    this.parentElement.style.right = '0'
    this.canvas.style.position = 'absolute';
    this.canvas.style.backgroundRepeat = 'no-repeat';
    this.canvas.style.backgroundSize = '100% 100%';
    this.canvas.style.zIndex = '2';
  }
  resize(w:number, h:number){
    w = w || this.parentElement.clientWidth
    h = h || this.parentElement.clientHeight
    this.width = w
    this.height = h
    this.canvas.width = w
    this.canvas.height = h
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.offscreen.width = w
    this.offscreen.height = h
  }
  onResize = () => {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      // this.resize();
      this.timer = undefined;
    }, 100);
  };
  // TODO 暂留 监听各个事件
  listen() {
    console.log("canvas監聽")
    this.canvas.ondragover = (e)=>{
      e.preventDefault();
    }
    this.canvas.ondrop = (e)=>{
      e.preventDefault();
      // metaData
      let metaData = JSON.parse(e.dataTransfer.getData('meta2d'))
      metaData = Array.isArray(metaData)? metaData : [metaData]  // 转换为数组
      console.log("metaData数据为",metaData)
      const pt = { x:e.offsetX, y:e.offsetY } // 鼠标坐标
      this.dropPens(metaData,pt) // 放置图元
    }
  }
  // 添加图元
  private async dropPens(pens: Pen[],pt: Point) {
    for(const pen of pens){
      !pen.parentId && this.randomCombineId(pen,pens) // 无parentId则绑定
    }
    for(let pen of pens){
      !pen.id && (pen.id = s8())  // 不存在id则赋值
      console.log(this.store)
      !pen.calculative && (pen.calculative = { canvas : this}) //初始化calculative
      this.store.pens[pen.id] = pen  // 将图元记录到数据仓库
    }


    for(let pen of pens){
      if(!pen.parentId){
        // 伴随画布一起缩放
        pen.width *= this.store.data.scale
        pen.height *= this.store.data.scale
        pen.x = pt.x - pen.width / 2;
        pen.y = pt.y - pen.height / 2
      }
    }
    await this.addPens(pens)
    this.render() // 渲染

  }

  // 添加图元
  private async addPens(pens: Pen[]) {
    // 该处可放生命周期
    const list: Pen[] =[]
    for(let pen of pens){
      this.makePen(pen) // 生成pen对象
      list.push(pen)
    }
    // 渲染
    this.render()
    return list
  }

  // 初始化pen的calculative属性
  private makePen(pen: Pen) {
    !pen.id && (pen.id = s8())
    this.store.data.pens.push(pen) // Meta2dData 记录pens
    this.store.pens[pen.id] = pen // 在store中注册
    if(pen.path){ // 该pen有path对象
      !pen.pathId && (pen.pathId = s8()) // 设置path的唯一标识
      // 将该pen的path记录到数据仓库中
      const paths = this.store.data.paths; //svgPath
      !paths[pen.pathId] && (paths[pen.pathId] = pen.path); //数据仓库中没有则添加

      // pen.path = undefined // TODO 为什么设为undefined？
    }

    // 设置pen的lineWidth
    if (pen.lineWidth == undefined) {
      pen.lineWidth = 1
    }

    // 设置pen的fontSize
    const { fontSize, lineHeight } = this.store.options; // 从设置中读取数据
    if (!pen.fontSize) {
      pen.fontSize = fontSize;
    }
    if (!pen.lineHeight) {
      pen.lineHeight = lineHeight;
    }
    pen.calculative = { canvas: this, singleton: pen.calculative?.singleton }
    // 将pen的key 加载到 pen的calculative中
    for (const k in pen) {
      if (typeof pen[k] !== 'object' || k === 'lineDash') {
        pen.calculative[k] = pen[k];
      }
    }
    // 锚点
    if(!pen.anchors && globalStore.anchors[pen.name]){
      !pen.anchors && (pen.anchors = []) // 初始化pen的锚点
      globalStore.anchors[pen.name](pen) // 将乖类型图元的锚点记录到globalStore中
    }
    !pen.rotate && (pen.rotate = 0);  // 初始化旋转角度
    this.updatePenRect(pen)

    // 计算锚点信息
    if (!pen.anchors && pen.calculative.worldAnchors) {
      pen.anchors = pen.calculative.worldAnchors.map((pt) => {
        return calcRelativePoint(pt, pen.calculative.worldRect);
      });
    }
    // 初始化pen的rotate属性
    !pen.rotate && (pen.rotate = 0)
  }
  // 更新图元矩形信息（位置，锚点，icon，text，inView？）
  private updatePenRect(pen: Pen,{
    worldRectIsReady,
  }: {
    worldRectIsReady?: boolean;  //TODO 这个属性的作用？？
  } = {}) {
    if(worldRectIsReady){   // 暂时不用理会
      calcPenRect(pen)
    }else {
      calcWorldRects(pen)
    }
    calcInView(pen) // 计算图元是否在视图中 状态更新到pen中
    //
    globalStore.path2dDraws[pen.name] &&
    this.store.path2dMap.set(pen, globalStore.path2dDraws[pen.name](pen));

    //
    if(pen.children){
      pen.children.forEach((id)=>{
        const child = this.store.pens[id]
        child && this.updatePenRect(child,{worldRectIsReady:false})  // 递归
      })
    }
    // ...
  }


  // 渲染原理  清屏>更新>渲染
  render(){
    let now = performance.now()  // 获取现在时间
    if(now -this.lastRender < this.store.options.interval){ // 设置渲染频率
      if(this.renderTimer){
        cancelAnimationFrame(this.renderTimer)
      }
      this.renderTimer = requestAnimationFrame(this.render) // 重绘
      return
    }
    this.lastRender = now // 记录当前值
    const offscreenCtx = this.offscreen.getContext('2d') // 离屏渲染层
    offscreenCtx.clearRect(0,0,this.offscreen.width,this.offscreen.height)  // 清屏
    offscreenCtx.save() // 保存当前状态
    offscreenCtx.translate(this.store.data.x, this.store.data.y);  // TODO 为甚要移动渲染层？
    this.renderPens() // 核心 渲染图元

    // 将隔离层图像渲染到显示层
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.offscreen, 0, 0, this.width, this.height);
  }

  // 绘制图元
  private renderPens() {
    const ctx =  this.offscreen.getContext('2d')
    ctx.strokeStyle = getGlobalColor(this.store)
    for (let pen of this.store.data.pens){
     renderPen(ctx,pen)
    }
  }

  /**
   * @param pens 为加入图元的集合
   * @param pen 迭代遍历的每个图元
   * @param parentId 父元素的id 迭代遍历用
   * */
  private randomCombineId(pen: Pen, pens: Pen[], parentId?: string) {
    randomId(pen)
    pen.parentId = parentId
    const newChildren = []
    if(Array.isArray(pen.children)){
      for(let childId of pen.children){
        const childPen = pens.find((item)=>item.id === childId)
        childPen && newChildren.push(this.randomCombineId(childPen,pens,pen.id).id) // 递归
      }
    }
    pen.children = newChildren
    return pen;
  }
}