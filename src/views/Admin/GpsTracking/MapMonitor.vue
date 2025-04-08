<template>
  <div class="map-monitor-container">
    <el-row :gutter="20">
      <!-- 地图区域 -->
      <el-col :span="18">
        <el-card shadow="never" class="map-card">
          <template #header>
            <div class="card-header">
              <span>车辆实时位置监控 (模拟 SVG)</span>
              <el-button @click="toggleRefresh" :type="isRefreshing ? 'danger' : 'primary'" size="small">
                {{ isRefreshing ? '停止刷新' : '自动刷新 (10s)' }}
              </el-button>
            </div>
          </template>
          <div class="svg-map-wrapper">
            <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" preserveAspectRatio="xMidYMid meet" class="svg-map">
              <image 
                 href="/images/map.jpeg" 
                 x="0" 
                 y="0" 
                 :width="svgWidth" 
                 :height="svgHeight"
                 preserveAspectRatio="xMidYMid slice" 
              />

              <g v-for="vehicle in filteredVehicleLocations" :key="vehicle.id">
                 <template v-if="transformCoords(vehicle.lat, vehicle.lng)">
                     <g :transform="`translate(${transformCoords(vehicle.lat, vehicle.lng).x}, ${transformCoords(vehicle.lat, vehicle.lng).y})`">
                        
                        <circle v-if="vehicle.id === selectedVehicleId"
                                cx="0" 
                                cy="0"
                                r="15" 
                                :fill="getStatusColor(vehicle.status, true)"
                                opacity="0.5">
                           <animate attributeName="r" values="12;18;12" dur="1.5s" repeatCount="indefinite" />
                           <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                        
                        <path 
                           d="M 0 -9 L 6 0 L 0 9 L -6 0 Z"
                           :fill="getStatusColor(vehicle.status)" 
                           stroke="#ffffff" 
                           stroke-width="1"
                           transform="scale(1.2)"
                           @click="focusOnMap(vehicle)"
                           style="cursor: pointer;"
                        >
                            <title>{{ vehicle.plateNumber }} ({{ formatStatus(vehicle.status) }})</title>
                        </path>

                        <text 
                           x="0" 
                           y="-14"
                           text-anchor="middle"
                           font-size="9"
                           fill="#000000"
                           stroke="#ffffff"
                           stroke-width="0.3"
                           paint-order="stroke"
                           style="pointer-events: none;"
                        >
                           {{ vehicle.plateNumber }}
                        </text>

                        <text 
                           x="0" 
                           y="-4"
                           text-anchor="middle"
                           font-size="7"
                           fill="#333333"
                           stroke="#ffffff"
                           stroke-width="0.2"
                           paint-order="stroke"
                           style="pointer-events: none;"
                        >
                           {{ vehicle.city || '' }}{{ (vehicle.city && vehicle.state) ? ', ' : '' }}{{ vehicle.state || '' }}
                        </text>
                     </g>
                 </template>
              </g>
            </svg>
          </div>
        </el-card>
      </el-col>

      <!-- 车辆列表与筛选区域 -->
      <el-col :span="6">
        <el-card shadow="never" class="vehicle-list-card">
          <template #header>
            <span>车辆列表 & 筛选</span>
          </template>
           <el-form :model="filterForm" label-position="top" size="small">
             <el-form-item label="供应商">
               <el-select v-model="filterForm.supplierId" placeholder="所有供应商" clearable filterable style="width: 100%;">
                  <el-option
                     v-for="supplier in mockSuppliers" 
                     :key="supplier.id"
                     :label="supplier.name"
                     :value="supplier.id"
                   />
               </el-select>
             </el-form-item>
              <el-form-item label="服务类型">
                <el-select v-model="filterForm.serviceType" placeholder="所有服务类型" clearable style="width: 100%;">
                   <el-option
                      v-for="item in serviceTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                </el-select>
              </el-form-item>
               <el-form-item label="车辆状态">
                 <el-select v-model="filterForm.vehicleStatus" placeholder="所有状态" clearable style="width: 100%;">
                    <el-option
                       v-for="item in vehicleStatusOptions"
                       :key="item.value"
                       :label="item.label"
                       :value="item.value"
                     />
                 </el-select>
               </el-form-item>
           </el-form>
           <el-divider />
          <div class="vehicle-scroll-list">
             <div v-if="filteredVehicleLocations.length === 0" class="no-data">
               无匹配车辆
             </div>
            <div v-for="vehicle in filteredVehicleLocations" :key="vehicle.id" class="vehicle-item" :class="{ 'is-selected': vehicle.id === selectedVehicleId }">
              <div class="vehicle-info">
                <span class="plate-number">{{ vehicle.plateNumber }}</span>
                 <el-tag :type="getStatusTagType(vehicle.status)" size="small">{{ formatStatus(vehicle.status) }}</el-tag>
              </div>
               <div class="supplier-name">{{ vehicle.supplierName }}</div>
               <div class="location-info" style="font-size: 12px; color: #606266;">
                 位置: {{ vehicle.city || 'N/A' }}, {{ vehicle.state || 'N/A' }}
               </div>
               <div class="details">
                 速度: {{ vehicle.speed }} km/h | 方向: {{ vehicle.direction }}°
               </div>
                <div class="coords" style="font-size: 11px; color: #909399;">
                  坐标: {{ vehicle.lat }}, {{ vehicle.lng }}
                </div>
               <div class="task" v-if="vehicle.taskOrderNo">
                 任务: {{ vehicle.taskOrderNo }}
               </div>
               <div class="time">
                 更新: {{ vehicle.lastUpdateTime }}
               </div>
               <div class="actions">
                  <el-button text type="primary" size="small" @click="focusOnMap(vehicle)">模拟定位</el-button>
                  <el-button text type="info" size="small" @click="viewHistory(vehicle)">历史轨迹</el-button>
               </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

