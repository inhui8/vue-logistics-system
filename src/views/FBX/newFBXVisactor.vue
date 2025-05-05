<template>
  <!-- eslint-disable -->
  <div class="delivery-trains-container">
    <!-- 顶部筛选区 -->
    <div class="filter-bar">
      <div class="filter-row">
        <!-- 仓库选择 -->
        <el-select v-model="warehouse" placeholder="美西二号仓" size="small" class="filter-item">
          <el-option label="美西二号仓" value="west2"></el-option>
          <el-option label="美西一号仓" value="west1"></el-option>
          <el-option label="新泽西一号仓" value="east1"></el-option>
          <el-option label="萨凡纳二号仓" value="east2"></el-option>
          <el-option label="达拉斯三号仓" value="east3"></el-option>
        </el-select>
        
        <!-- 创建日期 -->
        <el-select v-model="createDateType" placeholder="ETA" size="small" class="filter-item">
          <el-option label="ETA" value="eta"></el-option>
          <el-option label="提柜时间" value="issue"></el-option>
          <el-option label="抵仓时间" value="appointment"></el-option>
          <el-option label="预计拆柜时间" value="expectedUnloading"></el-option>
          <el-option label="拆柜完成时间" value="unloading"></el-option>
        </el-select>
        
        <!-- 日期范围选择 -->
        <div class="date-buttons">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            class="date-range-picker"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </div>
        
        <!-- 批次号 -->
        <el-select v-model="searchType" placeholder="部分模糊搜索" size="small" class="filter-item">
          <el-option label="部分模糊搜索" value="trainNumber"></el-option>
          <el-option label="柜号" value="containerNo"></el-option>
          <el-option label="SO号" value="soNumber"></el-option>
          <el-option label="货件编号" value="shipmentNumber"></el-option>
          <el-option label="追踪编号" value="trackingNumber"></el-option>
        </el-select>
        
        <!-- 搜索框 -->
        <el-input 
          placeholder="MEMO/跟进记录/ref/zip_code等" 
          v-model="searchText" 
          size="small" 
          class="search-input"
          prefix-icon="el-icon-search"
        ></el-input>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
          <el-button size="small" type="warning" @click="handleBatchOperation('followUp')">批量跟进</el-button>
          <el-button size="small" type="warning" @click="handleBatchOperation('memo')">批量MEMO</el-button>
          <el-button size="small" type="warning" @click="handleBatchOperation('createPC')">创建PC</el-button>
          <el-button size="small">导出列表</el-button>
        </div>
      </div>
    </div>

    <!-- 状态筛选区域和视图控制 -->
    <div class="view-management">
      <span class="view-label"></span>
      <el-radio-group v-model="currentView" size="small" class="status-view-group">
        <el-radio-button value="all">全部({{statusCounts.all || 0}})</el-radio-button>
        <el-radio-button value="pending">待处理({{statusCounts.pending || 0}})</el-radio-button>
        <el-radio-button value="processing">处理中({{statusCounts.processing || 0}})</el-radio-button>
        <el-radio-button value="completed">已完成({{statusCounts.completed || 0}})</el-radio-button>
        <el-radio-button value="cancelled">已取消({{statusCounts.cancelled || 0}})</el-radio-button>
        <!-- 动态添加自定义视图 -->
        <el-radio-button 
          v-for="view in customViews" 
          :key="view.id" 
          :label="view.id"
          @contextmenu.prevent="handleContextMenu($event, view)"
        >
          {{view.name}}
        </el-radio-button>
      </el-radio-group>
      
      <el-button type="text" size="small" @click="handleSaveView">新增视图</el-button>
      <el-button type="text" size="small" @click="showGroupModal">高级分组</el-button>
      <el-button type="text" size="small" @click="showSortModal">高级排序</el-button>
      <el-button type="text" size="small" @click="showFilterPanel">筛选</el-button>
      <el-button type="text" size="small" @click="showColumnSettings">字段配置</el-button>
    </div>

    <!-- Visactor 表格 -->
    <div class="table-container">
      <groupable-table-visactor
        ref="visactorTable"
        :data="displayData"
        :columns="tableColumns.filter(col => col.visible !== false)"
        row-key="id"
        :group-fields="multiGroupFields.length > 0 ? multiGroupFields : (groupField ? [groupField] : [])"
        :show-selection="true"
        :show-group-column="hasGroupData"
        :group-column-label="multiGroupFields.length > 0 ? '多级分组' : (groupField ? getColumnLabel(groupField) : '分组')"
        :default-expand-all="true"
        :show-pagination="true"
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        :loading="loading"
        :showUnclassified="false"
        :childColumns="childColumns"
        :enableSubTable="true"
        @selection-change="handleSelectionChange"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        @cell-dblclick="handleCellDbClick"
        @sort-change="handleSortChange"
        @clear-grouping="handleClearGrouping"
        @cell-value-change="handleCellValueChange"
      />
    </div>
    

    
    <!-- 筛选面板 -->
    <filter-panel
      v-model:visible="filterPanelVisible"
      :columns="tableColumns.filter(col => col.visible !== false)"
      :existing-filters="activeFilters"
      :existing-logic="filterLogic"
      @apply-filters="applyFilters"
      @cancel="cancelFilters"
    />

    <!-- 保存视图对话框 -->
    <el-dialog
      title="保存视图"
      v-model="saveViewDialogVisible"
      width="500px"
    >
      <el-form :model="viewForm" label-width="100px">
        <el-form-item label="视图名称" required>
          <el-input v-model="viewForm.name" placeholder="请输入视图名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveViewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveView">确定</el-button>
      </template>
    </el-dialog>

    <!-- 高级分组对话框 -->
    <el-dialog
      title="高级分组"
      v-model="groupModalVisible"
      width="500px"
    >
      <div class="group-settings">
        <div class="group-level">
          <span class="group-level-label">一级分组：</span>
          <el-select v-model="groupSettings.level1" placeholder="选择字段" style="width: 280px;" clearable>
            <el-option v-for="field in groupableFields" :key="field.prop" :label="field.label" :value="field.prop"></el-option>
          </el-select>
        </div>
        <div class="group-level">
          <span class="group-level-label">二级分组：</span>
          <el-select v-model="groupSettings.level2" placeholder="选择字段" style="width: 280px;" clearable>
            <el-option v-for="field in groupableFields" :key="field.prop" :label="field.label" :value="field.prop"></el-option>
          </el-select>
        </div>
        <div class="group-level">
          <span class="group-level-label">三级分组：</span>
          <el-select v-model="groupSettings.level3" placeholder="选择字段" style="width: 280px;" clearable>
            <el-option v-for="field in groupableFields" :key="field.prop" :label="field.label" :value="field.prop"></el-option>
          </el-select>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="groupModalVisible = false">取消</el-button>
          <el-button type="danger" @click="clearGroupSettings">清除分组</el-button>
          <el-button type="primary" @click="applyGroupSettings">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 高级排序对话框 -->
    <el-dialog
      title="高级排序"
      v-model="sortModalVisible"
      width="600px"
    >
      <div class="sort-rules-container">
        <div 
          v-for="(sortRule, index) in tempSortSettings" 
          :key="index"
          class="sort-rule-item"
        >
          <el-select 
            v-model="sortRule.field" 
            placeholder="请选择排序字段"
            style="width: 200px; margin-right: 10px;"
          >
            <el-option
              v-for="field in sortableFields"
              :key="field.prop"
              :label="field.label"
              :value="field.prop"
            ></el-option>
          </el-select>
          <el-select 
            v-model="sortRule.order" 
            placeholder="排序方式"
            style="width: 120px; margin-right: 10px;"
          >
            <el-option label="升序" value="asc"></el-option>
            <el-option label="降序" value="desc"></el-option>
          </el-select>
          <el-button 
            type="danger" 
            icon="el-icon-delete" 
            circle 
            size="mini"
            @click="removeTempSortRule(index)"
          ></el-button>
        </div>
        <div class="add-sort-rule">
          <el-button type="primary" size="small" @click="addTempSortRule">
            添加排序规则
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelSorting">取消</el-button>
        <el-button type="primary" @click="applySorting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 字段配置对话框 -->
    <el-dialog
      title="字段配置"
      v-model="columnSettingsVisible"
      width="600px"
    >
      <div class="columns-container">
        <p class="tip-text">拖拽调整列顺序，勾选/取消显示列：</p>
        <draggable 
          v-model="tempTableColumns" 
          item-key="id"
          handle=".drag-handle"
          ghost-class="ghost"
          animation="300"
        >
          <template #item="{element}">
            <div class="column-item">
              <el-checkbox v-model="element.visible">
                {{element.label}}
              </el-checkbox>
              <i class="el-icon-rank drag-handle"></i>
            </div>
          </template>
        </draggable>
      </div>
      <template #footer>
        <el-button @click="resetColumnSettings">重置</el-button>
        <el-button @click="cancelColumnSettings">取消</el-button>
        <el-button type="primary" @click="applyColumnSettings">确定</el-button>
      </template>
    </el-dialog>

    <!-- 视图右键菜单 -->
    <div 
      v-if="contextMenuVisible" 
      class="context-menu"
      :style="{left: contextMenuX + 'px', top: contextMenuY + 'px'}"
      @click.stop
    >
      <div class="context-menu-item" @click="deleteView(currentEditingView.id)">
        删除视图
      </div>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      title="编辑信息"
      v-model="editDialogVisible"
      width="500px"
    >
      <el-form :model="editingForm" label-width="120px">
        <el-form-item :label="editingColumn.label" v-if="editingColumn.prop">
          <el-select 
            v-if="['appointmentStatus', 'tags'].includes(editingColumn.prop)"
            v-model="editingForm.value" 
            style="width: 100%"
          >
            <el-option 
              v-for="option in getOptionsForColumn(editingColumn.prop)" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value">
            </el-option>
          </el-select>
          <el-input 
            v-else
            v-model="editingForm.value"
            :type="['zipCode', 'boxCount', 'weight', 'volume', 'palletCount'].includes(editingColumn.prop) ? 'number' : 'text'"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDialogEdit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 其他对话框 (后续继续添加) -->
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { defineComponent, ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus' // 引入分页和消息提示
import FilterPanel from '@/components/logistics/FilterPanel.vue' // 假设FilterPanel组件存在
import GroupableTableVisactor from '@/components/logistics/GroupableTableVisactor.vue'
import draggable from 'vuedraggable'

// 引入数据源
import containerShipmentsColumns from '@/assets/json/containerShipmentsColumns.json';
import containerItemsColumns from '@/assets/json/containerItemsColumns.json';
import containerShipmentsData from '@/assets/json/containerShipmentsData.json';

// 在数据源加载失败或为空的情况下使用的模拟数据
const mockData = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  loadingStatus: ['待处理', '处理中', '已完成', '已取消'][i % 4],
  trainNumber: `TR${1000 + i}`,
  containerNo: `CN${2000 + i}`,
  soNumber: `SO${3000 + i}`,
  shipmentNumber: `SH${4000 + i}`,
  trackingNumber: `TK${5000 + i}`,
  warehouse: 'west2',
  address: `123 Main St, Unit ${i}`,
  city: ['Los Angeles', 'Seattle', 'New York', 'Miami', 'Dallas'][i % 5],
  state: ['CA', 'WA', 'NY', 'FL', 'TX'][i % 5],
  zipCode: 90000 + i,
  deliveryArea: `Area ${i % 10 + 1}`,
  appointmentStatus: ['电话预约', '平台预约', '邮件预约', '未预约'][i % 4],
  deliveryAppointmentTime: `2024-04-${String(i % 28 + 1).padStart(2, '0')} 10:00:00`,
  deliveryTime: `2024-04-${String(i % 28 + 1).padStart(2, '0')} 14:00:00`,
  eta: `2024-04-${String(i % 28 + 1).padStart(2, '0')}`,
  remarks: `备注信息 ${i}`
}));

