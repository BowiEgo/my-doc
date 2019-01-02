## D3js制作股权关系图实践详解

### 一、需求分析

### 二、技术选型

#### 数据可视化
关系图涉及到数据的图形化展现，需要基于canvas、SVG来做绘图。

现有的数据可视化库：Echarts、HighCharts、Charts.js、D3js。

Canvas和SVG的区别：
| SVG| Canvas |
|-----------|-----------|
| 不依赖分辨率 | 依赖分辨率 |
| 支持事件处理 | 不支持事件处理 |
| 最适合带有大型渲染区域的应用程序（如地图） | 弱的文本渲染能力 |
| 复杂度高会减慢渲染速度（任何过度使用DOM的应用都不快） | 能够以.png或.jpg的格式保存结果图像 |
| 不适合游戏应用 | 最适合图像密集型的游戏 |
| 可以为某个元素附加Javascript事件处理器。在SVG中，每个被绘制的图形均被视为对象。 | 一旦图形被绘制完成，它就不会继续得到浏览器的关注。如果其位置发生变化，那么整个场景都需要重新绘制。 |

为什么不选用基于Canvas的库：在 Canvas 中，如果要为细粒度的元素添加事件处理器，必须涉及到边缘检测算法，无疑为开发带来了一定的难度，同时，采用这种方法并不一定精确。相比之下，SVG 是基于 DOM 操作的，支持更精确的用户交互。
关于SVG的性能，众所周知，频繁的DOM操作十分消耗性能。对于用户体验的影响便是可能出现闪烁、卡顿等现象。但是有将使用Virtual DOM的前端框架如Vue、React与SVG结合使用的案例，所以如果有大量元素渲染的场景，未来可以考虑将snabbdom(Vue的虚拟DOM实现)与D3js结合使用的方式来做优化。

Echarts等一些库提供的图表可以满足大部分的需求，但是遇到更加定制化的需求则捉襟见肘。此时需要使用比较基础的图形库，这个库对一些基础算法进行了封装。然后在此基础之上，我们可以进行二次开发，定制适合的图表向用户展示更有针对性的数据。曾考虑过Echarts的基础渲染器ZRender，它提供 Canvas、SVG、VML等多种渲染方式。提供了将近 20 种图形类型。以创建一个圆为例：
``` javascript
let circle = new zrender.Circle({
  shape: {
    cx: 150,
    cy: 50,
    r: 40
  },
  style: {
    fill: 'none',
    stroke: '#F00'
  }
})
zr.add(circle);
```
创建了一个圆心在 [150, 50] 位置，半径为 40 像素的圆，并将其添加到画布中。

但是ZRender没有对外对完整文档，开发时也不能按需引入，也没有完善的官方工具和插件支持。所以不予考虑。

那么，回到问题为什么选择D3js？首先，什么是D3js。(以下简称D3)

D3: 是Data-Driven Documents（数据驱动文档）的简称。D3 (或D3.js) 是一个用来使用Web标准做数据可视化的JavaScript库。 D3帮助我们使用SVG, Canvas 和 HTML技术让数据生动有趣。 D3将强大的可视化，动态交互和数据驱动的DOM操作方法完美结合，让我们可以充分发挥现代浏览器的功能，自由的设计正确的可视化界面。

