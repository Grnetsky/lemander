// 解析svg的path 命令


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

// 解析命令 type M path: M123 321 ....   cursor: 0 // TODO 待深度研究
function parseCommands(type: string, path: string, cursor: number): {
  cursor: number
  commands: SvgCommand[]
}{
  const expectedRegexList = grammar[type.toUpperCase()] //变大写 ->返回对应的正则数组 [numberRegex,...]

  const commands: SvgCommand[] = [] // 声明解析后的命令列表
  while(cursor <= path.length){  // 循环遍历命令
    const command :SvgCommand = { key:type, values: [] } // 声明转换后命令格式
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

export interface SvgCommand {
  key: string;
  values: number[];
  relative?: boolean;
  worldPoints?: number[];
}

export interface SvgPath {
  commands?: SvgCommand[];
}