export default defineComponent({
  name: 'NewFBXVisactor',
  components: {
    FilterPanel,
    GroupableTableVisactor,
    draggable
  },
  setup() {
    const visactorTable = ref(null);
    
    // ===== 基础状态 =====
    // 筛选条件
    const warehouse = ref('west2');
    const createDateType = ref('eta');
    const dateRange = ref([]);
    const searchType = ref('trainNumber');
    const searchText = ref('');
    
    // 表格数据状态
    const tableData = ref([]); // 原始数据
    const displayData = ref([]); // 显示数据
    const loading = ref(false);
    const selectedRows = ref([]);
    
    // 分页状态
    const currentPage = ref(1);
    const pageSize = ref(20);
    const total = ref(0);
    
    // 视图状态
    const currentView = ref('all');
    const customViews = ref([]);
    const statusCounts = ref({
      all: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    });
    
    // 分组和排序
    const groupField = ref('');
    const sortConfig = ref({
      field: '',
      order: 'asc' // 'asc' 或 'desc'
    });
    
    // 过滤状态
    const filterPanelVisible = ref(false);
    const activeFilters = ref([]);
    const filterLogic = ref('and'); // 'and' 或 'or'
    
    // 对话框状态
    const saveViewDialogVisible = ref(false);
    const editDialogVisible = ref(false);
    const viewForm = ref({
      name: '',
      columns: []
    });
    const editingForm = ref({
      value: ''
    });
    const editingColumn = ref({});
    
    // 视图相关
    const currentEditingView = ref(null); // 当前编辑的视图
    
    // 分组设置
    const groupModalVisible = ref(false);
    const groupSettings = ref({
      level1: '',
      level2: '',
      level3: ''
    });
    
    // 排序设置
    const sortModalVisible = ref(false);
    const sortSettings = ref([]);
    const tempSortSettings = ref([]); // 临时存储排序设置
    
    // 字段配置
    const columnSettingsVisible = ref(false);
    const tempTableColumns = ref([]); // 临时存储列设置
    
    // MEMO相关
    const memoDialogVisible = ref(false);
    const memoForm = ref({ memo: '' });
    
    // 跟进记录相关
    const followUpDialogVisible = ref(false);
    const followUpForm = ref({ content: '', type: 'primary' });
    const followUpHistory = ref([]);
    
    // 历史记录相关
    const historyDialogVisible = ref(false);
    const historyRecords = ref([]);
    
    // 批量操作相关
    const batchDialogVisible = ref(false);
    const batchOperation = ref('');
    const batchForm = ref({
      followUp: '',
      memo: '',
      pcType: 'delivery',
      targetWarehouse: ''
    });
    
    // 右键菜单
    const contextMenuVisible = ref(false);
    const contextMenuX = ref(0);
    const contextMenuY = ref(0);
    
    // 当前处理的行
    const currentRow = ref(null);
    
    // 新增筛选状态
    const newFilter = ref({
      field: '',
      operator: 'equals',
      value: ''
    });
    
    // 新增排序状态
    const newSort = ref({
      field: '',
      direction: 'asc'
    });
    
    // 详情信息
    const detailInfo = ref({});

    // 详情对话框相关
    const detailDialogVisible = ref(false);
    const selectedRecord = ref(null);
    const menuPosition = ref({ left: '0px', top: '0px' });

    // ===== 表格列配置 =====
    // 使用导入的列配置，并添加必要的属性
    const tableColumns = ref(containerShipmentsColumns.map(col => ({
      ...col,
      visible: true,
      sortable: col.sortable !== false, // 默认可排序
      filterable: col.prop !== 'operation', // 为非操作列启用筛选
      editable: ['address', 'city', 'state', 'zipCode', 'deliveryArea', 'appointmentStatus', 
        'deliveryAppointmentTime', 'deliveryTime', 'deliveryCompany', 'deliveryDriver', 
        'driverPhone', 'followUpRecord', 'remarks', 'internalRemarks', 'tags'].includes(col.prop)
    })));

    // 子表格列配置
    const childColumns = ref(containerItemsColumns);

    // === 计算属性 ===
    // 可分组的字段
    const groupableFields = computed(() => {
      return tableColumns.value.filter(col => 
        !['operation'].includes(col.prop) && 
        col.visible !== false
      );
    });

    // 可排序的字段
    const sortableFields = computed(() => {
      return tableColumns.value.filter(col => 
        col.sortable && 
        col.visible !== false
      );
    });

    // 表格是否有分组数据
    const hasGroupData = computed(() => {
      return multiGroupFields.value.length > 0 || !!groupField.value;
    });

    // 当前选中的自定义视图
    const viewOptions = computed(() => {
      // 如果currentView是自定义视图的ID
      if (currentView.value !== 'all' &&
          currentView.value !== 'pending' &&
          currentView.value !== 'processing' &&
          currentView.value !== 'completed' &&
          currentView.value !== 'cancelled') {
        
        const view = customViews.value.find(v => v.id === currentView.value);
        if (view) {
          return view;
        }
      }
      return null;
    });

    // 在setup函数中添加
    const multiGroupFields = ref([]);

    // ===== 数据获取和处理 =====
    // 获取数据
    const fetchData = async () => {
      loading.value = true;
      try {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 检查导入的数据源是否有效
        if (Array.isArray(containerShipmentsData) && containerShipmentsData.length > 0) {
          console.log('使用导入的JSON数据源');
          tableData.value = containerShipmentsData;
        } else {
          console.log('导入的数据源为空，使用模拟数据');
          tableData.value = mockData;
        }
        
        // 检查数据是否正确加载
        console.log('加载的数据条数:', tableData.value.length);
        console.log('数据样例:', tableData.value.slice(0, 2));
        
        total.value = tableData.value.length;
        
        // 计算状态数量
        const counts = {
          all: tableData.value.length,
          pending: 0,
          processing: 0,
          completed: 0,
          cancelled: 0
        };
        
        tableData.value.forEach(item => {
          if (item.loadingStatus === '待处理') counts.pending++;
          else if (item.loadingStatus === '处理中') counts.processing++;
          else if (item.loadingStatus === '已完成') counts.completed++;
          else if (item.loadingStatus === '已取消') counts.cancelled++;
        });
        
        statusCounts.value = counts;
        console.log('状态统计:', counts);
        
        // 应用筛选、排序、分组等
        refreshDisplayData();
      } catch (error) {
        console.error('获取数据失败:', error);
        // 发生错误时也使用模拟数据
        console.log('发生错误，使用模拟数据');
        tableData.value = mockData;
        total.value = mockData.length;
        refreshDisplayData();
        ElMessage.error('获取数据失败: ' + error.message);
      } finally {
        loading.value = false;
      }
    };
    
    // 处理显示数据
    const refreshDisplayData = () => {
      loading.value = true;
      
      // 应用状态筛选
      let filteredData = [...tableData.value];
      
      // 应用状态筛选
      if (currentView.value === 'pending') {
        filteredData = filteredData.filter(item => item.loadingStatus === '待处理');
      } else if (currentView.value === 'processing') {
        filteredData = filteredData.filter(item => item.loadingStatus === '处理中');
      } else if (currentView.value === 'completed') {
        filteredData = filteredData.filter(item => item.loadingStatus === '已完成');
      } else if (currentView.value === 'cancelled') {
        filteredData = filteredData.filter(item => item.loadingStatus === '已取消');
      }
      
      // 应用高级筛选
      if (searchText.value) {
        const text = searchText.value.toLowerCase();
        filteredData = filteredData.filter(item => {
          const value = item[searchType.value];
          return value && value.toString().toLowerCase().includes(text);
        });
      }
      
      // 应用分组
      if (groupField.value) {
        filteredData = processGroupData(filteredData, groupField.value);
      }
      
      // 应用排序
      if (sortSettings.value.length > 0) {
        filteredData = applySort(filteredData);
      }
      
      // 过滤掉空行
      if (!showEmptyRows.value) {
        filteredData = filteredData.filter(item => {
          // 检查是否有至少一个有意义的属性
          for (const key in item) {
            if (item[key] !== undefined && 
                item[key] !== null && 
                item[key] !== '' &&
                key !== 'id') {
              return true;
            }
          }
          return false;
        });
      }
      
      // 设置总数
      total.value = filteredData.length;
      
      // 分页处理
      const startIndex = (currentPage.value - 1) * pageSize.value;
      const endIndex = startIndex + pageSize.value;
      displayData.value = filteredData.slice(startIndex, endIndex);
      
      loading.value = false;
    };
    
    // 应用高级筛选条件
    const applyAdvancedFilters = (data, filters, logic = 'and') => {
      return data.filter(item => {
        // 对每个条件进行判断
        const results = filters.map(filter => {
          const { field, operator, value } = filter;
          
          // 如果没有该字段，则跳过
          if (!Object.prototype.hasOwnProperty.call(item, field)) return true;
          
          const itemValue = item[field];
          
          // 根据不同的操作符进行判断
          switch (operator) {
            case 'equals':
              return itemValue == value;
            case 'notEquals':
              return itemValue != value;
            case 'contains':
              return itemValue && itemValue.toString().includes(value);
            case 'notContains':
              return !itemValue || !itemValue.toString().includes(value);
            case 'startsWith':
              return itemValue && itemValue.toString().startsWith(value);
            case 'endsWith':
              return itemValue && itemValue.toString().endsWith(value);
            case 'greaterThan':
              return itemValue > value;
            case 'lessThan':
              return itemValue < value;
            case 'greaterThanOrEqual':
              return itemValue >= value;
            case 'lessThanOrEqual':
              return itemValue <= value;
            case 'empty':
              return !itemValue || itemValue.toString().trim() === '';
            case 'notEmpty':
              return itemValue && itemValue.toString().trim() !== '';
            default:
              return true;
          }
        });
        
        // 根据逻辑运算符合并结果
        if (logic === 'and') {
          return results.every(result => result);
        } else {
          return results.some(result => result);
        }
      });
    };
    
    // 处理分组数据
    const processGroupData = (data, field) => {
      const groups = {};
      const result = [];
      
      // 按指定字段分组
      data.forEach(item => {
        // 更精确地判断分组值，只有undefined和null才使用"未分组"
        const fieldValue = item[field];
        const groupValue = fieldValue === undefined || fieldValue === null ? '未分组' : String(fieldValue);
        
        if (!groups[groupValue]) {
          groups[groupValue] = {
            id: `group-${field}-${groupValue}`,
            groupName: groupValue,
            isGroup: true,
            groupLevel: 1,
            count: 0,
            children: []
          };
          result.push(groups[groupValue]);
        }
        
        groups[groupValue].children.push(item);
        groups[groupValue].count++;
      });
      
      return result;
    };
    
    // ===== 辅助函数 =====
    // 获取状态标签类型
    const getStatusTagType = (status) => {
      if (!status) return 'default';
      if (status === '待处理') return 'warning';
      if (status === '处理中') return 'primary';
      if (status === '已完成') return 'success';
      if (status === '已取消') return 'danger';
      return 'default';
    };
    
    // 获取预约状态标签类型
    const getAppointmentStatusType = (status) => {
      if (!status) return 'default';
      if (status === '未预约') return 'warning';
      if (status === '已预约') return 'success';
      if (status === '已取消') return 'danger';
      return 'default';
    };
    
    // 获取标签类型
    const getTagType = (tag) => {
      if (!tag) return 'default';
      const tagLower = tag.toLowerCase();
      if (tagLower.includes('urgent') || tagLower.includes('紧急')) return 'danger';
      if (tagLower.includes('delay') || tagLower.includes('延迟')) return 'warning';
      if (tagLower.includes('completed') || tagLower.includes('完成')) return 'success';
      return 'primary';
    };
    
    // ===== 状态视图相关 =====
    // 切换查看状态
    const switchView = (view) => {
      currentView.value = view;
      refreshDisplayData();
    };
    
    // 保存当前视图
    const saveCurrentView = () => {
      if (!viewForm.value.name) {
        ElMessage.warning('视图名称不能为空');
        return;
      }
      
      const newView = {
        id: `view-${Date.now()}`,
        name: viewForm.value.name,
        description: '',
        conditions: getCurrentFilterConditions(),
        columns: tableColumns.value
          .filter(col => col.visible !== false)
          .map(col => ({ prop: col.prop, visible: true }))
      };
      
      customViews.value.push(newView);
      saveViewDialogVisible.value = false;
      
      // 保存到本地存储
      localStorage.setItem('fbx_custom_views', JSON.stringify(customViews.value));
      
      // 切换到新视图
      currentView.value = newView.id;
      
      // 刷新数据
      refreshDisplayData();
      
      ElMessage.success('视图已保存');
    };
    
    // 获取当前过滤条件
    const getCurrentFilterConditions = () => {
      const conditions = {
        searchType: searchType.value,
        searchText: searchText.value,
        warehouse: warehouse.value,
        dateRange: dateRange.value,
        createDateType: createDateType.value,
        filters: activeFilters.value,
        filterLogic: filterLogic.value,
        sortSettings: sortSettings.value,
        groupField: groupField.value
      };
      
      return conditions;
    };
    
    // 删除自定义视图
    const deleteCustomView = (viewId) => {
      const index = customViews.value.findIndex(v => v.id === viewId);
      if (index > -1) {
        customViews.value.splice(index, 1);
        
        // 保存到本地存储
        localStorage.setItem('fbx_custom_views', JSON.stringify(customViews.value));
        
        // 如果当前视图是被删除的视图，切换到全部
        if (currentView.value === viewId) {
          currentView.value = 'all';
          refreshDisplayData();
        }
        
        ElMessage.success('视图已删除');
      }
    };
    
    // ===== 搜索和筛选相关 =====
    // 搜索
    const handleSearch = () => {
      refreshDisplayData();
    };
    
    // 添加高级筛选
    const addFilter = () => {
      if (
        !newFilter.value.field || 
        !newFilter.value.operator || 
        newFilter.value.value === undefined || 
        newFilter.value.value === null || 
        newFilter.value.value === ''
      ) {
        ElMessage.warning('请完整填写筛选条件');
        return;
      }
      
      activeFilters.value.push({
        id: `filter-${Date.now()}`,
        field: newFilter.value.field,
        operator: newFilter.value.operator,
        value: newFilter.value.value
      });
      
      // 重置新筛选条件
      newFilter.value.field = '';
      newFilter.value.operator = 'equals';
      newFilter.value.value = '';
      
      // 刷新数据
      refreshDisplayData();
    };
    
    // 移除高级筛选
    const removeFilter = (filterId) => {
      const index = activeFilters.value.findIndex(f => f.id === filterId);
      if (index > -1) {
        activeFilters.value.splice(index, 1);
        refreshDisplayData();
      }
    };
    
    // 清除所有高级筛选
    const clearAllFilters = () => {
      activeFilters.value = [];
      refreshDisplayData();
    };
    
    // ===== 表格相关 =====
    // 添加排序
    const addSort = () => {
      if (!newSort.value.field) {
        ElMessage.warning('请选择排序字段');
        return;
      }
      
      // 检查是否已存在相同字段的排序
      const existingIndex = sortSettings.value.findIndex(s => s.field === newSort.value.field);
      if (existingIndex > -1) {
        sortSettings.value[existingIndex].direction = newSort.value.direction;
      } else {
        sortSettings.value.push({
          field: newSort.value.field,
          direction: newSort.value.direction
        });
      }
      
      // 重置新排序设置
      newSort.value.field = '';
      newSort.value.direction = 'asc';
      
      // 刷新数据
      refreshDisplayData();
    };
    
    // 移除排序
    const removeSort = (index) => {
      sortSettings.value.splice(index, 1);
      refreshDisplayData();
    };
    
    // 清除所有排序
    const clearAllSorts = () => {
      sortSettings.value = [];
      refreshDisplayData();
    };
    
    // 设置分组
    const setGroupField = (field) => {
      if (groupField.value === field) {
        groupField.value = ''; // 取消分组
      } else {
        groupField.value = field;
      }
      refreshDisplayData();
    };
    
    // 重置所有筛选和排序
    const resetAll = () => {
      currentView.value = 'all';
      searchType.value = 'trainNumber';
      searchText.value = '';
      warehouse.value = '';
      dateRange.value = [];
      createDateType.value = 'eta';
      activeFilters.value = [];
      sortSettings.value = [];
      groupField.value = '';
      currentPage.value = 1;
      
      refreshDisplayData();
    };
    
    // 导出数据
    const exportData = () => {
      // 在实际应用中应该调用导出API
      ElMessage.info('导出功能尚未实现');
    };
    
    // ===== 分页相关 =====
    // 处理页码变化
    const handleSizeChange = (size) => {
      pageSize.value = size;
      currentPage.value = 1; // 页大小改变时回到第一页
      refreshDisplayData();
    };
    
    // 处理页码变化
    const handleCurrentChange = (page) => {
      currentPage.value = page;
      refreshDisplayData();
    };
    
    // ===== 表格操作相关 =====
    // 查看详情
    const handleDetail = (id) => {
      const record = tableData.value.find(item => item.id === id);
      if (record) {
        detailInfo.value = record;
        detailDialogVisible.value = true;
      }
    };
    
    // 更多操作
    const handleMoreOperations = (id, event) => {
      const record = tableData.value.find(item => item.id === id);
      if (record) {
        selectedRecord.value = record;
        
        // 显示操作菜单
        nextTick(() => {
          contextMenuVisible.value = true;
          if (event) {
            menuPosition.value = {
              left: `${event.clientX}px`,
              top: `${event.clientY}px`
            };
          }
        });
      }
    };
    
    // ===== 全局事件注册 =====
    // 注册全局函数以供表格使用
    const registerGlobalFunctions = () => {
      window.handleDetail = (id) => {
        handleDetail(id);
      };
      
      window.handleMoreOperations = (id) => {
        handleMoreOperations(id);
      };
    };
    
    // 取消注册全局函数
    const unregisterGlobalFunctions = () => {
      window.handleDetail = undefined;
      window.handleMoreOperations = undefined;
    };
    
    // ===== 生命周期钩子 =====
    onMounted(async () => {
      // 从本地存储加载自定义视图
      const savedViews = localStorage.getItem('fbx_visactor_custom_views');
      if (savedViews) {
        try {
          customViews.value = JSON.parse(savedViews);
        } catch (e) {
          console.error('加载自定义视图失败', e);
          customViews.value = [];
        }
      }
      
      // 注册全局函数用于表格中的操作按钮
      window.handleDetail = (id) => {
        handleDetail(id);
      };
      
      window.handleMoreOperations = (id) => {
        handleMoreOperations(id);
      };
      
      // 获取数据 - 要在最后调用，确保视图和配置已加载
      await fetchData();
      
      // 添加全局点击事件监听，用于关闭右键菜单
      document.addEventListener('click', handleClickOutsideContextMenu);
    });
    
    onBeforeUnmount(() => {
      // 清理全局函数
      window.handleDetail = undefined;
      window.handleMoreOperations = undefined;
      
      // 移除全局点击事件监听
      document.removeEventListener('click', handleClickOutsideContextMenu);
    });
    
    // 处理点击菜单外部 - 用于关闭右键菜单
    const handleClickOutsideContextMenu = () => {
      contextMenuVisible.value = false;
    };
    
    // 监听视图变化
    watch(() => currentView.value, () => {
      // 切换视图时重置页码
      currentPage.value = 1;
      
      // 如果切换到自定义视图，应用视图的设置
      if (currentView.value !== 'all' && 
          currentView.value !== 'pending' && 
          currentView.value !== 'processing' && 
          currentView.value !== 'completed' && 
          currentView.value !== 'cancelled') {
          
        const view = customViews.value.find(v => v.id === currentView.value);
        if (view && view.conditions) {
          // 应用视图的筛选条件
          if (view.conditions.filters) {
            activeFilters.value = [...view.conditions.filters];
          }
          
          if (view.conditions.filterLogic) {
            filterLogic.value = view.conditions.filterLogic;
          }
          
          if (view.conditions.sortSettings) {
            sortSettings.value = [...view.conditions.sortSettings];
          }
          
          if (view.conditions.groupField) {
            groupField.value = view.conditions.groupField;
          }
          
          // 应用视图的列设置
          if (view.columns && Array.isArray(view.columns)) {
            const columnMap = new Map(tableColumns.value.map(col => [col.prop, col]));
            
            // 遍历视图中的列配置，应用可见性
            view.columns.forEach(viewCol => {
              if (columnMap.has(viewCol.prop)) {
                const col = columnMap.get(viewCol.prop);
                col.visible = viewCol.visible;
              }
            });
          }
        }
      } else {
        // 切换到预定义视图时，可能需要重置某些筛选和排序
        // 这里可以根据需求决定是否重置
      }
      
      refreshDisplayData();
    });
    
    // ===== 界面交互处理 =====
    // 显示筛选面板
    const showFilterPanel = () => {
      filterPanelVisible.value = true;
    };
    
    // 显示高级分组弹窗
    const showGroupModal = () => {
      groupSettings.value = {
        level1: '',
        level2: '',
        level3: ''
      };
      groupModalVisible.value = true;
    };
    
    // 应用分组设置
    const applyGroupSettings = () => {
      const groupFields = [];
      if (groupSettings.value.level1) groupFields.push(groupSettings.value.level1);
      if (groupSettings.value.level2) groupFields.push(groupSettings.value.level2);
      if (groupSettings.value.level3) groupFields.push(groupSettings.value.level3);
      
      // 应用分组
      applyMultiLevelGrouping(groupFields);
      
      groupModalVisible.value = false;
      ElMessage.success('分组已应用');
    };
    
    // 清除分组设置
    const clearGroupSettings = () => {
      groupSettings.value = {
        level1: '',
        level2: '',
        level3: ''
      };
      applyMultiLevelGrouping([]);
      ElMessage.success('分组已清除');
    };
    
    // 应用多级分组
    const applyMultiLevelGrouping = (fields) => {
      // 将多级分组字段应用到组件
      multiGroupFields.value = fields;
      refreshDisplayData();
    };
    
    // 显示高级排序弹窗
    const showSortModal = () => {
      tempSortSettings.value = JSON.parse(JSON.stringify(sortSettings.value));
      // 如果没有排序规则，添加一个空的
      if (tempSortSettings.value.length === 0) {
        addTempSortRule();
      }
      sortModalVisible.value = true;
    };
    
    // 添加临时排序规则
    const addTempSortRule = () => {
      tempSortSettings.value.push({ field: '', order: 'asc' });
    };
    
    // 移除临时排序规则
    const removeTempSortRule = (index) => {
      tempSortSettings.value.splice(index, 1);
    };
    
    // 应用排序设置
    const applySorting = () => {
      // 过滤掉无效的排序规则（未选择字段）
      sortSettings.value = tempSortSettings.value.filter(s => s.field);
      sortModalVisible.value = false;
      refreshDisplayData();
    };
    
    // 取消排序设置
    const cancelSorting = () => {
      sortModalVisible.value = false;
    };
    
    // 显示字段配置弹窗
    const showColumnSettings = () => {
      // 深拷贝当前列配置用于编辑
      tempTableColumns.value = JSON.parse(JSON.stringify(tableColumns.value));
      columnSettingsVisible.value = true;
    };
    
    // 应用字段配置
    const applyColumnSettings = () => {
      tableColumns.value = JSON.parse(JSON.stringify(tempTableColumns.value));
      columnSettingsVisible.value = false;
      // 刷新数据 - 列配置变化后可能需要重新应用筛选和排序
      refreshDisplayData();
    };
    
    // 取消字段配置
    const cancelColumnSettings = () => {
      columnSettingsVisible.value = false;
    };
    
    // 重置字段配置
    const resetColumnSettings = () => {
      // 重置为默认配置
      tempTableColumns.value = containerShipmentsColumns.map(col => ({
        ...col,
        visible: true,
        sortable: col.sortable !== false,
        editable: ['address', 'city', 'state', 'zipCode', 'deliveryArea', 'appointmentStatus', 
          'deliveryAppointmentTime', 'deliveryTime', 'deliveryCompany', 'deliveryDriver', 
          'driverPhone', 'followUpRecord', 'remarks', 'internalRemarks', 'tags'].includes(col.prop)
      }));
    };
    
    // 处理保存视图
    const handleSaveView = () => {
      // 初始化视图表单
      viewForm.value = {
        name: '',
        columns: tableColumns.value
          .filter(col => col.visible !== false)
          .map(col => col.prop)
      };
      
      // 显示保存视图对话框
      saveViewDialogVisible.value = true;
    };
    
    // 保存视图
    const saveView = () => {
      if (!viewForm.value.name) {
        ElMessage.warning('视图名称不能为空');
        return;
      }
      
      const newView = {
        id: `view-${Date.now()}`,
        name: viewForm.value.name,
        description: '',
        conditions: getCurrentFilterConditions(),
        columns: tableColumns.value.map(col => ({
          prop: col.prop,
          visible: col.visible !== false
        }))
      };
      
      customViews.value.push(newView);
      saveViewDialogVisible.value = false;
      
      // 保存到本地存储
      localStorage.setItem('fbx_visactor_custom_views', JSON.stringify(customViews.value));
      
      // 切换到新视图
      currentView.value = newView.id;
      
      // 刷新数据
      refreshDisplayData();
      
      ElMessage.success('视图已保存');
    };
    
    // 删除视图
    const deleteView = (viewId) => {
      const index = customViews.value.findIndex(v => v.id === viewId);
      if (index > -1) {
        customViews.value.splice(index, 1);
        
        // 保存到本地存储
        localStorage.setItem('fbx_visactor_custom_views', JSON.stringify(customViews.value));
        
        // 如果当前视图是被删除的视图，切换到全部
        if (currentView.value === viewId) {
          currentView.value = 'all';
          refreshDisplayData();
        }
        
        ElMessage.success('视图已删除');
      }
      
      // 关闭右键菜单
      contextMenuVisible.value = false;
    };
    
    // 处理右键菜单
    const handleContextMenu = (event, view) => {
      // 阻止默认右键菜单
      event.preventDefault();
      
      // 设置右键菜单位置
      contextMenuX.value = event.clientX;
      contextMenuY.value = event.clientY;
      
      // 设置当前编辑的视图
      currentEditingView.value = view;
      
      // 显示操作菜单
      contextMenuVisible.value = true;
    };
    
    // 处理排序变化
    const handleSortChange = ({ prop, order }) => {
      // 转换 Element Plus 排序顺序到我们的格式
      const newOrder = order === 'ascending' ? 'asc' : (order === 'descending' ? 'desc' : null);
      
      if (newOrder) {
        // 替换现有排序
        sortSettings.value = [{ field: prop, order: newOrder }];
      } else {
        // 取消排序
        sortSettings.value = [];
      }
      
      refreshDisplayData();
    };
    
    // 处理批量操作
    const handleBatchOperation = (type) => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请先选择记录');
        return;
      }
      
      batchOperation.value = type;
      
      // 根据操作类型初始化表单
      if (type === 'followUp') {
        batchForm.value.followUp = '';
      } else if (type === 'memo') {
        batchForm.value.memo = '';
      } else if (type === 'createPC') {
        batchForm.value.pcType = 'delivery';
        batchForm.value.targetWarehouse = '';
      }
      
      // 显示批量操作对话框
      batchDialogVisible.value = true;
    };
    
    // 处理筛选面板确定
    const applyFilters = (filters, logic) => {
      // 更新筛选条件
      activeFilters.value = filters;
      filterLogic.value = logic;
      
      // 关闭筛选面板
      filterPanelVisible.value = false;
      
      // 刷新数据
      refreshDisplayData();
    };
    
    // 处理筛选面板取消
    const cancelFilters = () => {
      filterPanelVisible.value = false;
    };
    
    // 获取列选项
    const getOptionsForColumn = (columnProp) => {
      if (columnProp === 'appointmentStatus') {
        return [
          { value: '电话预约', label: '电话预约' },
          { value: '平台预约', label: '平台预约' },
          { value: '邮件预约', label: '邮件预约' },
          { value: '未预约', label: '未预约' }
        ];
      }
      else if (columnProp === 'tags') {
        return [
          { value: '加急', label: '加急' },
          { value: '特殊处理', label: '特殊处理' },
          { value: '延迟', label: '延迟' },
          { value: '紧急', label: '紧急' }
        ];
      }
      return [];
    };
    
    // 保存对话框编辑
    const saveDialogEdit = () => {
      if (!editingColumn.value || !editingColumn.value.prop) return;
      
      // 保存编辑的值
      if (currentRow.value) {
        currentRow.value[editingColumn.value.prop] = editingForm.value.value;
        
        // 关闭对话框
        editDialogVisible.value = false;
        
        // 刷新表格
        refreshDisplayData();
        
        // 通知用户
        ElMessage.success(`${editingColumn.value.label} 已更新`);
      }
    };
    
    // 获取分组列标签
    const getColumnLabel = (field) => {
      const column = tableColumns.value.find(col => col.prop === field);
      return column ? column.label : '分组';
    };
    
    // 处理行选择变更事件
    const handleSelectionChange = (rows) => {
      selectedRows.value = rows;
    };
    
    // 处理单元格双击事件
    const handleCellDbClick = ({ record, column, value, openEditDialog }) => {
      // 这里保留双击逻辑，以备将来可能需要弹出对话框编辑
      console.log('单元格双击', record, column, value, openEditDialog);
      if (openEditDialog) {
        // 打开编辑对话框的逻辑...
        editingForm.value.value = value;
        editingColumn.value = tableColumns.value.find(col => col.prop === column) || {};
        editDialogVisible.value = true;
        currentRow.value = record; // 保存当前行
      }
    };
    
    // 使用测试数据
    const testWithMockData = () => {
      // 重置所有筛选条件
      currentView.value = 'all';
      searchText.value = '';
      groupField.value = '';
      activeFilters.value = [];
      
      // 使用模拟数据
      tableData.value = mockData;
      total.value = mockData.length;
      
      // 直接设置显示数据，跳过筛选
      displayData.value = mockData;
      
      console.log('使用测试数据，共', mockData.length, '条');
      console.log('测试数据样例:', mockData[0]);
      
      ElMessage.success('已加载测试数据，共' + mockData.length + '条');
    };
    
    // 处理清空分组
    const handleClearGrouping = () => {
      multiGroupFields.value = [];
      groupField.value = '';
      groupSettings.value = {
        level1: '',
        level2: '',
        level3: ''
      };
      refreshDisplayData();
      ElMessage.success('分组已清除');
    };
    
    // 在setup函数开始处添加以下定义
    const showEmptyRows = ref(true); // 修改为默认显示空行

    // 应用排序
    const applySort = (data) => {
      if (!sortSettings.value || sortSettings.value.length === 0) {
        return data;
      }

      return [...data].sort((a, b) => {
        // 遍历每个排序规则
        for (const sort of sortSettings.value) {
          if (!sort.field) continue;
          
          const aValue = a[sort.field];
          const bValue = b[sort.field];
          
          // 如果是分组节点，跳过排序
          if (a.isGroup || b.isGroup) {
            return 0;
          }
          
          // 处理空值
          if (aValue === undefined || aValue === null || aValue === '') {
            return sort.order === 'asc' ? 1 : -1;
          }
          if (bValue === undefined || bValue === null || bValue === '') {
            return sort.order === 'asc' ? -1 : 1;
          }
          
          // 比较值
          let comparison = 0;
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
          } else {
            const aStr = String(aValue).toLowerCase();
            const bStr = String(bValue).toLowerCase();
            comparison = aStr.localeCompare(bStr);
          }
          
          // 根据排序方向返回结果
          if (comparison !== 0) {
            return sort.order === 'asc' ? comparison : -comparison;
          }
        }
        
        return 0;
      });
    };

    // ===== 事件处理 =====
    // 处理子组件单元格值变化
    const handleCellValueChange = ({ record, column, value }) => {
      console.log('单元格值变化:', record, column, value);
      // 找到原始数据中的对应行
      const originalRecord = tableData.value.find(item => item.id === record.id);
      if (originalRecord) {
        console.log('找到原始记录:', originalRecord);
        // 更新原始数据的值
        originalRecord[column] = value;
        console.log('更新后的原始记录:', originalRecord);
        
        // 可以选择性地重新计算或刷新显示数据，但通常Vue的响应式系统会自动处理
        // refreshDisplayData(); // 如果需要强制刷新，可以调用
      } else {
        console.warn('未在原始数据中找到记录:', record.id);
      }
    };

    // 返回响应式数据和方法
    return {
      // 筛选相关
      warehouse,
      createDateType,
      dateRange,
      searchType,
      searchText,
      
      // 表格状态
      loading,
      tableData,
      displayData,
      selectedRows,
      tableColumns,
      childColumns,
      
      // 分页相关
      currentPage,
      pageSize,
      total,
      
      // 视图相关
      currentView,
      customViews,
      statusCounts,
      saveViewDialogVisible,
      viewForm,
      
      // 分组和排序
      groupField,
      sortConfig,
      groupSettings,
      groupModalVisible,
      
      // 排序相关
      sortModalVisible,
      tempSortSettings,
      sortSettings,
      
      // 列配置相关
      columnSettingsVisible,
      tempTableColumns,
      
      // 筛选相关
      filterPanelVisible,
      activeFilters,
      filterLogic,
      newFilter,
      
      // 编辑相关
      editDialogVisible,
      editingForm,
      editingColumn,
      
      // 对话框相关
      detailDialogVisible,
      selectedRecord,
      menuPosition,
      
      // 右键菜单相关
      contextMenuVisible,
      contextMenuX,
      contextMenuY,
      currentEditingView,
      
      // DOM引用
      visactorTable,
      
      // 计算属性
      groupableFields,
      sortableFields,
      
      // 分页方法
      handleSizeChange,
      handleCurrentChange,
      
      // 事件处理
      handleSearch,
      handleDetail,
      handleMoreOperations,
      showFilterPanel,
      showGroupModal,
      applyGroupSettings,
      clearGroupSettings,
      showSortModal,
      addTempSortRule,
      removeTempSortRule,
      applySorting,
      cancelSorting,
      showColumnSettings,
      applyColumnSettings,
      cancelColumnSettings,
      resetColumnSettings,
      handleSaveView,
      saveView,
      deleteView,
      handleContextMenu,
      handleBatchOperation,
      handleSortChange,
      
      // 数据处理方法
      refreshDisplayData,
      applyAdvancedFilters,
      
      // 筛选相关方法
      applyFilters,
      cancelFilters,
      
      // 编辑相关方法
      getOptionsForColumn,
      saveDialogEdit,
      
      // 表格状态获取函数
      getAppointmentStatusType,
      getStatusTagType,
      getTagType,
      
      // 分组相关方法
      getColumnLabel,
      handleSelectionChange,
      handleCellDbClick,
      
      // 测试方法
      testWithMockData,
      
      // 新增状态
      multiGroupFields,
      
      // 新增状态
      hasGroupData,
      
      // 新增状态
      handleClearGrouping,
      
      // 新增状态
      showEmptyRows,
      
      // 新增状态
      handleCellValueChange
    };
  }
})
</script>

