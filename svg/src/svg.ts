import { Pen } from "core/src/pen"
import { XMLParser } from "fast-xml-parser";

// 解析svg
export function parseSvg(svg:string):Pen[]{
  const parser:XMLParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    preserveOrder: true
  })
  const xmlJson = parser.parse(svg)
  console.log(xmlJson)
  return xmlJson
}