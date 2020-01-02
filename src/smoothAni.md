## 创建平滑的Canvas动画

### 初始化画布
``` javascript
class Stage {
  constructor (opts) {
    this.container = opts.container;
    this.stageW = opts.stageW || STAGE_W;
    this.stageH = opts.stageH || STAGE_H;
    this.scale = opts.scale || 1;
    this.showFPS = opts.fps;
    this.backgroundColor = opts.backgroundColor || '#fff';
    this.update = opts.update;
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
draw()方法绘制了一个矩形，参数rectX, rectY分别代表矩形左上角顶点在画布中点位置（xy值），当不断传入不同当rectX，rectY值就能让矩形动起来。

``` javascript
function draw(rectX, rectY) {
  context.fillStyle = '#ff8080';
  context.fillRect(rectX, rectY, 150, 100);
}
```
用window.requestAnimationFrame()方法来告诉向浏览器我需要绘制动画的下一帧。在回调函数loop()中再次调用window.requestAnimationFrame()，以让浏览器自动继续更新绘制。回调函数执行次数通常与浏览器屏幕刷新次数相匹配，所以通常动画的刷新率会是每秒60次。回调函数接loop()收到一个时间戳DOMHighResTimeStamp，它表示window.requestAnimationFrame()开始去执行回调函数loop()的时刻。
``` javascript
class Stage {
  ...
  loop (timeStamp) {
    this.update();
    window.requestAnimationFrame(this.loop);
  }
}
```
为保证不同浏览器一致，对window.requestAnimationFrame()的兼容性写法进行封装。
``` javascript
let _onFrame, _cancelFrame;
if (typeof window !== 'undefined') {
  _onFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame;

  _cancelFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
}

class Stage {
  ...
  loop (timeStamp) {
    this.update();
    this.aniReq = this.onFrame((timeStamp) => this.loop(timeStamp));
  }

  onFrame (func) {
    return _onFrame(func)
  }

  cancelFrame (frame) {
    return _cancelFrame(frame)
  }
}
```

创建一个vue组件来使用刚定义的Stage。属性update传入一个更新和绘制的函数用来给Stage的loop()调用。
``` javascript
// Smoothani.vue
let rectX = 0;
let rectY = 0;

this.stage = new Stage({
  stageW: STAGE_W,
  stageH: STAGE_H,
  container: this.$refs.container,
  update: () => {
    this.update();
    this.drawRect(rectX, rectY);
  }
});

methods: {
  update () {
    rectX ++;
    rectY ++;
  }
}
```
### 何时更新物体的状态（位置）
update()方法是一个最简单的更新这个方块状态的方法，动画每一帧都会在loop()中触发update()，然后给方块的在画布中的坐标值加1。所以确保在draw()之前更新物体状态，就能持续在Canvas画布上绘制最新状态的物体。如下图：

<image-card :source="'/images/smooth-ani-01.png'" :width=600></image-card>

### 物体残影
我们本该期望看到一个物体以一条直线的轨迹从画布左上角移动到右下角，可是接下来看到是这样的：
<canvas-ani :motion-type="'linear'" :auto-start=true :show-brief=false :clearCtx=false :show-fps=false :loop=false></canvas-ani>
什么鬼？看起来像是出现了无数个方块，所以形成了一条残影形成的轨迹。原因很简单，我们不断绘制方块，而没有擦除上一帧的方块。

### 绘制前清空画布
解决的方法很简单，在每一帧绘制之前，擦除上一帧就可以了。
``` javascript
class Stage {
  ...
  loop (timeStamp) {
    this.ctx.clearRect(0, 0, this.stageW, this.stageH);
    this.update();
    window.requestAnimationFrame(this.loop);
  }
}
```
clearRect()是Canvas 2D API 设置指定矩形区域内（以 点 (x, y) 为起点，范围是(width, height) ）所有像素变成透明，并擦除之前绘制的所有内容的方法。

<image-card :source="'/images/smooth-ani-02.png'" :width=600></image-card>

当我们再次运行，看起来就正常了。
<canvas-ani :motion-type="'linear'" :auto-start=true :show-brief=false :show-fps=false :loop=false></canvas-ani>

### 计算动画的帧率
现在我们这个看起来很简单的动画已经可以很顺滑的运行在不同的设备。但如果我们的动画很多而且变得复杂起来，我们的设备可能会处理不过来然后造成拖慢和延迟，然后当性能恢复的时候速度又变的快了起来。这肯定不是我们想要的结果，所以如果我们想要让物体保持一个稳定的速度运动，不受当前设备的性能造成帧率的变化影响。那么该怎么做呢。

首先让我们实时计算出当前动画的帧率，然后显示到画布上。

``` javascript
let oldTimeStamp = 0;

