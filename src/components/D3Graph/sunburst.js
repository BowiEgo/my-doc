const d3 = Object.assign({}, require("d3-array"), require("d3-axis"), require("d3-dsv"), require("d3-fetch"), require("d3-hierarchy"), require("d3-interpolate"), require("d3-scale"), require("d3-scale-chromatic"), require("d3-selection"), require("d3-shape"), require("d3-transition"))

const WIDTH = 750
const HEIGHT = 600
const RADIUS = Math.min(WIDTH, HEIGHT) / 2
// const COLORS = ['#a173d1', '#5687d1', '#ff6177', '#9d52e8', '#00a2ff', '#ffc107', '#00cd6e', '#00cccc', '#3d4d89', '#7b615c', '#de783b', '#6ab975', '#bbbbbb', '#fff2b2', '#51c5e3']
const b = {
  w: 75, h: 30, s: 3, t: 10
}

let totalSize = 0
let svg = null
let context = null
let path = null
let explanation = null
let explanationValue = null
let explanationName = null
let trail = null
let root = null
let arc = null
let parent = null
let currentRoot = null
let partition = null
let depthMap = {}
let keepSize = false
// let color = null
export default function createSunburst(el) {
  let container = d3.select(el).append('div')
    .attr('class', 'container sunburst')
  
  explanation = container.append('div')
    .attr('class', 'explanation')

  explanationValue = explanation.append('span')
  explanationName = explanation.append('p')

  trail = container.append('svg:svg')
    .attr('width', WIDTH + 300)
    .attr('height', 50)
    .attr('class', 'trail')
  
  trail.append('svg:text')
    .attr('class', 'endlabel')
    .style('fill', '#000')
  
  svg = container.append('svg:svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)

  context = svg.append('svg:g')
    .attr('class', 'context')
    .attr('transform', 'translate(' + WIDTH / 2 + ',' + HEIGHT / 2 + ')')
  
  fetch('/data.json').then(resp => {
    return resp.json()
  }).then(res => {
    console.log(res)
    let data = translateData(res)
    console.log(data)
    createVisualization(data)
  })
}

function createVisualization (data) {
  // let nodeNum = 0
  root = d3.hierarchy(data)
    .count()
    .sort((a, b) => b.value - a.value)

  console.log(root)

  root.each(d => {
    d.current = d
    depthMap[d.depth] = d
    // nodeNum++
  })
  
  partition = d3.partition()
    .size([2 * Math.PI, RADIUS * RADIUS])

  var nodes = partition(root).descendants()
    // .filter(d => d.depth < 2)
    .filter(d => d.x1 - d.x0 > 0.005) // 0.005 radians = 0.29 degrees

  // const radius = WIDTH / 6
  // let arc0 = d3.arc()
  //   .startAngle(d => d.x0)
  //   .endAngle(d => d.x1)
  //   .innerRadius(d => d.y0 * radius)
  //   .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

  arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => Math.sqrt(d.y0))
    .outerRadius(d => Math.sqrt(d.y1))
    .cornerRadius(0)
  
  path = context.data([data]).selectAll('path')
    .data(nodes)
    .enter().append('svg:path')
    .attr('display', d => d.depth ? null : 'none')
    .attr('d', arc)
    .attr('fill-rule', 'evenodd')
    .attr('fill-opacity', 1)
    .style('fill', d => { 
      let index = d.parent ? d.parent.children.indexOf(d) : 0
      index += d.depth
      // d.color = COLORS[index]
      d.color = d3.interpolateRainbow(index / (d.parent ? d.parent.children.length : 0))
      return d.color
    })
    .style('opacity', 1)
    .on('mouseover', mouseover)

  path.filter(d => d.children)
    .style('cursor', 'pointer')
    .on('click', handleArcClick)

  parent = context.append('path')
    .datum(root)
    .attr('d', arc)
    .attr('fill', '#fff')
    .attr('pointer-events', 'all')
    .style('cursor', 'pointer')
    .on('click', handleArcClick)
  
  d3.select('.explanation')
    .style('cursor', 'pointer')
    .on('click', handleArcClickRoot)
  
  updateExplanation(root)
  
  totalSize = path.datum().value
}

function handleArcClickRoot () {
  handleArcClick(currentRoot.parent || root)
}

function updateExplanation (d) {
  let percentageString = ''
  if (d.depth === 0) {
    percentageString = '100%'
  } else {
    percentageString = d.data.value ? d.data.value + '%' : (100 * d.value / totalSize).toPrecision(3) + '%'
  }

  explanationValue.text(percentageString)
    .attr('style', `color: ${d.color}`)
  explanationName.text(d.data.name)
}

