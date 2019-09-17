let STAGE_W = 500;
let STAGE_H = 300;


class Stage {
  constructor (opts) {
    this.container = opts.container;
    this.stageW = opts.stageW || STAGE_W;
    this.stageH = opts.stageH || STAGE_H;
    this.scale = opts.scale || 1;
    this.showFPS = opts.fps;
    this.backgroundColor = opts.backgroundColor || '#fff';
    this.update = opts.update;
    this.oldTimeStamp = 0;
    this.timeStart = 0;
    this.timePassed = 0;
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

  start () {
    if (this.anniReq) {
      window.cancelAnimationFrame(this.anniReq);
    }
    this.oldTimeStamp = 0;
    this.timeStart = 0;
    this.timePassed = 0;
    this.anniReq = window.requestAnimationFrame((timeStamp) => this.loop(timeStamp));
  }

  loop (timeStamp) {
    if (this.timeStart === 0) {
      this.timeStart = timeStamp;
      this.anniReq = window.requestAnimationFrame((timeStamp) => this.loop(timeStamp));
      return;
    }
    let secondsPerFrame = (timeStamp - this.timeStart - this.oldTimeStamp) / 1000;
    this.oldTimeStamp = timeStamp - this.timeStart;
    this.timePassed += secondsPerFrame;
    console.log('loop', timeStamp, this.timeStart, this.oldTimeStamp, secondsPerFrame);

    let fps = Math.round(1 / secondsPerFrame);
    this.ctx.clearRect(0, 0, this.stageW, this.stageH);

    // console.log(this.timePassed, timeStamp, this.secondsPerFrame);
    this.update(this.timePassed, secondsPerFrame);

    if (this.showFPS) {
      this.ctx.font = '25px Arial';
      this.ctx.fillStyle = 'black';
      this.ctx.fillText("FPS: " + fps, 10, 30);
    }

    this.anniReq = window.requestAnimationFrame((timeStamp) => this.loop(timeStamp));
  }
}

export default Stage
