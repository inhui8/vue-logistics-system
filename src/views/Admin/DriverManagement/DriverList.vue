<template>
  <div class="driver-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>驾驶员列表</span>
           <el-button type="primary" @click="handleAddDriver">
             <el-icon><Plus /></el-icon> 新增驾驶员
           </el-button>
        </div>
      </template>

       <!-- 筛选区域 -->
      <el-form :inline="true" :model="filterForm" class="filter-form">
         <el-form-item label="供应商">
            <el-select v-model="filterForm.supplierId" placeholder="选择供应商" clearable filterable>
             <el-option
                v-for="supplier in mockSuppliers" 
                :key="supplier.id"
                :label="supplier.name"
                :value="supplier.id"
              />
            </el-select>
         </el-form-item>
         <el-form-item label="驾驶员姓名">
           <el-input v-model="filterForm.name" placeholder="输入姓名" clearable />
         </el-form-item>
          <el-form-item label="联系方式">
           <el-input v-model="filterForm.phone" placeholder="输入手机号" clearable />
         </el-form-item>
         <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
              <el-option
                 v-for="item in statusOptions"
                 :key="item.value"
                 :label="item.label"
                 :value="item.value"
               />
            </el-select>
         </el-form-item>
          <el-form-item label="驾照到期预警">
             <el-checkbox v-model="filterForm.licenseExpiringSoon">只看即将到期</el-checkbox>
          </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 驾驶员列表 -->
      <el-table :data="filteredDriverList" style="width: 100%" border>
         <el-table-column prop="name" label="姓名" width="120" fixed />
         <el-table-column prop="supplierName" label="所属供应商" width="200" show-overflow-tooltip />
         <el-table-column prop="phone" label="联系方式" width="130" />
         <el-table-column prop="licenseNumber" label="驾驶证号" width="180" />
         <el-table-column prop="allowedVehicleTypes" label="准驾车型" width="120" />
          <el-table-column prop="licenseExpiryDate" label="驾驶证有效期" width="140">
             <template #default="scope">
                <span :class="{'expiring-soon': isLicenseExpiringSoon(scope.row.licenseExpiryDate)}">
                  {{ scope.row.licenseExpiryDate }}
                  <el-tooltip v-if="isLicenseExpiringSoon(scope.row.licenseExpiryDate)" content="驾照即将到期" placement="top">
                     <el-icon color="#E6A23C" style="margin-left: 5px;"><Warning /></el-icon>
                  </el-tooltip>
                </span>
             </template>
          </el-table-column>
         <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
               <el-tag :type="getStatusTagType(scope.row.status)">
                 {{ formatStatus(scope.row.status) }}
               </el-tag>
            </template>
         </el-table-column>
          <el-table-column label="操作" fixed="right" width="150">
           <template #default="scope">
              <el-button text type="primary" size="small" @click="handleEditDriver(scope.row)">编辑</el-button>
              <el-button text type="danger" size="small" @click="handleDeleteDriver(scope.row)">删除</el-button>
           </template>
         </el-table-column>
      </el-table>

       <!-- 分页 -->
       <el-pagination
          style="margin-top: 20px; justify-content: flex-end;"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalDrivers"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          :current-page="pagination.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />

       <!-- 新增/编辑驾驶员弹窗 -->
        <el-dialog
          v-model="dialogVisible"
          :title="dialogTitle"
          width="60%"
          @close="handleDialogClose"
          :close-on-click-modal="false"
        >
          <el-form
            ref="driverFormRef"
            :model="driverForm"
            :rules="formRules"
            label-width="120px"
          >
             <el-row :gutter="20">
               <el-col :span="12">
                 <el-form-item label="所属供应商" prop="supplierId">
                    <el-select v-model="driverForm.supplierId" placeholder="选择供应商" filterable style="width: 100%;" :disabled="isEditMode">
                      <el-option
                         v-for="supplier in mockSuppliers" 
                         :key="supplier.id"
                         :label="supplier.name"
                         :value="supplier.id"
                       />
                    </el-select>
                 </el-form-item>
               </el-col>
               <el-col :span="12">
                 <el-form-item label="驾驶员姓名" prop="name">
                   <el-input v-model="driverForm.name" placeholder="请输入姓名" />
                 </el-form-item>
               </el-col>
             </el-row>
              <el-row :gutter="20">
               <el-col :span="12">
                 <el-form-item label="联系方式" prop="phone">
                   <el-input v-model="driverForm.phone" placeholder="请输入手机号" />
                 </el-form-item>
               </el-col>
                <el-col :span="12">
                 <el-form-item label="状态" prop="status">
                    <el-select v-model="driverForm.status" placeholder="选择状态" style="width: 100%;">
                      <el-option
                         v-for="item in statusOptions"
                         :key="item.value"
                         :label="item.label"
                         :value="item.value"
                       />
                    </el-select>
                 </el-form-item>
               </el-col>
             </el-row>
              <el-divider>证照信息</el-divider>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="驾驶证号" prop="licenseNumber">
                    <el-input v-model="driverForm.licenseNumber" placeholder="请输入驾驶证号" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="准驾车型" prop="allowedVehicleTypes">
                    <el-input v-model="driverForm.allowedVehicleTypes" placeholder="如：C1, A2" />
                  </el-form-item>
                </el-col>
              </el-row>
               <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="驾驶证有效期" prop="licenseExpiryDate">
                     <el-date-picker
                       v-model="driverForm.licenseExpiryDate"
                       type="date"
                       placeholder="选择有效期至"
                       style="width: 100%;"
                       value-format="YYYY-MM-DD"
                      />
                  </el-form-item>
                </el-col>
                 <el-col :span="12">
                  <el-form-item label="从业资格证 (占位)">
                     <el-input disabled placeholder="待实现" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                 <el-col :span="24">
                   <el-form-item label="相关证照上传">
                     <el-button link type="primary" disabled>点击上传 (待实现)</el-button>
                   </el-form-item>
                 </el-col>
              </el-row>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible = false">取消</el-button>
              <el-button type="primary" @click="handleSubmit">确认</el-button>
            </span>
          </template>
        </el-dialog>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Warning } from '@element-plus/icons-vue'; // Import Warning icon