function handleArcClick (p) {
  parent.datum(p.parent || root)
  currentRoot = p

  if (keepSize) {
    // let newNodes = partition(p.copy()).descendants()
    // root.each(d => {
    //   let targetNode = (d.depth <= p.depth
    //     ? root
    //     : (newNodes[p.descendants().indexOf(d)] || root))
    //   d.current = d.target
    //   d.target = {
    //     x0: targetNode.x0,
    //     x1: targetNode.x1,
    //     y0: targetNode.y0,
    //     y1: targetNode.y1
    //   }
    // })
  } else {
    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, getTargetDepth(d, p).y0),
      y1: Math.max(0, getTargetDepth(d, p).y1)
    })
  }

  path.transition()
    .duration(750)
    .attr('fill-opacity', 1)
    .tween('data', d => {
      const i = d3.interpolate(d.current, d.target)
      return t => d.current = i(t)
    })
    .attrTween('d', d => () => arc(d.current))
    .filter(d => d.depth <= p.depth)
    .attr('fill-opacity', 0)

  updateExplanation(p)
}

function getTargetDepth (d, p) {
  if (d.depth <= p.depth) {
    return {
      y0: root.y0,
      y1: root.y1
    }
  } else {
    return depthMap[d.depth - p.depth]
  }
}

function mouseover (d) {
  let percentageString = d.data.value ? d.data.value + '%' : (100 * d.value / totalSize).toPrecision(3) + '%'

  d3.selectAll('path')
    .style('opacity', 0.4)

  let sequenceArray = d.ancestors().reverse()
  sequenceArray.shift() // remove root node from the array
  updateBreadcrumbs(sequenceArray, percentageString)

  context.selectAll('path')
    .filter(function(node) {
      return (sequenceArray.indexOf(node) >= 0)
    })
    .style('opacity', 1)
}

function breadcrumbPoints(d, i) {
  var points = []
  points.push('0, 0')
  points.push((b.w + d.data.name.length * 10)+ ', 0')
  points.push((b.w + d.data.name.length * 10)+ b.t + ', ' + (b.h / 2))
  points.push((b.w + d.data.name.length * 10)+ ', ' + b.h)
  points.push('0, ' + b.h)
  if (i > 0) {
    points.push(b.t + ', ' + (b.h / 2))
  }
  return points.join(' ')
}


function updateBreadcrumbs (nodeArray, percentageString) {
  let trailEl = trail.selectAll('g')
    .data(nodeArray, d => d.data.name + d.depth)

  trailEl.exit().remove()

  let trailEnter = trailEl.enter().append('svg:g')

  trailEnter.append('svg:polygon')
    .attr('points', breadcrumbPoints)
    .style('fill', d => {
      return d.color
    })

  trailEnter.append('svg:text')
    .attr('x', 40)
    .attr('y', b.h / 2)
    .attr('dy', '0.35em')
    // .attr('text-anchor', 'middle')
    .attr('font-size', 10)
    .attr('fill', '#fff')
    .text(d => d.data.name)
  
  function getNameLen (index) {
    let nameLen = 0
    for (let i = 0; i < index; i++) {
      nameLen += nodeArray[i].data.name.length * 10
    }
    return nameLen
  }

  trailEnter.merge(trail).attr('transform', (d, i) => 
    `translate(${i * (b.w + b.s) + getNameLen(i)}, 0)`)
  
  trail.select('.endlabel')
    .attr('x', (nodeArray.length + 0.5) * (b.w + b.s) + getNameLen(nodeArray.length))
    .attr('y', b.h / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .text(percentageString)
}

function translateData (data) {
  function getChildKeys (gid, isRoot) {
    let result = []
    for (let i in data.structure) {
      if (i.indexOf(gid + '_') > -1) {
        if (isRoot) {
          result.push(data.structure[i])
        } else {
          return data.structure[i]
        }
      }
    }
    if (isRoot) {
      let rootResult = [[], []]
      for (let i in data.structure) {
        if (i.indexOf(result[0][0] + '_') > -1) {
          if (i.indexOf('股东') > -1) {
            rootResult[0] = data.structure[i]
          } else {
            rootResult[1] = data.structure[i]
            return rootResult
          }
        }
      }
    } else {
      return result
    }
  }
  function translateChildData (child, key) {
    child.gid = key
    if (child['交易所']) {
      child.tag = child['交易所'] === '深圳' ? '深' : '沪'
    }
    if (child['持有比例']) {
      child.value = Number(Number(child['持有比例']).toFixed(2))
    }
    if (child['投资比例']) {
      child.value = Number(Number(child['投资比例']).toFixed(1))
    }
    child.children = getChildren(key)
    return child
  }
  function getChildren (gid, isRoot) {
    let childKeys = getChildKeys(gid, isRoot)
    let result = childKeys.map(item => {
      if (isRoot) {
        return item.map(key => {
          let child = data.attributes[key]
          return translateChildData(child, key)
        })
      } else {
        let child = data.attributes[item]
        return translateChildData(child, item)
      }
    })
    if (isRoot) {
      return [
        {
          name: '主要股东',
          children: result[0]
        },
        {
          name: '投资子公司',
          children: result[1]
        }
      ]
    }
    return result
  }
  let result = data.attributes[data.root]
  result.gid = data.root
  result.children = getChildren(result.gid, true)
  return result
}


