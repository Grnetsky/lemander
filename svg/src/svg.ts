import { XMLParser } from "fast-xml-parser"; // https://github.com/NaturalIntelligence/fast-xml-parser
import {Rect, Pen, s8, } from "core"
import {calcWorldPositions, parseSvgPath, SvgPath} from "./parse";
const selfName = ':@';
let anchorsArr = []
let shapeScale: number; // 图形缩小比例
let allRect: Rect
const contentProp = '#text';
import {getRect} from './parse'

let style = undefined // 样式

function setStyle(filter: any) {
  filter.forEach(()=>{
    if(filter.style && filter.style[0]){
      style = cssToJson(filter.style[0][contentProp]);
    }
  })
}


// 对标svg的transform属性，在此基础上偏移
function getTranslate(transform:string) {
  // 若无transform属性则设置为0
  let offsetX = 0
  let offsetY = 0
  if(transform){
    let matchArr = transform
      .replace('translate(', '')
      .replace(')', '')
      .split(',');
    offsetX = parseFloat(matchArr[0]);
    offsetY = parseFloat(matchArr[1]);
  }
    return {
      offsetX,
      offsetY
    }
}

// 根据path转换为Pen
function transformPath(path: any, pen: any) {
  let d = path.d  // 获取命令
  if(!d)return
  console.log("获取path",path)
  let command = parseSvgPath(d) // 根据path命令生成自有命令
  console.log("根据path生成的自有命令",command)

  let rect = getRect(command)  // 根据命令生成矩形
  console.log("根据命令生成的矩形",rect)
  const { offsetX, offsetY } = getTranslate(path.transform) //根据svg的transform属性 获取偏移位置
  rect.x += offsetX
  rect.y += offsetY
  rect.ex += offsetX
  rect.ey += offsetY
  const x = (rect.x + pen.x - allRect.x) / allRect.width
  const y = (rect.y + pen.y - allRect.y) / allRect.height
  const width =
    rect.width / allRect.width <= 1 ? rect.width / allRect.width : 1
  const height =
    rect.height / allRect.height <= 1 ? rect.height / allRect.height : 1
  const res =  {
    ...pen,
    name: 'svgPath',
    pathId: s8(),
    path: d,
    x,
    y,
    width,
    height,
    disableAnchor: true,
  };
  console.log("transformPath最终输出",res)
  return res
}
interface Gradient {
  id: string; // 当前的 id 值
  from: string; // 该渐变来自于哪个渐变 即 xlink:href 属性， 比 id 多一个 #
  color: string; // 颜色，from 存在时，该值应该不存在
}
let linearGradient: Gradient[] = [];

// 根据传入的类名 生成classStyle 样式对象
function getClassStyle(
className:string
)
{
  const classStyle = {}
  for(let key in style){
    if(Object.prototype.hasOwnProperty.call(style,key)){ // key为style自身属性
      const value = style[key]
      if(key.includes(className)){
        Object.assign(classStyle,value)
      }
    }
  }
  return classStyle
}

// 样式信息变为json数据 TODO 之前不是json数据吗？？？
function styleToJson(style?: string) {
  if (!style) {
    return {};
  }
  const styleArr = style.split(';');
  const json = {};
  styleArr.forEach((item) => {
    const [key, value] = item.split(':');
    key && (json[key] = value);
  });
  return json;
}

// 转换为常规形状
function transformNormalShape(
  childProperty: any,
  parentProperty,
  parentId: string
) {
  const childClassJs = getClassStyle(childProperty.class)
  const parentClassJs = getClassStyle(parentProperty.class)
  const chileStyleJs = styleToJson(childProperty.style);
  const parentStyleJs = styleToJson(parentProperty.style);
  // 样式覆盖 最终样式
  const finalProperty = {
    ...parentProperty,
    ...parentClassJs,
    ...parentStyleJs,
    ...childProperty,
    ...childClassJs,
    ...chileStyleJs,
  };
  let background;
  if (finalProperty.fill === 'none') {
  } else if (finalProperty.fill?.includes('url')) {
    const id: string = finalProperty.fill.replace('url(#', '').replace(')', '');
    let gradientColor = linearGradient.find((item) => item.id === id);
    if (gradientColor && !gradientColor.color) {
      // 颜色不存在，则查找父级
      gradientColor = linearGradient.find(
        (item) => gradientColor.from === `#${item.id}`
      );
    }
    background = gradientColor?.color;
  } else {
    background = finalProperty.fill;
    // fill 属性不是 none ，是 undefined ，用默认黑色
    !background && (background = '#000');
  }
  let x = 0,
    y = 0;
  let rotate = 0;
  if (finalProperty.transform) {
    const transforms = finalProperty.transform.split(') ');
    transforms.forEach((transform: string) => {
      const [type, value] = transform.split('(');
      const [offsetX, offsetY] = value.split(' ');
      if (type === 'translate') {
        // 平移
        x = Number(offsetX) || 0;
        y = Number(offsetY) || 0;
      }
      if (type === 'rotate') {
        // TODO: transform 中的 rotate 圆心与 meta2d.js 圆心不一致，处理过程中默认把 translate 干掉
        // 旋转
        rotate = parseFloat(value);
        x = 0;
        y = 0;
      }
    });
  }

  return {
    id: s8(),
    locked: 10,
    parentId,
    x,
    y,
    rotate,
    // TODO: background 可以为空
    background: background,
    color: finalProperty.stroke,
    lineWidth: finalProperty['stroke-width']
    ? parseFloat(finalProperty['stroke-width']) * shapeScale
    : finalProperty.stroke
      ? 1
      : 0,
    lineCap: finalProperty.strokeLinecap,
    lineJoin: finalProperty.strokeLinejoin,
    lineDash: finalProperty.strokeDasharray, // TODO: 可能不是数组类型
    lineDashOffset: finalProperty.strokeDashoffset,
    globalAlpha: Number(finalProperty.opacity),
    fontSize: finalProperty['font-size']
    ? parseFloat(finalProperty['font-size']) * shapeScale
    : 16,
    fontFamily: finalProperty['font-family'],
    fontWeight: finalProperty['font-weight'],
    fontStyle: finalProperty['font-style'],
} as Pen;
}

