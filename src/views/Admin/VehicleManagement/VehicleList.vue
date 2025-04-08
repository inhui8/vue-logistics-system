<template>
  <div class="vehicle-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>车辆档案列表</span>
           <el-button type="primary" @click="handleAddVehicle">
             <el-icon><Plus /></el-icon> 新增车辆
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
         <el-form-item label="车牌号">
           <el-input v-model="filterForm.plateNumber" placeholder="输入车牌号" clearable />
         </el-form-item>
        <el-form-item label="服务类型">
          <el-select v-model="filterForm.serviceType" placeholder="选择服务类型" clearable>
             <el-option
                v-for="item in serviceTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
          </el-select>
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
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 车辆列表 -->
      <el-table :data="filteredVehicleList" style="width: 100%" border>
        <el-table-column prop="plateNumber" label="车牌号" width="120" fixed />
        <el-table-column prop="supplierName" label="所属供应商" width="200" show-overflow-tooltip />
        <el-table-column prop="vehicleModel" label="车辆型号" width="150" show-overflow-tooltip />
         <el-table-column prop="serviceType" label="主要服务类型" width="140">
            <template #default="scope">
              {{ formatServiceType(scope.row.serviceType) }}
            </template>
         </el-table-column>
         <el-table-column prop="classificationTags" label="分类标签" width="180">
            <template #default="scope">
               <el-tag v-for="tag in scope.row.classificationTags" :key="tag" size="small" style="margin-right: 5px;">
                 {{ formatTag(tag) }}
               </el-tag>
            </template>
         </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
               <el-tag :type="getStatusTagType(scope.row.status)">
                 {{ formatStatus(scope.row.status) }}
               </el-tag>
            </template>
         </el-table-column>
        <el-table-column prop="driverNames" label="当前关联司机" width="150" show-overflow-tooltip />
        <el-table-column prop="gpsDeviceId" label="GPS 设备 ID" width="150" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
             <el-button text type="primary" size="small" @click="handleEditVehicle(scope.row)">编辑</el-button>
             <el-button text type="info" size="small" @click="handleViewGps(scope.row)">查看GPS</el-button>
             <el-button text type="danger" size="small" @click="handleDeleteVehicle(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
       <el-pagination
          style="margin-top: 20px; justify-content: flex-end;"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalVehicles"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          :current-page="pagination.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />

      <!-- 新增/编辑车辆弹窗 -->
       <el-dialog
         v-model="dialogVisible"
         :title="dialogTitle"
         width="70%"
         @close="handleDialogClose"
         :close-on-click-modal="false"
       >
         <el-form
           ref="vehicleFormRef"
           :model="vehicleForm"
           :rules="formRules"
           label-width="120px"
         >
           <el-tabs v-model="activeTab">
              <el-tab-pane label="基本信息" name="basic">
                 <el-row :gutter="20">
                    <el-col :span="8">
                      <el-form-item label="所属供应商" prop="supplierId">
                         <el-select v-model="vehicleForm.supplierId" placeholder="选择供应商" filterable style="width: 100%;">
                           <el-option
                              v-for="supplier in mockSuppliers" 
                              :key="supplier.id"
                              :label="supplier.name"
                              :value="supplier.id"
                              :disabled="isEditMode" />
                         </el-select>
                      </el-form-item>
                    </el-col>
                   <el-col :span="8">
                     <el-form-item label="车牌号" prop="plateNumber">
                       <el-input v-model="vehicleForm.plateNumber" placeholder="请输入车牌号" :disabled="isEditMode"/>
                     </el-form-item>
                   </el-col>
                    <el-col :span="8">
                     <el-form-item label="车辆型号" prop="vehicleModel">
                       <el-input v-model="vehicleForm.vehicleModel" placeholder="如：Volvo VNL 760" />
                     </el-form-item>
                   </el-col>
                 </el-row>
                 <el-row :gutter="20">
                   <el-col :span="8">
                     <el-form-item label="车辆识别代码(VIN)" prop="vin">
                       <el-input v-model="vehicleForm.vin" placeholder="请输入 VIN" />
                     </el-form-item>
                   </el-col>
                   <el-col :span="8">
                     <el-form-item label="颜色" prop="color">
                       <el-input v-model="vehicleForm.color" placeholder="如：白色" />
                     </el-form-item>
                   </el-col>
                    <el-col :span="8">
                     <el-form-item label="购买日期" prop="purchaseDate">
                        <el-date-picker
                          v-model="vehicleForm.purchaseDate"
                          type="date"
                          placeholder="选择日期"
                          style="width: 100%;"
                          value-format="YYYY-MM-DD"
                         />
                     </el-form-item>
                   </el-col>
                 </el-row>
                 <el-row :gutter="20">
                    <el-col :span="8">
                      <el-form-item label="状态" prop="status">
                         <el-select v-model="vehicleForm.status" placeholder="选择车辆状态" style="width: 100%;">
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
                 <el-divider>证照信息 (占位)</el-divider>
                  <el-row :gutter="20">
                    <el-col :span="8">
                       <el-form-item label="行驶证注册日期">
                         <el-date-picker type="date" disabled placeholder="待实现" style="width: 100%;"/>
                       </el-form-item>
                    </el-col>
                     <el-col :span="8">
                       <el-form-item label="年检有效期">
                         <el-date-picker type="date" disabled placeholder="待实现" style="width: 100%;"/>
                       </el-form-item>
                    </el-col>
                     <el-col :span="8">
                       <el-form-item label="保险到期日">
                         <el-date-picker type="date" disabled placeholder="待实现" style="width: 100%;"/>
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

              </el-tab-pane>
              <el-tab-pane label="服务与分类" name="service">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="主要服务类型" prop="serviceType">
                        <el-radio-group v-model="vehicleForm.serviceType">
                          <el-radio
                             v-for="item in serviceTypeOptions"
                             :key="item.value"
                             :label="item.value"
                          >{{ item.label }}</el-radio>
                        </el-radio-group>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row>
                     <el-col :span="24">
                       <el-form-item label="分类标签" prop="classificationTags">
                         <el-checkbox-group v-model="vehicleForm.classificationTags">
                            <el-checkbox
                              v-for="tag in classificationTagOptions"
                              :key="tag.value"
                              :label="tag.value"
                              border
                              size="small"
                             >{{ tag.label }}</el-checkbox>
                         </el-checkbox-group>
                       </el-form-item>
                     </el-col>
                  </el-row>
              </el-tab-pane>
              <el-tab-pane label="司机与GPS" name="driverGps">
                   <el-row :gutter="20">
                      <el-col :span="12">
                         <el-form-item label="关联驾驶员" prop="driverIds">
                            <el-select
                              v-model="vehicleForm.driverIds"
                              multiple
                              filterable
                              placeholder="选择驾驶员 (同供应商)"
                              style="width: 100%;"
                              :disabled="!vehicleForm.supplierId">
                             <el-option
                                v-for="driver in availableDrivers"
                                :key="driver.id"
                                :label="driver.name + ' (' + driver.phone + ')'"
                                :value="driver.id"
                              />
                            </el-select>
                            <el-text type="info" size="small" v-if="!vehicleForm.supplierId">请先在"基本信息"标签页选择供应商</el-text>
                         </el-form-item>
                      </el-col>
                     <el-col :span="12">
                       <el-form-item label="GPS 设备 ID" prop="gpsDeviceId">
                         <el-input v-model="vehicleForm.gpsDeviceId" placeholder="输入绑定的 GPS 设备 ID" />
                       </el-form-item>
                     </el-col>
                   </el-row>
                   <el-row>
                      <el-col :span="24">
                         <el-form-item label="GPS 设备信息">
                           <el-text type="info">型号: (待实现), SIM: (待实现)</el-text>
                         </el-form-item>
                      </el-col>
                   </el-row>
              </el-tab-pane>
           </el-tabs>
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
import { Plus } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

