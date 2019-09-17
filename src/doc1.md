## D3js制作企业图谱实践

### 一、需求简介
1.将层级数据可视化展示
2.点击节点可收起、展开子节点
3.节点之间的碰撞处理
4.画布的拖动、缩放
5.对外暴露图形组件接口

### 二、技术选型
关系图涉及到数据的图形化展现，需要基于canvas、SVG来做绘图。

#### 目前主流的开源可视化库
echart (star: 31.6k)
highchart (star: 8.5k)
chart.js (star: 42.1k)
d3.js (star: 81.1k)

#### Canvas和SVG的区别
| SVG| Canvas |
|-----------|-----------|
| 不依赖分辨率 | 依赖分辨率 |
| 支持事件处理 | 不支持事件处理 |
| 最适合带有大型渲染区域的应用程序（如地图） | 弱的文本渲染能力 |
| 复杂度高会减慢渲染速度（任何过度使用DOM的应用都不快） | 能够以.png或.jpg的格式保存结果图像 |
| 不适合游戏应用 | 最适合图像密集型的游戏 |
| 可以为某个元素附加Javascript事件处理器。在SVG中，每个被绘制的图形均被视为对象。 | 一旦图形被绘制完成，它就不会继续得到浏览器的关注。如果其位置发生变化，那么整个场景都需要重新绘制。 |

#### 为什么不选用基于Canvas的库
在 Canvas 中，如果要为细粒度的元素添加事件处理器，必须涉及到边缘检测算法，无疑为开发带来了一定的难度，同时，采用这种方法并不一定精确。相比之下，SVG 是基于 DOM 操作的，支持更精确的用户交互。关于SVG的性能，众所周知，频繁的DOM操作十分消耗性能。对于用户体验的影响便是可能出现闪烁、卡顿等现象。但是有将使用Virtual DOM的前端框架如Vue、React与SVG结合使用的案例，所以如果有大量元素渲染的场景，未来可以考虑将snabbdom(Vue的虚拟DOM实现)与D3js结合使用的方式来做优化。

#### ZRender
ZRender是二维绘图引擎，也是Echart的渲染器，它提供 Canvas、SVG、VML等多种渲染方式。提供了将近 20 种图形类型。以创建一个圆为例：
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


#### 为什么选择D3js
那么，回到问题为什么选择D3js？首先，什么是D3js。(以下简称D3)

D3: 是Data-Driven Documents（数据驱动文档）的简称。D3 (或D3.js) 是一个用来使用Web标准做数据可视化的JavaScript库。 D3帮助我们使用SVG, Canvas 和 HTML技术让数据生动有趣。 D3将强大的可视化，动态交互和数据驱动的DOM操作方法完美结合，让我们可以充分发挥现代浏览器的功能，自由的设计正确的可视化界面。

同时，D3是目前最流行的数据可视化库，同时是Github上最流行的前端库之一。目前star数量81.1k。（Vue: 123k，React: 118k，Angular.js: 59.3k，Node: 56.5k，three.js: 47.3k，Echarts: 31.6k，highcharts: 8.3k，更新于2018.12.9）

