/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $message: typeof import('element-plus')['ElMessage']
    $messageBox: typeof import('element-plus')['ElMessageBox']
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $message: typeof import('element-plus')['ElMessage']
    $messageBox: typeof import('element-plus')['ElMessageBox']
  }
} 