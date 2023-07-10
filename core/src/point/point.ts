export interface Point {
  radius?: any;
  x: number
  y: number
  penId?: string
  connectTo?: string
  prev?: Point
  next?: Point
  id?:string
  anchorId?: string;

}

export function rotatePoint(pt: Point, angle: number, center: Point) {
  if (!angle || angle % 360 === 0) {
    return;
  }
  const a = (angle * Math.PI) / 180;
  const x =
    (pt.x - center.x) * Math.cos(a) -
    (pt.y - center.y) * Math.sin(a) +
    center.x;
  const y =
    (pt.x - center.x) * Math.sin(a) +
    (pt.y - center.y) * Math.cos(a) +
    center.y;
  pt.x = x;
  pt.y = y;

  pt.prev && rotatePoint(pt.prev, angle, center);
  pt.next && rotatePoint(pt.next, angle, center);
}

export function hitPoint(pt: Point, target: Point, radius = 5) {
  return (
    pt.x > target.x - radius &&
    pt.x < target.x + radius &&
    pt.y > target.y - radius &&
    pt.y < target.y + radius
  );
}
