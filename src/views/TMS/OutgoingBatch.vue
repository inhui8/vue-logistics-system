<!-- eslint-disable -->
<template>
  <div class="outgoing-batch-container">
    <!-- 顶部筛选区 - 重新设计为简洁样式 -->
    <div class="filter-bar">
      <div class="filter-row">
        <!-- 仓库选择 -->
        <el-select v-model="warehouse" placeholder="美西二号仓" size="small" class="filter-item">
          <el-option label="美西二号仓" value="west2"></el-option>
          <el-option label="美西一号仓" value="west1"></el-option>
        </el-select>
        
        <!-- 创建日期 -->
        <el-select v-model="createDateRange" placeholder="创建日期" size="small" class="filter-item">
          <el-option label="创建日期" value="today"></el-option>
          <el-option label="出库日期" value="yesterday"></el-option>
          <el-option label="APPT" value="7days"></el-option>
        </el-select>
        
        <!-- 开始/结束日期简化为按钮 -->
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
        <el-select v-model="batchNumber" placeholder="批次号" size="small" class="filter-item">
          <el-option label="批次号" value="all"></el-option>
          <el-option label="运单号" value="A001"></el-option>
          <el-option label="预约号" value="A001"></el-option>
        </el-select>
        
        <!-- 搜索框 -->
        <el-input 
          placeholder="请输入" 
          v-model="searchText" 
          size="small" 
          class="search-input"
          prefix-icon="el-icon-search"
        ></el-input>
        
        <!-- SEND订单 -->
        <div class="send-order-filter">
          <span class="label-text">是否SEND订单：</span>
          <el-radio-group v-model="sendOrder" size="small">
            <el-radio-button label="no">否</el-radio-button>
            <el-radio-button label="yes">是</el-radio-button>
          </el-radio-group>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" size="small">查询</el-button>
          <el-button type="warning" size="small">批量操作</el-button>
          <el-button size="small">导出列表</el-button>
          <el-button size="small">导出</el-button>
          <el-button size="small" @click="showFilterPanel">筛选</el-button>
          <el-button size="small" @click="showAddTrainDialog">创建派送</el-button>
        </div>
      </div>
    </div>

    <!-- 状态筛选区域 -->
    <div class="status-filter">
      <el-radio-group v-model="currentStatus" size="small">
        <el-radio-button label="all">全部(21794)</el-radio-button>
        <el-radio-button label="waitConfirm">待确认预约(107)</el-radio-button>
        <el-radio-button label="planned">待出库(152)</el-radio-button>
        <el-radio-button label="entered">草稿（待入库）(0)</el-radio-button>
        <el-radio-button label="transferred">草稿（待提交）(3)</el-radio-button>
        <el-radio-button label="completed">已出库(1585)</el-radio-button>
        <el-radio-button label="delivered">已签收(16351)</el-radio-button>
        <el-radio-button label="pod">已签收POD(3585)</el-radio-button>
        <el-radio-button label="returned">退件(11)</el-radio-button>
        <el-radio-button label="hold">待付款审批(0)</el-radio-button>
        <el-radio-button label="unfulfilled">应付未完成(21794)</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 使用DataTable组件 -->
    <div class="table-container">
      <DataTable 
        :tableData="tableData" 
        :editableFields="editableFields" 
      @selection-change="handleSelectionChange"
      v-loading="loading"
      class="logistics-table"
        :tableHeight="'calc(100vh - 320px)'"
      >
        <!-- 批次号 -->
        <el-table-column 
          prop="batchNumber" 
          label="批次号" 
          width="120" 
          show-overflow-tooltip
        ></el-table-column>
        
        <!-- 预约号 -->
        <el-table-column 
          prop="appointmentNumber" 
          label="预约号" 
          width="120" 
          show-overflow-tooltip
        ></el-table-column>
        
        <!-- 预约日期 -->
        <el-table-column 
          prop="appointmentDate" 
          label="预约日期" 
          width="120" 
          show-overflow-tooltip
        ></el-table-column>
        
        <!-- 签收单 -->
        <el-table-column 
          prop="receiptForm" 
          label="签收单" 
          width="100" 
          show-overflow-tooltip
        ></el-table-column>
        
        <!-- 派送卡车 -->
        <el-table-column 
          prop="deliveryTruck" 
          label="派送卡车" 
          width="150" 
          show-overflow-tooltip
        ></el-table-column>
        
        <!-- 装车类型 -->
        <el-table-column 
          prop="loadingType" 
          label="装车类型" 
          width="100" 
          align="center"
        ></el-table-column>
        
        <!-- 派送标签 -->
        <el-table-column 
          prop="deliveryTag" 
          label="派送标签" 
          width="100" 
          align="center"
        >
          <template #default="scope">
            <el-tag 
              :type="getDeliveryTagType(scope.row.deliveryTag)" 
              size="small" 
              effect="light"
            >{{ scope.row.deliveryTag }}</el-tag>
          </template>
        </el-table-column>
        
        <!-- 目的地 -->
        <el-table-column 
          prop="destination" 
          label="目的地" 
          width="150" 
          show-overflow-tooltip
        >
        <template #default="scope">
            <span style="color: #1890ff" v-if="scope.row.destination && scope.row.destination.includes('Amazon')">
            {{ scope.row.destination }}
          </span>
            <span v-else>{{ scope.row.destination }}</span>
        </template>
      </el-table-column>
        
        <!-- 派送方式 -->
        <el-table-column 
          prop="deliveryMethod" 
          label="派送方式" 
          width="120" 
          align="center"
        ></el-table-column>
        
        <!-- 创建人 -->
        <el-table-column 
          prop="creator" 
          label="创建人" 
          width="120" 
          show-overflow-tooltip
        ></el-table-column>
        
        <!-- 创建时间 -->
        <el-table-column 
          prop="createTime" 
          label="创建时间" 
          width="160" 
          align="center"
        ></el-table-column>
        
        <!-- 批次状态 -->
        <el-table-column 
          prop="batchStatus" 
          label="批次状态" 
          width="120" 
          align="center"
        >
        <template #default="scope">
            <el-tag 
              :type="getBatchStatusType(scope.row.batchStatus)" 
              size="small" 
              effect="light"
            >{{ scope.row.batchStatus }}</el-tag>
        </template>
      </el-table-column>
        
        <!-- 出库类型 -->
        <el-table-column 
          prop="outboundType" 
          label="出库类型" 
          width="120" 
          align="center"
        ></el-table-column>
        
        <!-- 出库时间 -->
        <el-table-column 
          prop="outboundTime" 
          label="出库时间" 
          width="160" 
          align="center"
        ></el-table-column>
        
        <!-- 跟进记录 -->
        <el-table-column 
          prop="followUpRecord" 
          label="跟进记录" 
          width="120" 
          show-overflow-tooltip
        ></el-table-column>
        
        <!-- 备注 -->
        <el-table-column 
          prop="remark" 
          label="备注" 
          width="120" 
          show-overflow-tooltip
        ></el-table-column>
        
        <!-- 派送成本 -->
        <el-table-column 
          prop="deliveryCost" 
          label="派送成本" 
          width="160" 
          show-overflow-tooltip
        ></el-table-column>
        
        <!-- 出库卡板数 -->
        <el-table-column 
          prop="palletCount" 
          label="出库卡板数" 
          width="120" 
          align="center"
        ></el-table-column>
        
        <!-- 出库操作人 -->
        <el-table-column 
          prop="operator" 
          label="出库操作人" 
          width="120" 
          align="center"
        ></el-table-column>
        
        <!-- 出库体积 -->
        <el-table-column 
          prop="outboundVolume" 
          label="出库体积" 
          width="120" 
          align="center"
        ></el-table-column>
        
        <!-- 费用状态 -->
        <el-table-column 
          prop="paymentStatus" 
          label="费用状态" 
          width="120" 
          align="center"
        ></el-table-column>
        
        <!-- 签收时间 -->
        <el-table-column 
          prop="receiptTime" 
          label="签收时间" 
          width="160" 
          align="center"
        ></el-table-column>
        
        <!-- 操作 -->
        <el-table-column 
          label="操作" 
          width="120" 
          fixed="right" 
          align="center"
        >
        <template #default="scope">
          <div class="operation-buttons">
            <el-button type="text" size="small" @click="handleDetail(scope.row)" class="operation-btn">详情</el-button>
            <el-button type="text" size="small" @click="handleMore(scope.row)" class="operation-btn">更多</el-button>
          </div>
        </template>
      </el-table-column>

        <template #expanded-content="{ row }">
          <div class="expanded-details">
            <h4>批次详情 - {{ row.batchNumber }}</h4>
            <div class="expanded-section">
              <p><strong>预约信息：</strong> {{ row.appointmentNumber }} ({{ row.appointmentDate }})</p>
              <p><strong>目的地：</strong> {{ row.destination }}</p>
              <p><strong>批次状态：</strong> {{ row.batchStatus }}</p>
              <p><strong>备注信息：</strong> {{ row.remark || '无' }}</p>
            </div>
          </div>
        </template>
      </DataTable>
      
      <!-- 滚动条占位区域 -->
      <div class="scroll-bar-placeholder"></div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <div class="total-info">共计 {{ pagination.total }} 条</div>
      <el-pagination
        :current-page="pagination.currentPage"
        :page-sizes="[50, 100, 200, 500]"
        :page-size="pagination.pageSize"
        background
        layout="prev, pager, next, jumper"
        :total="pagination.total"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      >
      </el-pagination>
      <div class="page-size-selector">
        <el-select v-model="pagination.pageSize" size="small" @change="handleSizeChange">
          <el-option
            v-for="item in [50, 100, 200, 500]"
            :key="item"
            :label="`${item} 条/页`"
            :value="item"
          ></el-option>
        </el-select>
      </div>
      <div class="go-to-page">
        <span>跳至</span>
        <el-input
          v-model="goToPage"
          size="small"
          style="width: 50px; margin: 0 5px;"
          @keyup.enter="handleGoToPage"
        ></el-input>
        <span>页</span>
      </div>
    </div>
    
    <!-- 加入车次弹窗 -->
    <AddTrainDialog
      v-model:visible="addTrainDialogVisible"
      :selectedRows="selectedRows"
      @confirm="handleAddTrainConfirm"
      @cancel="handleAddTrainCancel"
    />
    <FilterPanel
      v-model:visible="filterPanelVisible"
      :columns="tableColumnDefinitions"
      :existingFilters="activeFilters"
      :existingLogic="filterLogic"
      @apply-filters="handleApplyFilters"
      @cancel="handleFilterCancel"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import DataTable from '@/components/logistics/DataTable.vue';
