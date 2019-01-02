<template>
  <div class="graph" ref="container"></div>
</template>

<script>
import createSunburst from './sunburst'
const d3 = Object.assign({}, require("d3-array"), require("d3-axis"), require("d3-dsv"), require("d3-fetch"), require("d3-scale"), require("d3-selection"), require("d3-shape"))

export default {
  name: 'D3Graph',

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
    switch (this.type) {
      case ('curve'):
        this.createCurve()
        break
      case ('barChart'):
        this.createBarChart()
        break
      case ('sunburst'):
        this.createSunburst()
        break
      default:
        this.createCurve()
        break
    }
  },

  methods: {
    createCurve () {
      const _self = this
      const curveMap = {
        curveLinear: d3.curveLinear,
        curveStep: d3.curveStep,
        curveBasis: d3.curveBasis,
        curveCardinal: d3.curveCardinal,
        curveMonotoneX: d3.curveMonotoneX,
        curveCatmullRom: d3.curveCatmullRom,
      }
      const path = [
        {x: 0, y: 30},
        {x: 50, y: 20},
        {x: 100, y: 40},
        {x: 150, y: 80},
        {x: 200, y: 95}
      ]
      for (let i in curveMap) {
        const curve = d3.line()
          .x(d => d.x)
          .y(d => 100 - d.y)
          .curve(curveMap[i])

        drawCurve(curve, i)
      }

      function drawCurve (curve, name) {
        const context = d3.select(_self.$refs.container)
          .append('div')
          .attr('class', 'context')
          .append('svg')
          .attr('width', 280)
          .attr('height', 180)

        context.append('path')
          .attr('d', curve(path))
          .attr('stroke-width', 2)
          .attr('stroke', '#2196f3')
          .attr('fill', 'none')

        context.append('text')
          .attr('x', 0)
          .attr('y', 140)
          .text(name)
      }
    },

    createBarChart () {
      const _self = this

      const dataset = [ 5, 10, 13, 19, 21, 25, 22, 18, 15, 13, 11, 12, 15, 20, 18, 17, 16, 18, 23, 25 ]
      const w = 480
      const h = 180

      const context = d3.select(_self.$refs.container)
        .append('div')
        .attr('class', 'context')
        .append('svg')
        .attr('width', w + 40)
        .attr('height', h + 40)

      const hScale = d3.scaleLinear()
        .domain([0, d3.max(dataset)])
        .range([0, h])
      
      context.selectAll('rect')
        .data(dataset)
        .enter()
        .append('rect')
        .attr('x', (d, i) => i * (w / dataset.length) + 33)
        .attr('y', d => h - hScale(d) + 10)
        .attr('width', 20)
        .attr('height', d => hScale(d))
        .attr('fill', 'teal')
        // .attr('fill', function(d) {
        //   return 'rgb(0, 0, ' + (d * 10) + ')'
        // })

      context.selectAll('text')
        .data(dataset)
        .enter()
        .append('text')
        .attr('x', (d, i) => i * (w / dataset.length) + 33)
        .attr('y', d => h - hScale(d) + 26)
        .attr('fill', '#fff')
        .text(d => d)

      if (_self.xAxis.length > 0) {
        addXAxis()
        addYAxis()
      }

      function addXAxis() {
        let xScale = null
        if (typeof _self.xAxis[0] === 'number') {
          xScale = d3.scaleLinear()
        } else {
          xScale = d3.scaleTime()
        }
        xScale.domain([0, dataset.length + 1])
          .range([0, w + 20])
  
        let xAxis = context.append("g")
          .attr('transform', `translate(${20}, ${h + 10})`)
          .call(d3.axisBottom(xScale))
      }
      function addYAxis() {
        let yScale = d3.scaleLinear()
          .domain([0, d3.max(dataset)])
          .range([h, 0])
        
        let yAxis = context.append("g")
          .attr('transform', `translate(${20}, ${10})`)
          .call(d3.axisLeft(yScale).ticks(6))
      }
    },

    createSunburst () {
      createSunburst(this.$refs.container)
    }
  }
}
</script>

<style lang="stylus">
.graph
  position relative
  display flex
  flex-wrap wrap

.sunburst
  path
    stroke #fff

.explanation
  position absolute
  top 310px
  left 305px
  width 140px
  text-align center
  color #666
  span
    font-size 20px
  // z-index -1

</style>

