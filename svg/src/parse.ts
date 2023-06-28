// 解析svg的path 命令


// 正则
import {valueOf} from "offscreencanvas";

const numberRegex =
  /^[+-]?(([0-9]*\.[0-9]+)|([0-9]+\.)|([0-9]+))([eE][+-]?[0-9]+)?/;
const flagRegex = /^[01]/;
const commandRegex = /^[\t\n\f\r ]*([MLHVZCSQTAmlhvzcsqta])[\t\n\f\r ]*/; // d命令 正则
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

// 解析命令
function parseCommands(type: string, path: string, cursor: number): {
  cursor: number
  commands: SvgCommand
}{
  const expectedRegexList = grammar[type.toUpperCase()] //变大写
  const commands: SvgCommand[] = []
  while(cursor < path.length){
    const command :SvgCommand = {key:type,values:[]}
    // 正则匹配
    for (const regex of expectedRegexList){
      const match = path.slice(cursor).match(regex)
      if(match){
        command.values.push(+match[0]) // TODO 这个加号？
        cursor += match[0].length // 游标更新
      }else{
        throw new Error("死循环")
      }
    }
  }
  return {cursor:10,commands:{key:"1",values:[1,2]}}
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
      console.log(type,"command",cursor)

      const parser = parseCommands(type, path, cursor);
      cursor = parser.cursor;
      commands.push(...parser.commands)
    }else {
      throw new Error('malformed path (first error at ' + cursor + ')');
    }
  }
  return { commands }
}

export interface SvgCommand {
  key: string;
  values: number[];
  relative?: boolean;
  worldPoints?: number[];
}

export interface SvgPath {
  commands?: SvgCommand[];
}
