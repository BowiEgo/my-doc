## D3js简单教程

#### 绘制曲线
先从最简单的画条线来接触一下D3绘图的方式

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
* 语法：

D3巧妙地利用了一种链式语法(chain syntax)，跟jQuery很相似。通过用句点将方法”链接”起来，你可以在一行代码中执行多个操作。这种方式高效而简单。

* 图形（d3-shape）：

d3-shape 是一个用于绘制数据可视化中常见的几何图形的库。它非常的小巧（大概 28kb, 压缩后6kb）, 而且可以同时和 SVG 和 Canvas 协同工作。
通过d3-shape，你将得到绘制线和面的能力。包括: 各种各样的曲线，派图，扇形图，散点图等等。
而且与D3的其他特性一样，这些图形也是又数据驱动的: 每个图形生成器都暴露了一个如何将数据映射到可视化表现的访问器。

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
scale.invert(640) // Sat Jan 01 2000 16:00:00 GMT-0800 (PST)
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

#### 绘制坐标系（d3-axis）

这里使用d3.axisBottom跟d3.axisLeft分别构建刻度在下和刻度在左的坐标轴生成器作为X，Y轴。

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

坐标轴组件包含类名为 “domain” 的path元素，表示比例尺的输入范围，一组类名为 “tick” 的并且被坐标变换的 g elements 表示比例尺的刻度。每个刻度包含一个 line element 表示刻度线以及一个 text element 表示刻度标签。
可以通过这些组件来自定义坐标轴等样式：
``` javascript
g.append("g")
  .call(customYAxis)

function customYAxis(g) {
  g.call(yAxis)
  g.select(".domain").remove()
  g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "#777").attr("stroke-dasharray", "2,2")
  g.selectAll(".tick text").attr("x", 4).attr("dy", -4)
}
```

#### 过渡动画
[Scott Murray的教程](http://alignedleft.com/projects/2014/easy-as-pi/)
