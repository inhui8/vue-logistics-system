<!-- eslint-disable -->
<template>
  <div class="expense-details-container">
    <!-- 顶部功能栏 -->
    <div class="function-bar">
      <div class="tab-list">
        <div class="tab-item">基础资料</div>
        <div class="tab-item">流转详情</div>
        <div class="tab-item">文件管理</div>
        <div class="tab-item">操作日志</div>
        <div class="tab-item active">费用明细</div>
      </div>
      
      <div class="button-group">
        <el-button size="small" plain @click="handleSend">详情</el-button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="content-container">
      <!-- 左侧主内容区 -->
      <div class="main-content">
        <!-- 顶部按钮区 -->
        <div class="function-buttons">
          <el-button-group>
            <el-button size="small">应收应付</el-button>
            <el-button size="small">索赔</el-button>
            <el-button size="small">审核</el-button>
            <el-button size="small">变更</el-button>
            <el-button size="small">生成单据</el-button>
            <el-button size="small">凭据应用</el-button>
          </el-button-group>
        </div>

        <!-- 应收明细部分 -->
        <div class="detail-section">
          <div class="section-header">
            <div class="section-left">
              <span class="section-title">应收明细</span>
              <div class="section-actions">
                <el-button size="small">添加</el-button>
                <el-button size="small">删除</el-button>
                <el-button size="small">还原</el-button>
                <el-button size="small">应收完成</el-button>
                <el-button size="small">审核</el-button>
                <el-button size="small">取消审核</el-button>
                <el-button size="small">复制</el-button>
                <el-button size="small">复制到应付</el-button>
                <el-button size="small">生成账单</el-button>
                <el-button size="small">撤回费用</el-button>
                <el-button size="small" @click="scrollToTop">
                  <el-icon><Top /></el-icon>
                </el-button>
                <el-button size="small" @click="scrollToBottom">
                  <el-icon><Bottom /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="section-right">
              <el-button :icon="Setting" size="small" circle></el-button>
              <el-button type="primary" size="small">保存</el-button>
            </div>
          </div>

          <!-- 应收表格 -->
          <el-table
            ref="receivableTable"
            :data="receivableData"
            style="width: 100%"
            border
            stripe
            @selection-change="handleReceivableSelectionChange"
          >
            <el-table-column type="selection" width="50"></el-table-column>
            <el-table-column label="序号" width="60" type="index"></el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="scope">
                <div class="status-tags">
                  <el-tag v-if="scope.row.status === '审'" size="small" type="primary">审</el-tag>
                  <el-tag v-if="scope.row.status === '报'" size="small" type="success">报</el-tag>
                  <el-tag v-if="scope.row.status === '补'" size="small" type="warning">补</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="systemId" label="系统SO号" sortable></el-table-column>
            <el-table-column prop="warehouseCode" label="仓库代码" sortable></el-table-column>
            <el-table-column prop="expenseName" label="费用名称" sortable></el-table-column>
            <el-table-column prop="unit" label="单位" sortable width="80"></el-table-column>
            <el-table-column prop="unitPrice" label="单价" sortable width="80"></el-table-column>
            <el-table-column prop="quantity" label="数量" sortable width="80"></el-table-column>
            <el-table-column prop="originalAmount" label="原币金额" sortable></el-table-column>
            <el-table-column prop="currency" label="币种" sortable width="80"></el-table-column>
            <el-table-column prop="exchangeRate" label="汇率" sortable width="80"></el-table-column>
            <el-table-column prop="convertedAmount" label="折算金额" sortable></el-table-column>
          </el-table>

          <!-- 显示控制 -->
          <div class="display-control">
            <el-radio-group v-model="displayMode" size="small">
              <el-radio-button label="all">全部显示</el-radio-button>
              <el-radio-button label="received">只显示已收</el-radio-button>
              <el-radio-button label="receivable">只显示应付</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 应付明细部分 -->
          <div class="section-header">
            <div class="section-left">
              <span class="section-title">应付明细</span>
              <div class="section-actions">
                <el-button size="small">添加</el-button>
                <el-button size="small">删除</el-button>
                <el-button size="small">还原</el-button>
                <el-button size="small">应收完成</el-button>
                <el-button size="small">审核</el-button>
                <el-button size="small">取消审核</el-button>
                <el-button size="small">复制</el-button>
                <el-button size="small">复制到应收</el-button>
                <el-button size="small">生成账单</el-button>
                <el-button size="small">撤回费用</el-button>
                <el-button size="small" @click="scrollToTopPayable">
                  <el-icon><Top /></el-icon>
                </el-button>
                <el-button size="small" @click="scrollToBottomPayable">
                  <el-icon><Bottom /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="section-right">
              <el-button :icon="Setting" size="small" circle></el-button>
            </div>
          </div>

          <!-- 应付表格 -->
          <el-table
            ref="payableTable"
            :data="payableData"
            style="width: 100%"
            border
            stripe
            @selection-change="handlePayableSelectionChange"
          >
            <el-table-column type="selection" width="50"></el-table-column>
            <el-table-column label="序号" width="60" type="index"></el-table-column>
            <el-table-column prop="exchangeRate" label="汇率" sortable></el-table-column>
            <el-table-column prop="convertedAmount" label="折算金额" sortable></el-table-column>
            <el-table-column prop="taxRate" label="税率" sortable></el-table-column>
            <el-table-column prop="taxAmount" label="税金" sortable></el-table-column>
            <el-table-column prop="paymentMethod" label="付款方式" sortable></el-table-column>
            <el-table-column prop="expenseDate" label="费用日期" sortable></el-table-column>
            <el-table-column prop="voucherNumber" label="凭单号" sortable></el-table-column>
            <el-table-column prop="operator" label="操作人" sortable></el-table-column>
            <el-table-column prop="operationTime" label="操作时间" sortable></el-table-column>
            <el-table-column prop="paymentReference" label="付款参考号" sortable></el-table-column>
            <el-table-column prop="outputTime" label="出账时间" sortable></el-table-column>
          </el-table>

          <!-- 空数据展示 -->
          <div v-if="payableData.length === 0" class="empty-container">
            <img src="@/assets/empty-box.svg" class="empty-icon" alt="暂无数据" />
            <div class="empty-text">暂无数据</div>
          </div>
        </div>
      </div>

      <!-- 右侧汇总面板 -->
      <div class="summary-sidebar">
        <div class="panel-header">
          <div class="panel-title">
            <span>汇总面板</span>
          </div>
          <el-button :icon="Refresh" size="small" circle @click="refreshSummary"></el-button>
        </div>

        <div class="sidebar-section">
          <h4>币种</h4>
          <table class="summary-table">
            <thead>
              <tr>
                <th>币种</th>
                <th>应收</th>
                <th>应付</th>
                <th>利润</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>USD</td>
                <td>75</td>
                <td>0</td>
                <td>75</td>
              </tr>
              <tr>
                <td>合计(USD)</td>
                <td>75</td>
                <td>0</td>
                <td>75</td>
              </tr>
              <tr class="summary-row">
                <td>选中合计(USD)</td>
                <td>{{ selectedSummary.receivable }}</td>
                <td>{{ selectedSummary.payable }}</td>
                <td>{{ selectedSummary.profit }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="sidebar-section">
          <h4>功能面板</h4>
          <div class="function-panel">
            <el-button type="primary" size="small" block>全部审核</el-button>
            <el-button type="warning" size="small" block>全部取消审核</el-button>
            <el-button type="success" size="small" block>导出数据</el-button>
            <el-button type="info" size="small" block>打印费用明细</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { Setting, Top, Bottom, Refresh } from '@element-plus/icons-vue';

export default {
  name: 'ExpenseDetails',
  setup() {
    // 表格引用
    const receivableTable = ref(null);
    const payableTable = ref(null);
    
    // 显示模式
    const displayMode = ref('all');
    
    // 应收数据
    const receivableData = ref([
      {
        id: 1,
        status: '审',
        systemId: '990250400000858',
        warehouseCode: 'SWF2',
        expenseName: '拖车费',
        unit: '',
        unitPrice: '',
        quantity: '',
        originalAmount: 75,
        currency: 'USD',
        exchangeRate: 1,
        convertedAmount: 75.00
      }
    ]);
    
    // 应付数据
    const payableData = ref([]);
    
    // 选中的应收项
    const selectedReceivables = ref([]);
    
    // 选中的应付项
    const selectedPayables = ref([]);
    
    // 选中汇总
    const selectedSummary = reactive({
      receivable: 0,
      payable: 0,
      profit: 0
    });
    
    // 处理应收选择变化
    const handleReceivableSelectionChange = (selection) => {
      selectedReceivables.value = selection;
      updateSelectedSummary();
    };
    
    // 处理应付选择变化
    const handlePayableSelectionChange = (selection) => {
      selectedPayables.value = selection;
      updateSelectedSummary();
    };
    
    // 更新选中汇总
    const updateSelectedSummary = () => {
      let totalReceivable = 0;
      let totalPayable = 0;
      
      selectedReceivables.value.forEach(item => {
        totalReceivable += Number(item.convertedAmount) || 0;
      });
      
      selectedPayables.value.forEach(item => {
        totalPayable += Number(item.convertedAmount) || 0;
      });
      
      selectedSummary.receivable = totalReceivable;
      selectedSummary.payable = totalPayable;
      selectedSummary.profit = totalReceivable - totalPayable;
    };
    
    // 处理发送
    const handleSend = () => {
      console.log('发送');
    };
    
    // 刷新汇总
    const refreshSummary = () => {
      console.log('刷新汇总');
      updateSelectedSummary();
    };
    
    // 滚动到顶部
    const scrollToTop = () => {
      if (receivableTable.value) {
        const tableEl = receivableTable.value.$el.querySelector('.el-table__body-wrapper');
        if (tableEl) {
          tableEl.scrollTop = 0;
        }
      }
    };
    
    // 滚动到底部
    const scrollToBottom = () => {
      if (receivableTable.value) {
        const tableEl = receivableTable.value.$el.querySelector('.el-table__body-wrapper');
        if (tableEl) {
          tableEl.scrollTop = tableEl.scrollHeight;
        }
      }
    };
    
    // 滚动到顶部（应付）
    const scrollToTopPayable = () => {
      if (payableTable.value) {
        const tableEl = payableTable.value.$el.querySelector('.el-table__body-wrapper');
        if (tableEl) {
          tableEl.scrollTop = 0;
        }
      }
    };
    
    // 滚动到底部（应付）
    const scrollToBottomPayable = () => {
      if (payableTable.value) {
        const tableEl = payableTable.value.$el.querySelector('.el-table__body-wrapper');
        if (tableEl) {
          tableEl.scrollTop = tableEl.scrollHeight;
        }
      }
    };
    
    return {
      displayMode,
      receivableData,
      payableData,
      selectedReceivables,
      selectedPayables,
      selectedSummary,
      handleReceivableSelectionChange,
      handlePayableSelectionChange,
      handleSend,
      refreshSummary,
      scrollToTop,
      scrollToBottom,
      scrollToTopPayable,
      scrollToBottomPayable,
      receivableTable,
      payableTable,
      Setting,
      Top,
      Bottom,
      Refresh
    };
  }
};
</script>

<style scoped>
.expense-details-container {
  padding: 0;
  background-color: #f5f7fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.function-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
}

.tab-list {
  display: flex;
  height: 40px;
}

.tab-item {
  padding: 0 15px;
  line-height: 40px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  position: relative;
}

.tab-item.active {
  color: #409eff;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #409eff;
}

.button-group {
  display: flex;
  gap: 10px;
}

.content-container {
  display: flex;
  flex: 1;
  padding: 15px;
  gap: 15px;
}

.main-content {
  flex: 1;
  min-width: 0;
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
}

.function-buttons {
  margin-bottom: 15px;
}

.summary-sidebar {
  width: 320px;
  flex-shrink: 0;
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.panel-title {
  font-weight: bold;
  color: #303133;
  font-size: 16px;
}

.sidebar-section {
  margin-bottom: 20px;
}

.sidebar-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
  font-weight: bold;
}

.function-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.section-left {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.section-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.section-right {
  display: flex;
  gap: 8px;
}

.display-control {
  margin: 15px 0;
  display: flex;
  justify-content: flex-end;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.summary-table th, 
.summary-table td {
  padding: 8px 12px;
  text-align: left;
  border: 1px solid #dcdfe6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-table th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: normal;
}

.summary-row {
  background-color: #f5f7fa;
  font-weight: bold;
}

.empty-container {
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.empty-text {
  color: #909399;
  font-size: 14px;
}

.status-tags {
  display: flex;
  gap: 2px;
}
</style> 