<style lang="scss" scoped>
.delivery-trains-container {
  padding: 20px;
  
  .filter-bar {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 15px;
    
    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      
      .filter-item {
        width: 150px;
      }
      
      .date-range-picker {
        width: 320px;
      }
      
      .search-input {
        width: 250px;
      }
      
      .action-buttons {
        margin-left: auto;
        display: flex;
        gap: 8px;
      }
    }
  }
  
  .view-management {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    flex-wrap: wrap;
    
    .status-view-group {
      margin-right: 15px;
    }
  }
  
  .table-container {
    width: 100%;
    height: 600px; /* 给表格一个固定高度 */
    margin-bottom: 15px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
  }
  
  /* 高级排序相关样式 */
  .sort-rules-container {
    .sort-rule-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .add-sort-rule {
      margin-top: 15px;
    }
  }
  
  /* 字段配置相关样式 */
  .columns-container {
    .tip-text {
      margin-bottom: 15px;
      color: #606266;
      font-size: 14px;
    }
    
    .column-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      border-bottom: 1px solid #ebeef5;
      
      &:hover {
        background-color: #f5f7fa;
      }
      
      .drag-handle {
        cursor: move;
        color: #909399;
      }
    }
  }
  
  /* 右键菜单样式 */
  .context-menu {
    position: fixed;
    background-color: #fff;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    z-index: 2000;
    
    .context-menu-item {
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
      
      &:hover {
        background-color: #f5f7fa;
        color: #409eff;
      }
    }
  }
  
  /* 状态标签样式 */
  :deep(.status-tag) {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    border: 1px solid transparent;
  }
  
  :deep(.status-warning) {
    background-color: #fdf6ec;
    color: #e6a23c;
    border-color: #faecd8;
  }
  
  :deep(.status-primary) {
    background-color: #ecf5ff;
    color: #409eff;
    border-color: #d9ecff;
  }
  
  :deep(.status-success) {
    background-color: #f0f9eb;
    color: #67c23a;
    border-color: #e1f3d8;
  }
  
  :deep(.status-danger) {
    background-color: #fef0f0;
    color: #f56c6c;
    border-color: #fde2e2;
  }
  
  :deep(.status-default) {
    background-color: #f4f4f5;
    color: #909399;
    border-color: #e9e9eb;
  }
  
  /* 拖拽相关样式 */
  .ghost {
    opacity: 0.5;
    background: #c8ebfb;
  }

  /* 分组设置样式 */
  .group-settings {
    padding: 10px 0;
  }

  .group-level {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }

  .group-level-label {
    width: 100px;
    text-align: right;
    padding-right: 12px;
    font-size: 14px;
    color: #606266;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style> 