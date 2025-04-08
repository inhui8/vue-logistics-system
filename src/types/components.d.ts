import 'vue';

declare module 'vue' {
  export interface GlobalComponents {
    FilterPanel: typeof import('@/components/logistics/FilterPanel.vue')['default'];
    GroupableTable: typeof import('@/components/logistics/GroupableTable.vue')['default'];
    HistoryRecordDialog: typeof import('@/components/logistics/HistoryRecordDialog.vue')['default'];
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $message: typeof import('element-plus')['ElMessage'];
    $messageBox: typeof import('element-plus')['ElMessageBox'];
  }
} 