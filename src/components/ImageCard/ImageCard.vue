<template>
  <div class="image-card">
    <img :src="imgSource" alt="" :style="`width: ${width}px;`">
  </div>
</template>

<script>
export default {
  name: 'ImageCard',

  props: {
    width: {
      type: Number,
      default: 300
    },
    height: {
      type: Number,
      default: 200
    },
    source: {
      type: String,
      default: ''
    }
  },

  computed: {
    imgSource () {
      return process.env.NODE_ENV === 'development' ? this.source : '/dist' + this.source
    }
  }
}
</script>

<style lang="stylus" scoped>
.image-card
  width 300px
  img
    width 100%
    height 100%
</style>