// --- 模拟数据 ---
const mockSuppliers = ref([
  { id: 'supplier_1', name: '测试供应商A - 专做提框服务' },
  { id: 'supplier_2', name: '测试供应商B - FBA派送专家' },
  { id: 'supplier_3', name: '测试供应商C - 全能型选手' },
]);

const allDrivers = ref([]);

const generateMockDrivers = (count = 30) => {
  const names = ['张师傅', '李师傅', '王司机', '赵司机', '孙师傅', '周工', '吴经理', '郑技术员'];
  const phones = ['131', '132', '133', '134', '135', '136', '137', '138', '139', '186', '158'];
  const licenses = ['A1', 'A2', 'A3', 'B1', 'B2', 'C1', 'C2'];
  const statuses = ['idle', 'on_trip', 'on_leave', 'deactivated'];
  const mockData = [];
  const now = new Date();
  const fiveYearsLater = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());

  for (let i = 0; i < count; i++) {
    const supplier = mockSuppliers.value[Math.floor(Math.random() * mockSuppliers.value.length)];
    let expiryDate = fiveYearsLater; // 默认5年后到期
    if (Math.random() < 0.1) { // 10% 概率即将到期
        expiryDate = new Date(now.getTime() + Math.floor(Math.random() * 40 * 24 * 60 * 60 * 1000)); // 未来40天内随机一天
    } else if (Math.random() < 0.2) { // 20% 概率一年内到期
        expiryDate = new Date(now.getTime() + Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
    }

    mockData.push({
      id: `driver_${i + 1}`,
      name: names[Math.floor(Math.random() * names.length)] + String.fromCharCode(65 + i % 26),
      supplierId: supplier.id,
      supplierName: supplier.name,
      phone: `${phones[Math.floor(Math.random() * phones.length)]}${String(Math.random()).slice(2, 10)}`,
      licenseNumber: `DL${String(Math.random()).slice(2, 14)}`,
      allowedVehicleTypes: licenses[Math.floor(Math.random() * licenses.length)],
      licenseExpiryDate: expiryDate.toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * statuses.length)],
    });
  }
  return mockData;
};

// --- 选项数据 ---
const statusOptions = [
  { value: 'idle', label: '空闲' },
  { value: 'on_trip', label: '执行任务中' },
  { value: 'on_leave', label: '休假中' },
  { value: 'deactivated', label: '停用' },
];

// --- 筛选与分页 ---
const filterForm = reactive({
  supplierId: '',
  name: '',
  phone: '',
  status: '',
  licenseExpiringSoon: false,
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
});

const totalDrivers = computed(() => filteredDriversData.value.length);

// 过滤逻辑
const filteredDriversData = computed(() => {
  return allDrivers.value.filter(driver => {
    const supplierMatch = filterForm.supplierId ? driver.supplierId === filterForm.supplierId : true;
    const nameMatch = filterForm.name ? driver.name.includes(filterForm.name) : true;
    const phoneMatch = filterForm.phone ? driver.phone.includes(filterForm.phone) : true;
    const statusMatch = filterForm.status ? driver.status === filterForm.status : true;
    const expiryMatch = filterForm.licenseExpiringSoon ? isLicenseExpiringSoon(driver.licenseExpiryDate, 30) : true; // 默认30天内算即将到期
    return supplierMatch && nameMatch && phoneMatch && statusMatch && expiryMatch;
  });
});