loop (timeStamp) {
  let secondsPerFrame = (timeStamp - oldTimeStamp) / 1000;
  let fps = Math.round(1 / secondsPerFrame);

  this.ctx.clearRect(0, 0, this.stageW, this.stageH);
  this.update();

  if (this.showFPS) {
    this.ctx.font = '25px Arial';
    this.ctx.fillStyle = 'black';
    this.ctx.fillText("FPS: " + fps, 10, 30);
  }

  this.aniReq = this.onFrame((timeStamp) => this.loop(timeStamp));
}
```
运行代码看一下效果：
<canvas-ani :motion-type="'linear'" :auto-start=true :show-brief=false :showFps=true :loop=false></canvas-ani>
看起来我们的动画一般维持在60fps（frames per second)的帧率上，当我们切换浏览器标签页、打开控制台等操作的时候，可以明显看到这个数字抖动，因为这时候浏览器为了节省性能会减少requestAnimationFrame回调函数的触发。

### 维持物体运动速度
体育老师教过我们，物体的速度等于运动距离/运动时间，反过来当我们知道一个物体的速度，就可以求出它当前运动率多少距离。那么这个运动时间怎么计算呢？观察上面的代码，我们定义了一个oldTimeStamp，用来计算当前帧到上一帧间隔的时间，那么我们就可以用这个时间计算出每一帧物体所需要改变的距离。将这个secondsPerFrame传递给update()。
``` javascript
// Stage.js

loop (timeStamp) {
  let secondsPerFrame = (timeStamp - oldTimeStamp) / 1000;
  ...
  this.update(secondsPerFrame);
  ...
}

// Smoothani.vue
const MOVING_SPEED = 50;

this.stage = new Stage({
  stageW: STAGE_W,
  stageH: STAGE_H,
  container: this.$refs.container,
  update: (secondsPerFrame) => {
    this.update(secondsPerFrame);
    this.drawRect(rectX, rectY);
  }
});

methods: {
  update (secondsPerFrame) {
    rectX += (MOVING_SPEED * secondsPerFrame);
    rectY += (MOVING_SPEED * secondsPerFrame);
  }
}
```
<canvas-ani :motion-type="'linearWithSpeed'" :auto-start=true :show-brief=true :show-fps=true :loop=false></canvas-ani>

当我们当动画运行在60fps,也就是每绘制一帧间隔基本在0.0167 s，这也就意味着，如果你想让物体每秒移动50 pixels，你需要将50乘以与上一帧间隔当秒数，60fps下也就是物体将会每秒移动0.845 pixels，也就是update()所做的处理。

如此以来，无论动画的是运行在怎样的帧率之下，物体都将以一个我们可以控制的速度去移动。当然，如果帧率过低，会造成跳帧的现象。

### 给动画加上缓动

#### 计算动画经过时间
如果将timePassed(经过时间)与secondsPerFrame(每单一帧经过时间)累加，那么我们可以得到动画当前经过的时间。

``` javascript
// Stage.js
let timePassed = 0;

loop (timeStamp) {
  let secondsPerFrame = (timeStamp - oldTimeStamp) / 1000;
  let fps = Math.round(1 / secondsPerFrame);

  timePassed += secondsPerFrame;
  oldTimeStamp = timeStamp;

  this.update(this.timePassed, secondsPerFrame);

  this.aniReq = this.onFrame((timeStamp) => this.loop(timeStamp));
}
```
如果我们想让动画重新开始，就会遇到一个问题。
因为timeStamp是一个从[time origin](http://developr.mozilla.org)之后到当前调用经过的时间，它的变化并不会因为window.cancelAnimationFrame。那么如果仅仅重置oldTimeStamp，我们得到的secondsPerFrame会不准确。如果不重置那么在重新开始的时候又无法取消当前帧的回调，会使得之前的回调继续持续触发。我们改良一下代码：

``` javascript
// Stage.js

start () {
  this.ctx.clearRect(0, 0, this.stageW, this.stageH);
  this.timeStart = -1;
  this.timePassed = 0;
  this.aniReq = this.onFrame((timeStamp) => this.loop(timeStamp));
}

