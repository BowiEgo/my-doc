## 创建平滑的Canvas动画

### 初始化画布
``` javascript
class Stage {
  constructor (opts) {
    this.container = opts.container;
    this.stageW = opts.stageW || 500;
    this.stageH = opts.stageH || 500;
    this.scale = opts.scale || 1;
    this.backgroundColor = opts.backgroundColor || '#fff';
    this.initCtx();
  }

  initCtx () {
    this.canvasEl = document.createElement('canvas');
    this.canvasEl.width = this.stageW * this.scale;
    this.canvasEl.height = this.stageH * this.scale;
    this.canvasEl.style.width = this.stageW + 'px';
    this.canvasEl.style.height = this.stageH + 'px';
    this.canvasEl.style.border = '1px solid #eee';
    this.canvasEl.style.backgroundColor = '#fff';
    this.container.append(this.canvasEl);
    this.ctx = this.canvasEl.getContext('2d');
    this.ctx.scale(this.scale, this.scale);
  }
}
```

### 在画布上动态绘制物体
先从最简单的画条线来接触一下D3绘图的方式

``` javascript
function draw() {
  context.fillStyle = '#ff8080';
  context.fillRect(rectX, rectY, 150, 100);
}
```
<canvas-anni></canvas-anni>