import AddTrainDialog from '@/components/logistics/AddTrainDialog.vue';
import batchColumns from '@/assets/data/batchColumns.json';
import batchData from '@/assets/data/batchData.json';
import FilterPanel from '@/components/logistics/FilterPanel.vue';
export default {
  name: 'OutgoingBatchView',
  components: {
    DataTable,
    AddTrainDialog,
    FilterPanel
  },
  setup() {
    const loading = ref(false);
    const currentStatus = ref('all');
    const sendOrder = ref('all');
    const selectedRows = ref([]);
    const goToPage = ref('');
    const dateRange = ref([]);
    const addTrainDialogVisible = ref(false);
    
    // 筛选面板相关变量
    const filterPanelVisible = ref(false);
    const activeFilters = ref([]);
    const filterLogic = ref('and');
    
    // 表格列定义 - 用于筛选面板
    const tableColumnDefinitions = ref([
      { label: '批次号', prop: 'batchNumber', type: 'string' },
      { label: '预约号', prop: 'appointmentNumber', type: 'string' },
      { label: '预约日期', prop: 'appointmentDate', type: 'date' },
      { label: '签收单', prop: 'receiptForm', type: 'string' },
      { label: '派送卡车', prop: 'deliveryTruck', type: 'string' },
      { label: '装车类型', prop: 'loadingType', type: 'select', options: ['整车', '拼车', '快递'] },
      { label: '派送标签', prop: 'deliveryTag', type: 'select', options: ['优先派送', '标准派送', '特殊派送', '自提', '快递派送', '整车运输'] },
      { label: '目的地', prop: 'destination', type: 'string' },
      { label: '派送方式', prop: 'deliveryMethod', type: 'select', options: ['自配送', '第三方', '快递'] },
      { label: '创建人', prop: 'creator', type: 'string' },
      { label: '创建时间', prop: 'createTime', type: 'date' },
      { label: '批次状态', prop: 'batchStatus', type: 'select', options: ['待出库', '待确认订舱', '待确认预约', '已出库', '已签收', '已签收POD'] },
      { label: '出库类型', prop: 'outboundType', type: 'select', options: ['普通出库', '紧急出库', '特殊出库'] },
      { label: '出库时间', prop: 'outboundTime', type: 'date' },
      { label: '跟进记录', prop: 'followUpRecord', type: 'string' },
      { label: '备注', prop: 'remark', type: 'string' },
      { label: '派送成本', prop: 'deliveryCost', type: 'number' },
      { label: '出库卡板数', prop: 'palletCount', type: 'number' },
      { label: '出库操作人', prop: 'operator', type: 'string' },
      { label: '出库体积', prop: 'outboundVolume', type: 'number' },
      { label: '费用状态', prop: 'paymentStatus', type: 'select', options: ['已付款', '待付款', '部分付款'] },
      { label: '签收时间', prop: 'receiptTime', type: 'date' }
    ]);
    
    // 表格列定义
    const tableColumns = ref(batchColumns);
    
    // 过滤掉特殊列
    const filteredColumns = computed(() => {
      return tableColumns.value.filter(col => {
        return col.prop !== 'selection' && col.prop !== 'operation';
      });
    });
    
    // 表格数据
    const tableData = ref([]);
    
    // 可编辑字段配置
    const editableFields = reactive({
      remark: { type: 'input' },
      followUpRecord: { type: 'input' }
    });
    
    // 新增筛选字段
    const warehouse = ref('west2');
    const createDateRange = ref('');
    const batchNumber = ref('');
    const searchText = ref('');

    // 分页配置
    const pagination = reactive({
      currentPage: 1,
      pageSize: 50,
      total: 0
    });

    // 批次状态颜色映射
    const getBatchStatusType = (status) => {
      const statusMap = {
        '待出库': 'warning',
        '待确认订舱': 'info',
        '待确认预约': 'info',
        '已出库': 'success',
        '已签收': 'success',
        '已签收POD': 'success'
      };
      return statusMap[status] || 'info';
    };
    
    // 派送标签颜色映射
    const getDeliveryTagType = (tag) => {
      const tagMap = {
        '优先派送': 'danger',
        '标准派送': 'primary',
        '特殊派送': 'warning',
        '自提': 'info',
        '快递派送': 'success',
        '整车运输': 'warning'
      };
      return tagMap[tag] || 'info';
    };

    // 表格选择事件
    const handleSelectionChange = (selection) => {
      selectedRows.value = selection;
    };

    // 分页事件
    const handleCurrentChange = (page) => {
      pagination.currentPage = page;
      fetchData();
    };

    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      fetchData();
    };

    const handleGoToPage = () => {
      const page = parseInt(goToPage.value);
      if (page && page > 0 && page <= Math.ceil(pagination.total / pagination.pageSize)) {
        pagination.currentPage = page;
        fetchData();
      }
      goToPage.value = '';
    };

    // 行操作
    const handleDetail = (row) => {
      console.log('查看详情:', row);
    };

    const handleMore = (row) => {
      console.log('查看更多:', row);
    };

    // 显示加入车次弹窗
    const showAddTrainDialog = () => {
      if (selectedRows.value.length === 0) {
        // 可以使用Element Plus的消息提示
        // ElMessage.warning('请先选择要加入派送的批次');
        alert('请先选择要创建派送的批次');
        return;
      }
      addTrainDialogVisible.value = true;
    };
    
    // 处理加入车次确认
    const handleAddTrainConfirm = (data) => {
      console.log('创建派送确认:', data);
      // 这里处理创建派送逻辑
      alert(`已成功创建派送，包含${data.batchCount}个出库明细`);
    };
    
    // 处理加入车次取消
    const handleAddTrainCancel = () => {
      console.log('取消创建派送');
    };
    
    // 显示筛选面板
    const showFilterPanel = () => {
      filterPanelVisible.value = true;
    };
    
    // 应用筛选条件
    const handleApplyFilters = (filters, logic) => {
      console.log('应用筛选条件:', filters, '逻辑:', logic);
      activeFilters.value = filters;
      filterLogic.value = logic;
      fetchFilteredData();
      filterPanelVisible.value = false;
    };
    
    // 取消筛选
    const handleFilterCancel = () => {
      filterPanelVisible.value = false;
    };
    
    // 获取筛选后的数据
    const fetchFilteredData = () => {
      if (activeFilters.value.length === 0) {
        fetchData();
        return;
      }
      
      loading.value = true;
      
      // 模拟筛选API请求
      setTimeout(() => {
        // 应用筛选条件
        const filteredData = batchData.filter(item => {
          // 根据选择的逻辑（AND/OR）来筛选
          if (filterLogic.value === 'and') {
            // 所有条件都必须满足 (AND)
            return activeFilters.value.every(filter => {
              return applyFilter(item, filter);
            });
          } else {
            // 只要满足一个条件即可 (OR)
            return activeFilters.value.some(filter => {
              return applyFilter(item, filter);
            });
          }
        });
        
        tableData.value = filteredData;
        pagination.total = filteredData.length;
        loading.value = false;
      }, 500);
    };
    
    // 应用单个筛选条件
    const applyFilter = (item, filter) => {
      const { field, operator, value } = filter;
      const fieldValue = item[field];
      
      if (fieldValue === undefined || fieldValue === null) {
        return false;
      }
      
      // 根据不同的操作符和数据类型来判断
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'notEquals':
          return fieldValue !== value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        case 'notContains':
          return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        case 'startsWith':
          return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
        case 'endsWith':
          return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
        case 'greaterThan':
          return Number(fieldValue) > Number(value);
        case 'lessThan':
          return Number(fieldValue) < Number(value);
        case 'greaterThanOrEqual':
          return Number(fieldValue) >= Number(value);
        case 'lessThanOrEqual':
          return Number(fieldValue) <= Number(value);
        case 'between':
          if (Array.isArray(value) && value.length === 2) {
            if (typeof fieldValue === 'string' && fieldValue.includes('-')) {
              // 假设是日期格式
              const date = new Date(fieldValue);
              const start = new Date(value[0]);
              const end = new Date(value[1]);
              return date >= start && date <= end;
            } else {
              // 数字范围
              return Number(fieldValue) >= Number(value[0]) && Number(fieldValue) <= Number(value[1]);
            }
          }
          return false;
        default:
          return false;
      }
    };

    // 模拟获取数据
    const fetchData = () => {
      loading.value = true;
      
      // 模拟API请求
      setTimeout(() => {
        // 从导入的JSON获取数据
        tableData.value = batchData;
        
        // 更新总条数
        pagination.total = batchData.length;
        
        loading.value = false;
      }, 500);
    };

    // 加载数据
    onMounted(() => {
      fetchData();
    });

    return {
      loading,
      currentStatus,
      sendOrder,
      tableData,
      tableColumns,
      filteredColumns,
      editableFields,
      selectedRows,
      pagination,
      goToPage,
      dateRange,
      warehouse,
      createDateRange,
      batchNumber,
      searchText,
      addTrainDialogVisible,
      // 新增的筛选面板相关内容
      filterPanelVisible,
      tableColumnDefinitions,
      activeFilters,
      filterLogic,
      getBatchStatusType,
      getDeliveryTagType,
      handleSelectionChange,
      handleCurrentChange,
      handleSizeChange,
      handleGoToPage,
      handleDetail,
      handleMore,
      fetchData,
      showAddTrainDialog,
      handleAddTrainConfirm,
      handleAddTrainCancel,
      // 新增的筛选面板相关方法
      showFilterPanel,
      handleApplyFilters,
      handleFilterCancel
    };
  }
};
</script>

