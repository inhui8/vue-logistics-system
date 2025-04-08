<!-- 供应商车辆档案管理页面 -->
<template>
  <div class="vehicle-profile">
    <!-- 顶部筛选区 -->
    <div class="filter-bar">
      <div class="filter-row">
        <!-- 供应商选择 -->
        <el-select v-model="supplier" placeholder="选择供应商" size="small" class="filter-item">
          <el-option
            v-for="item in supplierOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <!-- 车辆类型 -->
        <el-select v-model="vehicleType" placeholder="车辆类型" size="small" class="filter-item">
          <el-option label="厢式货车" value="van" />
          <el-option label="平板车" value="flatbed" />
          <el-option label="冷藏车" value="refrigerated" />
          <el-option label="危险品车" value="dangerous" />
        </el-select>

        <!-- 车辆状态 -->
        <el-select v-model="vehicleStatus" placeholder="车辆状态" size="small" class="filter-item">
          <el-option label="正常" value="normal" />
          <el-option label="维修中" value="repairing" />
          <el-option label="报废" value="scrapped" />
        </el-select>

        <!-- 搜索框 -->
        <el-input
          v-model="searchText"
          placeholder="车牌号/司机姓名"
          size="small"
          class="search-input"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
          <el-button type="success" size="small" @click="handleAddVehicle">新增车辆</el-button>
          <el-button type="warning" size="small" @click="handleBatchImport">批量导入</el-button>
        </div>
      </div>
    </div>

    <!-- 车辆列表 -->
    <div class="vehicle-list">
      <el-table
        :data="vehicleList"
        border
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="plateNumber" label="车牌号" width="120" />
        <el-table-column prop="vehicleType" label="车辆类型" width="100">
          <template #default="scope">
            <el-tag :type="getVehicleTypeTag(scope.row.vehicleType)">
              {{ getVehicleTypeText(scope.row.vehicleType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="brand" label="品牌型号" width="150" />
        <el-table-column prop="supplier" label="所属供应商" width="150" />
        <el-table-column prop="driverName" label="当前司机" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastMaintenance" label="最后保养" width="120" />
        <el-table-column prop="nextMaintenance" label="下次保养" width="120" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="primary" link @click="handleLicense(scope.row)">证照</el-button>
            <el-button type="primary" link @click="handleMaintenance(scope.row)">保养</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑车辆弹窗 -->
    <el-dialog
      v-model="vehicleDialogVisible"
      :title="dialogType === 'add' ? '新增车辆' : '编辑车辆'"
      width="700px"
    >
      <el-form
        ref="vehicleFormRef"
        :model="vehicleForm"
        :rules="vehicleRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号" prop="plateNumber">
              <el-input v-model="vehicleForm.plateNumber" placeholder="请输入车牌号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆类型" prop="vehicleType">
              <el-select v-model="vehicleForm.vehicleType" placeholder="请选择车辆类型" style="width: 100%">
                <el-option label="厢式货车" value="van" />
                <el-option label="平板车" value="flatbed" />
                <el-option label="冷藏车" value="refrigerated" />
                <el-option label="危险品车" value="dangerous" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌型号" prop="brand">
              <el-input v-model="vehicleForm.brand" placeholder="请输入品牌型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属供应商" prop="supplier">
              <el-select v-model="vehicleForm.supplier" placeholder="请选择供应商" style="width: 100%">
                <el-option
                  v-for="item in supplierOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="载重" prop="loadCapacity">
              <el-input-number v-model="vehicleForm.loadCapacity" :min="0" :max="100" />
              <span class="unit">吨</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="容积" prop="volume">
              <el-input-number v-model="vehicleForm.volume" :min="0" :max="1000" />
              <span class="unit">立方米</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="购买日期" prop="purchaseDate">
              <el-date-picker
                v-model="vehicleForm.purchaseDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆状态" prop="status">
              <el-select v-model="vehicleForm.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="正常" value="normal" />
                <el-option label="维修中" value="repairing" />
                <el-option label="报废" value="scrapped" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="vehicleForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="vehicleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleVehicleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 证照管理弹窗 -->
    <el-dialog
      v-model="licenseDialogVisible"
      title="证照管理"
      width="800px"
    >
      <div class="license-container">
        <!-- 证照列表 -->
        <el-table :data="licenseList" border style="width: 100%">
          <el-table-column prop="type" label="证照类型" width="120">
            <template #default="scope">
              <el-tag>{{ getLicenseTypeText(scope.row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="number" label="证照号码" width="150" />
          <el-table-column prop="issueDate" label="发证日期" width="120" />
          <el-table-column prop="expireDate" label="有效期至" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getLicenseStatusType(scope.row.status)">
                {{ getLicenseStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button type="primary" link @click="handleViewLicense(scope.row)">查看</el-button>
              <el-button type="primary" link @click="handleEditLicense(scope.row)">编辑</el-button>
              <el-button type="danger" link @click="handleDeleteLicense(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 添加证照按钮 -->
        <div class="license-actions">
          <el-button type="primary" @click="handleAddLicense">添加证照</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 保养记录弹窗 -->
    <el-dialog
      v-model="maintenanceDialogVisible"
      title="保养记录"
      width="800px"
    >
      <div class="maintenance-container">
        <!-- 车辆信息 -->
        <el-descriptions :column="3" border>
          <el-descriptions-item label="车牌号">{{ currentVehicle.plateNumber }}</el-descriptions-item>
          <el-descriptions-item label="品牌型号">{{ currentVehicle.brand }}</el-descriptions-item>
          <el-descriptions-item label="当前里程">{{ currentVehicle.mileage }}公里</el-descriptions-item>
          <el-descriptions-item label="上次保养">{{ currentVehicle.lastMaintenance }}</el-descriptions-item>
          <el-descriptions-item label="下次保养">{{ currentVehicle.nextMaintenance }}</el-descriptions-item>
          <el-descriptions-item label="保养周期">{{ currentVehicle.maintenanceCycle }}公里</el-descriptions-item>
        </el-descriptions>

        <!-- 保养记录列表 -->
        <div class="maintenance-list">
          <h3>保养记录</h3>
          <el-table :data="maintenanceList" border style="width: 100%">
            <el-table-column prop="date" label="保养日期" width="120" />
            <el-table-column prop="mileage" label="保养里程" width="120">
              <template #default="scope">
                {{ scope.row.mileage }}公里
              </template>
            </el-table-column>
            <el-table-column prop="type" label="保养类型" width="120">
              <template #default="scope">
                <el-tag>{{ getMaintenanceTypeText(scope.row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="items" label="保养项目" />
            <el-table-column prop="cost" label="费用" width="120">
              <template #default="scope">
                ¥{{ scope.row.cost }}
              </template>
            </el-table-column>
            <el-table-column prop="nextDate" label="下次保养" width="120" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button type="primary" link @click="handleViewMaintenance(scope.row)">查看</el-button>
                <el-button type="primary" link @click="handleEditMaintenance(scope.row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 添加保养记录按钮 -->
        <div class="maintenance-actions">
          <el-button type="primary" @click="handleAddMaintenance">添加保养记录</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog
      v-model="importDialogVisible"
      title="批量导入"
      width="500px"
    >
      <el-upload
        class="upload-demo"
        drag
        action="/api/vehicle/import"
        :on-preview="handlePreview"
        :on-remove="handleRemove"
        :before-remove="beforeRemove"
        :limit="1"
        :on-exceed="handleExceed"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 xlsx/xls 文件，且不超过 10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleImportSubmit">开始导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { Search, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'VehicleProfile',
  components: {
    Search,
    UploadFilled
  },
  setup() {
    // 基础数据
    const loading = ref(false)
    const supplier = ref('')
    const vehicleType = ref('')
    const vehicleStatus = ref('')
    const searchText = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const vehicleList = ref([])

    // 供应商选项
    const supplierOptions = ref([
      { value: 'supplier1', label: '广州物流' },
      { value: 'supplier2', label: '深圳物流' },
      { value: 'supplier3', label: '东莞物流' }
    ])

    // 弹窗控制
    const vehicleDialogVisible = ref(false)
    const licenseDialogVisible = ref(false)
    const maintenanceDialogVisible = ref(false)
    const importDialogVisible = ref(false)
    const dialogType = ref('add') // add or edit

    // 表单数据
    const vehicleFormRef = ref(null)
    const vehicleForm = ref({
      plateNumber: '',
      vehicleType: '',
      brand: '',
      supplier: '',
      loadCapacity: 0,
      volume: 0,
      purchaseDate: '',
      status: 'normal',
      remarks: ''
    })

    // 表单验证规则
    const vehicleRules = {
      plateNumber: [
        { required: true, message: '请输入车牌号', trigger: 'blur' },
        { pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$/, message: '请输入正确的车牌号', trigger: 'blur' }
      ],
      vehicleType: [
        { required: true, message: '请选择车辆类型', trigger: 'change' }
      ],
      brand: [
        { required: true, message: '请输入品牌型号', trigger: 'blur' }
      ],
      supplier: [
        { required: true, message: '请选择供应商', trigger: 'change' }
      ],
      status: [
        { required: true, message: '请选择车辆状态', trigger: 'change' }
      ]
    }

    // 证照相关
    const licenseList = ref([
      {
        type: '行驶证',
        number: '123456789',
        issueDate: '2023-01-01',
        expireDate: '2024-01-01',
        status: 'valid'
      },
      {
        type: '营运证',
        number: '987654321',
        issueDate: '2023-02-01',
        expireDate: '2024-02-01',
        status: 'expired'
      }
    ])

    // 保养相关
    const currentVehicle = ref({})
    const maintenanceList = ref([
      {
        date: '2024-01-01',
        mileage: 50000,
        type: 'regular',
        items: '机油更换、轮胎检查',
        cost: 800,
        nextDate: '2024-07-01'
      }
    ])

    // 获取车辆类型标签
    const getVehicleTypeTag = (type) => {
      const typeMap = {
        van: '',
        flatbed: 'success',
        refrigerated: 'warning',
        dangerous: 'danger'
      }
      return typeMap[type] || ''
    }

    // 获取车辆类型文本
    const getVehicleTypeText = (type) => {
      const typeMap = {
        van: '厢式货车',
        flatbed: '平板车',
        refrigerated: '冷藏车',
        dangerous: '危险品车'
      }
      return typeMap[type] || '未知'
    }

    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        normal: 'success',
        repairing: 'warning',
        scrapped: 'danger'
      }
      return statusMap[status] || 'info'
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        normal: '正常',
        repairing: '维修中',
        scrapped: '报废'
      }
      return statusMap[status] || '未知'
    }

    // 获取证照类型文本
    const getLicenseTypeText = (type) => {
      const typeMap = {
        'driving': '行驶证',
        'operation': '营运证',
        'insurance': '保险单',
        'inspection': '年检证'
      }
      return typeMap[type] || type
    }

    // 获取证照状态类型
    const getLicenseStatusType = (status) => {
      const statusMap = {
        valid: 'success',
        expired: 'danger',
        pending: 'warning'
      }
      return statusMap[status] || 'info'
    }

    // 获取证照状态文本
    const getLicenseStatusText = (status) => {
      const statusMap = {
        valid: '有效',
        expired: '已过期',
        pending: '待审核'
      }
      return statusMap[status] || '未知'
    }

    // 获取保养类型文本
    const getMaintenanceTypeText = (type) => {
      const typeMap = {
        regular: '常规保养',
        major: '大保养',
        emergency: '紧急维修'
      }
      return typeMap[type] || type
    }

    // 查询
    const handleSearch = () => {
      loading.value = true
      // 模拟数据
      setTimeout(() => {
        vehicleList.value = [
          {
            plateNumber: '粤A12345',
            vehicleType: 'van',
            brand: '东风天锦',
            supplier: '广州物流',
            driverName: '张三',
            status: 'normal',
            lastMaintenance: '2024-01-01',
            nextMaintenance: '2024-07-01'
          },
          {
            plateNumber: '粤B67890',
            vehicleType: 'refrigerated',
            brand: '福田欧马可',
            supplier: '深圳物流',
            driverName: '李四',
            status: 'repairing',
            lastMaintenance: '2024-02-01',
            nextMaintenance: '2024-08-01'
          }
        ]
        total.value = 2
        loading.value = false
      }, 500)
    }

    // 新增车辆
    const handleAddVehicle = () => {
      dialogType.value = 'add'
      vehicleForm.value = {
        plateNumber: '',
        vehicleType: '',
        brand: '',
        supplier: '',
        loadCapacity: 0,
        volume: 0,
        purchaseDate: '',
        status: 'normal',
        remarks: ''
      }
      vehicleDialogVisible.value = true
    }

    // 编辑车辆
    const handleEdit = (row) => {
      dialogType.value = 'edit'
      vehicleForm.value = { ...row }
      vehicleDialogVisible.value = true
    }

    // 提交车辆表单
    const handleVehicleSubmit = () => {
      vehicleFormRef.value?.validate((valid) => {
        if (valid) {
          ElMessage.success(dialogType.value === 'add' ? '添加成功' : '修改成功')
          vehicleDialogVisible.value = false
          handleSearch()
        }
      })
    }

    // 删除车辆
    // eslint-disable-next-line no-unused-vars
    const handleDelete = (row) => {
      ElMessageBox.confirm('确认删除该车辆吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('删除成功')
        handleSearch()
      })
    }

    // 证照管理
    const handleLicense = (row) => {
      currentVehicle.value = row
      licenseDialogVisible.value = true
    }

    // 添加证照
    const handleAddLicense = () => {
      // 实现添加证照的逻辑
    }

    // 查看证照
    // eslint-disable-next-line no-unused-vars
    const handleViewLicense = (row) => {
      // 实现查看证照的逻辑
    }

    // 编辑证照
    // eslint-disable-next-line no-unused-vars
    const handleEditLicense = (row) => {
      // 实现编辑证照的逻辑
    }

    // 删除证照
    const handleDeleteLicense = (row) => {
      ElMessageBox.confirm('确认删除该证照吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = licenseList.value.findIndex(item => item.number === row.number)
        if (index > -1) {
          licenseList.value.splice(index, 1)
          ElMessage.success('删除成功')
        }
      })
    }

    // 保养管理
    const handleMaintenance = (row) => {
      currentVehicle.value = row
      maintenanceDialogVisible.value = true
    }

    // 添加保养记录
    const handleAddMaintenance = () => {
      // 实现添加保养记录的逻辑
    }

    // 查看保养记录
    // eslint-disable-next-line no-unused-vars
    const handleViewMaintenance = (row) => {
      // 实现查看保养记录的逻辑
    }

    // 编辑保养记录
    // eslint-disable-next-line no-unused-vars
    const handleEditMaintenance = (row) => {
      // 实现编辑保养记录的逻辑
    }

    // 批量导入
    const handleBatchImport = () => {
      importDialogVisible.value = true
    }

    // 文件上传相关
    const handlePreview = (file) => {
      console.log(file)
    }

    const handleRemove = (file) => {
      console.log(file)
    }

    const beforeRemove = (file) => {
      return ElMessageBox.confirm(`确定移除 ${file.name}？`)
    }

    const handleExceed = () => {
      ElMessage.warning('只能上传一个文件')
    }

    const handleImportSubmit = () => {
      ElMessage.success('导入成功')
      importDialogVisible.value = false
      handleSearch()
    }

    // 分页相关
    const handleSizeChange = (val) => {
      pageSize.value = val
      handleSearch()
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
      handleSearch()
    }

    // 生命周期钩子
    onMounted(() => {
      handleSearch()
    })

    return {
      // 基础数据
      loading,
      supplier,
      vehicleType,
      vehicleStatus,
      searchText,
      currentPage,
      pageSize,
      total,
      vehicleList,
      
      // 选项数据
      supplierOptions,
      
      // 弹窗控制
      vehicleDialogVisible,
      licenseDialogVisible,
      maintenanceDialogVisible,
      importDialogVisible,
      dialogType,
      
      // 表单数据
      vehicleFormRef,
      vehicleForm,
      vehicleRules,
      
      // 列表数据
      licenseList,
      currentVehicle,
      maintenanceList,
      
      // 方法
      getVehicleTypeTag,
      getVehicleTypeText,
      getStatusType,
      getStatusText,
      getLicenseTypeText,
      getLicenseStatusType,
      getLicenseStatusText,
      getMaintenanceTypeText,
      handleSearch,
      handleAddVehicle,
      handleEdit,
      handleVehicleSubmit,
      handleDelete,
      handleLicense,
      handleAddLicense,
      handleViewLicense,
      handleEditLicense,
      handleDeleteLicense,
      handleMaintenance,
      handleAddMaintenance,
      handleViewMaintenance,
      handleEditMaintenance,
      handleBatchImport,
      handlePreview,
      handleRemove,
      beforeRemove,
      handleExceed,
      handleImportSubmit,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.vehicle-profile {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.filter-bar {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.filter-item {
  width: 150px;
}

.search-input {
  width: 200px;
}

.action-buttons {
  margin-left: auto;
}

.vehicle-list {
  flex: 1;
  overflow: auto;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 证照管理样式 */
.license-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.license-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 保养记录样式 */
.maintenance-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.maintenance-list {
  margin-top: 20px;
}

.maintenance-list h3 {
  margin: 0 0 15px 0;
}

.maintenance-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 上传样式 */
.upload-demo {
  text-align: center;
}

.el-upload__tip {
  margin-top: 10px;
  color: #909399;
}

/* 单位样式 */
.unit {
  margin-left: 10px;
  color: #909399;
}

/* 弹窗样式 */
:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-dialog__footer) {
  padding: 20px;
  border-top: 1px solid #dcdfe6;
}
</style> 