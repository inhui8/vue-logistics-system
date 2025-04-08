<template>
  <div class="table-surely-demo">
    <!-- 顶部筛选区 -->
    <div class="filter-bar">
      <div class="filter-row">
        <!-- 仓库选择 -->
        <el-select v-model="filterForm.warehouse" placeholder="仓库" size="small" class="filter-item">
          <el-option label="美西二号仓" value="west2"></el-option>
          <el-option label="美西一号仓" value="west1"></el-option>
        </el-select>
        
        <!-- 日期类型 -->
        <el-select v-model="filterForm.dateType" placeholder="日期类型" size="small" class="filter-item">
          <el-option label="创建日期" value="create"></el-option>
          <el-option label="更新日期" value="update"></el-option>
        </el-select>
        
        <!-- 日期范围 -->
        <el-date-picker
          v-model="filterForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          class="date-range-picker"
        ></el-date-picker>
        
        <!-- 搜索类型 -->
        <el-select v-model="filterForm.searchType" placeholder="搜索类型" size="small" class="filter-item">
          <el-option label="车次号" value="trainNumber"></el-option>
          <el-option label="出单日期" value="issueDate"></el-option>
          <el-option label="出单人" value="issuer"></el-option>
          <el-option label="装车类型" value="loadingType"></el-option>
          <el-option label="派送类型" value="deliveryType"></el-option>
          <el-option label="司机登记时间" value="driverRegisterTime"></el-option>
          <el-option label="装车开始时间" value="loadingStartTime"></el-option>
          <el-option label="装车结束时间" value="loadingEndTime"></el-option>
          <el-option label="车厢号" value="carNumber"></el-option>
          <el-option label="装车人" value="loader"></el-option>
          <el-option label="DOCK号" value="dockNumber"></el-option>
          <el-option label="装车状态" value="loadingStatus"></el-option>
          <el-option label="出库组备注" value="warehouseRemarks"></el-option>
          <el-option label="司机驾照" value="driverLicense"></el-option>
          <el-option label="司机车牌号" value="licensePlate"></el-option>
          <el-option label="司机电话" value="driverPhone"></el-option>
          <el-option label="提货供应商" value="supplier"></el-option>
          <el-option label="实际出库板数" value="actualPallets"></el-option>
          <el-option label="合板数量" value="palletsMerged"></el-option>
          <el-option label="装车预约时间" value="loadingAppointmentTime"></el-option>
          <el-option label="重量" value="weight"></el-option>
          <el-option label="方数" value="cubicMeter"></el-option>
          <el-option label="总板数" value="totalPallets"></el-option>
          <el-option label="派送成本" value="deliveryCost"></el-option>
          <el-option label="Memo" value="Memo"></el-option>
          <el-option label="跟进记录" value="Followup"></el-option>
          <el-option label="司机出发时间" value="DriverStartTime"></el-option>
          <el-option label="司机到达时间" value="DriverEndTime"></el-option>
          <el-option label="交仓完成时间" value="Arrived"></el-option>
          <el-option label="POD图片" value="podImage"></el-option>
        </el-select>
        
        <!-- 搜索框 -->
        <el-input 
          v-model="filterForm.searchText" 
          placeholder="搜索内容" 
          size="small"
          class="search-input"
        ></el-input>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
          <el-button size="small" @click="resetFilter">重置</el-button>
          <el-button size="small" @click="handleExport">导出</el-button>
        </div>
      </div>
    </div>

    <!-- 视图管理 -->
    <div class="view-management">
      <!-- 状态筛选 & 自定义视图 -->
      <el-radio-group v-model="currentViewId" size="small" class="status-view-group">
        <!-- 预设状态视图 -->
        <el-radio-button label="all">全部({{totalCountForViews.all || 0}})</el-radio-button>
        <!-- 自定义视图 -->
        <el-radio-button 
          v-for="view in customViews" 
          :key="view.id" 
          :label="view.id"
          @contextmenu="showViewContextMenu($event, view.id)"
        >
          {{view.name}}
        </el-radio-button>
      </el-radio-group>
      
      <!-- 视图工具 -->
      <div class="view-tools">
        <el-button type="text" size="small" @click="showSaveViewDialog">保存视图</el-button>
        <el-button type="text" size="small" @click="showGroupingDialog">高级分组</el-button>
        <el-button type="text" size="small" @click="showSortingDialog">高级排序</el-button>
        <el-button type="text" size="small" @click="showFilterDialog">筛选</el-button>
        <el-button type="text" size="small" @click="showColumnSettings">字段配置</el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <s-table
        :dataSource="tableData"
        :columns="visibleColumns"
        :rowKey="record => record.id"
        :pagination="paginationConfig"
        :rowSelection="rowSelectionConfig"
        :loading="loading"
        @change="handleTableChange"
        :scroll="{ x: 1500 }"
        :expandable="{
          expandedRowKeys: expandedRows,
          expandRowByClick: true,
          rowExpandable: record => !record.isGroup,
          indentSize: 30,
          onExpand: (expanded, record) => {
            if (expanded) {
              expandedRows.push(record.id);
            } else {
              const index = expandedRows.indexOf(record.id);
              if (index > -1) {
                expandedRows.splice(index, 1);
              }
            }
          }
        }"
      >
        <template #expandedRowRender="{ record }">
          <div class="expanded-row-content">
            <div class="expanded-info">
              <div class="info-item">
                <span class="info-label">装车开始时间:</span>
                <span class="info-value">{{ record.loadingStartTime || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">装车结束时间:</span>
                <span class="info-value">{{ record.loadingEndTime || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">司机登记时间:</span>
                <span class="info-value">{{ record.driverRegisterTime || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">车厢号:</span>
                <span class="info-value">{{ record.carNumber || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">装车人:</span>
                <span class="info-value">{{ record.loader || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">DOCK号:</span>
                <span class="info-value">{{ record.dockNumber || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">装车状态:</span>
                <span class="info-value">{{ record.loadingStatus || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">出库组备注:</span>
                <span class="info-value">{{ record.warehouseRemarks || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">司机驾照:</span>
                <span class="info-value">{{ record.driverLicense || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">司机车牌号:</span>
                <span class="info-value">{{ record.licensePlate || '-' }}</span>
              </div>
            </div>
          </div>
        </template>
        <!-- 自定义列渲染 -->
        <template #bodyCell="{ column, record }">
          <!-- 分组行显示 -->
          <template v-if="record.isGroup">
            <div v-if="column.key === 'trainNumber'" class="group-name" :class="`group-level-${record.groupLevel}`">
              <div class="group-content">
                <span class="group-text">{{ record.groupName }}</span>
                <span class="group-count">({{ record.count }})</span>
              </div>
            </div>
            <span v-else>-</span>
          </template>

          <!-- 可编辑字段的渲染 -->
          <template v-else-if="isEditableField(column.key)">
            <div class="cell-wrapper">
              <div v-if="editingCell.id === record.id && editingCell.field === column.key" class="cell-editor">
                <el-input
                  v-model="editingCell.value"
                  size="small"
                  @blur="handleEditBlur(record, column.key)"
                  @keyup.enter="handleEditConfirm(record, column.key)"
                  @keyup.esc="cancelEdit"
                ></el-input>
              </div>
              <div v-else class="editable-cell" @click="handleCellClick(record, column.key)" @dblclick="handleCellDbClick(record, column.key)">
                <span 
                  class="cell-content" 
                  :class="{ 'show-full': hoverState.id === record.id && hoverState.field === column.key }"
                  @mouseenter="handleMouseEnter(record, column.key)"
                  @mouseleave="handleMouseLeave"
                >{{ record[column.key] || '-' }}</span>
              </div>
            </div>
          </template>
          <!-- 普通数据行显示 -->
          <template v-else>
            <!-- 状态列 -->
            <template v-if="column.key === 'loadingStatus'">
              <div class="cell-wrapper">
                <span class="cell-content">
                  <el-tag :type="getStatusType(record.loadingStatus)" size="small">
                    {{ record.loadingStatus }}
                  </el-tag>
                </span>
              </div>
            </template>
            <!-- 操作列 -->
            <template v-else-if="column.key === 'operation'">
              <el-button type="text" size="small" @click="handleEdit(record)">编辑</el-button>
              <el-button type="text" size="small" @click="handleMore(record)">更多</el-button>
            </template>
            <!-- 其他普通列 -->
            <template v-else>
              <div class="cell-wrapper">
                <span 
                  class="cell-content" 
                  :class="{ 'show-full': hoverState.id === record.id && hoverState.field === column.key }"
                  @mouseenter="handleMouseEnter(record, column.key)"
                  @mouseleave="handleMouseLeave"
                >{{ record[column.key] || '-' }}</span>
              </div>
            </template>
          </template>
        </template>
      </s-table>
    </div>

    <!-- 高级分组对话框 -->
    <el-dialog
      title="高级分组"
      v-model="groupingDialog.visible"
      width="500px"
    >
      <div class="grouping-content">
        <el-form :model="groupingDialog.form" label-width="80px">
          <el-form-item label="一级分组">
            <el-select v-model="groupingDialog.form.firstLevel" placeholder="请选择一级分组字段" clearable>
              <el-option
                v-for="field in groupableFields"
                :key="field.key"
                :label="field.title"
                :value="field.key"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="二级分组">
            <el-select v-model="groupingDialog.form.secondLevel" placeholder="请选择二级分组字段" clearable>
              <el-option
                v-for="field in groupableFields"
                :key="field.key"
                :label="field.title"
                :value="field.key"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="三级分组">
            <el-select v-model="groupingDialog.form.thirdLevel" placeholder="请选择三级分组字段" clearable>
              <el-option
                v-for="field in groupableFields"
                :key="field.key"
                :label="field.title"
                :value="field.key"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="clearGrouping">清除分组</el-button>
        <el-button @click="groupingDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="applyGrouping">确定</el-button>
      </template>
    </el-dialog>

    <!-- 高级排序对话框 -->
    <el-dialog
      title="高级排序"
      v-model="sortingDialog.visible"
      width="500px"
    >
      <div class="sorting-content">
        <el-form label-width="80px">
          <el-form-item label="一级排序">
            <div class="sort-item">
              <el-select v-model="sortingDialog.form.firstSort.field" placeholder="请选择排序字段" clearable class="sort-field">
                <el-option
                  v-for="field in sortableFields"
                  :key="field.key"
                  :label="field.title"
                  :value="field.key"
                ></el-option>
              </el-select>
              <el-select v-model="sortingDialog.form.firstSort.order" placeholder="排序方式" class="sort-order">
                <el-option label="升序" value="ascend"></el-option>
                <el-option label="降序" value="descend"></el-option>
              </el-select>
            </div>
          </el-form-item>
          <el-form-item label="二级排序">
            <div class="sort-item">
              <el-select v-model="sortingDialog.form.secondSort.field" placeholder="请选择排序字段" clearable class="sort-field">
                <el-option
                  v-for="field in sortableFields"
                  :key="field.key"
                  :label="field.title"
                  :value="field.key"
                ></el-option>
              </el-select>
              <el-select v-model="sortingDialog.form.secondSort.order" placeholder="排序方式" class="sort-order">
                <el-option label="升序" value="ascend"></el-option>
                <el-option label="降序" value="descend"></el-option>
              </el-select>
            </div>
          </el-form-item>
          <el-form-item label="三级排序">
            <div class="sort-item">
              <el-select v-model="sortingDialog.form.thirdSort.field" placeholder="请选择排序字段" clearable class="sort-field">
                <el-option
                  v-for="field in sortableFields"
                  :key="field.key"
                  :label="field.title"
                  :value="field.key"
                ></el-option>
              </el-select>
              <el-select v-model="sortingDialog.form.thirdSort.order" placeholder="排序方式" class="sort-order">
                <el-option label="升序" value="ascend"></el-option>
                <el-option label="降序" value="descend"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="clearSorting">清除排序</el-button>
        <el-button @click="sortingDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="applySorting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 字段配置对话框 -->
    <el-dialog
      title="字段配置"
      v-model="columnDialog.visible"
      width="600px"
    >
      <div class="column-settings-dialog">
        <div class="column-settings-header">
           <span>拖拽调整顺序，勾选控制显隐</span>
           <el-button type="primary" plain size="small" @click="resetColumnSettings">恢复默认</el-button>
        </div>
        <div class="column-list-container">
          <draggable
            v-model="columnDialog.settingsList"
            item-key="key"
            handle=".drag-handle"
            ghost-class="ghost"
            class="column-draggable-list"
          >
            <template #item="{ element }">
              <div class="column-item">
                <el-icon class="drag-handle" title="拖拽排序"><Rank /></el-icon>
                <el-checkbox v-model="element.visible">{{ element.title }}</el-checkbox>
              </div>
            </template>
          </draggable>
        </div>
      </div>
      <template #footer>
        <el-button @click="columnDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="applyColumnSettings">确定</el-button>
      </template>
    </el-dialog>

    <!-- 高级筛选对话框 -->
    <el-dialog
      title="高级筛选"
      v-model="filterDialog.visible"
      width="700px"
    >
      <div class="filter-dialog-content">
        <div class="filter-logic-row">
          <span class="filter-logic-label">筛选逻辑:</span>
          <el-radio-group v-model="filterDialog.logic" size="small">
            <el-radio-button label="and">且 (AND)</el-radio-button>
            <el-radio-button label="or">或 (OR)</el-radio-button>
          </el-radio-group>
        </div>

        <div class="filter-conditions">
          <div v-for="(filter, index) in filterDialog.conditions" :key="index" class="filter-condition-row">
            <el-select v-model="filter.field" placeholder="选择字段" size="small" class="filter-field">
              <el-option
                v-for="col in filterableColumns"
                :key="col.key"
                :label="col.title"
                :value="col.key"
              ></el-option>
            </el-select>
            <el-select v-model="filter.operator" placeholder="选择条件" size="small" class="filter-operator">
              <el-option label="等于" value="eq"></el-option>
              <el-option label="不等于" value="neq"></el-option>
              <el-option label="包含" value="contains"></el-option>
              <el-option label="不包含" value="notContains"></el-option>
              <el-option label="大于" value="gt"></el-option>
              <el-option label="大于等于" value="gte"></el-option>
              <el-option label="小于" value="lt"></el-option>
              <el-option label="小于等于" value="lte"></el-option>
            </el-select>
            <el-input
              v-model="filter.value"
              placeholder="输入值"
              size="small"
              class="filter-value"
            />
            <el-button 
              type="danger" 
              size="small" 
              circle
              class="remove-condition"
              @click="removeFilterCondition(index)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="add-condition-row">
          <el-button type="primary" plain size="small" @click="addFilterCondition">
            <el-icon><Plus /></el-icon>
            添加条件
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="filterDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="applyFilters">应用筛选</el-button>
      </template>
    </el-dialog>

    <!-- 保存视图对话框 -->
    <el-dialog
      title="保存视图"
      v-model="saveViewDialog.visible"
      width="400px"
    >
      <el-form :model="saveViewDialog" label-width="80px">
        <el-form-item label="视图名称" required>
          <el-input v-model="saveViewDialog.viewName" placeholder="请输入视图名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveViewDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveCurrentView">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重命名视图对话框 -->
    <el-dialog
      title="重命名视图"
      v-model="renameViewDialog.visible"
      width="400px"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item label="新名称" required>
          <el-input 
            v-model="renameViewDialog.newName" 
            placeholder="请输入新的视图名称"
            @keyup.enter="confirmRenameView"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameViewDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmRenameView">确定</el-button>
      </template>
    </el-dialog>

    <!-- 视图右键菜单 -->
    <div 
      v-if="viewContextMenu.visible" 
      class="context-menu" 
      :style="{
        top: viewContextMenu.top + 'px',
        left: viewContextMenu.left + 'px',
        position: 'fixed',
        zIndex: 2000
      }"
    >
      <div class="context-menu-item" @click="handleRenameView">重命名</div>
      <div class="context-menu-item" @click="handleDeleteView">删除</div>
    </div>

    <!-- 添加编辑确认对话框 -->
    <el-dialog
      title="确认修改"
      v-model="editConfirmDialog.visible"
      width="400px"
    >
      <div class="edit-confirm-content">
        <p>是否保存修改？</p>
        <div class="edit-value">
          <div>原值：{{ editConfirmDialog.oldValue || '空' }}</div>
          <div>新值：{{ editConfirmDialog.newValue || '空' }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" @click="confirmEdit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加弹窗编辑对话框 -->
    <el-dialog
      :title="editDialog.title"
      v-model="editDialog.visible"
      width="500px"
    >
      <div class="edit-dialog-content">
        <el-form label-width="100px">
          <el-form-item :label="editDialog.fieldLabel">
            <el-input
              v-if="!editDialog.isTextarea"
              v-model="editDialog.value"
              :placeholder="'请输入' + editDialog.fieldLabel"
            ></el-input>
            <el-input
              v-else
              v-model="editDialog.value"
              type="textarea"
              :rows="4"
              :placeholder="'请输入' + editDialog.fieldLabel"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleEditDialogConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { STable } from '@surely-vue/table';
import '@surely-vue/table/dist/index.css';
import draggable from 'vuedraggable';
import { Rank, Delete, Plus } from '@element-plus/icons-vue';
import trainsData from '@/assets/json/deliveryTrainsData.json';
import trainsColumns from '@/assets/json/deliveryTrainsColumns.json';

// --- 数据 & 列定义 --- 
const baseColumnDefs = trainsColumns.map(col => ({
  ...col,
  key: col.prop,
  dataIndex: col.prop,
  title: col.label,
  width: col.width,
  fixed: col.fixed,
  sorter: col.sortable ? (a, b) => {
    const valA = a[col.prop];
    const valB = b[col.prop];
    if (typeof valA === 'number') return valA - valB;
    if (valA < valB) return -1;
    if (valA > valB) return 1;
    return 0;
  } : undefined
}));

// --- 基础状态 --- 
const filterForm = ref({ warehouse: '', dateType: 'create', dateRange: [], searchType: 'trainNumber', searchText: '' });
const loading = ref(false);
const rawTableData = ref([]);
const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const selectedRowKeys = ref([]);
const orderedVisibleColumns = ref([]);
const processedData = ref([]);
const groupFields = ref([]);
const groupColumns = ref([]);

// --- 视图管理状态 --- 
const currentViewId = ref('all');
const customViews = ref([]); 
const saveViewDialog = reactive({ visible: false, viewName: '' });
const renameViewDialog = reactive({ visible: false, targetViewId: null, newName: '' });
const viewContextMenu = reactive({
  visible: false,
  top: 0,
  left: 0,
  targetViewId: null
});
const totalCountForViews = reactive({ all: 0 });

// --- 其他状态 --- 
const groupingDialog = ref({ 
  visible: false, 
  form: { 
    firstLevel: '', 
    secondLevel: '', 
    thirdLevel: '' 
  } 
});

const defaultSortForm = {
  firstSort: { field: '', order: 'ascend' },
  secondSort: { field: '', order: 'ascend' },
  thirdSort: { field: '', order: 'ascend' }
};

const sortingDialog = ref({
  visible: false,
  form: { ...defaultSortForm }
});

const columnDialog = ref({ visible: false, settingsList: [] });
const filterDialog = reactive({ visible: false, conditions: [], logic: 'and' });
const activeFilters = ref([]);
const filterLogic = ref('and');

// --- 计算属性 --- 
const filterableColumns = computed(() => baseColumnDefs.filter(col => col.prop !== 'operation'));
const groupableFields = computed(() => baseColumnDefs.filter(col => ['supplier', 'loadingStatus', 'loadingType', 'deliveryType', 'issuer'].includes(col.prop)));
const sortableFields = computed(() => baseColumnDefs.filter(col => col.sortable && col.prop !== 'operation'));
const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showTotal: (totalCount) => `共 ${totalCount} 条数据`
}));
const rowSelectionConfig = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange(keys, rows) {
    selectedRowKeys.value = keys;
    handleSelectionChange(rows.filter(row => !row.isGroup));
  },
  getCheckboxProps(record) {
    return {
      disabled: record.isGroup // 禁用分组行的复选框
    };
  }
}));

// 计算可见列
const visibleColumns = computed(() => {
  return orderedVisibleColumns.value.filter(col => col.visible !== false);
});

// --- 方法 --- 

// 处理选择变化 (Placeholder - define the actual logic needed)
const handleSelectionChange = (selectedRows) => {
  console.log('Selected rows:', selectedRows);
  // Add logic to handle selection, e.g., store selected items for batch actions
};

// 初始化列
const initializeColumns = () => {
  orderedVisibleColumns.value = baseColumnDefs.map(col => ({ ...col, visible: true }));
};

// 保存/加载视图到 localStorage
const VIEW_STORAGE_KEY = 'tableSurelyDemoViews_v2';
const loadViewsFromStorage = () => {
  try {
    const savedViews = localStorage.getItem(VIEW_STORAGE_KEY);
    if (savedViews) {
      customViews.value = JSON.parse(savedViews);
    }
  } catch (err) {
    console.error('加载视图失败:', err);
    ElMessage.error('加载视图失败');
    customViews.value = [];
  }
};
const saveViewsToStorage = () => {
  try {
    const viewsToSave = JSON.stringify(customViews.value);
    localStorage.setItem(VIEW_STORAGE_KEY, viewsToSave);
  } catch (err) {
    console.error('保存视图失败:', err);
    ElMessage.error('保存视图失败，请重试');
  }
};

// 保存当前视图
const showSaveViewDialog = () => {
  saveViewDialog.viewName = '';
  saveViewDialog.visible = true;
};

const saveCurrentView = () => {
  const name = saveViewDialog.viewName.trim();
  if (!name) {
    ElMessage.warning('请输入视图名称');
    return;
  }
  if (customViews.value.some(v => v.name === name)) {
    ElMessage.warning('视图名称已存在');
    return;
  }
  const currentConfig = {
    filters: JSON.parse(JSON.stringify(activeFilters.value)),
    filterLogic: filterLogic.value,
    sorting: { ...sortingDialog.value.form },
    grouping: { ...groupingDialog.value.form },
    columns: orderedVisibleColumns.value.map(col => ({ key: col.key, visible: col.visible }))
  };
  const newView = {
    id: `custom-${Date.now()}`,
    name: name,
    config: currentConfig
  };
  customViews.value.push(newView);
  saveViewsToStorage(); // Call to save
  saveViewDialog.visible = false;
  currentViewId.value = newView.id;
  ElMessage.success('视图保存成功');
};

// 应用视图配置
const applyViewConfig = (config) => {
  activeFilters.value = config.filters ? JSON.parse(JSON.stringify(config.filters)) : [];
  filterLogic.value = config.filterLogic || 'and';
  sortingDialog.value.form = config.sorting ? { ...config.sorting } : { field: '', order: 'ascend' };
  groupingDialog.value.form = config.grouping ? { ...config.grouping } : { firstLevel: '', secondLevel: '', thirdLevel: '' };
  if (config.columns) {
    // Create a map for faster lookup
    const savedColumnsMap = new Map(config.columns.map(c => [c.key, c.visible]));
    orderedVisibleColumns.value = baseColumnDefs.map(baseCol => ({
      ...baseCol,
      visible: savedColumnsMap.has(baseCol.key) ? savedColumnsMap.get(baseCol.key) : true
    }));
  } else {
    initializeColumns();
  }
  filterDialog.conditions = JSON.parse(JSON.stringify(activeFilters.value));
  filterDialog.logic = filterLogic.value;
};

// 重置为默认状态
const resetToDefaultState = () => {
  filterForm.value = { warehouse: '', dateType: 'create', dateRange: [], searchType: 'trainNumber', searchText: '' };
  activeFilters.value = [];
  filterLogic.value = 'and';
  sortingDialog.value.form = { field: '', order: 'ascend' };
  groupingDialog.value.form = { firstLevel: '', secondLevel: '', thirdLevel: '' };
  initializeColumns();
  filterDialog.conditions = [];
  filterDialog.logic = 'and';
};

// 监听视图 ID 变化
watch(currentViewId, (newId, oldId) => {
  if (newId === oldId) return;
  const customView = customViews.value.find(v => v.id === newId);
  if (newId === 'all') {
    resetToDefaultState();
  } else if (customView) {
    applyViewConfig(customView.config);
  } else {
    console.warn(`View ID not found: ${newId}, resetting to default.`);
    resetToDefaultState();
    currentViewId.value = 'all';
  }
  currentPage.value = 1;
  loadData();
});

// --- 右键菜单 & 视图管理 --- 
// ... (showViewContextMenu, closeViewContextMenu)
const showViewContextMenu = (event, viewId) => {
  event.preventDefault();
  event.stopPropagation();
  
  // 设置菜单位置和状态
  viewContextMenu.targetViewId = viewId;
  viewContextMenu.top = event.clientY;
  viewContextMenu.left = event.clientX;
  viewContextMenu.visible = true;
  
  // 添加全局点击事件监听器来关闭菜单
  const closeMenu = () => {
    viewContextMenu.visible = false;
    viewContextMenu.targetViewId = null;
    window.removeEventListener('click', closeMenu);
    window.removeEventListener('contextmenu', closeMenu);
  };
  
  // 使用 nextTick 确保在 DOM 更新后添加事件监听器
  nextTick(() => {
    window.addEventListener('click', closeMenu);
    window.addEventListener('contextmenu', closeMenu);
  });
};

const handleDeleteView = async () => {
  const viewId = viewContextMenu.targetViewId;
  if (!viewId) return;
  
  try {
    await ElMessageBox.confirm('确定要删除此视图吗？', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const viewIndex = customViews.value.findIndex(v => v.id === viewId);
    if (viewIndex === -1) {
      ElMessage.error('未找到要删除的视图');
      return;
    }
    
    // 如果要删除的是当前视图，先切换到默认视图
    if (currentViewId.value === viewId) {
      currentViewId.value = 'all';
    }
    
    // 删除视图
    customViews.value.splice(viewIndex, 1);
    saveViewsToStorage();
    ElMessage.success('视图已删除');
    
  } catch (err) {
    // 用户取消删除，不做处理
  } finally {
    viewContextMenu.visible = false;
    viewContextMenu.targetViewId = null;
  }
};

const handleRenameView = () => {
  const viewId = viewContextMenu.targetViewId;
  if (!viewId) return;
  
  const view = customViews.value.find(v => v.id === viewId);
  if (!view) {
    ElMessage.error('未找到要重命名的视图');
    return;
  }
  
  renameViewDialog.targetViewId = viewId;
  renameViewDialog.newName = view.name;
  renameViewDialog.visible = true;
  
  // 关闭右键菜单
  viewContextMenu.visible = false;
  viewContextMenu.targetViewId = null;
};

const confirmRenameView = () => {
  const newName = renameViewDialog.newName?.trim();
  if (!newName) {
    ElMessage.warning('请输入新的视图名称');
    return;
  }
  
  const viewId = renameViewDialog.targetViewId;
  const viewIndex = customViews.value.findIndex(v => v.id === viewId);
  
  if (viewIndex === -1) {
    ElMessage.error('未找到要重命名的视图');
    return;
  }
  
  // 检查名称是否已存在
  const nameExists = customViews.value.some(v => 
    v.id !== viewId && v.name === newName
  );
  
  if (nameExists) {
    ElMessage.warning('视图名称已存在');
    return;
  }
  
  // 更新视图名称
  customViews.value[viewIndex] = {
    ...customViews.value[viewIndex],
    name: newName
  };
  
  // 保存到本地存储
  saveViewsToStorage();
  
  renameViewDialog.visible = false;
  ElMessage.success('视图已重命名');
};

// 加载数据
const loadData = () => {
  loading.value = true;
  
  setTimeout(() => {
    rawTableData.value = [...trainsData];
    processedData.value = [...rawTableData.value];
    let currentData = processedData.value;

    // 1. Apply Filters
    if (activeFilters.value.length > 0) {
      currentData = currentData.filter(filterFunction);
    }
    totalCountForViews.all = currentData.length;

    // 2. Apply Sorting
    initSortingState(); // 确保排序状态存在
    const { firstSort, secondSort, thirdSort } = sortingDialog.value.form;
    if (firstSort?.field || secondSort?.field || thirdSort?.field) {
      currentData.sort(sortFunction);
    }

    // 3. Apply Grouping
    if (groupFields.value.length > 0) {
      groupColumns.value = groupFields.value.map(field => 
        baseColumnDefs.find(c => c.key === field)
      );
      tableData.value = processGroupData(currentData);
    } else {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      tableData.value = currentData.slice(start, end);
    }
    
    loading.value = false;
  }, 300);
};

// 处理分组数据
const processGroupData = (items, level = 0, parentKey = '') => {
  if (level >= groupFields.value.length) return items;
  
  const currentField = groupFields.value[level];
  const currentColumn = groupColumns.value[level];
  const currentColumnTitle = currentColumn?.title || currentField;
  
  const levelGroupedMap = new Map();
  items.forEach(item => {
    const groupValue = item[currentField] ?? '未分组';
    if (!levelGroupedMap.has(groupValue)) {
      levelGroupedMap.set(groupValue, []);
    }
    levelGroupedMap.get(groupValue).push(item);
  });
  
  const result = [];
  levelGroupedMap.forEach((groupItems, groupValue) => {
    const groupId = `${parentKey ? parentKey + '-' : ''}group-${currentField}-${groupValue}`;
    const groupName = `${currentColumnTitle}: ${groupValue}`;
    
    const group = {
      id: groupId,
      isGroup: true,
      groupName,
      groupLevel: level + 1,
      count: groupItems.length,
      _disableCheckbox: true,
      parentGroupKey: parentKey,
      expanded: false,
      children: []
    };
    
    result.push(group);
    
    const subGroups = processGroupData(groupItems, level + 1, groupId);
    group.children = subGroups;
    result.push(...subGroups);
  });
  
  return result;
};

// --- 初始化 --- 
onMounted(() => {
  loadViewsFromStorage();
  initializeColumns();
  const initialViewId = currentViewId.value;
  const isValidCustomView = customViews.value.find(v => v.id === initialViewId);
  if (initialViewId !== 'all' && !isValidCustomView) {
    console.warn(`Initial view ID ${initialViewId} not found, defaulting to 'all'.`);
    currentViewId.value = 'all';
  }
  if (currentViewId.value === 'all') {
    resetToDefaultState();
    loadData();
  } else if (isValidCustomView) {
    applyViewConfig(isValidCustomView.config);
    loadData();
  }
});

// --- 按钮点击处理函数 --- 

// 显示高级分组对话框
const showGroupingDialog = () => {
  groupingDialog.value.visible = true; // Correctly set visible for ref
};

// 显示高级排序对话框
const showSortingDialog = () => {
  initSortingState();
  sortingDialog.value.visible = true;
};

// 显示高级筛选对话框
const showFilterDialog = () => {
  // Load current filters into dialog state
  filterDialog.conditions = JSON.parse(JSON.stringify(activeFilters.value));
  filterDialog.logic = filterLogic.value;
  if (filterDialog.conditions.length === 0) {
    addFilterCondition();
  }
  filterDialog.visible = true; // Correctly set visible for reactive
};

// 显示字段配置对话框
const showColumnSettings = () => {
  columnDialog.value.settingsList = orderedVisibleColumns.value.map(col => ({
    key: col.key,
    title: col.title,
    visible: col.visible !== false
  }));
  columnDialog.value.visible = true; // Correctly set visible for ref
};

// --- 其他方法 (applyFilters, addFilterCondition, etc.) ---

// 应用筛选
const applyFilters = () => {
  // ... (filter application logic - seems correct)
  const validConditions = filterDialog.conditions.filter(
    f => f.field && f.operator && (f.value !== '' && f.value !== null && f.value !== undefined)
  );
  // ... (validation and messages)
  activeFilters.value = JSON.parse(JSON.stringify(validConditions));
  filterLogic.value = filterDialog.logic;
  filterDialog.visible = false;
  currentPage.value = 1; 
  loadData();
};

// 添加筛选条件
const addFilterCondition = () => {
  filterDialog.conditions.push({ field: '', operator: '', value: '' });
};

// 移除筛选条件
const removeFilterCondition = (index) => {
  filterDialog.conditions.splice(index, 1);
};

// 应用分组设置
const applyGrouping = () => {
  const { firstLevel, secondLevel, thirdLevel } = groupingDialog.value.form;
  const currentGroupFields = [firstLevel, secondLevel, thirdLevel].filter(Boolean);
  
  if (currentGroupFields.length === 0) {
    ElMessage.warning('请至少选择一个分组字段');
    return;
  }
  
  groupFields.value = currentGroupFields;
  groupColumns.value = currentGroupFields.map(field => 
    baseColumnDefs.find(c => c.key === field)
  );
  
  currentPage.value = 1;
  loadData();
  groupingDialog.value.visible = false;
  ElMessage.success('分组已应用');
};

// 应用排序设置
const applySorting = () => {
  initSortingState();
  const { firstSort, secondSort, thirdSort } = sortingDialog.value.form;
  const hasSort = [firstSort, secondSort, thirdSort].some(sort => sort && sort.field);
  
  if (!hasSort) {
    ElMessage.warning('请至少选择一个排序字段');
    return;
  }
  
  currentPage.value = 1;
  loadData();
  sortingDialog.value.visible = false;
  ElMessage.success('排序已应用');
};

// 应用字段配置
const applyColumnSettings = () => {
  const selectedCount = columnDialog.value.settingsList.filter(col => col.visible).length;
  if (selectedCount === 0) {
    console.warn('请至少选择一个字段显示');
    return;
  }
  orderedVisibleColumns.value = columnDialog.value.settingsList
    .map(setting => {
      const baseCol = baseColumnDefs.find(col => col.key === setting.key);
      return baseCol ? { ...baseCol, visible: setting.visible } : null;
    })
    .filter(col => col !== null);
  columnDialog.value.visible = false;
};

// 重置字段配置
const resetColumnSettings = (showMessage = true) => {
    initializeColumns();
    if (columnDialog.value.visible) {
        columnDialog.value.settingsList = orderedVisibleColumns.value.map(col => ({
            key: col.key, title: col.title, visible: col.visible !== false
        }));
    }
    if (showMessage) {
        console.log('字段配置已恢复默认');
    }
};

// 过滤函数
const filterFunction = (item) => {
  if (!activeFilters.value || activeFilters.value.length === 0) return true;
  const results = activeFilters.value.map(filter => {
    const itemValue = item[filter.field];
    const filterValue = filter.value;
    if (itemValue === undefined || itemValue === null) return false;
    switch (filter.operator) {
      case 'eq': return String(itemValue).toLowerCase() === String(filterValue).toLowerCase();
      case 'neq': return String(itemValue).toLowerCase() !== String(filterValue).toLowerCase();
      case 'contains': return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
      case 'notContains': return !String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
      case 'gt': return Number(itemValue) > Number(filterValue);
      case 'gte': return Number(itemValue) >= Number(filterValue);
      case 'lt': return Number(itemValue) < Number(filterValue);
      case 'lte': return Number(itemValue) <= Number(filterValue);
      default: return true;
    }
  });
  return filterLogic.value === 'or' ? results.some(res => res) : results.every(res => res);
};

// 排序函数
const sortFunction = (a, b) => {
  const sorts = ['firstSort', 'secondSort', 'thirdSort']
    .map(key => sortingDialog.value.form[key])
    .filter(sort => sort && sort.field);

  for (const sort of sorts) {
    const valA = a[sort.field];
    const valB = b[sort.field];
    
    if (valA === valB) continue;
    
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sort.order === 'ascend' ? valA - valB : valB - valA;
    }
    
    const strA = String(valA || '');
    const strB = String(valB || '');
    if (strA < strB) return sort.order === 'ascend' ? -1 : 1;
    if (strA > strB) return sort.order === 'ascend' ? 1 : -1;
  }
  
  return 0;
};

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    '未装车': 'info',
    '已登记': 'warning',
    '装车中': 'warning',
    '装车完成': 'success',
    '交仓中': 'warning',
    '交仓完成': 'success',
    'POD回传': 'success'
  };
  return statusMap[status] || 'info';
};

// 清除分组
const clearGrouping = () => {
  groupingDialog.value.form = {
    firstLevel: '',
    secondLevel: '',
    thirdLevel: ''
  };
  groupFields.value = [];
  groupColumns.value = [];
  loadData();
  groupingDialog.value.visible = false;
  ElMessage.success('已清除分组设置');
};

// 清除排序
const clearSorting = () => {
  sortingDialog.value.form = { ...defaultSortForm };
  loadData();
  sortingDialog.value.visible = false;
  ElMessage.success('已清除排序设置');
};

// 确保排序状态始终有默认值
const initSortingState = () => {
  if (!sortingDialog.value.form) {
    sortingDialog.value.form = { ...defaultSortForm };
  } else {
    // 确保每个排序级别都有完整的结构
    ['firstSort', 'secondSort', 'thirdSort'].forEach(level => {
      if (!sortingDialog.value.form[level]) {
        sortingDialog.value.form[level] = { field: '', order: 'ascend' };
      }
    });
  }
};

// 编辑相关状态
const editingCell = ref({
  id: null,
  field: null,
  value: ''
});

const editDialog = ref({
  visible: false,
  title: '',
  fieldLabel: '',
  value: '',
  isTextarea: false,
  record: null,
  field: null
});

const editConfirmDialog = ref({
  visible: false,
  oldValue: '',
  newValue: '',
  record: null,
  field: ''
});

// 判断字段是否可编辑
const isEditableField = (field) => {
  return [
    'driverRegisterTime',
    'loadingStartTime',
    'loadingEndTime',
    'carNumber',
    'loader',
    'dockNumber',
    'loadingStatus',
    'warehouseRemarks',
    'driverLicense',
    'licensePlate'
  ].includes(field);
};

// 单击编辑
const handleCellClick = (record, field) => {
  if (!isEditableField(field)) return;
  
  editingCell.value = {
    id: record.id,
    field: field,
    value: record[field] || ''
  };
};

// 双击弹窗编辑
const handleCellDbClick = (record, field) => {
  if (!isEditableField(field)) return;
  
  // 关闭行内编辑
  editingCell.value = {
    id: null,
    field: null,
    value: ''
  };
  
  // 打开弹窗编辑
  editDialog.value = {
    visible: true,
    title: `编辑${field}`,
    fieldLabel: field,
    value: record[field] || '',
    isTextarea: field === 'warehouseRemarks',
    record: record,
    field: field
  };
};

// 处理编辑框失焦
const handleEditBlur = (record, field) => {
  if (editingCell.value.id === record.id && editingCell.value.field === field) {
    if (editingCell.value.value !== record[field]) {
      editConfirmDialog.value = {
        visible: true,
        oldValue: record[field],
        newValue: editingCell.value.value,
        record: record,
        field: field
      };
    } else {
      cancelEdit();
    }
  }
};

// 处理编辑确认
const handleEditConfirm = (record, field) => {
  if (editingCell.value.id === record.id && editingCell.value.field === field) {
    if (editingCell.value.value !== record[field]) {
      editConfirmDialog.value = {
        visible: true,
        oldValue: record[field],
        newValue: editingCell.value.value,
        record: record,
        field: field
      };
    } else {
      cancelEdit();
    }
  }
};

// 取消编辑
const cancelEdit = () => {
  editingCell.value = {
    id: null,
    field: null,
    value: ''
  };
  editConfirmDialog.value.visible = false;
};

// 确认编辑
const confirmEdit = () => {
  if (editConfirmDialog.value.record && editConfirmDialog.value.field) {
    editConfirmDialog.value.record[editConfirmDialog.value.field] = editConfirmDialog.value.newValue;
    editConfirmDialog.value.visible = false;
    editingCell.value = {
      id: null,
      field: null,
      value: ''
    };
    ElMessage.success('保存成功');
  }
};

// 处理弹窗编辑确认
const handleEditDialogConfirm = () => {
  if (editDialog.value.record && editDialog.value.field) {
    editDialog.value.record[editDialog.value.field] = editDialog.value.value;
    editDialog.value.visible = false;
    ElMessage.success('保存成功');
  }
};

// 添加悬浮状态管理
const hoverState = ref({
  id: null,
  field: null,
  timer: null
});

// 处理鼠标进入
const handleMouseEnter = (record, field) => {
  if (hoverState.value.timer) {
    clearTimeout(hoverState.value.timer);
  }
  
  hoverState.value.timer = setTimeout(() => {
    hoverState.value = {
      id: record.id,
      field: field,
      timer: null
    };
  }, 700); // 0.7秒延迟
};

// 处理鼠标离开
const handleMouseLeave = () => {
  if (hoverState.value.timer) {
    clearTimeout(hoverState.value.timer);
  }
  hoverState.value = {
    id: null,
    field: null,
    timer: null
  };
};

// 添加展开行状态管理
const expandedRows = ref([]);

// 表格变化处理
const handleTableChange = (pagination, filters, sorter) => {
  // 处理分页变化
  if (pagination && pagination.current !== currentPage.value) {
    currentPage.value = pagination.current;
  }
  if (pagination && pagination.pageSize !== pageSize.value) {
    pageSize.value = pagination.pageSize;
    currentPage.value = 1; // 页大小变化时重置到第一页
  }
  
  // 处理排序
  if (sorter && sorter.column) {
    const field = sorter.field;
    const order = sorter.order;
    
    // 更新排序配置
    sortingDialog.value.form = {
      ...sortingDialog.value.form,
      firstSort: { field, order }
    };
    
    loadData(); // 重新加载数据
  }
};
</script>

<style scoped>
.table-surely-demo {
  padding: 20px;
}

/* 筛选栏样式 */
.filter-bar {
  background: #fff;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: max-content;
}

.filter-item {
  width: 140px;
}

.date-range-picker {
  width: 240px;
}

.search-input {
  width: 180px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-left: 8px;
}

/* 视图管理样式 */
.view-management {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.status-view-group {
  flex-wrap: wrap;
  gap: 8px;
}

.view-tools {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

/* 表格容器样式 */
.table-container {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-height: 500px;
}

/* 分组样式 */
.group-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  position: relative;
  height: 100%;
  padding: 0;
}

.group-content {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.group-content:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.group-text {
  font-weight: 500;
  margin-right: 8px;
}

.group-count {
  color: #909399;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.04);
  padding: 2px 6px;
  border-radius: 10px;
}

/* 分组行和子行样式 */
:deep(.surely-table-row-level-1) > td {
  background-color: transparent !important;
}

:deep(.surely-table-row-level-2) > td {
  background-color: transparent !important;
}

:deep(.surely-table-row-level-3) > td {
  background-color: transparent !important;
}

:deep(.surely-table-row-indent) {
  padding-left: 0 !important;
}

:deep(.surely-table-row-indent-level-1) {
  padding-left: 24px !important;
}

:deep(.surely-table-row-indent-level-2) {
  padding-left: 48px !important;
}

/* 对话框内容样式 */
.grouping-content,
.sorting-content,
.column-settings-dialog {
  padding: 20px;
}

.column-settings-dialog {
  padding: 0 20px 20px 20px;
}
.column-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
  color: #909399;
}
.column-list-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.column-draggable-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.column-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fff;
  transition: background-color 0.2s;
}
.column-item:last-child {
  border-bottom: none;
}
.column-item:hover {
  background-color: #f5f7fa;
}
.drag-handle {
  cursor: grab;
  margin-right: 10px;
  color: #c0c4cc;
}
.drag-handle:active {
  cursor: grabbing;
}
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

/* 自定义滚动条 (可选) */
.column-list-container::-webkit-scrollbar {
  width: 6px;
}
.column-list-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}
.column-list-container::-webkit-scrollbar-track {
  background: #f4f4f5;
}

/* 高级筛选对话框样式 */
.filter-dialog-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.filter-logic-row {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-logic-label {
  font-weight: 500;
  color: #606266;
}

.filter-conditions {
  margin-bottom: 20px;
}

.filter-condition-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.filter-field {
  width: 180px;
}

.filter-operator {
  width: 120px;
}

.filter-value {
  flex: 1;
  min-width: 150px;
}

.remove-condition {
  flex-shrink: 0;
}

.add-condition-row {
  margin-top: 16px;
}

/* Context Menu Styles */
.context-menu {
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  padding: 5px 0;
  min-width: 120px;
  user-select: none;
}
.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
}
.context-menu-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

/* 排序对话框样式 */
.sort-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sort-field {
  flex: 1;
}

.sort-order {
  width: 100px;
}

/* 单元格基础样式 */
.cell-wrapper {
  position: relative;
  width: 100%;
}

.cell-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 200px;
  transition: all 0.3s;
}

.cell-content.show-full {
  overflow: visible;
  white-space: normal;
  position: absolute;
  background-color: #fff;
  z-index: 10;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  min-width: 100%;
  max-width: none;
}

.editable-cell {
  cursor: pointer;
  padding: 2px 5px;
  border: 1px dashed transparent;
  transition: all 0.3s;
  position: relative;
}

.editable-cell:hover {
  background-color: #f0f9ff;
  border-color: #409EFF;
  border-radius: 3px;
}

.editable-cell .cell-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 200px;
  transition: all 0.3s;
}

.editable-cell .cell-content.show-full {
  overflow: visible;
  white-space: normal;
  position: absolute;
  background-color: #fff;
  z-index: 10;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  min-width: 100%;
  max-width: none;
}

.cell-editor {
  padding: 0;
  margin: -1px;
}

.cell-editor .el-input {
  width: 100%;
}

/* 编辑对话框样式 */
.edit-confirm-content {
  padding: 20px;
}

.edit-value {
  margin-top: 10px;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
}

.edit-value > div {
  margin: 5px 0;
  word-break: break-all;
}

.edit-dialog-content {
  padding: 20px;
}

/* 展开行样式优化 */
.expanded-row-content {
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  margin: 8px;
}

.expanded-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.info-label {
  color: #909399;
  margin-right: 8px;
  white-space: nowrap;
}

.info-value {
  color: #303133;
  flex: 1;
}

/* 展开图标样式 */
:deep(.surely-table-row-expand-icon) {
  margin-right: 8px;
  color: #409EFF;
  transition: transform 0.3s;
}

:deep(.surely-table-row-expanded .surely-table-row-expand-icon) {
  transform: rotate(90deg);
}

:deep(.surely-table-cell-with-append) {
  padding-left: 0 !important;
}

/* 确保展开内容正确显示 */
:deep(.surely-table-expanded-row) {
  background-color: transparent !important;
}

:deep(.surely-table-expanded-row > td) {
  padding: 0 !important;
  background-color: transparent !important;
}
</style> 