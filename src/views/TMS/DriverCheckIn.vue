<template>
  <div class="driver-check-in-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ isEnglish ? 'Loading Check In Form' : '装柜登记表' }}</span>
          <el-switch
            v-model="isEnglish"
            active-text="English"
            inactive-text="中文"
            @change="handleLanguageChange"
          />
        </div>
      </template>
      <div v-if="!showDetails">
        <div class="form-description">
          <p>{{ isEnglish ? 'Please provide the following information to inquire about the loading information you need. The system will display delivery details after query:' : '请提供以下信息以查询您需要的装货信息。查询到信息后，系统将显示派送明细：' }}</p>
          <ol>
            <li>Check-In time</li>
            <li>Phone number</li>
            <li>Driver's license number</li>
            <li>Trailer#</li>
            <li>Deadline</li>
          </ol>
        </div>
        
        <div class="demo-info">
          <el-alert
            :title="isEnglish ? 'Demo data available with Pick Up #: 12345, 23456, 34567' : '模拟数据可用的提货号: 12345, 23456, 34567'"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
        
        <el-form :model="form" label-width="140px" class="check-in-form">
          <el-form-item :label="isEnglish ? 'Pick Up #' : '提货号(Pick Up #)'">
            <el-input v-model="form.pickupNumber" :placeholder="isEnglish ? 'Enter pick up number' : '请输入提货号'">
              <template #prepend>
                <el-icon><Document /></el-icon>
              </template>
              <template #append>
                <el-tooltip :content="isEnglish ? 'Click search button after input' : '输入提货号后点击查询按钮'" placement="top">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit" :loading="loading" size="large">
              <el-icon><Search /></el-icon> {{ isEnglish ? 'Search' : '查询' }}
            </el-button>
            <el-button @click="resetForm" size="large">
              <el-icon><RefreshRight /></el-icon> {{ isEnglish ? 'Reset' : '重置' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <div v-else>
        <div class="details-header">
          <h3>{{ isEnglish ? 'Pick Up Information' : '提货信息' }}</h3>
          <el-tag type="success" size="large" effect="dark">{{ getStatusText(deliveryInfo.status) }}</el-tag>
        </div>
        
        <el-form :model="deliveryForm" label-width="140px" class="delivery-form">
          <el-descriptions :column="1" border class="delivery-info" size="large">
            <el-descriptions-item :label="isEnglish ? 'Pick Up #' : '提货号 (Pick Up #)'">{{ deliveryInfo.pickupNumber }}</el-descriptions-item>
            <el-descriptions-item :label="isEnglish ? 'Train Number' : '车次号'">{{ deliveryInfo.trainNumber }}</el-descriptions-item>
            
            <!-- 可编辑的字段 -->
            <el-descriptions-item :label="isEnglish ? 'Driver Phone' : '司机电话'">
              <el-input v-model="deliveryForm.driverPhone" size="small" :placeholder="isEnglish ? 'Enter driver phone' : '请输入司机电话'" />
            </el-descriptions-item>
            
            <el-descriptions-item :label="isEnglish ? 'Driver License' : '司机驾照号码'">
              <el-input v-model="deliveryForm.driverLicense" size="small" :placeholder="isEnglish ? 'Enter driver license' : '请输入驾照号码'" />
            </el-descriptions-item>
            
            <el-descriptions-item :label="isEnglish ? 'Trailer #' : '车厢号 (Trailer #)'">
              <el-input v-model="deliveryForm.carNumber" size="small" :placeholder="isEnglish ? 'Enter trailer number' : '请输入车厢号'" />
            </el-descriptions-item>
            
            <el-descriptions-item :label="isEnglish ? 'Pick Up Appointment Time' : '提货预约时间'">{{ deliveryInfo.appointmentTime }}</el-descriptions-item>
          </el-descriptions>
        </el-form>
        
        <!-- 替换司机登记表单为派送明细表格 -->
        <div class="delivery-details">
          <h4>{{ isEnglish ? 'Delivery Details' : '派送明细' }}</h4>
          <el-table 
            :data="deliveryDetails" 
            style="width: 100%" 
            border 
            stripe
            header-row-class-name="table-header"
            :max-height="400">
            <el-table-column prop="pcNumber" :label="isEnglish ? 'PC #' : 'PC号'" width="120" sortable />
            <el-table-column prop="appointmentParty" :label="isEnglish ? 'Appointment Party' : '预约方'" width="100" />
            <el-table-column prop="appointmentTime" :label="isEnglish ? 'Appointment Time' : '预约时间'" width="150" sortable />
            <el-table-column prop="startWarehouse" :label="isEnglish ? 'Start Warehouse' : '起始仓库'" width="120" />
            <el-table-column prop="destination" :label="isEnglish ? 'Destination' : '目的地'" min-width="150" />
            <el-table-column prop="palletCount" :label="isEnglish ? 'Pallets' : '板数'" width="80" sortable align="center" />
            <el-table-column prop="weight" :label="isEnglish ? 'Weight' : '重量'" width="100" sortable align="center" />
            <el-table-column prop="loadingType" :label="isEnglish ? 'Loading Type' : '装车类型'" width="100" />
            <el-table-column prop="boxCount" :label="isEnglish ? 'Boxes' : '箱数'" width="80" sortable align="center" />
            <el-table-column prop="priority" :label="isEnglish ? 'Priority' : '优先级'" width="80" sortable align="center" />
            <el-table-column prop="cubicMeter" :label="isEnglish ? 'Cubic Meter' : '方数'" width="80" sortable align="center" />
          </el-table>
        </div>
        
        <div class="action-buttons">
          <el-button @click="goBack" size="large">
            <el-icon><Back /></el-icon> {{ isEnglish ? 'Back' : '返回' }}
          </el-button>
          <el-button type="success" @click="handleCheckIn" size="large" :loading="checkingIn" :disabled="deliveryInfo.status === 'completed'">
            <el-icon><Check /></el-icon> {{ isEnglish ? 'Check In' : '确认登记' }}
          </el-button>
        </div>
        
        <!-- Check In 确认对话框 -->
        <el-dialog
          v-model="checkInDialogVisible"
          :title="isEnglish ? 'Confirm Check In' : '确认登记'"
          width="30%"
        >
          <span>{{ isEnglish ? 'Are you sure to check in this delivery?' : '您确定要登记此提货信息吗？' }}</span>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="checkInDialogVisible = false">{{ isEnglish ? 'Cancel' : '取消' }}</el-button>
              <el-button type="primary" @click="confirmCheckIn" :loading="checkingIn">
                {{ isEnglish ? 'Confirm' : '确定' }}
              </el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Document, QuestionFilled, RefreshRight, Back, Check } from '@element-plus/icons-vue';

const form = reactive({
  pickupNumber: '',
});

const deliveryForm = reactive({
  driverPhone: '',
  driverLicense: '',
  carNumber: '',
});

const loading = ref(false);
const checkingIn = ref(false);
const checkInDialogVisible = ref(false);
const showDetails = ref(false);
const deliveryInfo = ref(null);
const deliveryDetails = ref([]);
const isEnglish = ref(false);

// 模拟数据库
const mockDeliveryData = [
  {
    pickupNumber: '12345',
    trainNumber: 'T6789',
    driverPhone: '13800138000',
    driverLicense: 'L12345678',
    carNumber: 'TR987',
    appointmentTime: '2024-07-30 14:00',
    status: 'pending', // pending, in-progress, completed
    details: [
      {
        pcNumber: 'PC2024030100',
        appointmentParty: '客户A',
        appointmentTime: '2024-02-29 14:00:00',
        startWarehouse: '广州仓库',
        destination: '深圳市南山区',
        palletCount: 10,
        weight: 1000,
        loadingType: '卡板',
        boxCount: 100,
        priority: 1,
        cubicMeter: 20
      },
      {
        pcNumber: 'PC2024030100',
        appointmentParty: '客户B',
        appointmentTime: '2024-02-29 15:00:00',
        startWarehouse: '广州仓库',
        destination: '深圳市福田区',
        palletCount: 10,
        weight: 1000,
        loadingType: '地板',
        boxCount: 500,
        priority: 2,
        cubicMeter: 20
      }
    ]
  },
  {
    pickupNumber: '23456',
    trainNumber: 'T7890',
    driverPhone: '13900139000',
    driverLicense: 'L87654321',
    carNumber: 'TR654',
    appointmentTime: '2024-08-02 10:30',
    status: 'in-progress',
    details: [
      {
        pcNumber: 'PC2024030200',
        appointmentParty: '客户C',
        appointmentTime: '2024-03-05 09:00:00',
        startWarehouse: '深圳仓库',
        destination: '北京市朝阳区',
        palletCount: 15,
        weight: 1500,
        loadingType: '卡板',
        boxCount: 150,
        priority: 1,
        cubicMeter: 25
      }
    ]
  },
  {
    pickupNumber: '34567',
    trainNumber: 'T8901',
    driverPhone: '13700137000',
    driverLicense: 'L13579246',
    carNumber: 'TR321',
    appointmentTime: '2024-08-05 09:15',
    status: 'completed',
    details: [
      {
        pcNumber: 'PC2024030300',
        appointmentParty: '客户D',
        appointmentTime: '2024-03-10 13:30:00',
        startWarehouse: '东莞仓库',
        destination: '广州市天河区',
        palletCount: 8,
        weight: 800,
        loadingType: '混装',
        boxCount: 80,
        priority: 3,
        cubicMeter: 15
      },
      {
        pcNumber: 'PC2024030301',
        appointmentParty: '客户E',
        appointmentTime: '2024-03-10 14:30:00',
        startWarehouse: '东莞仓库',
        destination: '广州市海珠区',
        palletCount: 12,
        weight: 1200,
        loadingType: '地板',
        boxCount: 120,
        priority: 2,
        cubicMeter: 22
      }
    ]
  }
];

// 监听 deliveryInfo 变化，更新表单数据
watch(() => deliveryInfo.value, (newVal) => {
  if (newVal) {
    deliveryForm.driverPhone = newVal.driverPhone || '';
    deliveryForm.driverLicense = newVal.driverLicense || '';
    deliveryForm.carNumber = newVal.carNumber || '';
  }
}, { immediate: true });

// 获取状态文本
const getStatusText = (status) => {
  if (isEnglish.value) {
    switch(status) {
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  } else {
    switch(status) {
      case 'pending': return '待登记';
      case 'in-progress': return '登记中';
      case 'completed': return '已完成';
      default: return '未知状态';
    }
  }
};

// 语言切换处理
const handleLanguageChange = (val) => {
  isEnglish.value = val;
};

// 模拟 API 获取数据的函数
const fetchDeliveryInfo = async (pickupNumber) => {
  console.log(`获取提货号为 ${pickupNumber} 的数据`);
  await new Promise(resolve => setTimeout(resolve, 800)); // 模拟网络延迟
  
  const data = mockDeliveryData.find(item => item.pickupNumber === pickupNumber);
  return data || null;
};

const onSubmit = async () => {
  if (!form.pickupNumber) {
    ElMessage.warning(isEnglish.value ? 'Please enter pick up number' : '请输入提货号');
    return;
  }
  
  loading.value = true;
  try {
    const data = await fetchDeliveryInfo(form.pickupNumber);
    if (data) {
      deliveryInfo.value = data;
      deliveryDetails.value = data.details || [];
      showDetails.value = true;
    } else {
      ElMessage.error(isEnglish.value ? 'No information found for this pick up number' : '未找到该提货号的信息');
    }
  } catch (error) {
    console.error('查询提货信息失败:', error);
    ElMessage.error(isEnglish.value ? 'Query failed, please try again later' : '查询失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.pickupNumber = '';
};

const handleCheckIn = () => {
  // 验证必填字段
  if (!deliveryForm.driverPhone || !deliveryForm.driverLicense || !deliveryForm.carNumber) {
    ElMessage.warning(isEnglish.value ? 'Please fill in all required fields' : '请填写所有必填字段');
    return;
  }
  checkInDialogVisible.value = true;
};

const confirmCheckIn = async () => {
  checkingIn.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 更新本地数据
    if (deliveryInfo.value) {
      // 更新表单数据到deliveryInfo
      deliveryInfo.value.driverPhone = deliveryForm.driverPhone;
      deliveryInfo.value.driverLicense = deliveryForm.driverLicense;
      deliveryInfo.value.carNumber = deliveryForm.carNumber;
      deliveryInfo.value.status = 'completed';
      
      // 更新模拟数据库
      const index = mockDeliveryData.findIndex(item => item.pickupNumber === deliveryInfo.value.pickupNumber);
      if (index !== -1) {
        mockDeliveryData[index] = { ...deliveryInfo.value };
      }
    }
    
    ElMessage.success(isEnglish.value ? 'Check in successfully' : '登记成功');
    checkInDialogVisible.value = false;
  } catch (error) {
    console.error('登记失败:', error);
    ElMessage.error(isEnglish.value ? 'Check in failed, please try again later' : '登记失败，请稍后重试');
  } finally {
    checkingIn.value = false;
  }
};

const goBack = () => {
  showDetails.value = false;
  form.pickupNumber = ''; // 清空输入框以便下次查询
  deliveryInfo.value = null;
  deliveryDetails.value = [];
};
</script>

<style scoped>
.driver-check-in-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 18px;
}

.box-card {
  width: 98%;
  max-width: 1200px;
  margin: 20px auto;
  border-radius: 8px;
}

.form-description {
  margin-bottom: 20px;
  color: #606266;
}

.check-in-form {
  margin-top: 30px;
}

.demo-info {
  margin: 20px 0;
}

ol {
  padding-left: 20px;
  margin-bottom: 20px;
}

li {
  margin-bottom: 5px;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.details-header h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.delivery-info {
  margin-bottom: 30px;
}

.delivery-form :deep(.el-descriptions__body) {
  width: 100%;
}

.delivery-form :deep(.el-descriptions__label) {
  width: 140px;
  font-weight: bold;
}

.delivery-form :deep(.el-input) {
  width: 100%;
}

.delivery-details {
  margin-top: 30px;
}

.delivery-details h4 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

:deep(.table-header) {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: bold;
}

:deep(.el-switch__label) {
  color: #606266;
}

:deep(.el-switch__label.is-active) {
  color: #409EFF;
}
</style> 