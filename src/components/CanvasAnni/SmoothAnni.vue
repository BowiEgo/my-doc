<template>
  <div class="container" ref="container">
    <div class="brief" v-if="showBrief">
      <p>secondsPerFrame: {{ secondsPerFrame }}</p>
      <p>seconds: {{ timePassed }}</p>
      <p v-if="motionType !== 'ease'">movingSpeed: {{ movingSpeed }}</p>
      <input type="range" v-model="movingSpeed" max="200" v-if="motionType !== 'ease'"/>
      <input type="input" v-model="movingSpeed" v-if="motionType !== 'ease'"/>
      <div class="ease-select" v-if="motionType === 'ease'">
        <div class="tag">X</div>
        <select v-model="easeTrendX">
          <option :value="item" v-for="(item, index) in easeTrends" :key="index">{{ item }}</option>
        </select>
        <select v-model="easeTypeX">
          <option :value="item" v-for="(item, index) in easeTypes" :key="index">{{ item }}</option>
        </select>
        <input type="text" v-model="xBegin">
        <input type="text" v-model="xChange">
      </div>
      <div class="ease-select" v-if="motionType === 'ease'">
        <div class="tag">Y</div>
        <select v-model="easeTrendY">
          <option :value="item" v-for="(item, index) in easeTrends" :key="index">{{ item }}</option>
        </select>
        <select v-model="easeTypeY">
          <option :value="item" v-for="(item, index) in easeTypes" :key="index">{{ item }}</option>
        </select>
        <input type="text" v-model="yBegin">
        <input type="text" v-model="yChange">
      </div>
      <input type="text" v-model="duration" v-if="motionType === 'ease'">
      <button @click="startAnni">start</button>
    </div>
  </div>
</template>

<script>
import Stage from './Stage';
import Ease from './ease';

export default {
  name: 'CanvasAnni',

  data () {
    return {
      stage: null,
      stageW: 500,
      stageH: 300,
      rectX: 0,
      rectY: 0,
      movingSpeed: 150,
      secondsPerFrame: 0,
      timePassed: 0,
      easeTypeX: 'Quad',
      easeTypeY: 'Quad',
      easeTrendX: 'In',
      easeTrendY: 'In',
      easeTypes: [
        'Quad',
        'Sine',
        'Expo',
        'Circ',
        'Cubic',
        'Quart',
        'Quint',
        'Bounce',
      ],
      easeTrends: [
        'In',
        'Out',
        'InOut'
      ],
      xBegin: 0,
      yBegin: 0,
      xChange: 500,
      yChange: 300,
      duration: 2
    }
  },

  props: {
    motionType: {
      type: String,
      default: 'ease'
    },
    clearCtx: {
      type: Boolean,
      default: true
    },
    autoStart: {
      type: Boolean,
      default: false
    },
    showFps: {
      type: Boolean,
      default: true
    },
    showBrief: {
      type: Boolean,
      default: true
    },
    loop: {
      type: Boolean,
      default: true
    }
  },

  mounted () {
    this.movingSpeed = this.movingSpeed;

    this.stage = new Stage({
      stageW: this.stageW,
      stageH: this.stageH,
      container: this.$refs.container,
      fps: this.showFps,
      autoStart: this.autoStart,
      disableClearCtx: !this.clearCtx,
      update: (timePassed, secondsPerFrame) => {
        this.update(timePassed, secondsPerFrame);
      }
    });
  },

  methods: {
    startAnni () {
      this.rectX = this.xBegin;
      this.rectY = this.yBegin;
      this.stage.start();
    },

    update (timePassed, secondsPerFrame) {
      this.secondsPerFrame = secondsPerFrame.toFixed(6);
      this.timePassed = timePassed.toFixed(0);

      if (this.motionType !== 'ease') {
        if (this.rectX > this.stageW || this.rectY > this.stageH) {
          if (this.loop) {
            this.startAnni();
            return
          }
        }
      } else {
        if (timePassed > this.duration) {
          if (this.loop) {
            this.startAnni();
            return
          }
        }
      }

      // linear
      if (this.motionType === 'linear') {
        this.rectX++;
        this.rectY++;
        this.drawRect(this.rectX, this.rectY);
        return
      }

      // linear with speed
      if (this.motionType === 'linearWithSpeed') {
        // this.rectX ++;
        // this.rectY ++;
        this.rectX += (this.movingSpeed * secondsPerFrame);
        this.rectY += (this.movingSpeed * secondsPerFrame);
        this.drawRect(this.rectX, this.rectY);
        return
      }

      // ease
      let easeFuncX = `ease${this.easeTrendX}${this.easeTypeX}`;
      let easeFuncY = `ease${this.easeTrendY}${this.easeTypeY}`;
      let paramsX = [timePassed, this.xBegin, this.xChange, this.duration];
      let paramsY = [timePassed, this.yBegin, this.yChange, this.duration];
      if (this.easeTypeX === 'Bounce') {
        paramsX.unshift(1);
      }
      if (this.easeTypeY === 'Bounce') {
        paramsY.unshift(1);
      }
      this.rectX = Ease[easeFuncX].apply(null, paramsX);
      this.rectY = Ease[easeFuncY].apply(null, paramsY);

      this.drawRect(this.rectX, this.rectY);
    },

    drawRect (rectX, rectY) {
      const { ctx } = this.stage;

      ctx.fillStyle = '#ff8080';
      ctx.fillRect(rectX, rectY, 150, 100);
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  position relative
  display flex
  // flex-wrap wrap

.brief
  position absolute
  // width 220px
  top 40px
  left 560px

p
  line-height 16px
  padding 0

button
  margin 10px 0
  width 100px
  height 40px
  display block

select
  margin 10px 10px 10px 0

.ease-select
  display flex
  align-items center
  input[type=text]
    width 50px
    margin-right 10px

.tag
  display inline-block
  margin-right 10px
  width 30px
  height 18px
  line-height 18px
  font-size 14px
  text-align center
  background-color #333
  border-radius 2px
  color #fff
</style>