// --- SVG Map Dimensions and Coordinate Transformation ---
const svgWidth = ref(800);
const svgHeight = ref(600);
const padding = 50; // Padding inside SVG viewport

// Define the approximate Lat/Lng boundaries of your mock data
// Adjusted to roughly match the Eastvale, CA area from the screenshot
const latMin = 33.94; 
const latMax = 33.99;
const lngMin = -117.60;
const lngMax = -117.53;

const transformCoords = (lat, lng) => {
  if (lat === undefined || lng === undefined || lat === null || lng === null) {
      return null; 
  }
  const clampedLat = Math.max(latMin, Math.min(latMax, lat));
  const clampedLng = Math.max(lngMin, Math.min(lngMax, lng));
  const xRatio = (clampedLng - lngMin) / (lngMax - lngMin);
  const x = padding + xRatio * (svgWidth.value - 2 * padding);
  const yRatio = (clampedLat - latMin) / (latMax - latMin);
  const y = padding + (1 - yRatio) * (svgHeight.value - 2 * padding);
  return { x: Math.round(x), y: Math.round(y) };
};

// --- Mock Data (Keep existing mock data generation) ---
const mockSuppliers = ref([
  { id: 'supplier_1', name: '测试供应商A - 专做提框服务' },
  { id: 'supplier_2', name: '测试供应商B - FBA派送专家' },
  { id: 'supplier_3', name: '测试供应商C - 全能型选手' },
]);

const mockBaseVehicles = ref([
  { id: 'vehicle_1', plateNumber: 'CA12345', supplierId: 'supplier_1', supplierName: '测试供应商A - 专做提框服务', serviceType: 'port_to_warehouse', city: 'Eastvale', state: 'CA' },
  { id: 'vehicle_2', plateNumber: 'NY98765', supplierId: 'supplier_2', supplierName: '测试供应商B - FBA派送专家', serviceType: 'warehouse_to_destination', city: 'Corona', state: 'CA' },
  { id: 'vehicle_3', plateNumber: 'TX54321', supplierId: 'supplier_3', supplierName: '测试供应商C - 全能型选手', serviceType: 'general_purpose', city: 'Chino', state: 'CA' },
   { id: 'vehicle_4', plateNumber: 'FL11223', supplierId: 'supplier_1', supplierName: '测试供应商A - 专做提框服务', serviceType: 'port_to_warehouse', city: 'Eastvale', state: 'CA' },
   { id: 'vehicle_5', plateNumber: 'AZ55667', supplierId: 'supplier_2', supplierName: '测试供应商B - FBA派送专家', serviceType: 'warehouse_to_destination', city: 'Ontario', state: 'CA' },
]);

