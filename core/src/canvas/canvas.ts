import {Meta2d} from "../core";
import {Meta2dStore} from "../store";
import {MagnifierCanvas} from "./magnifierCanvas";
import {Point} from "../point";
import {needSetPenProps, Pen} from "../pen";
import {s8} from "../utils/uuid";
import {globalStore} from "../store/global";
import {createOffScreen} from "./offscreen";
import {
  calcInView,
  calcPenRect,
  calcWorldRects, getAllChildren,
  getGlobalColor,
  getParent,
  renderPen,
  setChildrenActive
} from "../pen/render"
import {randomId} from "../pen/utils";
import {calcCenter, calcRelativePoint, pointInRect, pointInSimpleRect, Rect, translateRect} from "../rect";
import {HoverType} from "../utils/data";
import {getLineR} from "../diagrams/line/line";
import {deepCopy} from "../../../utils/deepCopy";
import {rectToPoints} from "../../../../../Desktop/蔡豪/meta2d.js/packages/core/src/rect/rect";
import {rotatePoint} from "../../../../../Desktop/蔡豪/meta2d.js/packages/core/src/point/point";

export const movingSuffix = '-moving' as const;


export class Canvas {
  canvas = document.createElement("canvas") // 创建canvas
  canvasRect: Rect;

  parentElement:HTMLElement // 父元素
  externalElements = document.createElement('div');  // 这个为外部聚焦框 可能不止一个子元素？ external：外部的
  width:number // 宽度
  height:number // 高度
  clientRect:Rect
  offscreen = createOffScreen() as HTMLCanvasElement
  magnifier: MagnifierCanvas
  private lastRender: number = 0
  private renderTimer: number = 0
  mousePos: Point = { x: 0, y: 0 }
  mouseDown: { x: number; y: number; restore?: boolean };
  timer: any
  activeRect:Rect
  private hoverType: HoverType;
  private movingPens: Pen[] & any[];
  private lastMouseTime: any;
  private initActiveRect: Rect;
  private sizeCPs: Point[];
  private hoverTimer: number = 0;
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
    // 这个元素的作用？
    this.externalElements.style.position = 'absolute';
    this.externalElements.style.left = '0';
    this.externalElements.style.top = '0';
    this.externalElements.style.right = '0';
    this.externalElements.style.bottom = '0';

