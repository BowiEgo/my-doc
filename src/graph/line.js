import * as d3 from 'd3-shape'
import * as d3Interpolate from 'd3-interpolate'

function Line (collection, opts, points) {
  this.container = collection
  this.opts = DEFAULT_OPTIONS
}
