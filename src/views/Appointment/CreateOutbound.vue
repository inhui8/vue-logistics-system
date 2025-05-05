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
              <span class="summary-text">合计: {{ summary.pieces }} PCS, {{ summary.volume }} CBM, {{ summary.weight }} lbs</span>
            </div>
            <el-table
              ref="stockedTable"
              :data="stockedItems"
              style="width: 100%"
              size="small"
              @selection-change="handleStockedSelectionChange"
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
  import { ref, computed, defineExpose, defineEmits } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  
  // 定义emit事件，用于通知父组件
  const emit = defineEmits(['cancel', 'save']);
  
  // 表单数据模型
  const basicInfoForm = ref(null);
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
  const stockedTable = ref(null);
  const selectedStockedItems = ref([]);
  
  // 已入库表格数据
  const stockedItems = ref([]);
  
  // --- 新增：选择预约相关 --- 
  const selectAppointmentDialogVisible = ref(false);
  const availableAppointments = ref([
    { id: 'appt1', appointmentNumber: 'APPT_12345', destination: 'Amazon-ABQ2', appointmentTime: '2024-07-25 10:00', crdd: '2024-07-28 15:00', status: '未使用' },
    { id: 'appt2', appointmentNumber: 'APPT_67890', destination: 'Amazon-ONT8', appointmentTime: '2024-07-26 14:30', crdd: '2024-07-29 09:30', status: '未使用' },
    { id: 'appt3', appointmentNumber: 'APPT_11223', destination: 'Amazon-ABQ2', appointmentTime: '2024-07-27 09:00', crdd: '2024-07-30 11:00', status: '已使用' },
  ]);
  // --- 结束：选择预约相关 --- 
  
  // --- 计算汇总信息 ---
  const summary = computed(() => {
    let pieces = 0;
    let volume = 0;
    let weight = 0;
    stockedItems.value.forEach(item => {
      pieces += Number(item.pieces) || 0;
      volume += Number(item.volume) || 0;
      weight += Number(item.weight) || 0;
    });
    return { pieces, volume, weight };
  });
  
  // --- 方法 ---
  
  // Method to set stocked items from parent component
  const setStockedItems = (items) => {
    console.log('Setting stocked items in CreateOutbound:', items);
    stockedItems.value = items;
    // Optionally update pallet quantity based on received items summary?
    // basicInfo.value.palletQuantity = summary.value.pieces; // Or based on item count
    // Optionally set destination based on first item?
    // if (items.length > 0 && !basicInfo.value.destination) {
        // Example: Assuming destination info might be in customerName or platformCode
        // basicInfo.value.destination = items[0].platformCode || 'Default Destination';
    // }
  };
  
  const handleStockedSelectionChange = (val) => {
    selectedStockedItems.value = val;
  };
  
  const handleDelete = (row) => {
    ElMessageBox.confirm('确定要删除这条明细吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        const index = stockedItems.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          stockedItems.value.splice(index, 1);
          ElMessage({
            type: 'success',
            message: '删除成功!',
          });
        }
      })
      .catch(() => {
        // Cancelled
      });
  };
  
  const handleBatchDelete = () => {
    if (selectedStockedItems.value.length === 0) {
      ElMessage.warning('请先选择要删除的明细');
      return;
    }
    ElMessageBox.confirm(`确定要删除选中的 ${selectedStockedItems.value.length} 条明细吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        const selectedIds = selectedStockedItems.value.map(item => item.id);
        stockedItems.value = stockedItems.value.filter(item => !selectedIds.includes(item.id));
        ElMessage({
          type: 'success',
          message: '批量删除成功!',
        });
         stockedTable.value?.clearSelection(); // Clear table selection
      })
      .catch(() => {
        // Cancelled
      });
  };
  
  const handleSelectAppointment = () => {
    selectAppointmentDialogVisible.value = true;
  };
  
  const confirmSelectAppointment = (appointment) => {
    if (appointment.status !== '未使用') {
      ElMessage.warning('该预约已被使用，请选择其他预约。');
      return;
    }
    basicInfo.value.bookingNumber = appointment.appointmentNumber;
    if (appointment.appointmentTime) {
      const datePart = appointment.appointmentTime.split(' ')[0];
      basicInfo.value.apptDate = datePart;
    } else {
      basicInfo.value.apptDate = null;
    }
    selectAppointmentDialogVisible.value = false;
    ElMessage.success(`已选择预约号: ${appointment.appointmentNumber}`);
  };
  
  // Method to be called by parent to trigger save/submit
  const submit = async () => {
    try {
      const valid = await basicInfoForm.value?.validate();
      if (!valid) {
        ElMessage.error('请检查基础信息表单是否填写完整且正确！');
        return;
      }
      if (stockedItems.value.length === 0) {
          ElMessage.error('出库明细不能为空！');
          return;
      }
      const saveData = {
        basicInfo: basicInfo.value,
        details: stockedItems.value,
      };
      console.log('Submitting data:', saveData);
      emit('save', saveData);
    } catch (error) {
      console.error("Validation or submission error:", error);
    }
  };
  
  // Expose methods to the parent component
  defineExpose({
    setStockedItems, // Expose the method to set items
    submit,        // Expose the submit method
  });
  
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