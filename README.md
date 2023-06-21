# 功能要点
## nav部分
### 新建文件
#### 实现方法
```js
window.meta2d.open()
```
执行挂载到window身上的meta2d对象的open方法
方法内部细节：
```ts
// mate2d.open
  open(data?: Meta2dData, render: boolean = true) {
    this.clear(false); // 执行清理函数 核心部分
    if (data) { //判断是否为加载文件 
        this.setBackgroundImage(data.bkImage); // 设置背景图片
        Object.assign(this.store.data, data); // 将传入的数据 复制到meta2d的store中 此stroe由createstore创建
        this.store.data.pens = []; // 将store中的图元初始化清空
        // 第一遍赋初值  将传入的数据进行数据清洗 使得传入到store中的值符合标准
        for (const pen of data.pens) {
            if (!pen.id) { // 图元无id则赋值id
                pen.id = s8(); // 8位随机id
            }
            !pen.calculative && (pen.calculative = { canvas: this.canvas }); // 图元无calculatrive计算属性则赋值
            this.store.pens[pen.id] = pen; // 存入到store中
        }
        for (const pen of data.pens) {
            this.canvas.makePen(pen);
        }
    }
    if (!render) {
        this.canvas.opening = true;
    }
    this.initBindDatas(); // 绑定传入数据到store中
    this.render();
    this.listenSocket();
    this.connectSocket();
    this.startAnimate();
    this.startVideo();
    this.doInitJS();
    this.store.emitter.emit('opened'); // 触发store事件

    if (this.canvas.scroll && this.canvas.scroll.isShow) {
        this.canvas.scroll.init();
    }
}
```

### 打开保存的文件
#### 实现方法
```js
// example/vue/meta2d.vue
onOpen = (e) => {
  const file = e.target.files[0];  // 获取文件对象
  if (!file) {
    return;
  }
  const reader = new FileReader(); // FileReader读取文件对象
  reader.onload = (event) => { // 监听读取成功事件
    try {
      const json = JSON.parse(event.target.result); // 解析json数据
      window.meta2d.open(json); // meta2d执行打开方法，传入数据
    } catch(e) {
      console.log("读取文件失败，请检查数据格式");
    }
  };
  reader.readAsText(file);// 执行读取方法
};
```
### 保存文件
通过创建a链接 添加download属性执行下载
#### 实现方法
```js
// example/vue/meta2d.vue
const onSave = () => {
  const filename = "测试数据.json";  //文件名
  const data = window.meta2d.data(); //核心 将画布中的数据转换文json格式
  const json = JSON.stringify(data, undefined, 4); // 解析json
  const blob = new Blob([json], { type: "text/json" }); // 生成blob数据
  const a = document.createElement("a"); // 通过a链接的dowmload下载 
  a.download = filename; // 下载文件名
  a.href = window.URL.createObjectURL(blob); // j将a的下载地址指向文件内存地址
  a.dataset.downloadurl = ["text/json", a.download, a.href].join(":"); //TODO 暂不明确其作用
  a.click(); // 点击执行下载
};
```
#### 核心部分实现细节
```ts
  data(): Meta2dData {
    const data: Meta2dData = deepClone(this.store.data); // 深拷贝 数据仓库中的数据
    const { pens, paths } = this.store.data; // 结构pens和paths信息
    data.version = pkg.version; // 获取版本信息
    // TODO: 未在 delete 时清除，避免撤销等操作。
    // 清除一些未使用到的 paths   paths配置项有何作用？？
    data.paths = {};
    for (const pathId in paths) {
        if (Object.prototype.hasOwnProperty.call(paths, pathId)) {
            if (pens.find((pen) => pen.pathId === pathId)) {
                data.paths[pathId] = paths[pathId];
            }
        }
    }
    return data; // 返回json数据
}

```
### 钢笔
通过meta2d对象的finishPencil方法实现，具体实现如下
#### 实现方法
```js
  onTogglePen = () => {
    // 注意此方法存在bug
    isPencilActive.value = false;
    window.meta2d.finishPencil(); //  执行绘图方法
    isPenActive.value = true; 
    window.meta2d.drawLine("curve");  // 绘画函数
};


// finishPencil
async finishPencil() {
    if (this.pencilLine) {
        const anchors: Point[] = simplify(
            this.pencilLine.calculative.worldAnchors,
            10,
            0,
            this.pencilLine.calculative.worldAnchors.length - 1
        );
        let p = getFromAnchor(this.pencilLine);
        anchors.unshift({ id: p.id, penId: p.penId, x: p.x, y: p.y });
        p = getToAnchor(this.pencilLine);
        anchors.push({ id: p.id, penId: p.penId, x: p.x, y: p.y });
        this.pencilLine.calculative.worldAnchors = smoothLine(anchors);
        if (this.pencilLine.calculative.worldAnchors.length > 1) {
            this.pencilLine.calculative.pencil = false;
            this.store.path2dMap.set(
                this.pencilLine,
                globalStore.path2dDraws[this.pencilLine.name](this.pencilLine)
            );
            const allowAdd =
                (!this.beforeAddPens ||
                    (await this.beforeAddPens([this.pencilLine]))) &&
                (!this.beforeAddPen || this.beforeAddPen(this.pencilLine));
            if (allowAdd) {
                this.initLineRect(this.pencilLine);
                this.store.data.pens.push(this.pencilLine);
                this.store.pens[this.pencilLine.id] = this.pencilLine;
                this.store.emitter.emit('add', [this.pencilLine]);
                this.active([this.pencilLine]);
                this.pushHistory({
                    type: EditType.Add,
                    pens: deepClone([this.pencilLine], true),
                });
            }
        }
        this.pencilLine = undefined;
        this.render();
    }
}

// drawLine
drawLine(lineName?: string) {
    lineName && lockedError(this.store);
    this.canvas.drawingLineName = lineName;
}
```

