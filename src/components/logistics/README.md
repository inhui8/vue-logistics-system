# 物流系统组件库

这是一个基于Vue 3和Element Plus的物流系统组件库，提供了一套完整的物流数据管理界面组件，包括表格、筛选、分组、排序等功能。

## 特性

- 完全响应式设计
- 支持数据筛选、排序和分组
- 支持单元格编辑
- 支持数据导出
- 支持批量操作
- 自定义列配置
- 丰富的表格样式和交互
- 完整的TypeScript类型定义

## 安装

```bash
# npm
npm install vue-logistics-components

# yarn
yarn add vue-logistics-components
```

## 使用方法

### 全局注册

```js
import { createApp } from 'vue';
import LogisticsComponents from 'vue-logistics-components';
import App from './App.vue';

const app = createApp(App);
app.use(LogisticsComponents);
app.mount('#app');
```

### 局部注册

```js
import { LogisticsTable } from 'vue-logistics-components';

export default {
  components: {
    LogisticsTable
  }
};
```

## 组件列表

### LogisticsTable

主要的物流表格组件，集成了所有功能。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| tableId | String | 'logistics-table' | 表格标识，用于区分不同的表格 |
| rowKey | String | 'id' | 行数据的唯一标识字段 |
| columns | Array | [] | 列配置 |
| initialVisibleColumns | Array | [] | 初始可见列 |
| filterFields | Array | [] | 筛选字段配置 |
| statusOptions | Array | [] | 状态选项 |
| dateField | String | 'createdAt' | 日期字段 |
| batchActions | Array | [] | 批量操作配置 |
| groupColumnLabel | String | '分组' | 分组列标签 |
| showOperation | Boolean | true | 是否显示操作列 |
| operationColumnLabel | String | '操作' | 操作列标签 |
| operationColumnWidth | Number/String | 120 | 操作列宽度 |
| operationButtonText | String | '操作' | 操作按钮文本 |
| operationActions | Array | [] | 操作列下拉菜单 |
| operationAdditionalButtons | Array | [] | 操作列额外按钮 |

#### 事件

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| search | params | 搜索事件 |
| reset | - | 重置事件 |
| add | - | 添加事件 |
| refresh | - | 刷新事件 |
| export | params | 导出事件 |
| batch-command | { command, rows } | 批量操作命令事件 |
| selection-change | selection | 选择变化事件 |
| cell-click | row, column, cell, event | 单元格点击事件 |
| cell-dbl-click | row, field | 单元格双击事件 |
| cell-edit-confirm | row, field | 单元格编辑确认事件 |
| tag-close | row, field, tag | 标签关闭事件 |
| size-change | size | 分页大小变化事件 |
| current-change | page | 当前页变化事件 |
| operation-command | { command, row } | 操作命令事件 |
| operation-button-click | { command, row } | 操作按钮点击事件 |

### GroupableTable

可分组表格组件，支持多级分组和树形展示。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| data | Array | [] | 表格数据 |
| rowKey | String | 'id' | 行数据的唯一标识字段 |
| groupFields | Array | [] | 分组字段 |
| showSelection | Boolean | true | 是否展示选择列 |
| showGroupColumn | Boolean | true | 是否展示分组列 |
| groupColumnLabel | String | '分组' | 分组列标题 |
| groupColumnWidth | Number/String | 180 | 分组列宽度 |
| groupColumnFixed | Boolean/String | 'left' | 分组列是否固定 |
| defaultExpandAll | Boolean | true | 默认是否展开所有 |
| showPagination | Boolean | true | 是否显示分页 |
| currentPage | Number | 1 | 当前页码 |
| pageSize | Number | 20 | 每页数量 |
| pageSizes | Array | [10, 20, 50, 100] | 可选的每页数量 |
| total | Number | 0 | 总数据量 |

#### 事件

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| selection-change | selection | 选择变化事件 |
| cell-click | row, column, cell, event | 单元格点击事件 |
| size-change | size | 分页大小变化事件 |
| current-change | page | 当前页变化事件 |
| cell-dbl-click | row, field | 单元格双击事件 |
| cell-edit-confirm | row, field | 单元格编辑确认事件 |
| tag-close | row, field, tag | 标签关闭事件 |

### FilterArea

筛选区域组件，支持快速筛选和高级筛选。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| filterFields | Array | [] | 筛选字段配置 |
| statusOptions | Array | [] | 状态选项 |
| showDateRange | Boolean | true | 是否显示日期范围筛选 |
| showStatusFilter | Boolean | true | 是否显示状态筛选 |
| dateField | String | 'createdAt' | 日期字段名 |