const vehicleLocations = ref([]);
const refreshInterval = ref(null);
const isRefreshing = ref(true);
const selectedVehicleId = ref(null); // Track the selected vehicle for highlighting

const generateMockLocationData = () => {
  const statuses = ['idle', 'loaded', 'stopped', 'moving'];
  const taskPrefixes = ['PO', 'DO', 'SO'];
  const nowStr = new Date().toLocaleTimeString('sv-SE');

  vehicleLocations.value = mockBaseVehicles.value.map(baseVehicle => {
    const existingLocation = vehicleLocations.value.find(loc => loc.id === baseVehicle.id);
    // Generate initial coords within the new bounds
    let lat = existingLocation?.lat ?? (latMin + Math.random() * (latMax - latMin)); 
    let lng = existingLocation?.lng ?? (lngMin + Math.random() * (lngMax - lngMin));
    let speed = 0;
    let status = statuses[Math.floor(Math.random() * statuses.length)];
    let direction = Math.floor(Math.random() * 360);
    let taskOrderNo = null;

    if (existingLocation && status !== 'stopped' && status !== 'idle') {
       const latChange = (Math.random() - 0.5) * 0.001; // Smaller steps for smaller area
       const lngChange = (Math.random() - 0.5) * 0.001;
       lat = Math.max(latMin, Math.min(latMax, existingLocation.lat + latChange));
       lng = Math.max(lngMin, Math.min(lngMax, existingLocation.lng + lngChange));
       speed = Math.floor(Math.random() * 80) + 10; 
       direction = (existingLocation.direction + Math.floor((Math.random() - 0.5) * 20) + 360) % 360;
       status = 'moving';
    } else if (status === 'stopped' || status === 'idle') {
        speed = 0;
         // If stopped/idle, keep previous position if available
         lat = existingLocation?.lat ?? lat;
         lng = existingLocation?.lng ?? lng;
    } else {
        speed = Math.floor(Math.random() * 80) + 10;
    }

    if (status === 'loaded' || status === 'moving' || (existingLocation && existingLocation.taskOrderNo)) {
       taskOrderNo = existingLocation?.taskOrderNo || `${taskPrefixes[Math.floor(Math.random() * taskPrefixes.length)]}${String(Math.random()).slice(2, 8)}`;
    }
    if (status === 'idle') taskOrderNo = null; 

    return {
      ...baseVehicle,
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      speed: speed,
      direction: direction,
      status: status,
      taskOrderNo: taskOrderNo,
      lastUpdateTime: nowStr,
    };
  });
};

// --- Option Data (Keep existing) ---
const serviceTypeOptions = [
  { value: 'port_to_warehouse', label: '码头到仓库' },
  { value: 'warehouse_to_destination', label: '仓库到目的地' },
  { value: 'general_purpose', label: '通用型' },
];

const vehicleStatusOptions = [
  { value: 'idle', label: '空驶' },
  { value: 'loaded', label: '载货' },
  { value: 'stopped', label: '停留' },
  { value: 'moving', label: '行驶中' },
];

// --- Filtering (Keep existing) ---
const filterForm = reactive({
  supplierId: '',
  serviceType: '',
  vehicleStatus: ''
});

const filteredVehicleLocations = computed(() => {
  return vehicleLocations.value.filter(loc => {
    const supplierMatch = filterForm.supplierId ? loc.supplierId === filterForm.supplierId : true;
    const serviceTypeMatch = filterForm.serviceType ? loc.serviceType === filterForm.serviceType : true;
    const statusMatch = filterForm.vehicleStatus ? loc.status === filterForm.vehicleStatus : true;
    return supplierMatch && serviceTypeMatch && statusMatch;
  });
});