loop (timeStamp) {
  if (this.timeStart === -1) {
    this.cancelFrame(this.aniReq);
    this.timeStart = timeStamp - 1;
  }

  let secondsPerFrame = (timeStamp - this.timeStart) / 1000;
  let fps = Math.round(1 / secondsPerFrame);

  this.timePassed += secondsPerFrame;
  this.timeStart = timeStamp;
  if (!this.disableClearCtx) {
    this.ctx.clearRect(0, 0, this.stageW, this.stageH);
  }
  this.update(this.timePassed, secondsPerFrame);

  if (this.showFPS) {
    this.ctx.font = '25px Arial';
    this.ctx.fillStyle = 'black';
    this.ctx.fillText("FPS: " + fps, 10, 30);
  }

  this.aniReq = this.onFrame((timeStamp) => this.loop(timeStamp));
}
```

#### 缓动函数
现在我们把时间timePassed当作因子，就可以做更有趣一点的事。对于所有的缓动函数，都需要传入四个参数，分别代表t = time (当前时间), b = beginning value (初始值), c = change in value (变化值), d = duration (总时间)。时间可以是帧数，秒数或者毫秒数。
接下来看一个简单的线性缓动函数：
``` javascript
function easeLinear (t, b, c, d) {
  return c * t / d + b;
}
```
你可以用这个函数去计算物体运动被平滑后的位置（线性缓动严格来说不是一个真正的缓动，因为它是线性变化的，这里举例是因为更容易理解）。只要你不断输入新的时间点，缓动函数就能不断的输出一个结果，比如不断调用绘制的loop()函数。更不用说可以得到一个精确时间点的精确位置。

常见的缓动函数：
``` javascript
// Linear motion
function easeLinear (t, b, c, d) {
  return c * t / d + b;
}

// Quadratic easing in
function easeInQuad (t, b, c, d) {
  return c * (t /= d) * t + b;
}

// Quadratic easing out
function easeOutQuad (t, b, c, d) {
  return -c * (t /= d) * (t - 2) + b;
}

// Quadratic easing in and out
function easeInOutQuad (t, b, c, d) {
  if ((t /= d / 2) < 1) return c / 2 * t * t + b;
  return -c / 2 * ((--t) * (t - 2) - 1) + b;
}

// 较缓
// Sinusoidal easing in
function easeInSine (t, b, c, d) {
  return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
}

// Sinusoidal easing out
function easeOutSine (t, b, c, d) {
  return c * Math.sin(t / d * (Math.PI / 2)) + b;
}

// Sinusoidal easing in and out
function easeInOutSine (t, b, c, d) {
  return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
}

// Exponential easing in
function easeInExpo (t, b, c, d) {
  return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
}

// Exponential easing out
function easeOutExpo (t, b, c, d) {
  return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
}

// Exponential easing in and out
function easeInOutExpo (t, b, c, d) {
  if (t == 0) return b;
  if (t == d) return b + c;
  if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
  return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
}

// 较迅速
// Circular easing in
function easeInCirc (t, b, c, d) {
  return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
}

// Circular easing out
function easeOutCirc (t, b, c, d) {
  return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
}

// Circular easing in and out
function easeInOutCirc (t, b, c, d) {
  if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
  return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
}

// Cubic easing in
function easeInCubic (t, b, c, d) {
  return c * (t /= d) * t * t + b;
}

// Cubic easing out
function easeOutCubic (t, b, c, d) {
  return c * ((t = t / d - 1) * t * t + 1) + b;
}

// Cubic easing in and out
function easeInOutCubic (t, b, c, d) {
  if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
  return c / 2 * ((t -= 2) * t * t + 2) + b;
}

// Quartic easing in
function easeInQuart (t, b, c, d) {
  return c * (t /= d) * t * t * t + b;
}

// Quartic easing out
function easeOutQuart (t, b, c, d) {
  return -c * ((t = t / d - 1) * t * t * t - 1) + b;
}

// Quartic easing in and out
function easeInOutQuart (t, b, c, d) {
  if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
  return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
}

// Quintic easing in
function easeInQuint (t, b, c, d) {
    return c * (t /= d) * t * t * t * t + b;
}

// Quintic easing out
function easeOutQuint (t, b, c, d) {
  return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
}

// Quintic easing in and out
function easeInOutQuint (t, b, c, d) {
  if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
  return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
}

```
[缓动效果](https://easings.net/)

<canvas-ani :motion-type="'ease'" :auto-start=true :show-brief=true :show-fps=true :log=false></canvas-ani>


