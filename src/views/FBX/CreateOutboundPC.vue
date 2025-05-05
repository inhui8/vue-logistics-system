<template>
  <div class="create-outbound-pc-container-inner">
    <!-- 基础信息 -->
    <el-card class="section-card basic-info-card">
      <template #header>
        <div class="card-header">
          <span>基础信息</span>
        </div>
      </template>
      <el-form ref="basicInfoForm" :model="basicInfo" label-width="100px" size="small">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="目的地" prop="destination">
              <el-input v-model="basicInfo.destination" placeholder="Amazon-GEU2"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="派送方式" prop="deliveryMethod">
              <el-input v-model="basicInfo.deliveryMethod" placeholder="卡车派送"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="卡板数量" prop="palletQuantity">
              <el-input v-model.number="basicInfo.palletQuantity" placeholder="2" type="number"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="发车日期" prop="departureDate">
              <el-date-picker v-model="basicInfo.departureDate" type="date" placeholder="请选择日期" style="width: 100%;"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="APPT" prop="apptDate">
              <el-date-picker v-model="basicInfo.apptDate" type="date" placeholder="请选择日期" style="width: 100%;"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="供应商" prop="supplier" required>
              <el-select v-model="basicInfo.supplier" placeholder="请选择" style="width: 100%;">
                <el-option label="供应商A" value="A"></el-option>
                <el-option label="供应商B" value="B"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="预约状态" prop="bookingStatus" required>
              <el-radio-group v-model="basicInfo.bookingStatus">
                <el-radio label="unconfirmed">未确认</el-radio>
                <el-radio label="confirmed">已确认</el-radio>
                <el-radio label="overbooked">爆仓</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="装车类型" prop="loadingType" required>
              <el-radio-group v-model="basicInfo.loadingType">
                <el-radio label="pallet">卡板</el-radio>
                <el-radio label="floor">地板</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
           <el-col :span="8">
            <el-form-item label="运输类型" prop="shippingType" required>
              <el-radio-group v-model="basicInfo.shippingType">
                <el-radio label="ftl">FTL</el-radio>
                <el-radio label="ltl">LTL</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="预约方" prop="bookingParty" required>
              <el-radio-group v-model="basicInfo.bookingParty">
                <el-radio label="self">自有约</el-radio>
                <el-radio label="supplier">供应商约</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="派送成本" prop="deliveryCost">
              <el-input v-model="basicInfo.deliveryCost" placeholder="请输入">
                <template #append>USD</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预约号" prop="bookingNumber">
              <div style="display: flex; align-items: center; width: 100%;">
                <el-input v-model="basicInfo.bookingNumber" placeholder="请输入或选择预约" style="flex-grow: 1;"></el-input>
                <el-button 
                  v-if="isAmazonDestination && basicInfo.bookingParty === 'self'" 
                  type="primary" 
                  plain 
                  size="small" 
                  @click="handleSelectAppointment" 
                  style="margin-left: 8px; flex-shrink: 0;"
                >
                  选择预约
                </el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="备注" prop="remarks">
              <el-input v-model="basicInfo.remarks" placeholder="请输入"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8"></el-col>
          <el-col :span="8"></el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 出库明细 -->
    <el-card class="section-card outbound-details-card">
      <template #header>
        <div class="card-header">
          <span>出库明细</span>
        </div>
      </template>
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="已入库" name="stocked">
          <div class="tab-toolbar">
            <el-button size="small" type="danger" plain @click="handleBatchDelete">批量删除</el-button>
            <span class="summary-text">合计: 130 PCS, 4.00 CBM, 2166.68 lbs</span>
          </div>
          <el-table
            ref="stockedTable"
            :data="stockedItems"
            style="width: 100%"
            size="small"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column prop="waybillNo" label="运单号"></el-table-column>
            <el-table-column prop="containerNo" label="柜号"></el-table-column>
            <el-table-column prop="palletNo" label="卡板号"></el-table-column>
            <el-table-column prop="location" label="库位"></el-table-column>
            <el-table-column label="件重体">
              <template #default="scope">
                <div>件数: {{ scope.row.pieces }}</div>
                <div>重量(lbs): {{ scope.row.weight }}</div>
                <div>体积: {{ scope.row.volume }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="text" size="small" @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="待入库" name="pending">
          <div style="padding: 20px; text-align: center; color: #909399;">待入库功能待实现</div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增：选择预约对话框 -->
    <el-dialog 
      v-model="selectAppointmentDialogVisible" 
      title="选择预约" 
      width="75%"
      append-to-body 
      destroy-on-close
    >
      <el-table :data="availableAppointments" style="width: 100%" size="small" border>
        <el-table-column prop="appointmentNumber" label="预约号" width="180"></el-table-column>
        <el-table-column prop="destination" label="目的地" width="180"></el-table-column>
        <el-table-column prop="appointmentTime" label="预约时间" width="160"></el-table-column>
        <el-table-column prop="crdd" label="CRDD" width="160"></el-table-column>
        <el-table-column prop="status" label="使用状态" width="100">
           <template #default="scope">
            <el-tag :type="scope.row.status === '未使用' ? 'success' : 'info'" size="small">{{ scope.row.status }}</el-tag>
           </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="confirmSelectAppointment(scope.row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="selectAppointmentDialogVisible = false" size="small">取消</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { defineEmits } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 定义emit事件，用于通知父组件
const emit = defineEmits(['cancel', 'save']);

// 表单数据模型
const basicInfo = ref({
  destination: 'Amazon-GEU2',
  deliveryMethod: '卡车派送',
  palletQuantity: 2,
  departureDate: null,
  apptDate: null,
  supplier: null,
  bookingStatus: 'unconfirmed',
  loadingType: 'pallet',
  shippingType: 'ftl',
  bookingParty: 'self',
  deliveryCost: null,
  bookingNumber: null,
  remarks: null,
});

// 计算属性，判断目的地是否包含Amazon
const isAmazonDestination = computed(() => {
  return basicInfo.value.destination && basicInfo.value.destination.toLowerCase().includes('amazon');
});

const activeTab = ref('stocked');
const selectedItems = ref([]);

// 已入库表格数据
const stockedItems = ref([
  { id: 1, waybillNo: 'LW25041701409', containerNo: '2025/04/17乐摇', palletNo: 'KB25041701101', location: 'C25', pieces: 66, weight: 1100.01, volume: 2.03 },
  { id: 2, waybillNo: 'LW25041701409', containerNo: '2025/04/17乐摇', palletNo: 'KB25041701102', location: 'C25', pieces: 64, weight: 1066.67, volume: 1.97 },
]);

// --- 新增：选择预约相关 --- 
const selectAppointmentDialogVisible = ref(false);
// 更新模拟数据，为 crdd 添加小时信息
const availableAppointments = ref([
  { id: 'appt1', appointmentNumber: 'APPT_12345', destination: 'Amazon-ABQ2', appointmentTime: '2024-07-25 10:00', crdd: '2024-07-28 15:00', status: '未使用' },
  { id: 'appt2', appointmentNumber: 'APPT_67890', destination: 'Amazon-ONT8', appointmentTime: '2024-07-26 14:30', crdd: '2024-07-29 09:30', status: '未使用' },
  { id: 'appt3', appointmentNumber: 'APPT_11223', destination: 'Amazon-ABQ2', appointmentTime: '2024-07-27 09:00', crdd: '2024-07-30 11:00', status: '已使用' },
]);
// --- 结束：选择预约相关 --- 

// 方法
const handleSelectionChange = (val) => {
  selectedItems.value = val;
};

const handleBatchDelete = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请先选择要删除的项');
    return;
  }
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedItems.value.length} 项吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const idsToDelete = selectedItems.value.map(item => item.id);
    stockedItems.value = stockedItems.value.filter(item => !idsToDelete.includes(item.id));
    ElMessage.success('批量删除成功');
  }).catch(() => {
    // 用户取消
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除运单号 ${row.waybillNo} 吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    stockedItems.value = stockedItems.value.filter(item => item.id !== row.id);
    ElMessage.success('删除成功');
  }).catch(() => {
    // 用户取消
  });
};