// --- Methods ---
// Formatters
const formatStatus = (status) => vehicleStatusOptions.find(opt => opt.value === status)?.label || status;

const getStatusTagType = (status) => {
  switch (status) {
    case 'moving':
    case 'loaded': return 'success';
    case 'stopped': return 'warning';
    case 'idle': return 'info';
    default: return 'info';
  }
};

// Added function to get marker color based on status
const getStatusColor = (status, isPulse = false) => {
  switch (status) {
    case 'moving': return isPulse ? '#67c23a' : '#4CAF50'; // Green
    case 'loaded': return isPulse ? '#67c23a' : '#4CAF50'; // Green
    case 'stopped': return isPulse ? '#e6a23c' : '#FF9800'; // Orange
    case 'idle': return isPulse ? '#909399' : '#9E9E9E';   // Grey
    default: return isPulse ? '#909399' : '#9E9E9E';      // Grey
  }
};

// Updated focusOnMap to simply set the selected ID
const focusOnMap = (vehicle) => {
  console.log('Simulating focus on vehicle:', vehicle.plateNumber);
  selectedVehicleId.value = vehicle.id;
  // No actual map movement, just highlight
};

// Keep existing viewHistory
const viewHistory = (vehicle) => {
  console.log('查看历史轨迹 for:', vehicle.plateNumber);
  ElMessage.info(`跳转或弹窗显示 ${vehicle.plateNumber} 的历史轨迹查询 (待实现)`);
};

// Keep existing refresh logic
const startRefresh = () => {
  if (refreshInterval.value) clearInterval(refreshInterval.value);
  generateMockLocationData(); 
  refreshInterval.value = setInterval(generateMockLocationData, 10000);
  isRefreshing.value = true;
};

const stopRefresh = () => {
  if (refreshInterval.value) clearInterval(refreshInterval.value);
  refreshInterval.value = null;
  isRefreshing.value = false;
};

const toggleRefresh = () => {
  if (isRefreshing.value) {
    stopRefresh();
  } else {
    startRefresh();
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  startRefresh();
});

onUnmounted(() => {
  stopRefresh();
});

</script>

<style scoped>
.map-monitor-container {
  padding: 20px;
  height: calc(100vh - 104px);
}

.el-row, .el-col, .el-card {
  height: 100%;
}

.map-card .el-card__body {
  height: calc(100% - 57px);
  padding: 0;
  display: flex; /* Use flex to contain SVG wrapper */
}

.svg-map-wrapper {
    flex-grow: 1; /* Allow wrapper to grow */
    height: 100%;
    overflow: hidden; /* Hide potential overflow if needed */
    background-color: #f5f7fa; /* Match SVG background initially */
    display: flex; /* Center SVG if smaller */
    align-items: center;
    justify-content: center;
}

.svg-map {
    width: 100%; /* Make SVG fill wrapper */
    height: 100%;
}

.vehicle-list-card .el-card__body {
   height: calc(100% - 57px);
   display: flex;
   flex-direction: column;
}

.filter-form .el-form-item {
  margin-bottom: 10px;
}

.vehicle-scroll-list {
  flex-grow: 1;
  overflow-y: auto;
  margin-top: 10px;
  padding-right: 5px;
}

.vehicle-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
  font-size: 13px;
  background-color: #fff;
  transition: background-color 0.3s;
}

.vehicle-item.is-selected {
    background-color: #ecf5ff; 
    border-left: 3px solid #409eff;
}

.vehicle-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.plate-number {
  font-weight: bold;
}

.supplier-name {
  color: #606266;
  margin-bottom: 3px;
}

.location-info,
.details,
.task,
.time,
.coords {
  color: #909399;
  margin-bottom: 3px;
}

.time {
    font-size: 12px;
}

.actions {
  margin-top: 5px;
  text-align: right;
}

.no-data {
  text-align: center;
  color: #909399;
  padding-top: 20px;
}

/* Optional: Style for the text if needed */
.svg-map text {
    font-weight: 500; /* Make text slightly bolder */
}
</style> 