### 铅笔
#### 实现方法
...
### 放大镜
#### 实现方法
在meta2d实例身上有canvas实例，在canvas实例中挂载了MagnifierCanvas实例，通过appendChild添加到父元素中，父元素监听鼠标移动事件通过调用渲染函数，在放大镜的渲染函数中进行鼠标位置的确定最终操作放大镜跟随鼠标移动
```ts
    const pt = {
      x:
        (this.parentCanvas.mousePos.x + this.store.data.x) *
        this.store.dpiRatio,
      y:
        (this.parentCanvas.mousePos.y + this.store.data.y) *
        this.store.dpiRatio,
    };
    const drawOffscreens = [
      this.parentCanvas.canvasImageBottom.offscreen,
      this.parentCanvas.canvasImageBottom.animateOffsScreen,
      this.parentCanvas.offscreen,
      this.parentCanvas.canvasImage.offscreen,
      this.parentCanvas.canvasImage.animateOffsScreen,
    ];
    // 跟随鼠标绘制  双缓冲
    drawOffscreens.forEach((offscreen) => {
      ctx.drawImage(
        offscreen,
        pt.x - r,
        pt.y - r,
        this.magnifierSize,
        this.magnifierSize,
        0,
        0,
        this.magnifierSize,
        this.magnifierSize
      );
```
放大效果实现
```ts
const ctx = this.magnifierScreen.getContext(
      '2d'
    ) as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = 5;

    ctx.save();
    ctx.translate(2.5, 2.5);

    ctx.save();
    ctx.arc(r, r, r, 0, Math.PI * 2, false);
    ctx.clip();
    ctx.fillStyle =
      this.store.data.background || this.store.options.background || '#f4f4f4';
    ctx.fillRect(0, 0, size, size);
    ctx.translate(-r, -r);
    ctx.scale(2, 2); // 放大效果实现
```
### 缩略图
#### 实现方法


### 帮助
#### 实现方法
a链接 点击跳转制定帮助页面

## 左侧图标部分
###

## 画布部分
### 图元的放置

### 图元的拖拽，位置移动

### 图元的缩放

### 图元的旋转

### 图元聚焦

### 图元的事件

### 图元的生命周期

### 图元的锚点

### 锚点之间的链接

### 图元的框选（多个）

