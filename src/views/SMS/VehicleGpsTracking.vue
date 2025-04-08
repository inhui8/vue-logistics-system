<!-- 供应商车辆GPS追踪页面 -->
<template>
  <div class="vehicle-gps-tracking">
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

        <!-- 车辆状态 -->
        <el-select v-model="vehicleStatus" placeholder="车辆状态" size="small" class="filter-item">
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="异常" value="abnormal" />
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
          <el-button type="success" size="small" @click="handleBindDevice">绑定设备</el-button>
          <el-button type="warning" size="small" @click="handleSetArea">区域设置</el-button>
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
        <el-table-column prop="driverName" label="司机姓名" width="100" />
        <el-table-column prop="supplier" label="所属供应商" width="150" />
        <el-table-column prop="deviceId" label="GPS设备号" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="当前位置" min-width="200" />
        <el-table-column prop="speed" label="速度" width="100">
          <template #default="scope">
            {{ scope.row.speed }}km/h
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdateTime" label="最后更新时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleTrack(scope.row)">轨迹</el-button>
            <el-button type="primary" link @click="handleMonitor(scope.row)">监控</el-button>
            <el-button type="warning" link @click="handleWarning(scope.row)">预警</el-button>
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

    <!-- 绑定设备弹窗 -->
    <el-dialog
      v-model="bindDeviceVisible"
      title="绑定GPS设备"
      width="500px"
    >
      <el-form :model="bindDeviceForm" label-width="100px">
        <el-form-item label="车牌号">
          <el-select v-model="bindDeviceForm.vehicleId" placeholder="请选择车辆" style="width: 100%">
            <el-option
              v-for="item in vehicleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="GPS设备号">
          <el-input v-model="bindDeviceForm.deviceId" placeholder="请输入GPS设备号" />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="bindDeviceForm.deviceType" placeholder="请选择设备类型" style="width: 100%">
            <el-option label="北斗GPS" value="beidou" />
            <el-option label="高德GPS" value="amap" />
            <el-option label="百度GPS" value="baidu" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bindDeviceVisible = false">取消</el-button>
          <el-button type="primary" @click="handleBindDeviceSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 区域设置弹窗 -->
    <el-dialog
      v-model="areaSettingVisible"
      title="区域限制设置"
      width="800px"
    >
      <div class="area-setting-container">
        <!-- 地图容器 -->
        <div class="map-container" ref="mapContainer"></div>
        
        <!-- 区域列表 -->
        <div class="area-list">
          <div class="area-list-header">
            <h3>区域列表</h3>
            <el-button type="primary" size="small" @click="handleAddArea">添加区域</el-button>
          </div>
          <el-table :data="areaList" border style="width: 100%">
            <el-table-column prop="name" label="区域名称" />
            <el-table-column prop="type" label="区域类型">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'forbidden' ? 'danger' : 'success'">
                  {{ scope.row.type === 'forbidden' ? '禁行区' : '限速区' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="speed" label="限速值" width="100">
              <template #default="scope">
                {{ scope.row.speed }}km/h
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button type="primary" link @click="handleEditArea(scope.row)">编辑</el-button>
                <el-button type="danger" link @click="handleDeleteArea(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="areaSettingVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAreaSettingSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 轨迹查询弹窗 -->
    <el-dialog
      v-model="trackDialogVisible"
      title="历史轨迹查询"
      width="1000px"
    >
      <div class="track-query-container">
        <!-- 查询条件 -->
        <div class="track-query-form">
          <el-form :inline="true" :model="trackQueryForm">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="trackQueryForm.dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                :default-time="[
                  new Date(2000, 1, 1, 0, 0, 0),
                  new Date(2000, 1, 1, 23, 59, 59),
                ]"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleTrackQuery">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 轨迹地图 -->
        <div class="track-map-container" ref="trackMapContainer"></div>
        
        <!-- 轨迹数据列表 -->
        <div class="track-data-list">
          <el-table :data="trackDataList" border style="width: 100%">
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column prop="location" label="位置" />
            <el-table-column prop="speed" label="速度" width="100">
              <template #default="scope">
                {{ scope.row.speed }}km/h
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 实时监控弹窗 -->
    <el-dialog
      v-model="monitorDialogVisible"
      title="实时监控"
      width="1000px"
      :close-on-click-modal="false"
    >
      <div class="monitor-container">
        <!-- 监控地图 -->
        <div class="monitor-map-container" ref="monitorMapContainer"></div>
        
        <!-- 车辆信息 -->
        <div class="vehicle-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="车牌号">{{ currentVehicle.plateNumber }}</el-descriptions-item>
            <el-descriptions-item label="司机姓名">{{ currentVehicle.driverName }}</el-descriptions-item>
            <el-descriptions-item label="当前位置">{{ currentVehicle.location }}</el-descriptions-item>
            <el-descriptions-item label="行驶速度">{{ currentVehicle.speed }}km/h</el-descriptions-item>
            <el-descriptions-item label="设备状态">
              <el-tag :type="getStatusType(currentVehicle.status)">
                {{ getStatusText(currentVehicle.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最后更新">{{ currentVehicle.lastUpdateTime }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>

    <!-- 异常预警弹窗 -->
    <el-dialog
      v-model="warningDialogVisible"
      title="异常预警设置"
      width="600px"
    >
      <el-form :model="warningForm" label-width="120px">
        <el-form-item label="超速预警">
          <el-input-number v-model="warningForm.speedLimit" :min="0" :max="200" />
          <span class="unit">km/h</span>
        </el-form-item>
        <el-form-item label="离线预警">
          <el-input-number v-model="warningForm.offlineLimit" :min="0" :max="1440" />
          <span class="unit">分钟</span>
        </el-form-item>
        <el-form-item label="区域预警">
          <el-switch v-model="warningForm.areaWarning" />
        </el-form-item>
        <el-form-item label="预警通知">
          <el-checkbox-group v-model="warningForm.notifyMethods">
            <el-checkbox label="sms">短信通知</el-checkbox>
            <el-checkbox label="email">邮件通知</el-checkbox>
            <el-checkbox label="app">APP推送</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="warningDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleWarningSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'VehicleGpsTracking',
  components: {
    Search
  },
  setup() {
    // 基础数据
    const loading = ref(false)
    const supplier = ref('')
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

    // 车辆选项
    const vehicleOptions = ref([
      { value: 'vehicle1', label: '粤A12345' },
      { value: 'vehicle2', label: '粤B67890' }
    ])

    // 绑定设备相关
    const bindDeviceVisible = ref(false)
    const bindDeviceForm = ref({
      vehicleId: '',
      deviceId: '',
      deviceType: ''
    })

    // 区域设置相关
    const areaSettingVisible = ref(false)
    const areaList = ref([
      {
        name: '禁行区域1',
        type: 'forbidden',
        speed: 0
      },
      {
        name: '限速区域1',
        type: 'speed',
        speed: 40
      }
    ])

    // 轨迹查询相关
    const trackDialogVisible = ref(false)
    const trackQueryForm = ref({
      dateRange: []
    })
    const trackDataList = ref([])

    // 实时监控相关
    const monitorDialogVisible = ref(false)
    const currentVehicle = ref({})

    // 异常预警相关
    const warningDialogVisible = ref(false)
    const warningForm = ref({
      speedLimit: 80,
      offlineLimit: 30,
      areaWarning: true,
      notifyMethods: ['sms', 'app']
    })

    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        online: 'success',
        offline: 'info',
        abnormal: 'danger'
      }
      return statusMap[status] || 'info'
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        online: '在线',
        offline: '离线',
        abnormal: '异常'
      }
      return statusMap[status] || '未知'
    }

    // 查询
    const handleSearch = () => {
      loading.value = true
      // 模拟数据
      setTimeout(() => {
        vehicleList.value = [
          {
            plateNumber: '粤A12345',
            driverName: '张三',
            supplier: '广州物流',
            deviceId: 'GPS001',
            status: 'online',
            location: '广州市天河区天河路',
            speed: 60,
            lastUpdateTime: '2024-03-20 10:00:00'
          },
          {
            plateNumber: '粤B67890',
            driverName: '李四',
            supplier: '深圳物流',
            deviceId: 'GPS002',
            status: 'offline',
            location: '深圳市南山区科技园',
            speed: 0,
            lastUpdateTime: '2024-03-20 09:30:00'
          }
        ]
        total.value = 2
        loading.value = false
      }, 500)
    }

    // 绑定设备
    const handleBindDevice = () => {
      bindDeviceVisible.value = true
    }

    // 提交绑定设备
    const handleBindDeviceSubmit = () => {
      if (!bindDeviceForm.value.vehicleId || !bindDeviceForm.value.deviceId) {
        ElMessage.warning('请填写完整信息')
        return
      }
      ElMessage.success('绑定成功')
      bindDeviceVisible.value = false
    }

    // 区域设置
    const handleSetArea = () => {
      areaSettingVisible.value = true
    }

    // 添加区域
    const handleAddArea = () => {
      // 实现添加区域的逻辑
    }

    // 编辑区域
    // eslint-disable-next-line no-unused-vars
    const handleEditArea = (row) => {
      // 实现编辑区域的逻辑
    }

    // 删除区域
    // eslint-disable-next-line no-unused-vars
    const handleDeleteArea = (row) => {
      ElMessageBox.confirm('确认删除该区域吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = areaList.value.findIndex(item => item.name === row.name)
        if (index > -1) {
          areaList.value.splice(index, 1)
          ElMessage.success('删除成功')
        }
      })
    }

    // 提交区域设置
    const handleAreaSettingSubmit = () => {
      ElMessage.success('保存成功')
      areaSettingVisible.value = false
    }

    // 轨迹查询
    // eslint-disable-next-line no-unused-vars
    const handleTrack = (row) => {
      trackDialogVisible.value = true
      // 实现轨迹查询的逻辑
    }

    // 查询轨迹
    const handleTrackQuery = () => {
      // 实现轨迹查询的逻辑
    }

    // 实时监控
    const handleMonitor = (row) => {
      currentVehicle.value = row
      monitorDialogVisible.value = true
      // 实现实时监控的逻辑
    }

    // 异常预警
    // eslint-disable-next-line no-unused-vars
    const handleWarning = (row) => {
      warningDialogVisible.value = true
      // 实现异常预警的逻辑
    }

    // 提交预警设置
    const handleWarningSubmit = () => {
      ElMessage.success('保存成功')
      warningDialogVisible.value = false
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
      vehicleStatus,
      searchText,
      currentPage,
      pageSize,
      total,
      vehicleList,
      
      // 选项数据
      supplierOptions,
      vehicleOptions,
      
      // 弹窗控制
      bindDeviceVisible,
      areaSettingVisible,
      trackDialogVisible,
      monitorDialogVisible,
      warningDialogVisible,
      
      // 表单数据
      bindDeviceForm,
      trackQueryForm,
      currentVehicle,
      warningForm,
      
      // 列表数据
      areaList,
      trackDataList,
      
      // 方法
      getStatusType,
      getStatusText,
      handleSearch,
      handleBindDevice,
      handleBindDeviceSubmit,
      handleSetArea,
      handleAddArea,
      handleEditArea,
      handleDeleteArea,
      handleAreaSettingSubmit,
      handleTrack,
      handleTrackQuery,
      handleMonitor,
      handleWarning,
      handleWarningSubmit,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.vehicle-gps-tracking {
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

/* 区域设置样式 */
.area-setting-container {
  display: flex;
  gap: 20px;
  height: 600px;
}

.map-container {
  flex: 2;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.area-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.area-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.area-list-header h3 {
  margin: 0;
}

/* 轨迹查询样式 */
.track-query-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.track-query-form {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.track-map-container {
  height: 400px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.track-data-list {
  height: 300px;
  overflow: auto;
}

/* 实时监控样式 */
.monitor-container {
  display: flex;
  gap: 20px;
}

.monitor-map-container {
  flex: 2;
  height: 500px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.vehicle-info {
  flex: 1;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* 异常预警样式 */
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