目前有大量的用户和丰富的[案例](https://github.com/d3/d3/wiki/Gallery)，有详细的[官方文档](https://d3js.org.cn/api/)和[教程（含中文）](https://d3js.org.cn/introduce/)。

Echarts等一些库提供的图表可以满足大部分的需求，但是遇到更加定制化的需求则捉襟见肘。此时需要使用比较基础的图形库，这个库对一些基础算法进行了封装。然后在此基础之上，我们可以进行二次开发，定制适合的图表向用户展示更有针对性的数据。

### 三、企业图谱项目分析
#### 项目结构
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

#### 封装基本图形方法
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

polyline、rect、text类则是在graphic目录下定义。这是用D3将该图表中使用率比较高的基础图形进行了封装。

##### 绘制文本
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

#### 数据模型
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

以上结果还得通过mixins目录下的TreeMixin和TreeNodeMixin，来给Tree和Node两个类添加绘制图表相关的属性和方法。
``` javascript
import { NodeModel, TreeModel } from '../../model/tree'
import treeMixin from '../mixins/TreeMixin'
import treeNodeMixin from '../mixins/TreeNodeMixin'

const TreeNode = treeNodeMixin(NodeModel)
const Tree = treeMixin(TreeModel)

export {
  Tree,
  TreeNode
}
```
然后Tree在使用的时候可以像下面这样：
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
TreeMixin赋予了Tree计算布局layout()，更新节点update()等等原型方法。
``` javascript
TreeModel.prototype.layout = function () {
    for (let i in this.nodeMap) {
      let node = this.nodeMap[i]
      node.isChildPosCalculated = false
      if (node.depth === 1) {
        // node.visible = true
        node.expanded = true
        node.maxChildNum = 6
      }
      if (node.depth > 1) {
        node.maxChildNum = 10
      }
    }
    this.root.calcNodePos()
    calcChildPos(this.root)
    return this  // 返回this，使得可以使用链式调用
  }

```

#### 节点位置计算
所有的树干路径的计算方法放在了group/tree/path.js，所有的节点、按钮位置的计算方法放在group/tree/pos.js
#### 节点的碰撞处理
节点的碰撞发生在父节点展开的时候(handleExpand)
用所有子节点的最小高度和最大高度来作为父节点之间的碰撞边界（minY，maxY）。
以当前节点为中心向两边判断边界碰撞，如果碰撞，改变相邻节点的位置（pushNode）
``` javascript
function handleExpand (node) {
  const prevNode = getPrev(node)
  const nextNode = getNext(node)
  if (prevNode) {
    if (node.minY < prevNode.maxY) {
      pushNode(prevNode, 'prev', node.minY)
    } else {
      resumeNode(prevNode, 'prev', node.minY - LEAF_SPACE)
    }
  }
  if (nextNode) {
    if (node.maxY > nextNode.minY) {
      pushNode(nextNode, 'next', node.maxY)
    } else {
      resumeNode(nextNode, 'next', node.maxY + LEAF_SPACE)
    }
  }
  checkIntersect(node)
}
```

#### 复原节点位置
节点的复原发生在父节点收起的时候(handleShrink)。
从当前节点相邻的节点开始比较，找出相邻节点恢复初始位置趋势较大的一边，将这一边的所有节点逐个以不碰撞为前提进行恢复操作(resumeNode)。
最后在检查当前节点碰撞(checkIntersect)
``` javascript
function handleShrink (node) {
  const change = getChange(node)
  const prevNode = getPrev(node)
  const nextNode = getNext(node)
  if (change !== 0) {
    translateChild(node, -change)
  }
  if (change === 0) {
    const prevChange = prevNode
      ? getChange(prevNode)
      : null
    const nextChange = nextNode
      ? getChange(nextNode)
      : null
    if (prevChange === null && nextChange !== null) {
      nextNode &&
        resumeNode(nextNode, 'next', -Infinity)
    } else if (nextChange === null && prevChange !== null) {
      prevNode &&
        resumeNode(prevNode, 'prev', Infinity)
    } else {
    ...
    }
  checkIntersect(node)
}
```

#### 图像的更新流程
1.TreeGraph的构造函数中实例化Tree

2.Tree构造函数中生成所有的Node实例。并储存在Store的nodeMap中。

3.Tree调用layout()来通知Store中的所有Node去计算calcPos()自己的位置(Node.pos.x、Node.pos.y)

4.TreeGraph调用render()，触发Tree的update()方法。

5.Tree通知所有的Node执行各自的update()，在第一次update时生成dom（绘制）

6.当有交互发生时（select，expand），Node监听事件，触发回调方法（handleSelect，handleExpand）计算新的位置pos。

7.所有需要更新的Node重新计算pos后，通知Tree执行update()

8.所有待更新的Node执行update()，更新自己的位置和枝干元素的path

#### 过渡动画
在处理完节点新的位置之后(计算出新的pos.x，pos.y)，通过update()来更新节点DOM的真正位置。
```javascript
Node.prototype.update = function () {
    return new Promise((resolve, reject) => {
      ...
      updateBranchText(this)
      updateExpandBtn(this)
      updateRootBranch(this)
      updateBaseBranch(this)
      if (this.depth === 1) resolve(this)
      this.nodeEl && this.nodeEl
        .transition()
        .duration(ANIMATE_DURATION)
        .style('opacity', 1)
        .style('transform', `translate(${this.pos.x}px, ${this.pos.y}px)`)
      setTimeout(() => {
        resolve(this)
      }, ANIMATE_DURATION + 1)
    })
  }
```

#### 线条绘制动画
将<path>元素的stroke-dashoffset设置为线条长度lineLength，当改变stroke-dasharray是则能改变线条的显示长度。
```javascript
/* polyline.js */
draw: function () {
    this.lineLenth = calcLength(this.points)

    this.el
      .attr('d', this.lineFunc(this.points))
      .attr('stroke-dasharray', this.lineLenth)
      .attr('stroke-dashoffset', this.lineLenth)
      .attr('stroke', this.opts.strokeColor)
      .attr('stroke-width', this.opts.strokeWidth)
      .attr('fill', 'none')
      .transition()
      .duration(this.opts.duration)
      .delay(this.opts.delay)
      .ease(d3Ease.easeLinear)
      .attr('stroke-dashoffset', 0)
    return this
  },


function calcLength (points) {
  let result = 0
  for (let i = 0, len = points.length; i < len - 1; i++) {
    const l = points[i]
    const r = points[i + 1]
    result += (Math.sqrt(Math.pow((r.x - l.x), 2) + Math.pow((r.y - l.y), 2)))
  }
  return result
}
```

#### 事件处理
D3元素可以直接绑定click事件监听
```javascript
/* treeNodeMixin.js */
nodeEl.on('click', () => {
  node.store.setCurrentNode(node)
  node.toggleExpand(!node.expanded)
})
```

#### 画布的缩放和位移
初始化画布initContext()

1.在根元素中添加(append)画布容器

2.添加选中节点时作为高光使用的svg元素

3.初始化缩放，返回作为缩放的基础画布zoomSvg

4.添加(append)第二层用来缩放的基础画布ctx

5.添加(append)真正用来绘制图形的画布innerCtx

##### d3-zoom
缩放行为通过d3-zoom模块实现，能方便且灵活到selections上。可以点击并拖拽平移，使用滚轮进行缩放，当然也可以通过触摸进行。
```javascript
initZoom () {
    this.zoom0 = this.zoom1 = {
      x: 0, // 水平位移
      y: 0, // 垂直位移
      k: 1  // 缩放比例
    }

    const zoomListener = d3Zoom.zoom().on('zoom', () => {
      let transform = d3.event.transform
      this.zoomSvg.attr('transform', transform)
      this.zoom0 = d3.event.transform
    })

    return this.container.append('svg')
      .attr('width', this.opts.width)
      .attr('height', this.opts.height)
      .call(zoomListener)
      .on('dblclick.zoom', null) // 取消默认的双击缩放行为
      .append('g')
  },

```

### 四、可优化的地方
1.将snabbdom(Vue的虚拟DOM实现)与D3js结合使用的方式来做优化。

2.为基础图形的封装添加canvas实现。并通过Rollup打包成模块。

3.更为准确和强大的图形碰撞检测:
   外接图形判别法、光线投射法、分离轴定理(SAT)、最小平移向量(MTV)
—《HTML Canvas核心技术》

4.尝试其他的图形库（Two.js、Paper.js）。

### 五、总结
1.D3js相比其他可视化库拥有更强大和自由的定制化功能。

2.D3js使用方便，有许多强大的模块(d3-zoom，d3-shape，d3-transition…)可以自由使用。

3.更为复杂的图形绘制和交互功能，需要学习更多的知识