同时，D3是目前最流行的数据可视化库，同时是Github上最流行的前端库之一。目前star数量81.1k。（Vue: 123k，React: 118k，Angular.js: 59.3k，Node: 56.5k，three.js: 47.3k，Echarts: 31.6k，highcharts: 8.3k，更新于2018.12.9）
目前有大量的用户和丰富的[案例](https://github.com/d3/d3/wiki/Gallery)，有详细的[官方文档](https://d3js.org.cn/api/)和[教程（含中文）](https://d3js.org.cn/introduce/)。

#### 项目打包
Rollup

### 三、项目结构
```
├─build        
├─config   
├─dist
│  ├─index.html
│  └─bundle.cjs
├─public
├─src
│  ├─graphic
│  │  ├─index
│  │  ├─polyline
│  │  ├─rect
│  │  └─text
│  ├─group
│  │  ├─chain
│  │  ├─icon64
│  │  ├─mixins
│  │  │  ├─TreeMixin
│  │  │  └—TreeNodeMixin
│  │  └─tree
│  │     ├─index
│  │     ├─path
│  │     └—pos
│  ├─model
│  │  └─tree
│  │     ├─index
│  │     ├─Node
│  │     └—Tree
│  └─util
│  │  ├─dom
│  │  └─tools
│  └─main.js
└─mock
```

### 四、D3的使用

#### 浏览器支持

#### 绘制曲线
``` javascript
const path = [
  {x: 0, y: 30},
  {x: 50, y: 20},
  {x: 100, y: 40},
  {x: 150, y: 80},
  {x: 200, y: 95}
]
const line = d3.line()
  .x(d => d.x)
  .y(d => d.y)
  .curve(d3.curveStep)

d3.select('div#graph')
  .append('svg')
  .append('path')
  .attr('d', line(path))
  .attr('stroke-width', 2)
  .attr('stroke', '#2196f3')
  .attr('fill', 'none')
```
<d3-graph></d3-graph>
D3巧妙地利用了一种链式语法(chain syntax)，跟jQuery很相似。通过用句点将方法”链接”起来，你可以在一行代码中执行多个操作。这种方式高效而简单。我在后面的TreeGraph类中也采用了这种设计。
#### 绘制柱状图
推荐[Scott Murray 的 D3 教程](http://alignedleft.com/tutorials/d3/making-a-bar-chart)

<d3-graph :type="'barChart'"></d3-graph>

#### 比例尺
什么是比例尺？

比例尺就是把一组输入域映射到输出域的函数。映射就是两个数据集之间元素相互对应的关系。比如输入是1，输出是100，输入是5，输出是10000，那么这其中的映射关系就是你所定义的比例尺。一下简单介绍D3中几种常用的比例尺。

* [d3.scaleLinear()](https://d3js.org.cn/api/d3-scale/#scaleLinear) 线性比例尺：最常用的比例尺，计算线性的对应关系

使用d3.scaleLinear()创造一个线性比例尺，而domain()是输入域，range()是输出域，相当于将domain中的数据集映射到range的数据集中。

``` javascript
let linearScale = d3.scaleLinear().domain([1, 5]).range([0, 100])
```
试一下比例尺的输入和输出
``` javascript
scale(1) // 0
scale(4) // 75
scale(5) // 100
```
输入domain区域外的数据
``` javascript
scale(-1) // -50
scale(10) // 225
```

* [d3.scalePow()、d3.scaleSqrt()](https://d3js.org.cn/api/d3-scale/#scalePow) 指数比例尺（幂比例尺）：指数比例尺和对数比例尺的方法和线性比例尺一样，但指数比例尺多一个exponent()，对数比例尺多一个base()，两者都是用于指定底数。
``` javascript
let powScale = d3.scale.pow().exponent(3) // 指数比例尺，指数为3； 

console.log(powScale(2)) // 8
console.log(powScale(3)) // 27

powScale.exponent(0.5)
console.log(powScale(2)) // 1.414
console.log(powScale(3)) // 1.732

powScale.exponent(3)
  .domain([0, 3]) // 指数比例尺内部调用了线性比例尺，而且把这个线性比例尺定义域的边界变为了其指定的次方。即定义域为[0,27]
  .range([0, 90]

linearScale.domain([0, Math.pow(3, 3)])
  .range([0, 90]

console.log(powScale(1.5)) // 11.25
console.log(linearScale(Math.pow(1.5, 3)) // 11.25
```


* [d3.scaleLog()](https://d3js.org.cn/api/d3-scale/#scaleLog) 对数比例尺
``` javascript
let logScale = d3.scale.log()
```
* [d3.scaleTime()](https://d3js.org.cn/api/d3-scale/#time-scales) 时间比例尺

d3.scaleTime()类似于d3.scaleLinear()线性比例尺，只不过输入域变成了一个时间轴。是线性比例尺的一种变体，它的输入被强制转为 dates 而不是数值类型，并且 invert 返回的是 date 类型。
``` javascript
let scale = d3.scaleTime()
  .domain([new Date(2000, 0, 1), new Date(2000, 0, 2)])
  .range([0, 960])

scale(new Date(2000, 0, 1, 5)) // 200
scale(new Date(2000, 0, 1, 16)) // 640
scale.invert(200) // Sat Jan 01 2000 05:00:00 GMT-0800 (PST)
scale.invert(640); // Sat Jan 01 2000 16:00:00 GMT-0800 (PST)
```

* [d3.scaleSequential()](https://d3js.org.cn/api/d3-scale/#sequential-scales) 序列比例尺

输出域是根据指定的插值器内置且不可配置
``` javascript
// 实现一个 HSL 具有周期性的颜色插值器：可以传入的值 [0, 1]。其中 0 表示最小值，1 表示最大值。
let rainbow = d3.scaleSequential(function(t) {
  return d3.hsl(t * 360, 1, 0.5) + ""
})
```

* [d3.scaleDiverging()](https://d3js.org.cn/api/d3-scale/#diverging-scales) 发散比例尺
``` javascript
let spectral = d3.scaleDiverging(d3.interpolateSpectral)
```

* [d3.scaleQuantize()](https://d3js.org.cn/api/d3-scale/#quantize-scales) 量化比例尺

定义域是连续的，值域是离散的
``` javascript
let color = d3.scaleQuantize()
  .domain([0, 1])
  .range(["brown", "steelblue"])

color(0.49) // "brown"
color(0.51) // "steelblue"
```

* [d3.scaleQuantile()](https://d3js.org.cn/api/d3-scale/#quantile-scales) 分位数比例尺

与量子比例尺类似，也是用于将连续的定义域区域分成段，每段对应到一个离散的值上，不同的是分段处的值，量子比例尺的分段值只与定义域的起始值和结束值有关，其中间有多少其他数值都没有影响，分段值取其算数平均值，分位比例尺的分段值与定义域中存在的数值都有关，可使用quantile.quantiles()查询分位比例尺的分段值。
``` javascript
let quantize = d3.scale.quantize()
  .domain([0, 2, 8, 10])
  .range([1, 100]) //[0, 5]对应1，[5, 10]对应100

let quantile = d3.scale.quantile()
  .domain([0, 2, 4, 10])
  .range([1, 100]) //[0, 3]对应1，[3, 10]对应100

quantize(4.99) // 1
quantize(5) // 100
quantile(2.99) // 1
quantize(3) // 100
```

* [d3.scaleThreshold()](https://d3js.org.cn/api/d3-scale/#threshold-scales) 阈值比例尺

与量化比例尺类似，只不过它们允许将输入域的任意子集映射到输入域的离散值。输入域依旧是连续的，并且会根据输出域分片。
``` javascript
var color = d3.scaleThreshold()
  .domain([0, 1])
  .range(["red", "white", "green"])

color(-1) // "red"
color(0) // "white"
color(0.5) // "white"
color(1) // "green"
color(1000) // "green"

// 输入和输出之间的反转映射
color.invertExtent("red") // [undefined, 0]
color.invertExtent("white") // [0, 1]
color.invertExtent("green") // [1, undefined]
```

* [d3.scaleOrdinal()](https://d3js.org.cn/api/d3-scale/#ordinal-scales) 序数比例尺

序数比例尺的输出域和输入域都是离散的。例如序数比例尺可以将一组命名类别映射到一组颜色。或者确定一组条形图在水平方向的位置等等。
``` javascript
let ordinal = d3.scale.ordinal() //构建一个序数比例尺，定义域和值域一一对应
  .domain([1, 2, 3, 4, 5])
  .range([10, 20, 30, 40, 50])

ordinal.rangePoints([0, 100]) //（interval,padding）interval是区间，padding边界部分留白，省略默认为0，输入连续区间自动计算连续值[0, 25, 50, 75, 100]
ordinal.rangeBands([0, 100])//（interval, padding, outerPadding）outerPadding边界的空白，默认为0，[0, 20, 40, 60, 80]
```

* [d3.scaleBand()](https://d3js.org.cn/api/d3-scale/#band-scales) 分段比例尺
``` javascript
let scale = d3.scaleBand()
  .domain([1, 2, 3, 4])
  .range([0, 100])

scale(0) // undefined
scale(1) // 0
scale(2) // 25
scale(4) // 75
scale(10) // undefined
```
映射关系：

![](https://raw.githubusercontent.com/SevenChan07/MarkdownPhotos/master/20170830/Snip20170830_1.png)

* [d3.scalePoint()](https://d3js.org.cn/api/d3-scale/#point-scales) 标点比例尺

标点比例尺是分段比例尺的分段宽度为0时的变体。标点比例尺通常用于对具有序数或分类维度的散点图。

#### 绘制坐标系

``` javascript
let xScale = d3.scaleLinear()
  .domain([0, dataset.length])
  .range([0, w])

let xAxis = context.append("g")
  .attr('transform', `translate(${20}, ${h})`)
  .call(d3.axisBottom(xScale))

let yScale = d3.scaleLinear()
  .domain([0, d3.max(dataset)])
  .range([h, 0])

let yAxis = context.append("g")
  .attr('transform', `translate(${20}, ${10})`)
  .call(d3.axisLeft(yScale).ticks(6))
```

<d3-graph :type="'barChart'" :xAxis="[0, 10]"></d3-graph>

#### 过渡动画
[Scott Murray的教程](http://alignedleft.com/projects/2014/easy-as-pi/)

### 五、数据模型
本项目作为一个关系图，最直接的特点就是布局方式是基于节点来生成的链接树。

D3有默认的API可以创建一个树布局：[d3.tree()](https://d3js.org.cn/api/d3-hierarchy/#tree)，在创建时间和布局紧凑上进行了优化，虽然十分方便，但是尝试后还是和需求所需要的布局方式有很大出入。[可参考样例。](https://ssthouse.github.io/organization-chart/#/orgChart)

![](https://raw.githubusercontent.com/d3/d3-hierarchy/master/img/tree.png)

而且树和节点的状态会随时因为交互而发生变化，并为了照顾到将来可能不断变化的需求，所以在计算节点的位置上，打算自己处理。

首先，为了处理可能需要面对的复杂逻辑，需要将整个图像抽象化，来作为和数据的连接。手段是创建一个树的数据模型TreeModel来管理树和节点的状态。然后通过抽象化后的模型来将数据实例化，实例化后的对象便具有了管理状态、计算位置、绘制更新的方法，并在结构上与数据保持一致，可以方便的获取节点之间的关系。以下是代码的实现过程：

定义一个TreeModel的类和NodeModel的类：

``` javascript
class TreeModel {
  constructor (options) {
    this.currentNode = null
    this.currentNodeKey = null
    for (let name in options) {
      if (options.hasOwnProperty(name)) {
        this[name] = options[name]
      }
    }
    this.updating = false
    this.currentDepth = 2
    this.maxDepth = 0
    this.nodeMap = {}
    this.depthMap = {0: []}
  }
}
```
TreeModel作为每个NodeModel的Store用作全局的状态管理

``` javascript
let nid = 0
class NodeModel {
  constructor (options) {
    this.uid = nid++
    this.data = null
    this.shouldUpdate = true
    this.expanded = false
    this.depthExpanded = false
    this.parent = null
    this.visible = true
    this.isOutView = false
    this.childMoveDistance = 0
    this.maxChildNum = 0

    for (let name in options) {
      if (options.hasOwnProperty(name)) {
        this[name] = options[name]
      }
    }

    // 给节点赋值（data, childNodes，maxChildNum）
    this.setData(this.data)

    if (store.defaultExpandAll) {
      this.expanded = true
    }
    // 每个节点创建时将该节点加入到store的nodeMap和depthMap中
    store.nodeMap[this.uid] = this
    if (!store.depthMap[this.depth]) {
      store.depthMap[this.depth] = []
    }
    if (store.depthMap[this.depth].indexOf(this) === -1) {
      store.depthMap[this.depth].push(this)
    }
  }

  setData (data) {
    this.data = data
    this.childNodes = []
    let children
    if (this.depth === 0 && this.data instanceof Array) {
      children = this.data
    } else {
      children = this.data.children || []
    }
    this.maxChildNum = children.length
    for (let i = 0, len = children.length; i < len; i++) {
      this.insertChild({
        data: children[i]
      }, i)
    }
  }

  insertChild (child, idx) {
    if (!child) throw new Error('insertChild error: child is required.')
    if (!(child instanceof NodeModel)) {
      const children = this.getChildren()
      if (children.indexOf(child.data) === -1) {
        children.push(child.data)
      }
      // 将parent和store赋值给child
      merge(child, {
        parent: this,
        store: this.store
      })
      // 创建child节点实例
      child = new NodeModel(child)
    }
    child.idx = idx
    // 将child节点实例插入到当前节点的childNodes属性中
    this.childNodes.push(child)
  }

  getChildren () {
    const data = this.data
    if (!data) return null
    if (data.children === undefined) {
      data.children = null
    }
    return data.children
  }
}
```

这样，通过创建TreeModel实例，我们可以将数据转换成一个具有树结构的JS对象

Tree: TreeModel => root: NodeModel(uid = 0) => childNodes: NodeModel[] => childNodes: NodeModel[] ...

``` javascript
TreeModel {
  branchColor: "#D2D8E5"
  cbs: {}
  center: {x: 187.5, y: 305.5}
  container: Selection {_groups: Array(1), _parents: Array(1)}
  currentDepth: 2
  currentNode: null
  currentNodeKey: null
  data: {证券代码: "0651", 交易所: "深圳", 上市板: "主板", 是否已经上市: "1", name: "格力电器", …}
  depthDatum: {left: {…}, right: {…}}
  depthMap: {0: Array(1), 1: Array(2), 2: Array(22), 3: Array(11), 4: Array(14), 5: Array(13)}
  eventPool: {selected: ƒ, expanded: ƒ, unexpanded: ƒ, updated: ƒ}
  levelMap: {}
  levelSpace: 100
  maxDepth: 5
  nodeMap: {0: NodeModel, 1: NodeModel, 2: NodeModel, 3: NodeModel, ...}
  nodeStyle: ƒ nodeStyle(node)
  root: NodeModel {uid: 0, data: {…}, shouldUpdate: false, expanded: true, depthExpanded: false, …}
  scale: 1
  showuid: true
  top: 120
  updating: false
  __proto__: Object
}
```
``` javascript
root: NodeModel {
  branchEl: Selection {_groups: Array(1), _parents: Array(1)}
  branchTextEl: undefined
  childMoveDistance: 0
  childNodes: (2) [NodeModel, NodeModel]
  container: Selection {_groups: Array(1), _parents: Array(1)}
  data: {证券代码: "0651", 交易所: "深圳", 上市板: "主板", 是否已经上市: "1", name: "格力电器", …}
  depth: 0
  depthExpanded: false
  expanded: true
  hightlight: Selection {_groups: Array(1), _parents: Array(1)}
  idx: 0
  isChildPosCalculated: true
  isOutView: false
  level: 0
  maxChildNum: 2
  nodeEl: Selection {_groups: Array(1), _parents: Array(1)}
  nodeStyle: {x: 0, y: 0, width: 145, height: 65, paddingTop: 7, …}
  parent: null
  pos: {x: 115, y: 120}
  pos0: {x: 115, y: 120}
  rectInstance: Rect {parent: Selection, opts: {…}, el: Selection}
  shouldUpdate: false
  side: "center"
  store: TreeModel {currentNode: null, currentNodeKey: null, container: Selection, center: {…}, top: 120, …}
  uid: 0
  visible: true
  label: (...)
  __proto__: Object
}
```

以上结果还得通过mixins目录下的TreeMixin和TreeNodeMixin，来给Tree和Node两个类添加绘制图表相关的属性和方法。让Tree在使用的时候可以像下面这样：
``` javascript
new Tree({
  container: this.innerCtx,
  center: {
    x: this.opts.width / 2,
    y: this.opts.height / 2
  },
  top: 120,
  scale: this.deviceScale,
  data: this.data,
  showuid: this.opts.showuid,
  branchColor: this.opts.branchColor,
  levelSpace: this.opts.levelSpace,
  nodeStyle: this.opts.nodeStyle
}).initRoot().layout()
  .on('selected', node => {
    this.opts.onSelected(node)
  })
  .on('expanded', node => {
    this.opts.onExpanded(node)
    this.handleOutView(node, this.opts.width)
  })
  .on('unexpanded', node => {
    this.opts.onUnExpanded(node)
  })
  .on('updated', tree => {
    this.depth = tree.currentDepth
  })
```
TreeNodeMixin则是绘制以及更新节点的核心。以下主要分析renderNodeEl实现方法来接触一下D3绘制图形的基本方式。
``` javascript
// group/mixins/TreeNodeMixin.js
...
const rectInstance = new Rect(nodeEl, rectStyle).render()
...
const textInstance = new Text(nodeEl, textStyle)
...
```
上面一段代码，可以看到创建了一个Rect实例和一个Text实例并使用了render方法。这两个类则是在graphic目录下定义。包括polyline，这是用D3将该图表中使用率比较高的基础图形进行了封装。

### 六、封装图形类
图形类的使用设计如下：
``` javascript
const RectInstance = new Rect(nodeEl, {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  radius: 0,
  bgColor: '#fff',
  borderWidth: 1,
  borderColor: '#000'
}).render()
const RectEl = RectInstance.el
RectInstance.update({
  width: 200,
  height: 200,
  bgColor: '#000',
  borderColor: '#fff'
})
```
render和update方法分别用来绘制和更新图形样式，并返回该实例，可以通过el属性获取该图形DOM对象的选择集。

#### 绘制文本
因为SVG绘制文本并不像HTML那样原生带有一些样式，所以想要达到某些效果需要手动添加一些方法。譬如文本的换行、缩进和超出文字省略号处理。相关的SVG文本介绍可以查阅[D3文档](https://d3js.org.cn/svg/get_start/#%E7%AC%AC%E4%B9%9D%E7%AB%A0-%E6%96%87%E6%9C%AC)和[MDN](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Element/text)。

基本的SVG绘制文本如下
``` javascript
d3.select('body')
  .append('text')
  .attr('x', 10)
  .attr('y', 20)
  .style('font-size', 10)
  .style('font-family', 'PingFangSC-Regular')
  .style('font-weight', 500)
  .append('tspan')
  .attr('x', 0)
  .attr('y', 0)
  .attr('dy', '1em')
  .attr('fill', '#333')
  .text('This is a text!')
```
``` html
// --result--
<text x="10"  y="20"
  style="font-family: PingFangSC-Regular;
         font-size  : 10;
         font-weight: 500;">
  <tspan x="0" y="0" dy="1em" fill="#333">
    This is a text!
  </tspan>
</text>
```
text标签是一个容器，用来定义文字样式属性，tspan则是文本行。这里通过将文字进行分割，然后append多个tspan来实现换行的效果。相关代码：
``` javascript
/** 分割文本
 * @param  {string} str 字符串
 * @param  {number} maxLen 每一行的宽度，单位为像素
 * @param  {number} fontSize 文字的大小
 * @param  {number} indent 首行缩进
 * @return  {array}
 */
function splitByLine (str, maxLen, fontSize, indent) {
  let curLen = 0
  let result = []
  let start = 0
  let end = 0
  let max = maxLen
  let flag = true
  max -= indent
  for (let i = 0, len = str.length; i < len; i++) {
    let code = str.charCodeAt(i)
    let pixelLen = code > 255 ? fontSize : fontSize / 2
    curLen += pixelLen
    if (curLen > max) {
      end = i
      result.push(str.substring(start, end))
      start = i
      curLen = pixelLen
    }
    if (i === len - 1) {
      end = i
      result.push(str.substring(start, end + 1))
    }
    // debugger
    if (result.length === 1 && flag) {
      max += indent
      flag = false
    }
  }
  return result
}

function getStrPixelLen (str, fontSize) {
  let result = 0
  for (let i = 0, len = str.length; i < len; i++) {
    let code = str.charCodeAt(i)
    let pixelLen = code > 255 ? fontSize : fontSize / 2
    if (code === 46) pixelLen = fontSize / 3
    result += pixelLen
  }
  return result
}
```

### 七、节点位置计算
### 八、动画
### 九、事件处理
### 九、画布的缩放和位移
### 十、一些坑
### 十一、可优化的地方
### 十二、总结