// TODO 将多个children组合在一起  实现绑定 不完整
function transformCombines(selfProperty: any, children: any[]): Pen[] {
  const pens:Pen[] =[]
  const [width, height] = dealUnit(selfProperty);
  const combinePen: Pen = {  // 声明图元
    id:s8(),
    name:"combine", //TODO 名字写死？
    x: selfProperty.x,
    y: selfProperty.y,
    locked: selfProperty.locked,
    width,
    height,
    children:[]
  }
  pens.push(combinePen) // 第一项为combinePen信息
  children.forEach(child =>{
    let pen: Pen | Pen[] = undefined
    const childProperty = child[selfName]
    if(childProperty && childProperty.transform){
      child.g && child.g.forEach((item)=>{ // 若为组标签
        if(!item[selfName]){
          item[selfName] = {
            transform: childProperty.transform
          }
        }else {
          item[selfName].transform = childProperty.transform
        }
      })
    }
    if(child.defs){
      setStyle(child.defs.filter(item=> item.value))
    }else if(child.style){
      setStyle([{style: child.style}])
    }else if(childProperty){
      pen = transformNormalShape(childProperty, selfProperty, combinePen.id)
      // 根据不同类型进行渲染  暂时只完成path相关
      if(child.path){
        console.log("transformPath输入",pen)
        pen = transformPath(childProperty, pen);
      }else if(child.rect){

      }else if(child.circle){

      }else if(child.line){

      }else if(child.ellipse){

      }else if(child.polygon){

      }else if(child.polyline){

      }else if(child.g){

      }else if(child.text){

      }else if(child.image){

      }else{
        pen = undefined
      }
    }
    // 将子元素记录到组合图元中
    if(pen){
      if (Array.isArray(pen)){
        for(const pItem of pen){
          if( !pItem.parentId ){
            pItem.parentId = combinePen.id // 该pen无父级id则绑定为该组合id
            combinePen.children.push(pItem.id) // 双向引用 记录子id
          }
        }
        pens.push(...pen);
      }else {
        combinePen.children.push(pen.id);
        pens.push(pen);
      }
    }
  })
  console.log("transformCombines最终输出",pens)
  return pens
}

// 解析svg 返回为图元
export function parseSvg(svg:string):Pen[]{
  const parser:XMLParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    preserveOrder: true
  })
  const xmlJson = parser.parse(svg)
  const svgs = xmlJson.filter(item => item.svg); // 解析为xml对象
  const pens: Pen[] = []
  console.log(svgs,"svgs")
  anchorsArr = []; // 锚点
  svgs.forEach((svg)=>{
    const selfProperty = svg[selfName] // 获取:@ 元信息
    console.log(selfProperty)
    allRect = transformContainerRect(selfProperty)

    // TODO 作用？暂时不知
    const isWidthLitter = allRect.width < allRect.height; // 宽小于高
    // 长边等于 40
    if (!isWidthLitter) {
      if (!selfProperty.width) {
        selfProperty.width = 40;
      }
      shapeScale = selfProperty.width / allRect.width;
      !selfProperty.height &&
      (selfProperty.height = shapeScale * allRect.height);
    } else {
      // 高小于宽
      if (!selfProperty.height) {
        selfProperty.height = 40;
      }
      shapeScale = selfProperty.height / allRect.height;
      !selfProperty.width && (selfProperty.width = shapeScale * allRect.width);
    }
    // end

    let children = svg.svg
    console.log(children,"svgChildren")
    const combinePens = transformCombines(selfProperty,children) // 将svg的多个子元素组合一起 组合为pen
    pens.push(...combinePens) //
  })
  // setAnchor(pens[0])// TODO 设置锚点
  console.log("parseSvg最终输出",pens)
  return pens
}

function transformContainerRect(mySelf: any): Rect {
  if (mySelf.viewBox) {
    const viewBox = mySelf.viewBox.split(' ');
    return {
      x: Number(viewBox[0]), // 横坐标
      y: Number(viewBox[1]), // 纵坐标
      width: Number(viewBox[2]), // 视图宽度
      height: Number(viewBox[3]), // 视图高度  // TODO 这个宽度高度与myself的width属性区别？
    };
  } else {
    return {
      x: 0,
      y: 0,
      width: parseFloat(mySelf.width),
      height: parseFloat(mySelf.height),
    };
  }
}

function cssToJson(text: string) {
  const json = {};
  const styleArr = text.split('}');
  styleArr.forEach((item) => {
    const [key, value] = item.split('{');
    // key && (json[key] = styleToJson(value));
  });
  return json;
}

// 单位转换
function dealUnit(selfProperty: any): [number, number] {
  if (String(selfProperty.width)?.endsWith('in')) {
    // 英寸
    const width = parseFloat(selfProperty.width) * 96;
    const height = parseFloat(selfProperty.height) * 96;
    return [width, height];
  }
  const width = parseFloat(selfProperty.width) || 0;
  const height = parseFloat(selfProperty.height) || 0;
  return [width, height];
}