// 分页逻辑
const filteredDriverList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredDriversData.value.slice(start, end);
});

// --- 弹窗与表单 ---
const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEditMode = ref(false);
const driverFormRef = ref(null);

// 表单数据模型
const initialFormState = {
  id: null,
  name: '',
  supplierId: '',
  phone: '',
  licenseNumber: '',
  allowedVehicleTypes: '',
  licenseExpiryDate: '',
  status: 'idle',
};
const driverForm = reactive({ ...initialFormState });

// 表单验证规则
const formRules = reactive({
  supplierId: [{ required: true, message: '请选择所属供应商', trigger: 'change' }],
  name: [{ required: true, message: '请输入驾驶员姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系方式', trigger: 'blur' }], // 可加手机号格式验证
  licenseNumber: [{ required: true, message: '请输入驾驶证号', trigger: 'blur' }],
  allowedVehicleTypes: [{ required: true, message: '请输入准驾车型', trigger: 'blur' }],
  licenseExpiryDate: [{ required: true, message: '请选择驾驶证有效期', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
});

// --- 方法 ---
// 格式化
const formatStatus = (status) => statusOptions.find(opt => opt.value === status)?.label || status;
const getStatusTagType = (status) => {
  switch (status) {
    case 'idle': return 'success';
    case 'on_trip': return 'primary';
    case 'on_leave': return 'warning';
    case 'deactivated': return 'info';
    default: return 'info';
  }
};

// 判断驾照是否即将到期 (默认提前 30 天预警)
const isLicenseExpiringSoon = (expiryDate, daysThreshold = 30) => {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= daysThreshold;
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
};

// 分页
const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize;
  pagination.currentPage = 1;
};
const handleCurrentChange = (newPage) => {
  pagination.currentPage = newPage;
};

// 重置表单
const resetForm = () => {
  Object.assign(driverForm, initialFormState);
  nextTick(() => {
    driverFormRef.value?.clearValidate();
  });
};

// 新增
const handleAddDriver = () => {
  resetForm();
  isEditMode.value = false;
  dialogTitle.value = '新增驾驶员';
  dialogVisible.value = true;
};

// 编辑
const handleEditDriver = (row) => {
  resetForm();
  isEditMode.value = true;
  dialogTitle.value = '编辑驾驶员信息';
  nextTick(() => {
     Object.assign(driverForm, JSON.parse(JSON.stringify(row)));
  });
  dialogVisible.value = true;
};

// 删除
const handleDeleteDriver = (row) => {
   ElMessageBox.confirm(`确定要删除驾驶员 ${row.name} 吗?`, '警告', { type: 'warning' })
     .then(() => {
       console.log('删除驾驶员:', row.id);
       const index = allDrivers.value.findIndex(d => d.id === row.id);
       if (index !== -1) {
         allDrivers.value.splice(index, 1);
       }
       ElMessage.success('删除成功');
     })
     .catch(() => ElMessage.info('取消删除'));
};

// 弹窗关闭
const handleDialogClose = () => {
  resetForm();
  dialogVisible.value = false;
};

// 提交
const handleSubmit = async () => {
  if (!driverFormRef.value) return;
  try {
    await driverFormRef.value.validate();
    const supplierName = mockSuppliers.value.find(s => s.id === driverForm.supplierId)?.name || '';
    const driverData = { ...driverForm, supplierName };

    if (isEditMode.value) {
      console.log('更新驾驶员:', driverData);
      const index = allDrivers.value.findIndex(d => d.id === driverData.id);
      if (index !== -1) {
        allDrivers.value[index] = driverData;
      }
      ElMessage.success('更新成功');
    } else {
      const newDriver = { ...driverData, id: `driver_${Date.now()}` };
      console.log('新增驾驶员:', newDriver);
      allDrivers.value.unshift(newDriver);
      ElMessage.success('新增成功');
    }
    dialogVisible.value = false;
  } catch (error) {
    console.log('表单验证失败:', error);
    ElMessage.error('请检查表单填写是否正确');
  }
};

// --- 生命周期 ---
onMounted(() => {
  allDrivers.value = generateMockDrivers();
});

</script>

<style scoped>
.driver-list-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-form .el-form-item {
  margin-bottom: 10px;
}
.el-table {
  margin-top: 15px;
}
.dialog-footer button:first-child {
  margin-right: 10px;
}
.el-button .el-icon {
  margin-right: 5px;
}
.expiring-soon {
  color: #E6A23C; /* 橙色警告 */
  font-weight: bold;
}
</style> 