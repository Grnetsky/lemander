export function createOffScreen() {
  try {
    const offscreen = new OffscreenCanvas(0, 0);  // 离屏canvans 实验中的新特性 用于提高canvas渲染效率 缓冲区
    const context = offscreen.getContext('2d'); // 2d渲染
    if (context && context.arc) {
      return offscreen;
    }
    return document.createElement('canvas');
  } catch (e) {
    return document.createElement('canvas');
  }
}