// --- 模拟数据 ---
// 假设的供应商列表 (应从 SupplierList 或 API 获取)
const mockSuppliers = ref([
  { id: 'supplier_1', name: '测试供应商A - 专做提框服务' },
  { id: 'supplier_2', name: '测试供应商B - FBA派送专家' },
  { id: 'supplier_3', name: '测试供应商C - 全能型选手' },
]);

// 假设的驾驶员列表 (应从 DriverList 或 API 获取)
const mockDrivers = ref([
  { id: 'driver_1', name: '张师傅', phone: '13111111111', supplierId: 'supplier_1' },
  { id: 'driver_2', name: '李师傅', phone: '13222222222', supplierId: 'supplier_1' },
  { id: 'driver_3', name: '王司机', phone: '13333333333', supplierId: 'supplier_2' },
  { id: 'driver_4', name: '赵司机', phone: '13444444444', supplierId: 'supplier_3' },
  { id: 'driver_5', name: '孙师傅', phone: '13555555555', supplierId: 'supplier_3' },
]);

const allVehicles = ref([]);

const generateMockVehicles = (count = 25) => {
  const models = ['Volvo VNL 760', 'Freightliner Cascadia', 'Kenworth T680', 'Ford Transit', 'Mercedes Sprinter'];
  const plates = ['AZ12345', 'CA98765', 'NY55555', 'TX13579', 'FL24680'];
  const vins = ['1V9X8Y7Z6A5B4C3D2', '2F8G7H6J5K4L3M2N1', '3K9L8M7N6P5Q4R3S2', '4T7U6V5W4X3Y2Z1A0', '5B1C2D3E4F5G6H7J8'];
  const colors = ['白色', '红色', '蓝色', '黑色', '银色'];
  const serviceTypes = ['port_to_warehouse', 'warehouse_to_destination', 'general_purpose'];
  const statuses = ['available', 'maintenance', 'on_trip', 'deactivated'];
  const tagValues = ['refrigerated', 'tail_lift', 'hazmat'];
  const mockData = [];

  for (let i = 0; i < count; i++) {
    const supplier = mockSuppliers.value[Math.floor(Math.random() * mockSuppliers.value.length)];
    const driversForSupplier = mockDrivers.value.filter(d => d.supplierId === supplier.id);
    const assignedDrivers = driversForSupplier.length > 0 ? [driversForSupplier[Math.floor(Math.random() * driversForSupplier.length)]] : []; // 随机关联一个司机
    const tags = [];
    if (Math.random() > 0.7) tags.push(tagValues[Math.floor(Math.random() * tagValues.length)]);
    if (Math.random() > 0.8 && tags.length < 2) tags.push(tagValues[Math.floor(Math.random() * tagValues.length)]);

    mockData.push({
      id: `vehicle_${i + 1}`,
      plateNumber: `${plates[Math.floor(Math.random() * plates.length)]}${String(i).padStart(3,'0')}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      vehicleModel: models[Math.floor(Math.random() * models.length)],
      vin: `${vins[Math.floor(Math.random() * vins.length)]}${i}`,
      color: colors[Math.floor(Math.random() * colors.length)],
      purchaseDate: new Date(Date.now() - Math.floor(Math.random() * 5 * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
      classificationTags: [...new Set(tags)], // 去重
      driverIds: assignedDrivers.map(d => d.id),
      driverNames: assignedDrivers.map(d => d.name).join(', '),
      gpsDeviceId: Math.random() > 0.3 ? `GPS-${String(Math.random()).slice(2, 12)}` : null,
    });
  }
  return mockData;
};

// --- 选项数据 ---
const serviceTypeOptions = [
  { value: 'port_to_warehouse', label: '码头到仓库' },
  { value: 'warehouse_to_destination', label: '仓库到目的地' },
  { value: 'general_purpose', label: '通用型' },
];

const classificationTagOptions = [
  { value: 'refrigerated', label: '冷藏' },
  { value: 'tail_lift', label: '带升降尾板' },
  { value: 'hazmat', label: '危险品资质' },
];

const statusOptions = [
  { value: 'available', label: '可用' },
  { value: 'maintenance', label: '维修中' },
  { value: 'on_trip', label: '执行任务中' },
  { value: 'deactivated', label: '停用' },
];

// --- 筛选与分页 ---
const filterForm = reactive({
  supplierId: '',
  plateNumber: '',
  serviceType: '',
  status: '',
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
});

const totalVehicles = computed(() => {
  return filteredVehiclesData.value.length;
});

const filteredVehiclesData = computed(() => {
  return allVehicles.value.filter(vehicle => {
    const supplierMatch = filterForm.supplierId ? vehicle.supplierId === filterForm.supplierId : true;
    const plateMatch = filterForm.plateNumber ? vehicle.plateNumber?.includes(filterForm.plateNumber) : true;
    const serviceTypeMatch = filterForm.serviceType ? vehicle.serviceType === filterForm.serviceType : true;
    const statusMatch = filterForm.status ? vehicle.status === filterForm.status : true;
    return supplierMatch && plateMatch && serviceTypeMatch && statusMatch;
  });
});

const filteredVehicleList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredVehiclesData.value.slice(start, end);
});

// --- 弹窗与表单 ---
const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEditMode = ref(false);
const vehicleFormRef = ref(null);
const activeTab = ref('basic');

// 表单数据模型
const initialFormState = {
  id: null,
  plateNumber: '',
  supplierId: '',
  vehicleModel: '',
  vin: '',
  color: '',
  purchaseDate: '',
  status: 'available',
  serviceType: 'general_purpose',
  classificationTags: [],
  driverIds: [],
  gpsDeviceId: ''
};
const vehicleForm = reactive({ ...initialFormState });

// 表单验证规则
const formRules = reactive({
  supplierId: [{ required: true, message: '请选择所属供应商', trigger: 'change' }],
  plateNumber: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  serviceType: [{ required: true, message: '请选择主要服务类型', trigger: 'change' }],
});

// 可选司机列表 (根据所选供应商过滤)
const availableDrivers = computed(() => {
  if (!vehicleForm.supplierId) return [];
  return mockDrivers.value.filter(driver => driver.supplierId === vehicleForm.supplierId);
});

// --- 方法 ---
const formatServiceType = (value) => serviceTypeOptions.find(opt => opt.value === value)?.label || value;
const formatStatus = (value) => statusOptions.find(opt => opt.value === value)?.label || value;
const formatTag = (tag) => classificationTagOptions.find(opt => opt.value === tag)?.label || tag;
const getStatusTagType = (status) => {
  switch (status) {
    case 'available': return 'success';
    case 'maintenance': return 'warning';
    case 'on_trip': return 'danger';
    case 'deactivated': return 'info';
    default: return 'info';
  }
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
  Object.assign(vehicleForm, JSON.parse(JSON.stringify(initialFormState)));
  nextTick(() => {
    vehicleFormRef.value?.clearValidate();
  });
  activeTab.value = 'basic';
};

// 新增
const handleAddVehicle = () => {
  resetForm();
  isEditMode.value = false;
  dialogTitle.value = '新增车辆档案';
  dialogVisible.value = true;
};

// 编辑
const handleEditVehicle = (row) => {
  resetForm();
  isEditMode.value = true;
  dialogTitle.value = '编辑车辆档案';
  Object.assign(vehicleForm, JSON.parse(JSON.stringify(row)));
  vehicleForm.classificationTags = vehicleForm.classificationTags || [];
  vehicleForm.driverIds = vehicleForm.driverIds || [];
  dialogVisible.value = true;
  activeTab.value = 'basic';
};

// Get router instance
const router = useRouter();

// 查看GPS (Updated)
const handleViewGps = (row) => {
  console.log('查看GPS for vehicle ID:', row.id, 'Plate:', row.plateNumber);
  // Use router to navigate to the GPS tracking page with vehicleId as query param
  router.push({ name: 'AdminGpsTracking', query: { vehicleId: row.id } });
  // Keep the message for now, can be removed later
  ElMessage.info(`正在跳转到 ${row.plateNumber} 的GPS实时监控页面...`);
};

// 删除
const handleDeleteVehicle = (row) => {
   ElMessageBox.confirm(`确定要删除车辆 ${row.plateNumber} 吗?`, '警告', { type: 'warning' })
     .then(() => {
       console.log('删除车辆:', row.id);
       const index = allVehicles.value.findIndex(v => v.id === row.id);
       if (index !== -1) {
         allVehicles.value.splice(index, 1);
       }
       ElMessage.success('删除成功');
       // handleSearch(); // 可选：删除后刷新当前页
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
  if (!vehicleFormRef.value) return;
  try {
    await vehicleFormRef.value.validate();
    // 获取关联司机姓名 (用于列表展示)
    const selectedDrivers = mockDrivers.value.filter(d => vehicleForm.driverIds?.includes(d.id));
    const driverNames = selectedDrivers.map(d => d.name).join(', ');
    const supplierName = mockSuppliers.value.find(s => s.id === vehicleForm.supplierId)?.name || '';

    const vehicleData = { 
      ...vehicleForm, 
      driverNames: driverNames, 
      supplierName: supplierName 
    };

    if (isEditMode.value) {
      console.log('更新车辆:', vehicleData);
      const index = allVehicles.value.findIndex(v => v.id === vehicleData.id);
      if (index !== -1) {
        allVehicles.value.splice(index, 1, vehicleData);
      }
      ElMessage.success('更新成功');
    } else {
      const newVehicle = { ...vehicleData, id: `vehicle_${Date.now()}` };
      console.log('新增车辆:', newVehicle);
      allVehicles.value.unshift(newVehicle);
      ElMessage.success('新增成功');
    }
    dialogVisible.value = false;
    // handleSearch(); // 可选：提交后刷新
  } catch (error) {
    console.log('表单验证失败:', error);
    // 检查是哪个 tab 的校验失败，并切换过去 (可选)
    if (error && typeof error === 'object') {
      const firstErrorField = Object.keys(error)[0];
      if (['supplierId', 'plateNumber'].includes(firstErrorField)) {
         activeTab.value = 'basic';
      } else if (['serviceType'].includes(firstErrorField)) {
         activeTab.value = 'service';
      }
      // 可以添加更多判断
    }
    ElMessage.error('请检查表单填写是否正确');
  }
};

// --- 生命周期 ---
onMounted(() => {
  allVehicles.value = generateMockVehicles();
});

</script>

<style scoped>
.vehicle-list-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-form .el-form-item {
  margin-bottom: 10px; /* 减少筛选表单项间距 */
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
.el-tabs {
  margin-top: -10px; /* 减少 tab 和上面元素的间距 */
}
</style> 