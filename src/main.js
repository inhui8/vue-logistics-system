import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import STable from '@surely-vue/table'
import '@surely-vue/table/dist/index.css'

// 简化 ResizeObserver 错误处理方案
const handleResizeObserverError = () => {
  // 1. 忽略 ResizeObserver 相关错误
  const originalError = window.console.error;
  window.console.error = function() {
    if (arguments[0] && typeof arguments[0] === 'string' && 
        (arguments[0].includes('ResizeObserver') || arguments[0].includes('stopPropagation'))) {
      // 忽略这些错误
      return;
    }
    originalError.apply(console, arguments);
  };

  // 2. 防止过于频繁的回调
  const ResizeObserverPrototype = window.ResizeObserver.prototype;
  const originalObserve = ResizeObserverPrototype.observe;
  ResizeObserverPrototype.observe = function(target) {
    if (target && 
        (target.classList.contains('el-table') || 
         target.classList.contains('el-drawer__container') || 
         target.classList.contains('el-tabs__nav'))) {
      // 给敏感的组件添加防抖样式
      target.style.contain = 'content';
    }
    return originalObserve.apply(this, arguments);
  };
};

// 应用错误处理
handleResizeObserverError();

const app = createApp(App)

app.use(store)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})
app.use(STable)

app.mount('#app') 