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
      <div class="ease-select" v-if="motionType === 'ease'">
        <div class="tag">W</div>
        <select v-model="easeTrendW">
          <option :value="item" v-for="(item, index) in easeTrends" :key="index">{{ item }}</option>
        </select>
        <select v-model="easeTypeW">
          <option :value="item" v-for="(item, index) in easeTypes" :key="index">{{ item }}</option>
        </select>
        <input type="text" v-model="wBegin">
        <input type="text" v-model="wChange">
      </div>
      <div class="ease-select" v-if="motionType === 'ease'">
        <div class="tag">H</div>
        <select v-model="easeTrendH">
          <option :value="item" v-for="(item, index) in easeTrends" :key="index">{{ item }}</option>
        </select>
        <select v-model="easeTypeH">
          <option :value="item" v-for="(item, index) in easeTypes" :key="index">{{ item }}</option>
        </select>
        <input type="text" v-model="hBegin">
        <input type="text" v-model="hChange">
      </div>
      <input type="text" v-model="duration" v-if="motionType === 'ease'">
      <button @click="startAni">start</button>
    </div>
  </div>
</template>

<script>
import Stage from './Stage';
import Ease from './ease';

export default {
  name: 'CanvasAni',

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
      easeTypeW: 'Quad',
      easeTypeH: 'Quad',
      easeTrendX: 'In',
      easeTrendY: 'In',
      easeTrendW: 'In',
      easeTrendH: 'In',
      easeTypes: [
        'Quad',
        'Sine',
        'Expo',
        'Circ',
        'Cubic',
        'Quart',
        'Quint',
        'Bounce',
        'Elastic'
      ],
      easeTrends: [
        'In',
        'Out',
        'InOut'
      ],
      xBegin: 0,
      yBegin: 0,
      wBegin: 150,
      hBegin: 100,
      xChange: 500,
      yChange: 300,
      wChange: 0,
      hChange: 0,
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
    },
    log: {
      type: Boolean,
      default: false
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
    startAni () {
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
            this.startAni();
            return
          }
        }
      } else {
        if (timePassed > this.duration + 1) {
          if (this.loop) {
            this.startAni();
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
      let easeFuncW = `ease${this.easeTrendW}${this.easeTypeW}`;
      let easeFuncH = `ease${this.easeTrendH}${this.easeTypeH}`;
      let paramsX = [timePassed, Number(this.xBegin), Number(this.xChange), this.duration];
      let paramsY = [timePassed, Number(this.yBegin), Number(this.yChange), this.duration];
      let paramsW = [timePassed, Number(this.wBegin), Number(this.wChange), this.duration];
      let paramsH = [timePassed, Number(this.hBegin), Number(this.hChange), this.duration];
      if (this.easeTypeX === 'Bounce' || this.easeTypeX === 'Elastic') {
        paramsX.unshift(1);
      }
      if (this.easeTypeY === 'Bounce' || this.easeTypeY === 'Elastic') {
        paramsY.unshift(1);
      }
      if (this.easeTypeW === 'Bounce' || this.easeTypeW === 'Elastic') {
        paramsW.unshift(1);
      }
      if (this.easeTypeH === 'Bounce' || this.easeTypeH === 'Elastic') {
        paramsH.unshift(1);
      }
      this.rectX = Ease[easeFuncX].apply(null, paramsX);
      this.rectY = Ease[easeFuncY].apply(null, paramsY);
      this.rectW = Ease[easeFuncW].apply(null, paramsW);
      this.rectH = Ease[easeFuncH].apply(null, paramsH);

      this.drawRect(this.rectX, this.rectY, this.rectW, this.rectH);
    },

    drawRect (rectX, rectY, rectW = 150, rectH = 100) {
      const { ctx } = this.stage;
      if (this.log) {
        console.log('drawRect', rectX, rectY, rectW, rectH)
      }

      ctx.fillStyle = '#ff8080';
      ctx.fillRect(rectX, rectY, rectW, rectH);
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
  top -10px
  left 560px
  p
    line-height 10px
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