<style scoped>
.outgoing-batch-container {
  padding: 15px;
  background-color: #f5f7fa;
}

.filter-bar {
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  margin-bottom: 10px;
  padding: 8px 10px;
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  overflow-x: auto;
  height: 40px;
}

.filter-item {
  margin-right: 8px;
  width: 130px;
}

.date-buttons {
  display: flex;
  margin-right: 8px;
}

.date-buttons .el-button {
  padding: 7px 10px;
  margin-right: 3px;
}

.search-input {
  width: 200px;
  margin-right: 8px;
}

.send-order-filter {
  display: flex;
  align-items: center;
  white-space: nowrap;
  margin-right: 8px;
}

.label-text {
  font-size: 12px;
  margin-right: 4px;
}

.action-buttons {
  display: flex;
  margin-left: auto;
}

.action-buttons .el-button {
  margin-left: 5px;
}

/* 滚动条美化 */
.filter-row::-webkit-scrollbar {
  height: 4px;
}

.filter-row::-webkit-scrollbar-thumb {
  background-color: #e0e0e0;
  border-radius: 4px;
}

.filter-row::-webkit-scrollbar-track {
  background-color: #f5f5f5;
}

/* 状态筛选样式调整 */
.status-filter {
  background-color: #fff;
  border-radius: 2px;
  padding: 10px;
  margin-bottom: 10px;
  overflow-x: auto;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.status-filter .el-radio-button__inner {
  padding: 8px 12px;
}

/* 使用DataTable组件 */
.table-container {
  position: relative;
  height: calc(100vh - 340px);
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
}

/* 表格容器 */
.table-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
  padding-bottom: 12px; /* 为横向滚动条留出足够空间 */
}

