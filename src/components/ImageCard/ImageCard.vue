<template>
  <div class="image-card">
    <img :src="source" alt="">
  </div>
</template>

<script>
export default {
  name: 'ImageCard',

  props: {
    source: {
      type: String,
      default: ''
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

