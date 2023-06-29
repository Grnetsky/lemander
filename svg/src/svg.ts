import { XMLParser } from "fast-xml-parser"; // https://github.com/NaturalIntelligence/fast-xml-parser
import {Rect, Pen, s8} from "core"
import {parseSvgPath} from "./parse";
const selfName = ':@';
let anchorsArr = []
let shapeScale: number; // 图形缩小比例
let allRect: Rect
const contentProp = '#text';

  // ？
function setStyle(filter: any) {
  filter.forEach(()=>{
    if(filter.style && filter.style[0]){
    let   style = cssToJson(filter.style[0][contentProp]);
    }
  })
}

function getRect(command: SvgPath) {
  
}

// 根据path渲染
function transformPath(path, pen: Pen | Pen[]) {
  let d = path.d  // 获取命令
  if(!d)return
  let command = parseSvgPath(d) // 根据path命令生成自有命令
  console.log(command)
  let rect = getRect(command)  //根据命令生成矩形

  return undefined;
}

function transformNormalShape(
  childProperty: any,
  parentProperty,
  parentId: string
) {
  return undefined;
}

// TODO 将多个children组合在一起  实现绑定 不完整
function transformCombines(selfProperty: any, children: any[]): Pen[] {
  const pens:Pen[] =[]
  const [width, height] = [selfProperty.width, selfProperty.height]
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
  pens.push(combinePen)
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
      setStyle({style: child.style})
    }else if(childProperty){
      //
      pen = transformNormalShape(childProperty, selfProperty, combinePen.id)
      // 根据不同类型进行渲染
      if(child.path){
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

      }
    }
  })
  return
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
     transformCombines(selfProperty,children) // 将svg的多个子元素组合一起 组合为pen

  })
  return xmlJson
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