## D3js绘制旭日图（序列辐射图）

效果如下：

<d3-graph :type="'sunburst'"></d3-graph>

### 数据处理：

D3中可以通过d3-fetch这个模块来加载数据，它基于Fetch之上添加了解析功能。本次演示为了减少按需引入的模块，并且在es6环境中运行，就直接使用Fetch来获取数据。
``` javascript
fetch('/data.json').then(resp => {
  return resp.json()
}).then(res => {
  let data = translateData(res)
  createVisualization(data)
})
```
数据的结构如下：
``` json
{
  "name": "Eve",
  "children": [
    {
      "name": "Cain"
    },
    {
      "name": "Seth",
      "children": [
        {
          "name": "Enos"
        },
        {
          "name": "Noam"
        }
      ]
    },
    {
      "name": "Abel"
    },
    {
      "name": "Awan",
      "children": [
        {
          "name": "Enoch"
        }
      ]
    },
    {
      "name": "Azura"
    }
  ]
}
```
将后台数据处理成我们想要的格式之后，通过createVisualization方法来进行图形的绘制。那么来看下createVisualization这个方法。
``` javascript
// 首先使用d3-hierachy来将数据重组为层次结构数据。
root = d3.hierarchy(data)
  .count()
  .sort((a, b) => b.value - a.value)
```
通过d3-hierarchy这个模块处理后的数据如下：

<image-card :source="'/images/screenshot1.png'"></image-card>

可以看到处理后的数据除了在原型链上添加了一些方法之外，还多了data，depth，parent，height等属性。
分别代表了当前节点关联的数据，深度，父节点，高度。而原型链中的方法譬如ancestors()，descendants()，leaves()，path()，links()等等都是用来获取节点相对应关系的节点数组和相对路径等关系。这样的层级化方便了我们对所有节点单元在微观和宏观上的观察及把控，为接下来计算布局提供了方便。

### 计算布局（partition）：

``` javascript
partition = d3.partition()
  .size([2 * Math.PI, RADIUS * RADIUS])

```

d3-hierarchy可以实现几种经典的对层次结构数据的布局：Node-link diagrams(节点-链接图)，Adjacency diagrams(邻接图) ，Enclosure diagrams(包裹图)。这里我们使用partition来生存一个邻接图布局。在这个布局中节点会被绘制为一个区域(可以是弧也可以是矩形)，并且其位置反应了其在层次结构中的相对位置。

![](https://raw.githubusercontent.com/d3/d3-hierarchy/master/img/partition.png)

同时用size()来指定布局尺寸。因为我们绘制的旭日图基本图形是圆环，所以x值对应的应该是圆环的弧度，映射到矩形宽度范围为0～2*PI。y值对应圆环内径长度，范围0～RADIUS的平方，这里RADIUS取的是画布宽高的最小值。

``` javascript
const RADIUS = Math.min(WIDTH, HEIGHT) / 2
```
然后用设定的布局来处理数据。

``` javascript
var nodes = partition(root).descendants()
  .filter(d => d.x1 - d.x0 > 0.005) // 0.005 radians = 0.29 degrees
```
处理后的数据添加了x0，x1，y0，y1几个属性，它们就是用来表示在这个矩形区域中各自的位置。

* node.x0 - 矩形的左边缘
* node.y0 - 矩形的上边缘
* node.x1 - 矩形的右边缘
* node.y1 - 矩形的下边缘

这里用还filter做了筛选，去掉角度小于0.29的数据，过滤掉了肉眼看起来太过细小的圆环。

有了数据和布局位置，接下来就可以用D3的图形模块生成圆环了。

### 绘制圆环（arc）：

``` javascript
arc = d3.arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .innerRadius(d => Math.sqrt(d.y0))
  .outerRadius(d => Math.sqrt(d.y1))
  .cornerRadius(0)
```
绑定数据，添加path元素：
``` javascript
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
    d.color = d3.interpolateRainbow(index / (d.parent ? d.parent.children.length : 0))
    return d.color
  })
  .style('opacity', 1)
```

### 添加事件（mouseover, click）
当鼠标划过每个圆环的时候，需要高亮显示当前圆环，并在头部绘制相应的legend。
首先来看绑定的mouseover方法：

``` javascript
path.on('mouseover', mouseover)

function mouseover (d) {
  let percentageString = d.data.value ? d.data.value + '%' : (100 * d.value / totalSize).toPrecision(3) + '%'

  d3.selectAll('path')
    .style('opacity', 0.4) // 将所有圆环透明度设为0.4

  let sequenceArray = d.ancestors().reverse()
  sequenceArray.shift() // 删除祖先节点数组中的自身节点
  updateBreadcrumbs(sequenceArray, percentageString)

  context.selectAll('path')
    .filter(function(node) {
      return (sequenceArray.indexOf(node) >= 0)
    })
    .style('opacity', 1) // 将当前圆环透明度设为1
}
```

通过ancestors()这个之前用d3-hierarchy层级化时添加的原型方法，可以获取到当前节点的祖先节点数组。然后通过updateBreadcrumbs来更新legend。如下：
``` javascript
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
  const fontSize = 10
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
    .attr('font-size', fontSize)
    .attr('fill', '#fff')
    .text(d => d.data.name)
  
  function getNameLen (index) { // 获取字符长度
    let nameLen = 0
    for (let i = 0; i < index; i++) {
      nameLen += nodeArray[i].data.name.length * fontSize
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
```

当点击圆环时，我们需要让图只显示该圆环的所有子代。
``` javascript
// createVisualization
root.each(d => {
  d.current = d
  depthMap[d.depth] = d
  nodeNum++
})

// ...

path.filter(d => d.children) // 只有有子代的节点才能点击
  .style('cursor', 'pointer')
  .on('click', handleArcClick)
```
handleArcClick方法：
``` javascript
function handleArcClick (p) {
  parent.datum(p.parent || root)
  currentRoot = p

  root.each(d => d.target = {
    x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
    x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
    y0: Math.max(0, getTargetDepth(d, p).y0),
    y1: Math.max(0, getTargetDepth(d, p).y1)
  })

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
```
