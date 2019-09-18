let STAGE_W = 500;
let STAGE_H = 300;

let _onFrame, _cancelFrame;
if (typeof window !== 'undefined') {
  _onFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame;

  _cancelFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
}

class Stage {
  constructor (opts) {
    this.container = opts.container;
    this.stageW = opts.stageW || STAGE_W;
    this.stageH = opts.stageH || STAGE_H;
    this.scale = opts.scale || 1;
    this.showFPS = opts.fps;
    this.backgroundColor = opts.backgroundColor || '#fff';
    this.update = opts.update;
    this.disableClearCtx = opts.disableClearCtx === undefined ? false : opts.disableClearCtx;
    console.log('disableClearCtx', this.disableClearCtx, opts);
    this.initCtx();
    if (opts.autoStart) {
      this.start();
    }
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

  start () {
    this.ctx.clearRect(0, 0, this.stageW, this.stageH);
    this.oldTimeStamp = 0;
    this.timeStart = -1;
    this.timePassed = 0;
    this.anniReq = this.onFrame((timeStamp) => this.loop(timeStamp));
  }

  loop (timeStamp) {
    if (this.timeStart === -1) {
      this.cancelFrame(this.anniReq);
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

    this.anniReq = this.onFrame((timeStamp) => this.loop(timeStamp));
  }

  onFrame (func) {
    return _onFrame(func)
  }

  cancelFrame (frame) {
    return _cancelFrame(frame)
  }
}

export default Stage
