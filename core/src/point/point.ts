export interface Point {
  x: number
  y: number
  penId?: string
  connectTo?: string
  prev?: Point
  next?: Point
}