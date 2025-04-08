<template>
  <div class="dockyard-container">
    <h1>海柜停车图</h1>
    
    <div class="header">
      <div class="logo">
        <div class="logo-box">W</div>
        <div>
          <div class="company-name">盈仓科技</div>
          <div class="company-name-en">LinkW Technology Logistics Inc.</div>
        </div>
      </div>
    </div>
    
    <div class="container">
      <!-- 前场停车区 -->
      <div class="front-yard">
        <!-- 第1行: 编号 -->
        <div v-for="space in frontYardRow1" :key="space.id" 
             :class="['parking-space', getContainerClass(space.id)]" 
             :data-id="space.id" @click="showContainerPopup(space.id)">
          {{ space.label }}
          <div v-if="containerData[space.id]" class="container-id">
            {{ containerData[space.id].containerId }}
          </div>
          <div v-if="containerData[space.id]" class="mini-progress">
            <div class="mini-progress-bar" :style="{width: containerData[space.id].progress + '%'}">
              {{ containerData[space.id].progress }}%
            </div>
          </div>
        </div>
        
        <!-- 前场标签 -->
        <div class="front-yard-label">前场<br>100X</div>
        
        <!-- 第2行: 停车位 -->
        <div v-for="space in frontYardRow2" :key="space.id" 
             :class="['parking-space', getContainerClass(space.id)]" 
             :data-id="space.id" @click="showContainerPopup(space.id)">
          {{ space.label }}
          <div v-if="containerData[space.id]" class="container-id">
            {{ containerData[space.id].containerId }}
          </div>
          <div v-if="containerData[space.id]" class="mini-progress">
            <div class="mini-progress-bar" :style="{width: containerData[space.id].progress + '%'}">
              {{ containerData[space.id].progress }}%
            </div>
          </div>
        </div>
      </div>
      
      <div class="warehouse-title">仓库</div>
      
      <div class="parking-area">

        
        <!-- 仓库停车位 -->
        <div v-for="i in 27" :key="'warehouse-'+i" 
             :class="['parking-space', getContainerClass(formatSpaceId(i))]" 
             :data-id="formatSpaceId(i)" @click="showContainerPopup(formatSpaceId(i))">
          {{ formatSpaceId(i) }}
          <div v-if="containerData[formatSpaceId(i)]" class="container-id">
            {{ containerData[formatSpaceId(i)].containerId }}
          </div>
          <div v-if="containerData[formatSpaceId(i)]" class="mini-progress">
            <div class="mini-progress-bar" :style="{width: containerData[formatSpaceId(i)].progress + '%'}">
              {{ containerData[formatSpaceId(i)].progress }}%
            </div>
          </div>
        </div>
      </div>
      
      <!-- 后场区域 -->
      <div class="back-yard">
        <!-- 后场标签 -->
        <div class="back-yard-label">后场<br>120X</div>
        
        <!-- 后场停车位 -->
        <div v-for="space in backYardSpaces" :key="space.id" 
             :class="['parking-space', getContainerClass(space.id)]" 
             :data-id="space.id" @click="showContainerPopup(space.id)">
          {{ space.label }}
          <div v-if="containerData[space.id]" class="container-id">
            {{ containerData[space.id].containerId }}
          </div>
          <div v-if="containerData[space.id]" class="mini-progress">
            <div class="mini-progress-bar" :style="{width: containerData[space.id].progress + '%'}">
              {{ containerData[space.id].progress }}%
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 自定义弹窗 -->
    <div v-if="popupVisible" class="custom-popup" :style="popupStyle">
      <div class="popup-header">
        <span class="popup-title">停车位信息</span>
        <button class="popup-close" @click="closePopup">&times;</button>
      </div>
      <div class="popup-body">
        <p>停车位号: {{ selectedSpace }}</p>
        <p>柜号: {{ selectedContainer ? selectedContainer.containerId : '空' }}</p>
        <p>拆柜进度:</p>
        <el-progress 
          :percentage="selectedContainer ? selectedContainer.progress : 0"
          :status="selectedContainer && selectedContainer.progress >= 100 ? 'success' : ''"
        ></el-progress>
      </div>
      <div class="popup-footer">
        <el-button type="primary" @click="dispatchContainer">调度上口</el-button>
        <el-button type="danger" @click="removeContainer">移除海柜</el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DockyardView',
  data() {
    return {
      // 集装箱数据
      containerData: {
        // 格式: 'spaceId': { containerId: 'XXX', progress: 65 }
        // 前场集装箱
        '05': { containerId: 'FRNT5723', progress: 70 },
        '14': { containerId: 'FRNT8912', progress: 40 },
        '19': { containerId: 'FRNT4567', progress: 30 },
        
        // 仓库集装箱
        '01': { containerId: 'WHSE7845', progress: 65 },
        '02': { containerId: 'WHSE3912', progress: 30 },
        '09': { containerId: 'WHSE4523', progress: 80 },
        
        // 后场集装箱
        '47': { containerId: 'BACK4755', progress: 25 },
        '41-2': { containerId: 'BACK4102', progress: 50 },
        '35-2': { containerId: 'BACK3520', progress: 100 }, // 已完全卸载
      },
      
      // 前场第1行停车位
      frontYardRow1: [
        { id: '46', label: '46' },
        { id: '45', label: '45' },
        { id: '44', label: '44' },
        { id: '43', label: '43' },
        { id: '42', label: '42' },
        { id: '41', label: '41' },
        { id: '40', label: '40' },
        { id: '39', label: '39' },
        { id: '38', label: '38' },
        { id: '37', label: '37' },
        { id: '36', label: '36' },
        { id: '35', label: '35' },
        { id: '34', label: '34' },
        { id: '33', label: '33' },
        { id: '32', label: '32' },
        { id: '31', label: '31' },
        { id: 'empty1', label: '', isEmptySpace: true },
        { id: 'empty2', label: '', isEmptySpace: true },
        { id: '30', label: '30' },
        { id: '29', label: '29' },
        { id: '28', label: '28' },
        { id: '27', label: '27' },
        { id: '26', label: '26' },
        { id: 'empty3', label: '', isEmptySpace: true },
        { id: 'empty4', label: '', isEmptySpace: true },
        { id: 'XX1', label: 'XX' },
        { id: 'XX2', label: 'XX' },
        { id: 'empty5', label: '', isEmptySpace: true }
      ],
      
      // 前场第2行停车位
      frontYardRow2: [
        { id: '03', label: '03' },
        { id: '04', label: '04' },
        { id: '05', label: '05' },
        { id: 'empty6', label: '', isEmptySpace: true },
        { id: '07', label: '07' },
        { id: '08', label: '08' },
        { id: '09', label: '09' },
        { id: '10', label: '10' },
        { id: '11', label: '11' },
        { id: '12', label: '12' },
        { id: '13', label: '13' },
        { id: '14', label: '14' },
        { id: 'empty7', label: '', isEmptySpace: true },
        { id: '16', label: '16' },
        { id: 'empty8', label: '', isEmptySpace: true },
        { id: 'empty9', label: '', isEmptySpace: true },
        { id: 'empty10', label: '', isEmptySpace: true },
        { id: '17', label: '17' },
        { id: '18', label: '18' },
        { id: '19', label: '19' },
        { id: '20', label: '20' },
        { id: '21', label: '21' },
        { id: '22', label: '22' },
        { id: '23', label: '23' },
        { id: '24', label: '24' },
        { id: '25', label: '25' }
      ],
      
      // 后场停车位
      backYardSpaces: [
        { id: '47', label: '47' },
        { id: '48', label: '48' },
        { id: 'empty11', label: '', isEmptySpace: true },
        { id: '49', label: '49' },
        { id: '44-2', label: '44' },
        { id: '43-2', label: '43' },
        { id: '42-2', label: '42' },
        { id: '41-2', label: '41' },
        { id: '40-2', label: '40' },
        { id: '39-2', label: '39' },
        { id: '38-2', label: '38' },
        { id: '37-2', label: '37' },
        { id: '36-2', label: '36' },
        { id: '35-2', label: '35' },
        { id: '34-2', label: '34' },
        { id: '33-2', label: '33' },
        { id: '32-2', label: '32' },
        { id: '31-2', label: '31' },
        { id: '31-1', label: '31-1' },
        { id: '31-2', label: '31-2' },
        { id: 'empty12', label: '', isEmptySpace: true },
        { id: '30-2', label: '30' },
        { id: '29-2', label: '29' },
        { id: '28-2', label: '28' },
        { id: '29-1', label: '28-1' },
        { id: '26-2', label: '28-2' }
      ],
      
      // 弹窗相关
      popupVisible: false,
      selectedSpace: '',
      popupStyle: {
        position: 'absolute',
        margin: '0',
        padding: '0',
        top: '0px',
        left: '0px'
      }
    }
  },
  computed: {
    selectedContainer() {
      return this.containerData[this.selectedSpace] || null;
    }
  },
  methods: {
    // 格式化停车位ID
    formatSpaceId(num) {
      return num.toString().padStart(2, '0');
    },
    
    // 获取集装箱状态对应的CSS类
    getContainerClass(spaceId) {
      if (!this.containerData[spaceId]) {
        return 'no-container';
      }
      
      return this.containerData[spaceId].progress >= 100 
        ? 'empty-container' 
        : 'loading-container';
    },
    
    // 显示集装箱弹窗
    showContainerPopup(spaceId) {
      // 检查是否为空白区域
      const isEmptySpace = 
        this.frontYardRow1.some(s => s.id === spaceId && s.isEmptySpace) ||
        this.frontYardRow2.some(s => s.id === spaceId && s.isEmptySpace) ||
        this.backYardSpaces.some(s => s.id === spaceId && s.isEmptySpace);
      
      if (isEmptySpace) return;
      
      this.selectedSpace = spaceId;
      
      // 获取点击的停车位元素
      this.$nextTick(() => {
        const spaceElement = document.querySelector(`.parking-space[data-id="${spaceId}"]`);
        if (spaceElement) {
          const rect = spaceElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
          
          // 计算弹窗位置 - 放在停车位的右侧
          this.popupStyle = {
            position: 'absolute',
            margin: '0',
            padding: '0',
            top: `${rect.top + scrollTop - 30}px`,
            left: `${rect.right + scrollLeft + 10}px`
          };
          
          // 检查是否会超出右侧边界，如果是则放在左侧
          const windowWidth = window.innerWidth;
          if (rect.right + 310 > windowWidth) { // 300px宽度 + 10px边距
            this.popupStyle.left = `${rect.left + scrollLeft - 310}px`;
          }
          
          this.popupVisible = true;
        } else {
          // 如果找不到元素，则居中显示
          this.popupStyle = {
            position: 'relative',
            margin: '0 auto'
          };
          this.popupVisible = true;
        }
      });
    },
    
    // 关闭弹窗
    closePopup() {
      this.popupVisible = false;
    },
    
    // 调度集装箱
    dispatchContainer() {
      if (this.containerData[this.selectedSpace]) {
        this.$message.success(`集装箱 ${this.containerData[this.selectedSpace].containerId} 已从停车位 ${this.selectedSpace} 调度`);
        
        // 更新数据
        this.$delete(this.containerData, this.selectedSpace);
        
        // 关闭弹窗
        this.popupVisible = false;
      } else {
        this.$message.warning(`停车位 ${this.selectedSpace} 没有集装箱可调度`);
      }
    },
    
    // 移除集装箱
    removeContainer() {
      if (this.containerData[this.selectedSpace]) {
        this.$message.success(`集装箱 ${this.containerData[this.selectedSpace].containerId} 已从停车位 ${this.selectedSpace} 移除`);
        
        // 更新数据
        this.$delete(this.containerData, this.selectedSpace);
        
        // 关闭弹窗
        this.popupVisible = false;
      } else {
        this.$message.warning(`停车位 ${this.selectedSpace} 没有集装箱可移除`);
      }
    }
  }
}
</script>

