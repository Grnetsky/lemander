export enum HoverType {
  None,
  NodeAnchor,
  LineAnchor,
  Resize,
  Rotate,
  Line,
  Node,
  LineAnchorPrev,
  LineAnchorNext
}

// 默认画线函数
export const defaultDrawLineFns = ['curve', 'polyline', 'line'];
