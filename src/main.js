import Vue from 'vue'
import Doc1 from './doc1.md'
import Doc2 from './doc2.md'
import Doc3 from './doc3.md'
import smoothAnni from './smoothAnni.md'
import 'highlight.js/styles/atom-one-dark.css'
import './assets/styles/markdown.stylus'
import './assets/styles/doc.stylus'
import D3Graph from './components/D3Graph/index'
import CanvasAnni from './components/CanvasAnni/index'
import ImageCard from './components/ImageCard/index'
Vue.use(D3Graph)
Vue.use(CanvasAnni)
Vue.use(ImageCard)
Vue.config.productionTip = false

new Vue({
  render: h => h(smoothAnni)
}).$mount('#app')