// 修改：处理选择预约按钮点击事件 - 打开对话框
const handleSelectAppointment = () => {
  console.log('选择预约按钮被点击');
  // TODO: 在实际应用中，这里可能需要根据目的地或其他条件筛选 availableAppointments
  selectAppointmentDialogVisible.value = true; // 打开选择预约对话框
  // basicInfo.value.bookingNumber = 'APPT_12345'; // 移除之前的模拟赋值
};

// 新增：确认选择预约
const confirmSelectAppointment = (selectedAppointment) => {
  if (selectedAppointment.status !== '未使用') {
    ElMessage.warning('该预约已被使用，请选择其他预约。');
    return;
  }
  basicInfo.value.bookingNumber = selectedAppointment.appointmentNumber; // 将选择的预约号填充到表单
  // 将选择的预约时间填充到APPT日期字段
  // 注意：这里假设appointmentTime的格式是 'YYYY-MM-DD HH:MM'
  // el-date-picker可能需要Date对象或'YYYY-MM-DD'格式
  // 我们先简单地取日期部分，如果需要更精确的处理或不同的格式，需要调整
  if (selectedAppointment.appointmentTime) {
    const datePart = selectedAppointment.appointmentTime.split(' ')[0];
    basicInfo.value.apptDate = datePart; // 更新APPT日期
  } else {
    basicInfo.value.apptDate = null; // 如果没有时间，则清空
  }
  selectAppointmentDialogVisible.value = false; // 关闭对话框
  ElMessage.success(`已选择预约号: ${selectedAppointment.appointmentNumber}`);
};

// eslint-disable-next-line no-unused-vars
const cancel = () => {
  emit('cancel'); // 触发取消事件给父组件
  console.warn('CreateOutboundPC: Cancel event emitted to parent.');
};

// eslint-disable-next-line no-unused-vars
const save = () => {
  // TODO: 添加表单验证逻辑
  console.log('保存的基础信息:', basicInfo.value);
  console.log('保存的出库明细:', stockedItems.value);
  emit('save', { basicInfo: basicInfo.value, details: stockedItems.value }); // 触发保存事件给父组件，并传递数据
  ElMessage.success('保存成功（模拟，事件发送给父组件）');
};

</script>

<style scoped>
.create-outbound-pc-container-inner {
  padding: 0;
}

.section-card {
  margin-bottom: 20px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-card :deep(.el-card__header) {
  background-color: #f8f9fa;
  padding: 10px 15px;
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
  color: #495057;
}

.section-card :deep(.el-card__body) {
  padding: 20px;
}

.basic-info-card :deep(.el-form-item) {
  margin-bottom: 15px;
}

.outbound-details-card :deep(.el-tabs__header) {
  margin-bottom: 15px;
}

.tab-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.summary-text {
  font-size: 14px;
  color: #6c757d;
}

.el-radio-group {
  display: flex;
  align-items: center;
}
.el-radio {
  margin-right: 20px;
}
.el-select {
  width: 100%;
}

.el-table .el-button--text {
  color: #dc3545;
}
.el-table .el-button--text:hover {
  color: #c82333;
}

/* 可选：为新对话框的表格添加一些样式 */
.el-dialog .el-table th {
  background-color: #f5f7fa; /* 表头背景色 */
}
</style> 