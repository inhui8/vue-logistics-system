<!-- eslint-disable -->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建派送"
    width="950px"
    :close-on-click-modal="false"
    @close="handleClose"
    custom-class="add-train-dialog"
    :show-close="false"
  >
    <div class="dialog-header">
      <div class="back-button" @click="handleCancel">
        <i class="el-icon-arrow-left"></i> 返回
      </div>
      <span class="dialog-title">创建派送</span>
    </div>
    
    <div class="dialog-content">
      <!-- 基本信息区域 -->
      <div class="info-section">
        <div class="section-header">基本信息</div>
        <div class="form-content">
          <el-form :model="formData" label-width="80px" size="default">
            <div class="form-row">
              <el-form-item label="派车类型" class="form-item" required>
                <el-select v-model="formData.vehicleType" placeholder="请选择" style="width: 100%">
                  <el-option label="整车" value="full"></el-option>
                  <el-option label="散板" value="partial"></el-option>
                  <el-option label="一提多卸" value="oneToMany"></el-option>
                  <el-option label="多提一卸" value="manyToOne"></el-option>
                </el-select>
              </el-form-item>
              
              <el-form-item label="供应商" class="form-item" required>
                <el-select v-model="formData.supplier" placeholder="请选择" style="width: 100%">
                  <el-option label="供应商1" value="supplier1"></el-option>
                  <el-option label="供应商2" value="supplier2"></el-option>
                  <el-option label="供应商3" value="supplier3"></el-option>
                </el-select>
              </el-form-item>
            </div>
            
            <div class="form-row">
              <el-form-item label="装车类型" class="form-item" required>
                <el-select v-model="formData.loadingType" placeholder="请选择" style="width: 100%">
                  <el-option label="卡板" value="pallet"></el-option>
                  <el-option label="地板" value="floor"></el-option>
                  <el-option label="混装" value="mixed"></el-option>
                </el-select>
              </el-form-item>
              
              <el-form-item label="运输类型" class="form-item" required>
                <el-select v-model="formData.transportType" placeholder="请选择" style="width: 100%">
                  <el-option label="FTL" value="ftl"></el-option>
                  <el-option label="LTL" value="ltl"></el-option>
                </el-select>
              </el-form-item>
            </div>
            
            <div class="form-row">
              <el-form-item label="派送成本" class="form-item">
                <div class="cost-input">
                  <el-input v-model="formData.deliveryCost" placeholder="请输入"></el-input>
                  <span class="currency">USD</span>
                </div>
              </el-form-item>
              
              <el-form-item label="备注" class="form-item">
                <el-input v-model="formData.remark" placeholder="请输入"></el-input>
              </el-form-item>
            </div>
          </el-form>
        </div>
      </div>
      
      <!-- 出库明细 -->
      <div class="detail-section">
        <div class="section-header">派送明细</div>
        <div class="table-summary">合计: {{ formData.totalCount }} , {{ formData.totalCBM }} , {{ formData.totalWeight }} </div>
        
        <el-table :data="formData.details" border style="width: 100%">
          <el-table-column type="selection" width="50"></el-table-column>
          <el-table-column prop="pcNumber" label="PC号" width="120"></el-table-column>
          <el-table-column prop="loadingType" label="装车类型" width="100"></el-table-column>
          <el-table-column prop="orderType" label="订单类型" width="100"></el-table-column>
          <el-table-column prop="destination" label="目的地" width="150"></el-table-column>
          <el-table-column prop="palletCount" label="板数" width="80"></el-table-column>
          <el-table-column prop="weight" label="重量" width="100"></el-table-column>
          <el-table-column prop="volume" label="方数" width="100"></el-table-column>
          <el-table-column prop="appointmentNumber" label="预约号" width="120"></el-table-column>
          <el-table-column prop="appointmentTime" label="预约时间" width="150"></el-table-column>
          <el-table-column prop="appointmentParty" label="预约方" width="100"></el-table-column>
          <el-table-column prop="remark" label="备注" width="120"></el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button type="text" class="delete-btn" @click="handleRemoveItem(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <div class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">保存</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { reactive, computed, watch } from 'vue';

export default {
  name: 'AddTrainDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    selectedRows: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:visible', 'confirm', 'cancel'],
  setup(props, { emit }) {
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    });
    
    // 处理选中的数据
    const processSelectedRows = () => {
      // 模拟处理数据
      return props.selectedRows.map(row => ({
        pcNumber: row.batchNumber || `PC${Math.floor(Math.random() * 10000)}`,
        loadingType: '卡板',
        orderType: '标准派送',
        destination: row.destination || '商业地址-LW2503190889',
        palletCount: row.palletCount || 2,
        weight: row.weight || 2161.61,
        volume: row.volume || 1.58,
        appointmentNumber: row.appointmentNumber || `AP${Math.floor(Math.random() * 10000)}`,
        appointmentTime: '2023-08-15 13:30',
        appointmentParty: 'Amazon',
        remark: row.remark || ''
      }));
    };
    
    // 表单数据
    const formData = reactive({
      vehicleType: '',
      supplier: '',
      loadingType: '',
      transportType: 'ftl',
      deliveryCost: '',
      remark: '',
      details: [],
      totalCount: '300 PCS',
      totalCBM: '12.84 CBM',
      totalWeight: '17526.57 lbs'
    });
    
    // 初始化详情数据
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        formData.details = processSelectedRows();
      }
    });
    
    // 移除明细项
    const handleRemoveItem = (index) => {
      formData.details.splice(index, 1);
    };
    
    // 关闭弹窗
    const handleClose = () => {
      dialogVisible.value = false;
    };
    
    // 取消操作
    const handleCancel = () => {
      dialogVisible.value = false;
      emit('cancel');
    };
    
    // 确认操作
    const handleConfirm = () => {
      emit('confirm', {
        ...formData,
        batchCount: formData.details.length
      });
      
      dialogVisible.value = false;
    };
    
    return {
      dialogVisible,
      formData,
      handleClose,
      handleCancel,
      handleConfirm,
      handleRemoveItem
    };
  }
};
</script>

<style scoped>
.add-train-dialog {
  border-radius: 4px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.back-button {
  cursor: pointer;
  color: #ff6600;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.dialog-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: bold;
}

.dialog-content {
  padding: 0 10px;
}

.info-section, .detail-section {
  margin-bottom: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.section-header {
  background-color: #edf1f7;
  color: #303133;
  padding: 10px 15px;
  font-weight: bold;
  border-left: 3px solid #ff6600;
  margin-bottom: 15px;
}

.form-content {
  padding: 0 15px 15px;
}

.form-row {
  display: flex;
  margin-bottom: 10px;
}

.form-item {
  flex: 1;
  margin-right: 20px;
}

.form-item:last-child {
  margin-right: 0;
}

.cost-input {
  position: relative;
}

.currency {
  position: absolute;
  right: 10px;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  color: #909399;
}

.table-summary {
  padding: 0 15px 15px;
  color: #606266;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  gap: 20px;
}

.delete-btn {
  color: #f56c6c;
}

:deep(.el-table .cell) {
  padding: 8px;
}

:deep(.el-form-item__label) {
  font-weight: normal;
}
</style> 