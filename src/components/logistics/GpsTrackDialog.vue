<!-- eslint-disable -->
<template>
  <el-dialog
    title="GPS轨迹"
    v-model="dialogVisible"
    width="1000px"
    :close-on-click-modal="false"
  >
    <div class="gps-container">
      <!-- 地图容器 -->
      <div class="map-container">
        <svg class="route-map" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
          <!-- 背景 -->
          <rect width="100%" height="100%" fill="#f5f7fa"/>
          
          <!-- 路线 -->
          <path
            :d="routePath"
            fill="none"
            stroke="#409EFF"
            stroke-width="4"
            stroke-dasharray="5,5"
          />
          
          <!-- 站点标记 -->
          <g v-for="(point, index) in trackPoints" :key="index">
            <!-- 站点圆点 -->
            <circle
              :cx="point.x"
              :cy="point.y"
              r="8"
              :fill="getStatusColor(point.status)"
              stroke="white"
              stroke-width="2"
            />
            
            <!-- 站点名称 -->
            <text
              :x="point.x"
              :y="point.y - 15"
              text-anchor="middle"
              fill="#303133"
              font-size="12"
            >{{ point.name }}</text>
          </g>
          
          <!-- 车辆标记 -->
          <g v-if="currentPoint">
            <circle
              :cx="currentPoint.x"
              :cy="currentPoint.y"
              r="6"
              fill="#409EFF"
              stroke="white"
              stroke-width="2"
            />
            <circle
              :cx="currentPoint.x"
              :cy="currentPoint.y"
              r="3"
              fill="white"
            />
          </g>
        </svg>
      </div>
      
      <!-- 轨迹信息面板 -->
      <div class="track-info">
        <div class="info-header">
          <h3>轨迹信息</h3>
          <el-button type="primary" size="small" @click="startTrackPlay">开始播放</el-button>
        </div>
        
        <!-- 时间轴 -->
        <div class="timeline">
          <el-slider
            v-model="currentTimeIndex"
            :min="0"
            :max="trackPoints.length - 1"
            :format-tooltip="formatTimeTooltip"
            @change="handleTimeChange"
          ></el-slider>
          <div class="time-display">{{ currentTime }}</div>
        </div>
        
        <!-- 轨迹点列表 -->
        <div class="track-points">
          <div
            v-for="(point, index) in trackPoints"
            :key="index"
            class="track-point-item"
            :class="{ active: currentTimeIndex === index }"
            @click="handlePointClick(index)"
          >
            <div class="point-time">{{ point.time }}</div>
            <div class="point-info">
              <div class="point-name">{{ point.name }}</div>
              <div class="point-address">{{ point.address }}</div>
            </div>
            <div class="point-status" :class="point.status">
              {{ getStatusText(point.status) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  name: 'GpsTrackDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    trainData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    });

    // 轨迹数据
    const trackPoints = ref([
      {
        time: '2024-03-20 08:00:00',
        name: '洛杉矶仓库',
        address: '1234 Warehouse Ave, Los Angeles, CA 90001',
        status: 'completed',
        x: 100,
        y: 300
      },
      {
        time: '2024-03-20 09:30:00',
        name: '凤凰城中转站',
        address: '5678 Distribution Center Blvd, Phoenix, AZ 85001',
        status: 'completed',
        x: 300,
        y: 250
      },
      {
        time: '2024-03-20 11:00:00',
        name: '达拉斯配送点',
        address: '9012 Delivery Center Rd, Dallas, TX 75201',
        status: 'current',
        x: 500,
        y: 200
      },
      {
        time: '2024-03-20 13:00:00',
        name: '休斯顿仓库',
        address: '3456 Logistics Way, Houston, TX 77001',
        status: 'pending',
        x: 700,
        y: 150
      }
    ]);

    // 播放控制
    const currentTimeIndex = ref(0);
    const isPlaying = ref(false);
    let playTimer = null;

    // 当前时间显示
    const currentTime = computed(() => {
      return trackPoints.value[currentTimeIndex.value]?.time || '';
    });

    // 当前点
    const currentPoint = computed(() => {
      return trackPoints.value[currentTimeIndex.value];
    });

    // 路线路径
    const routePath = computed(() => {
      const points = trackPoints.value;
      if (points.length < 2) return '';
      
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
      }
      return path;
    });

    // 获取状态颜色
    const getStatusColor = (status) => {
      const colors = {
        completed: '#67c23a',
        current: '#409eff',
        pending: '#909399'
      };
      return colors[status] || colors.pending;
    };

    // 开始播放轨迹
    const startTrackPlay = () => {
      if (isPlaying.value) {
        stopTrackPlay();
      } else {
        isPlaying.value = true;
        playTimer = setInterval(() => {
          if (currentTimeIndex.value < trackPoints.value.length - 1) {
            currentTimeIndex.value++;
          } else {
            stopTrackPlay();
          }
        }, 2000);
      }
    };

    // 停止播放轨迹
    const stopTrackPlay = () => {
      isPlaying.value = false;
      if (playTimer) {
        clearInterval(playTimer);
        playTimer = null;
      }
    };

    // 处理时间轴变化
    const handleTimeChange = (value) => {
      currentTimeIndex.value = value;
    };

    // 处理轨迹点点击
    const handlePointClick = (index) => {
      currentTimeIndex.value = index;
    };

    // 格式化时间提示
    const formatTimeTooltip = (value) => {
      return trackPoints.value[value]?.time || '';
    };

    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        completed: '已完成',
        current: '当前位置',
        pending: '待到达'
      };
      return statusMap[status] || status;
    };

    // 监听对话框显示状态
    watch(dialogVisible, (val) => {
      if (!val) {
        stopTrackPlay();
      }
    });

    return {
      dialogVisible,
      trackPoints,
      currentTimeIndex,
      currentTime,
      currentPoint,
      routePath,
      startTrackPlay,
      handleTimeChange,
      handlePointClick,
      formatTimeTooltip,
      getStatusText,
      getStatusColor
    };
  }
};
</script>

<style scoped>
.gps-container {
  display: flex;
  height: 600px;
  gap: 20px;
}

.map-container {
  flex: 2;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.route-map {
  width: 100%;
  height: 100%;
}

.track-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #EBEEF5;
  padding-left: 20px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.info-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.timeline {
  margin-bottom: 20px;
}

.time-display {
  text-align: center;
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}

.track-points {
  flex: 1;
  overflow-y: auto;
}

.track-point-item {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #f5f7fa;
  transition: all 0.3s;
}

.track-point-item:hover {
  background-color: #ecf5ff;
}

.track-point-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409EFF;
}

.point-time {
  color: #909399;
  font-size: 13px;
  min-width: 150px;
}

.point-info {
  flex: 1;
}

.point-name {
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.point-address {
  color: #606266;
  font-size: 13px;
}

.point-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.point-status.completed {
  background-color: #f0f9eb;
  color: #67c23a;
}

.point-status.current {
  background-color: #ecf5ff;
  color: #409eff;
}

.point-status.pending {
  background-color: #f4f4f5;
  color: #909399;
}

/* 自定义滚动条样式 */
.track-points::-webkit-scrollbar {
  width: 6px;
}

.track-points::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.track-points::-webkit-scrollbar-track {
  background: #f4f4f5;
}
</style> 