<style scoped>
.dockyard-container {
  padding: 20px;
}

h1 {
  margin-bottom: 30px;
  font-size: 24px;
  color: #303133;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  border: 2px solid #008000;
  background-color: white;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-box {
  width: 60px;
  height: 60px;
  background-color: #0086c3;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32px;
  font-weight: bold;
  margin-right: 10px;
}

.company-name {
  color: #0086c3;
  font-size: 24px;
  font-weight: bold;
}

.company-name-en {
  color: #777;
  font-size: 14px;
}

.container {
  border: 1px solid black;
  background-color: white;
  position: relative;
}

.warehouse-title {
  text-align: center;
  font-size: 36px;
  font-weight: bold;
  padding: 20px 0;
}

.front-yard {
  display: grid;
  grid-template-columns: repeat(28, 1fr);
  grid-gap: 1px;
  margin-bottom: 20px;
}

.front-yard-label {
  grid-column: span 28;
  text-align: center;
  font-weight: bold;
  background-color: #f0f0f0;
  padding: 5px;
  border: 1px solid #333;
}

.back-yard-label {
  grid-column: span 27;
  text-align: center;
  font-weight: bold;
  background-color: #f0f0f0;
  padding: 5px;
  border: 1px solid #333;
}

.parking-area {
  display: grid;
  grid-template-columns: repeat(27, 1fr);
  grid-gap: 1px;
}

.back-yard {
  display: grid;
  grid-template-columns: repeat(27, 1fr);
  grid-gap: 1px;
  margin-top: 20px;
}

.parking-space {
  height: 120px;
  border: 1px solid #333;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s;
  position: relative;
}

.parking-space:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(0,0,0,0.2);
  z-index: 10;
}