/* 美化滚动条 */
.logistics-table :deep(.el-table__body-wrapper::-webkit-scrollbar) {
  height: 10px;
  width: 10px;
}

.logistics-table :deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background-color: #c0c4cc;
  border-radius: 5px;
}

.logistics-table :deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background-color: #f5f7fa;
  border-radius: 5px;
}

/* 表格样式 */
.logistics-table {
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

:deep(.el-table) {
  width: auto !important;
  min-width: 100%;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
  padding: 10px 0;
}

:deep(.el-table--border th:first-child .cell) {
  padding-left: 10px;
}

:deep(.el-table td) {
  padding: 8px 0;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafafa;
}

:deep(.el-table__row:hover td) {
  background-color: #f0f9ff !important;
}

/* 操作按钮样式 */
.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.operation-btn {
  color: #FF6600;
  font-weight: 500;
  padding: 2px 5px;
  margin: 0;
}

.operation-btn:hover {
  color: #ff8c40;
  background-color: rgba(255, 102, 0, 0.1);
  border-radius: 2px;
}

/* 展开图标 */
.expand-icon {
  cursor: pointer;
  transition: transform 0.2s;
}

.expand-icon:hover {
  color: #409EFF;
}

/* 分页样式 */
.pagination-container {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.total-info {
  margin-right: 15px;
  color: #606266;
}

.page-size-selector {
  margin-left: 15px;
}

.go-to-page {
  margin-left: 15px;
  display: flex;
  align-items: center;
}

/* 标签样式 */
:deep(.el-tag) {
  font-weight: 500;
}

/* 展开详情样式 */
.expanded-details {
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.expanded-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 10px;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .filter-item {
    min-width: 100px;
  }
}

/* 滚动条占位区域 */
.scroll-bar-placeholder {
  height: 20px;
  margin-top: 5px;
  background-color: #f5f7fa;
  border-radius: 5px;
  position: relative;
}

.date-range-picker {
  width: 260px;
}
</style> 