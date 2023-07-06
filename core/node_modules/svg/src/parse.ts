// 解析svg的path 命令
import { Rect } from "core"

// 正则

const numberRegex =
  /^[+-]?(([0-9]*\.[0-9]+)|([0-9]+\.)|([0-9]+))([eE][+-]?[0-9]+)?/;
const flagRegex = /^[01]/;
const commandRegex = /^[\t\n\f\r ]*([MLHVZCSQTAmlhvzcsqta])[\t\n\f\r ]*/; // d命令 正则
const commaWsp = /^(([\t\n\f\r ]+,?[\t\n\f\r ]*)|(,[\t\n\f\r ]*))/;

// svg d语法
const grammar: { [key: string]: RegExp[] } = {
  M: [numberRegex, numberRegex],
  L: [numberRegex, numberRegex],
  H: [numberRegex],
  V: [numberRegex],
  Z: [],
  C: [
    numberRegex,
    numberRegex,
    numberRegex,
    numberRegex,
    numberRegex,
    numberRegex,
  ],
  S: [numberRegex, numberRegex, numberRegex, numberRegex],
  Q: [numberRegex, numberRegex, numberRegex, numberRegex],
  T: [numberRegex, numberRegex],
  A: [
    numberRegex,
    numberRegex,
    numberRegex,
    flagRegex,
    flagRegex,
    numberRegex,
    numberRegex,
  ],
};

// 获取矩形外框尺寸
export function getRect(command: SvgPath): Rect {
  let x = Infinity // 默认位置为无穷
  let y = Infinity
  let ex = -Infinity // end x
  let ey = -Infinity
  calcWorldPositions(command) // 给command添加计算worldPoints属性

  // command： {commands:[{key:命令,values：[原始位置信息],relative：是否为相对位置,worldPoints:[转换后位于画布位置]}]}
  command.commands.forEach((item)=>{
    item.worldPoints.forEach((num,index)=>{
      // X位置项 （注意index从0开始计数）
      if(index % 2 === 0){ // x TODO 为什么用余数的形式俩判断是哪个坐标？？
        if(num < x){
          x = num
        }
        if(num >ex){
          ex = num
        }
      }else {
        if(num < y){
          y = num
        }
        if(num > ey){
          ey = num
        }
      }
    })
  })
  //TODO 为什么要自减？ 不自减会怎样？ 可能与框选边框有关 精确框选边框
  --x
  --y
  return {
    x,
    y,
    ex,
    ey,
    width: ex - x + 1,
    height: ey - y + 1
  }
}

// 解析命令 type M path: M123 321 ....   cursor: 0 // TODO 待深度研究
function parseCommands(type: string, path: string, cursor: number): {
  cursor: number
  commands: SvgCommand[]
}{
  const expectedRegexList = grammar[type.toUpperCase()] //变大写 ->返回对应的正则数组 [numberRegex,...]

  const commands: SvgCommand[] = [] // 声明解析后的命令列表
  while(cursor <= path.length){  // 循环遍历命令
    const command: SvgCommand = { key:type, values: [] } // 声明转换后命令格式
    // 正则匹配
    for (const regex of expectedRegexList){ // 匹配正则 原命令是否有效
      const match = path.slice(cursor).match(regex)
      if(match !==null ){
        command.values.push(+match[0])
        cursor += match[0].length // 游标更新
        const ws = path.slice(cursor).match(commaWsp);
        if (ws !== null) {
          cursor += ws[0].length;
        }
      }else if (command.values.length === 0) {
        return { cursor, commands };
      }else{
        throw new Error("死循环")
      }
    }
    command.relative = command.key.toUpperCase() !== command.key
    commands.push(command)
    if(expectedRegexList.length === 0){
      return { cursor, commands }
    }
    if( type === 'm')type = 'l'
    if(type === 'M')type = 'L'
  }
  throw new Error('malformed path (first error at ' + cursor + ')');
}

//path: "M1072.416701 6.472819c-19.159545 7.50847-38.40971 9.670392-57.737548 6.47282a4.582756 4.582756 0 0 0-3.961365"
export function parseSvgPath (path:string): SvgPath {
  const commands: SvgCommand[] = [] // commands list
  let cursor = 0 // 游标
  while (cursor < path.length){ // 指针循环查找
    const match = path.slice(cursor).match(commandRegex)
    if(match !== null){
      const type = match[1]
      cursor += match[0].length
      const parser = parseCommands(type, path, cursor);
      cursor = parser.cursor;
      commands.push(...parser.commands)
    }else {
      throw new Error('malformed path (first error at ' + cursor + ')');
    }
  }
  return { commands }
}


// 计算坐标点
function calcWorldPoints(command: SvgCommand, previous: SvgCommand) {
  const worldPoints :number[] = [] // 定义全局坐标点
  // 根据是否为相对定位和是否有前一个点来绝对命令位置
  let current = command.relative && previous ? {
    x: previous.worldPoints[previous.worldPoints.length - 2],
    y: previous.worldPoints[previous.worldPoints.length - 1]
  }:{x:0, y:0}
  // 将位置信息同步更新到svgCommand的属性中
  for (let i = 0; i < command.values.length - 1; i += 2) {
    worldPoints.push(current.x + command.values[i]);
    worldPoints.push(current.y + command.values[i + 1]);
  }
  command.worldPoints = worldPoints;
}

// 计算元素在图纸上的坐标信息
export function calcWorldPositions( command: SvgPath ){
  console.log(command,"path")
  let previous: SvgCommand  // 前一个点的坐标 用于相对定位
  let x = 0 // 初始x坐标
  let y = 0 // 初始y坐标
  command.commands.forEach((item)=> {
    switch (item.key){
      // z 关闭路径
      case 'Z':
      case 'z':
        item.worldPoints = [x,y];
        break
      // 水平线
        // 绝对
      case 'H':
        item.worldPoints = [
          item.values[0],
          previous.worldPoints[previous.worldPoints.length - 1]
        ]
        break
        // 相对
      case 'h':
        item.worldPoints = [
          item.values[0]+previous.worldPoints[previous.worldPoints.length - 2],
          previous.worldPoints[previous.worldPoints.length - 1]
        ]
        break
      // 垂直线
        // 绝对
      case 'V':
        item.worldPoints = [
          previous.worldPoints[previous.worldPoints.length - 2],
          item.values[0]
        ]
        break
        // 相对
      case 'v':
        item.worldPoints = [
          previous.worldPoints[previous.worldPoints.length - 2],
          item.values[0] + previous.worldPoints[previous.worldPoints.length - 1],
        ]
        break
      case 'A':
        item.worldPoints = [
          previous.worldPoints[previous.worldPoints.length - 2],
          item.values[0] +
          previous.worldPoints[previous.worldPoints.length - 1],
        ];
        break
      default:
        calcWorldPoints(item, previous)
        break
    }

    if (
      item.key === 'M' ||
      item.key === 'm' ||
      item.key === 'Z' ||
      item.key === 'z'
    ) {
      x = item.worldPoints[item.worldPoints.length - 2];
      y = item.worldPoints[item.worldPoints.length - 1];
    }
    previous = item;
  })
}

export interface SvgCommand {
  key: string;
  values: number[];
  relative?: boolean;
  worldPoints?: number[]; // 图纸上具体坐标
}

export interface SvgPath {
  commands?: SvgCommand[];
}


export function pathToString(path: SvgPath): string {
  let text = '';

  path.commands.forEach((item) => {
    text += item.key + ' ';
    item.values.forEach((num) => {
      text += num + ' ';
    });
  });
  return text;
}