.parking-space.empty-container {
  background-color: #4CAF50;
  color: black;
}

.parking-space.loading-container {
  background-color: #f44336;
  color: white;
}

.parking-space.no-container {
  background-color: white;
  color: black;
}

.container-id {
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: bold;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 5px;
  border-radius: 3px;
  white-space: nowrap;
}

.mini-progress {
  position: absolute;
  bottom: 5px;
  left: 5px;
  right: 5px;
  height: 8px;
  background-color: #ddd;
  border-radius: 4px;
}

.mini-progress-bar {
  height: 100%;
  background-color: #2196F3;
  border-radius: 4px;
  text-align: center;
  color: white;
  font-size: 6px;
  line-height: 8px;
}

.empty-space {
  height: 60px;
  border: 1px solid transparent;
}

.linktrans-area {
  grid-column: span 9;
  background-color: #4682B4;
  color: white;
  text-align: center;
  padding: 5px;
  font-weight: bold;
  border: 1px solid #333;
}

.outbound-area {
  grid-column: span 9;
  background-color: white;
  text-align: center;
  padding: 5px;
  font-weight: bold;
  border: 1px solid #333;
}

.amazon-area {
  grid-column: span 9;
  background-color: #ADD8E6;
  text-align: center;
  padding: 5px;
  font-weight: bold;
  border: 1px solid #333;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
}

/* 自定义弹窗样式 */
.custom-popup {
  position: absolute;
  width: 300px;
  background-color: white;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
  z-index: 2000;
}

.popup-header {
  padding: 15px;
  border-bottom: 1px solid #EBEEF5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.popup-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #909399;
}

.popup-body {
  padding: 15px;
}

.popup-footer {
  padding: 10px 15px 15px;
  border-top: 1px solid #EBEEF5;
  display: flex;
  justify-content: space-between;
}

.popup-body p {
  margin-bottom: 10px;
}
</style> 