#### 事件

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| search | params | 搜索事件 |
| reset | - | 重置事件 |
| filter-change | params | 筛选条件变化事件 |

### TableToolbar

表格工具栏组件，包含批量操作、导出、列配置、排序、分组等功能。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| showBatchActions | Boolean | true | 是否显示批量操作 |
| batchActions | Array | [] | 批量操作列表 |
| selectedRows | Array | [] | 已选择的行 |
| showExport | Boolean | true | 是否显示导出 |
| showColumnSetting | Boolean | true | 是否显示字段配置 |
| showSort | Boolean | true | 是否显示排序 |
| showGroup | Boolean | true | 是否显示分组 |
| columns | Array | [] | 所有列配置 |
| defaultVisibleColumns | Array | [] | 默认可见列 |
| defaultSortFields | Array | [] | 排序字段 |
| defaultGroupFields | Array | [] | 分组字段 |

#### 事件

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| batch-command | { command, rows } | 批量操作命令事件 |
| clear-selection | - | 清除选择事件 |
| export | - | 导出事件 |
| update:columns | columns | 列更新事件 |
| sort-change | fields | 排序变化事件 |
| group-change | fields | 分组变化事件 |

### EditableTableColumn

可编辑表格列组件，支持多种编辑类型。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| prop | String | - | 列属性 |
| label | String | - | 列标签 |
| width | Number/String | 'auto' | 列宽度 |
| type | String | 'text' | 列类型，可选值：text/textarea/datetime/select/tags |
| editable | Boolean | true | 是否可编辑 |
| options | Array | [] | 选择器选项 |
| placeholder | String | '' | 占位符 |
| showSummary | Boolean | false | 是否显示分组摘要 |
| summaryProperty | String | '' | 摘要属性名 |
| getTagType | Function | null | 获取标签类型函数 |
| getTagText | Function | null | 获取标签文本函数 |

#### 事件

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| cell-click | row, field | 单元格点击事件 |
| cell-dbl-click | row, field | 单元格双击事件 |
| cell-edit-confirm | row, field | 单元格编辑确认事件 |
| tag-close | row, field, tag | 标签关闭事件 |

### OperationColumn

操作列组件，支持下拉菜单和额外按钮。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| label | String | '操作' | 列标签 |
| width | Number/String | 120 | 列宽度 |
| buttonText | String | '操作' | 按钮文本 |
| actions | Array | [] | 操作列表 |
| additionalButtons | Array | [] | 额外按钮 |

#### 事件

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| command | { command, row } | 命令事件 |
| button-click | { command, row } | 按钮点击事件 |

## 自定义指令

### v-focus

自动聚焦元素，在编辑模式下非常有用。

```html
<el-input v-focus />
```

### v-click-outside

检测点击元素外部的操作。

```html
<div v-click-outside="handleClickOutside">...</div>
```

### v-drag

使元素可拖拽。

```html
<div v-drag>可拖拽元素</div>
```

### v-permission

根据用户权限控制元素是否显示。

```html
<button v-permission="'admin'">管理员操作</button>
<button v-permission="['admin', 'editor']">多角色操作</button>
```

### v-number

限制输入框只能输入数字。

```html
<el-input v-number />          <!-- 允许小数 -->
<el-input v-number.int />      <!-- 只允许整数 -->
```

## 示例

```vue
<template>
  <div>
    <logistics-table
      tableId="example-table"
      :columns="columns"
      :filterFields="filterFields"
      :statusOptions="statusOptions"
      :batchActions="batchActions"
      :operationActions="operationActions"
      @search="handleSearch"
      @add="handleAdd"
      @export="handleExport"
      @operation-command="handleOperationCommand"
      @cell-edit-confirm="handleCellEditConfirm"
    />
  </div>
</template>

<script>
import { LogisticsTable } from 'vue-logistics-components';
import { ref, reactive, onMounted } from 'vue';

export default {
  components: {
    LogisticsTable
  },
  setup() {
    // 列配置
    const columns = [
      { prop: 'containerNo', label: '柜号', width: 150, required: true, sortable: true, groupable: true },
      { prop: 'waybillNo', label: '运单号', width: 180, required: true, sortable: true, groupable: true },
      { prop: 'status', label: '状态', width: 120, editable: true, type: 'select', options: statusOptions, sortable: true, groupable: true }
    ];
    
    // 状态选项
    const statusOptions = [
      { value: 'created', label: '已创建' },
      { value: 'processing', label: '处理中' },
      { value: 'completed', label: '已完成' }
    ];
    
    // 其他配置和事件处理...
    
    return {
      columns,
      statusOptions,
      // ...
    };
  }
}
</script>
```

## 许可证

MIT 