    this.externalElements.style.outline = 'none';
    this.externalElements.style.background = 'transparent';
    this.externalElements.className = 'exter';
    this.externalElements.style.zIndex = '4';
    parentEle.style.position = 'relative';
    parentEle.appendChild(this.externalElements);
    this.listen()
  }
  resize(w?:number, h?:number){
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
    this.render()
  }
  onResize = () => {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.resize();
      this.timer = undefined;
    }, 100);
  };
  // TODO 暂留 监听各个事件e
  listen() {
    console.log("canvas監聽")
    this.externalElements.ondragover = (e) => e.preventDefault(); //ondrop 前需先定义ondragover
    this.externalElements.onmousemove =  (e)=>{
      this.onMouseMove({
        x: e.offsetX,
        y: e.offsetY,
        clientX: e.clientX,
        clientY: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY,
        ctrlKey: e.ctrlKey || e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        buttons: e.buttons,
      })
    }
    this.externalElements.ondrop = this.ondrop
    this.externalElements.onmousedown = (e)=>{
      this.onMouseDown({
        x: e.offsetX,
        y: e.offsetY,
        clientX: e.clientX,
        clientY: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY,
        ctrlKey: e.ctrlKey || e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        buttons: e.buttons,
      })
    }
    this.externalElements.onmouseup = (e)=>{
      this.onMouseUp(
        {
          x: e.offsetX,
          y: e.offsetY,
          clientX: e.clientX,
          clientY: e.clientY,
          pageX: e.pageX,
          pageY: e.pageY,
          ctrlKey: e.ctrlKey || e.metaKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          buttons: e.buttons,
        }
      )
    }
    this.canvas.ondragover = (e)=>{
      e.preventDefault();
    }
    window.onresize = ()=>{
      this.onResize()
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
        // 中心点
        pen.x = pt.x - pen.width / 2;
        pen.y = pt.y - pen.height / 2
      }
    }
    await this.addPens(pens)
    this.render() // 渲染
  }

  // 鼠标按下事件 选择

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
  ondrop =  (e)=>{
    e.preventDefault();
    // metaData
    try {
      let metaData = JSON.parse(e.dataTransfer.getData('meta2d'))
      metaData = Array.isArray(metaData)? metaData : [metaData]  // 转换为数组
      console.log("metaData数据为",metaData)
      const pt = { x:e.offsetX, y:e.offsetY } // 鼠标坐标
      this.dropPens(metaData,pt) // 放置图元
    }catch (err){
      console.log("无法识别的元件")
    }
  }
  // 初始化pen的calculative属性
  makePen(pen: Pen) {
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

    // 设置path2dMap
    globalStore.path2dDraws[pen.name] &&
    this.store.path2dMap.set(pen, globalStore.path2dDraws[pen.name](pen));
    console.log(this.store.path2dMap,"==========")

    // 递归设置子项
    if(pen.children){
      pen.children.forEach((id)=>{
        const child = this.store.pens[id]
        child && this.updatePenRect(child,{worldRectIsReady:false})  // 递归
      })
    }
    // ...
  }

  active(pens:Pen[]){
    console.log("activepens",this.store.active)
    if(this.store.active){

    }
    this.store.active = []
    pens.forEach((item)=>{
      item.calculative.active = true
      setChildrenActive(item)
    })
    // 将所选图元推入 active列表中
    this.store.active.push(...pens)
    this.activeRect = undefined;
    console.log(this.store.active)
  }

  deactive(){
    this.store.active.forEach((pen) => {
      pen.calculative.active = undefined;
      setChildrenActive(pen, false);
    });
    this.hoverType = HoverType.None;
    this.store.active = [];
    this.activeRect = undefined;
  }
  // 渲染原理  清屏>更新>渲染
  render(){
    console.log("渲染")
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
    // 渲染部分
    this.renderPens() // 核心 渲染图元
    offscreenCtx.restore();

    // 将隔离层图像渲染到显示层
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    console.log("清理成功")
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
  // 获取焦点信息
  getHover(pt:Point) {
    let hoverType = HoverType.None
    this.store.hover = undefined
    this.store.hoverAnchor = undefined
    if(hoverType === HoverType.None){
      hoverType = this.inPens(pt,this.store.data.pens)
    }
    this.hoverType = hoverType
    if (hoverType === HoverType.Node) {
      // 若hoverType == None
      this.externalElements.style.cursor = 'crosshair'

    }else {
      this.externalElements.style.cursor = 'default'
    }
  }

  calibrateMouse = (pt: Point) => {
    pt.x -= this.store.data.x;
    pt.y -= this.store.data.y;
    return pt;
  };

  private onMouseDown(e:{
    x: number;
    y: number;
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    buttons?: number; // 1 左键 2 右键 4 中键
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  }){

    console.log("mousedown",this.store.active)
    // TODO 如何防止抖动的？
    this.mouseDown = e;
    this.lastMouseTime = performance.now();
    this.calibrateMouse(e)
    this.mousePos.x = e.x;
    this.mousePos.y = e.y;
    this.mouseDown = e
    switch (this.hoverType){
      case HoverType.Node:
        if(this.store.hover){
          // 获取hover的图元
          const pen = getParent(this.store.hover, true) || this.store.hover
          this.active([pen])
        }
        break
      case HoverType.None:
        this.deactive()
        this.calcActiveRect();

    }
  }

  private onMouseMove = (
    e: {
      x: number;
      y: number;
      clientX: number;
      clientY: number;
      pageX: number;
      pageY: number;
      buttons?: number;
      ctrlKey?: boolean;
      shiftKey?: boolean;
      altKey?: boolean;
    }
  ) => {
    console.log("mousemove")
    // if (
    //   this.mouseDown &&
    //   !this.mouseDown.restore &&
    //   e.buttons !== 1 &&
    //   e.buttons !== 2
    // ) {
    //   this.onMouseUp(e);
    //   return;
    // }
    // 避免鼠标点击和移动一起触发，误抖动
    if (this.lastMouseTime) {
      const now = performance.now();
      if (now - this.lastMouseTime < 50) {
        this.lastMouseTime = 0;
        return;
      }
      this.lastMouseTime = 0;
    }
    this.mousePos = {x:e.x, y:e.y};
    this.calibrateMouse(e)
    this.mousePos.x = e.x;
    this.mousePos.y = e.y;
    this.getHover(e)
    console.log(this.hoverType)
    if(this.hoverType === HoverType.Node && this.mouseDown){
      console.log("移动pens")
      // const x = e.x- this.mouseDown.x
      // const y = e.y - this.mouseDown.y
      // const shake = 20
      this.movePens(e)
    }
    console.log(this.store.active)
    globalThis.debug && console.time('hover');
    const now = performance.now();
    if (now - this.hoverTimer > 50) {
      this.hoverTimer = now;
      this.getHover(e);
    }
    this.render();


  }
  // 获取鼠标所触碰的元素

   private onMouseUp(    e: {
     x: number;
     y: number;
     clientX: number;
     clientY: number;
     pageX: number;
     pageY: number;
     buttons?: number;
     ctrlKey?: boolean;
     shiftKey?: boolean;
     altKey?: boolean;
   }){
     this.mouseDown = undefined;

     console.log("mouseup")
    if(this.hoverType == HoverType.Node){

    }
   }
  private inPens(pt: Point,pens) {
    let hoverType = HoverType.None // 初始化
    for (let i = pens.length - 1 ;i >=0;--i){
      const pen = pens[i]
      const r = getLineR(pen); // r 是什么？？

      // if(!pointInSimpleRect(pt,pen.calculative.worldRect,r)&&!pointInRect(pt,pen.calculative.worldRect)){
      //     continue
      // }
      let isIn = false
    if(pen.name === 'line'){
      isIn = pointInSimpleRect(pt,pen.calculative.worldRect,pen.lineWidth)
    }else {
      isIn = pointInRect(pt,pen.calculative.worldRect)
    }
    if(isIn){
      this.store.hover = pen
      hoverType = HoverType.Node
      this.store.pointAt = pt
    }
    // 递归子元素
      // if(pen.children){
      //   const pens = []
      //   pen.children.forEach(id=>{
      //     pens.push(this.store.pens[id])
      //   })
      //   hoverType = this.inPens(pt, pens)
      //   if(hoverType)break
      // }
    }
    this.initActiveRect = undefined;

    return hoverType  // 返回hover类型
  }

  private movePens(e: {
    x: number;
    y: number;
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    buttons?: number;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean
  }) {
    // if (!this.initActiveRect) {
      this.initActiveRect = deepCopy(this.activeRect);
    console.log(this.activeRect,"activeRect")
    //   return;
    // }
    this.initMovingPens()
    console.log("移动pen")

    let x = e.x - this.mouseDown.x;
    let y = e.y - this.mouseDown.y;
    const rect = deepCopy(this.initActiveRect);
    translateRect(rect, x, y);
    const offset: Point = {
      x: rect.x - this.activeRect.x,
      y: rect.y - this.activeRect.y,
    };
    console.log("执行movepens")
    this.translatePens(this.movingPens,offset.x,offset.y,true)
  }


  // 初始化移动图元 复制图元 修改ids ：为什么要修改ids？
  private initMovingPens() {
    // 深拷贝移动图元
    this.movingPens = deepCopy(this.store.active, true)
    console.log(this.movingPens,this.store.active,)
    const containChildPens = this.getAllByPens(this.movingPens)  // 获取所有图元
    console.log(containChildPens)
    const copyContainChildPens = deepCopy(containChildPens, true); // 深拷贝

    containChildPens.forEach(i=>{
      // 为什么要重新设置id？ 因为要放入
      this.changeIdsByMoving(i,copyContainChildPens)
      this.store.pens[i.id] = i  // 将复制的图元信息祖册到全局pens中
      i.calculative.canvas = this
      const value: Pen = {
        globalAlpha: 0.5  // 更改透明度
      }
      this.updateValue(i,value)
    })
  }

  // 获取所有图元
  getAllByPens(pens: Pen[]): Pen[] {
    const retPens: Pen[] = [];
    for (const pen of pens) {
      retPens.push(...deepCopy(getAllChildren(pen, this.store), true));
    }
    return retPens.concat(pens);
  }

  private changeIdsByMoving(pen: Pen, pens: Pen[]) {

    // 为相关图元添加 后缀
    pen.id += movingSuffix
    if(pen.parentId && pens.find(i=>i.id === pen.parentId)){
      pen.parentId += movingSuffix
    }
    if(pen.children){
      pen.children = pen.children.map(i=>i += movingSuffix)
    }
  }

  private updateValue(pen: Pen, data: Pen) {
    let willSetPenRect :boolean = false
    console.log("更新数据")
    const penRect = this.getPenRect(pen)
    const oldName = pen.name
    const isChangeName = oldName !== pen.name
    data.newId && this.changePenId(pen.id,data.newId)
    // 新数据注册到pen中
    Object.assign(pen,data)
    for (let k in data){
      if(typeof pen[k] !== "object" ){
        pen.calculative[k] = data[k]
      }

      if(needSetPenProps.includes(k)){
        willSetPenRect = true
      }
    }
    if(willSetPenRect){
      const rect = {
        x:data.x ?? penRect.x,
        y:data.y ?? penRect.y,
        width: data.width ?? penRect.width,
        height: data.height ?? penRect.height,
      }
      this.setPenRect(pen, rect, false);

    }

  }

  private getPenRect(pen: Pen,origin = this.store.data.origin,scale = this.store.data.scale) {
    if(!pen)return
    if(pen.parentId){
      return {
        x: pen.x,
        y:pen.y,
        width:pen.width,
        height:pen.height
      }
    }else {
      return {
        x: (pen.x - origin.x) / scale,
        y: (pen.y - origin.y) / scale,
        width: pen.width / scale,
        height: pen.height / scale,
      };
    }
  }

  /**
   * @description 移动图元
   * @param pens 需要移动的图源对象
   * @param x 偏移量
   * @param y 偏移量
   * @param doing 是否可持续移动
   * */
  translatePens(pens:Pen[] = this.store.active,x: number,y:number,doing?:boolean){
    if(!pens || pens.length === 0){
      return
    }
    console.log("执行translate")
    const initPens = deepCopy(pens, true)
    this.activeRect && translateRect(this.activeRect,x,y)
    const containChildPens = this.getAllByPens(pens)

    console.log(containChildPens,"containChildPens")
    pens.forEach((pen)=>{
      translateRect(pen.calculative.worldRect, x, y);

      console.log("123")
      this.updatePenRect(pen,{worldRectIsReady:true})
      pen.calculative.worldRect.x = pen.x
      pen.calculative.worldRect.y = pen.y

      if (pen.calculative.initRect) {
        pen.calculative.initRect.x = pen.calculative.x;
        pen.calculative.initRect.y = pen.calculative.y;
        pen.calculative.initRect.ex =
          pen.calculative.x + pen.calculative.width;
        pen.calculative.initRect.ey =
          pen.calculative.y + pen.calculative.height;
      }
    })
    this.activeRect && this.getSizeCPs();
    this.render();
  }
  getSizeCPs() {
    this.sizeCPs = rectToPoints(this.activeRect);
    // 正上 正右 正下 正左
    const pts = [
      { x: 0.5, y: 0 },
      { x: 1, y: 0.5 },
      { x: 0.5, y: 1 },
      { x: 0, y: 0.5 },
    ] as const;
    const { x, y, width, height, rotate, center } = this.activeRect;
    pts.forEach((pt) => {
      const p = {
        x: pt.x * width + x,
        y: pt.y * height + y,
      };
      rotatePoint(p, rotate, center);
      this.sizeCPs.push(p);
    });
  }
  private changePenId(id: string, newId: string) {
    if(id === newId)return
    const pen = this.store.pens[id]
    if(!pen || this.store.pens[newId])return
    pen.id = newId
    this.store.pens[newId] = this.store.pens[id]
    delete this.store.pens[id]

    if(pen.parentId){
      const parent = this.store.pens[pen.parentId];
      const index = parent.children?.findIndex((i) => i === id);
      index !== -1 && parent.children?.splice(index, 1, newId);
    }
    pen.children?.forEach((childId) => {
      const child = this.store.pens[childId];
      child.parentId = newId;
    });
  }

  private calcActiveRect() {
    if(this.store.active.length === 0){
      return
    }else if(this.store.active.length === 1){
      this.activeRect = deepCopy(this.store.active[0].calculative.worldRect)
      this.activeRect.rotate = this.store.active[0].calculative.rotate || 0;
      calcCenter(this.activeRect);
    }else {
      // 选中为多个 暂不考虑
    }


  }
}

// 打平pen 将所以子孙图元加入同一个列表



