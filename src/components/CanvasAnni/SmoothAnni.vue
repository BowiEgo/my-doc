<template>
  <div class="container" ref="container">
    <div class="brief">
      <p>secondsPerFrame: {{ secondsPerFrame }}</p>
      <p>seconds: {{ timePassed }}</p>
      <p>movingSpeed: {{ movingSpeed }}</p>
      <button @click="startAnni">start</button>
    </div>
  </div>
</template>

<script>
import Stage from './Stage';
import Ease from './ease';

let STAGE_W = 500;
let STAGE_H = 300;
let RECT_X = 0;
let RECT_Y = 0;
let MOVING_SPEED = 50;

export default {
  name: 'CanvasAnni',

  data () {
    return {
      stage: null,
      secondsPerFrame: 0,
      movingSpeed: 50,
      timePassed: 0
    }
  },

  props: {
    type: {
      type: String,
      default: 'curve'
    },
    xAxis: {
      type: Array,
      default: () => []
    }
  },

  mounted () {
    this.movingSpeed = MOVING_SPEED;
    this.stage = new Stage({
      stageW: STAGE_W,
      stageH: STAGE_H,
      container: this.$refs.container,
      fps: true,
      update: (timePassed, secondsPerFrame) => {
        this.update(timePassed, secondsPerFrame);
      }
    });
  },

  methods: {
    startAnni () {
      this.stage.start();
    },

    update (timePassed, secondsPerFrame) {
      this.secondsPerFrame = secondsPerFrame.toFixed(6);
      this.timePassed = timePassed.toFixed(0);

      if (RECT_X > STAGE_W || RECT_Y > STAGE_H) {
        RECT_X = 0;
        RECT_Y = 0;
        console.log('>>>>>>>>>>>>', RECT_X, RECT_Y, timePassed);
        this.stage.start();
        return;
      }
      // linear
      // RECT_X += (MOVING_SPEED * secondsPerFrame);
      // RECT_Y += (MOVING_SPEED * secondsPerFrame);

      // ease
      RECT_X = Ease.easeLinear(timePassed, 0, 500, 2);
      RECT_Y = Ease.easeLinear(timePassed, 0, 300, 2);

      // console.log(timePassed, RECT_Y, RECT_Y > STAGE_H);
      this.drawRect(RECT_X, RECT_Y);
    },

    drawRect (rectX, rectY) {
      const { ctx } = this.stage;

      ctx.fillStyle = '#ff8080';
      ctx.fillRect(rectX, rectY, 150, 100);
    }

  }
}
</script>

<style lang="stylus">
.container
  position relative
  display flex
  flex-wrap wrap

.brief
  position absolute
  width 220px
  top 40px
  right 40px
</style>

