<template>
  <!-- 包裹层，用于居中显示手机模型 -->
  <div class="outbound-view-wrapper">
    <div class="phone-mockup">
      <div class="phone-screen">
        <!-- 扫描页面 -->
        <div v-if="!taskStarted" class="scan-container">
          <el-page-header @back="goBack" content="出库扫描">
          </el-page-header>
          
          <div class="scan-area">
            <div class="scan-icon">
              <el-icon><Aim /></el-icon>
            </div>
            <p class="scan-text">请扫描出库单</p>
            <div class="scan-input-area">
              <el-input 
                v-model="outboundCode" 
                placeholder="请输入出库单号"
                clearable
                @keyup.enter="handleScanOutbound"
              ></el-input>
              <el-button type="primary" @click="handleScanOutbound">确认</el-button>
            </div>
            <div class="virtual-code-btn">
              <el-button type="success" @click="generateVirtualCode">生成虚拟号码</el-button>
            </div>
          </div>
        </div>

        <!-- 任务页面 -->
        <div v-if="taskStarted && !outboundStarted" class="outbound-container">
          <el-page-header @back="resetToScan" content="出库任务">
          </el-page-header>

          <div class="train-info">
            <h2>车次号: {{ trainNumber }}</h2>
          </div>

          <div class="confirm-button-container">
            <el-button type="primary" @click="startOutbound" style="width: 100%;">确认出库开始</el-button>
          </div>
        </div>

        <!-- 出库详情页面 -->
        <div v-if="outboundStarted" class="outbound-confirm-container">
          <el-page-header @back="backToTask" content="确认出库">
          </el-page-header>

          <div class="train-info">
            <h2>车次号: {{ trainNumber }}</h2>
          </div>

          <!-- PC/卡板号维度的订单数据区域 -->
          <div class="order-data-area">
            <p v-if="orderLoading" class="loading">加载订单中...</p>
            <el-card 
              shadow="never" 
              v-for="order in orderList" 
              :key="order.palletCode" 
              class="order-card" 
              :class="{ 'outbound-completed': order.status === 'completed' }"
            >
              <div class="order-details">
                <p><strong>卡板号:</strong> {{ order.palletCode }}</p>
                <p><strong>PC号:</strong> {{ order.orderNumber }}</p>
                <p><strong>原库位:</strong> {{ order.originalLocation }}</p>
                <p><strong>状态:</strong> <span :class="`status-${order.status}`">{{ getStatusText(order.status) }}</span></p>
              </div>
              <div class="scan-actions" v-if="order.status === 'pending'">
                <el-button size="small" type="primary" @click="simulateScanPallet(order)" plain>扫卡板</el-button>
                <el-button size="small" type="info" @click="simulateScanLocation(order)" :disabled="!order.palletScanned" plain>扫库位</el-button>
                <el-button size="small" type="warning" @click="simulateScanDock(order)" :disabled="!order.palletScanned" plain>扫Dock</el-button>
              </div>
              <div v-if="order.status === 'completed'" class="completed-indicator">
                 <el-icon color="#67C23A" size="18"><SuccessFilled /></el-icon> 已出库
              </div>
            </el-card>
            <p v-if="!orderList.length && !orderLoading" class="no-data">没有需要出库的订单</p>
          </div>

           <!-- 模拟扫描输入 Dialog -->
          <el-dialog
             v-model="showScanDialog"
             :title="`扫描${scanType === 'pallet' ? '卡板' : scanType === 'location' ? '库位' : 'Dock'}: ${scanInputLabel}`"
             width="90%" 
             :append-to-body="true"
             :close-on-click-modal="false"
             @closed="clearScanDialog" 
           >
             <el-input
               v-model="scannedCode"
               :placeholder="`请输入模拟 ${scanType === 'pallet' ? '卡板' : scanType === 'location' ? '库位' : 'Dock'} 码`"
               clearable
               @keyup.enter="confirmScan"
               ref="scanInputRef" 
             />
             <template #footer>
               <span class="dialog-footer">
                 <el-button @click="showScanDialog = false">取消</el-button>
                 <el-button type="primary" @click="confirmScan">确认</el-button>
               </span>
             </template>
           </el-dialog>

           <!-- 总体出库完成按钮 -->
           <div class="footer-button-inside-phone" v-if="outboundStarted"> 
              <el-button type="success" @click="completeOutbound" style="width: 100%;">出库完成</el-button>
           </div>
        </div>
        
        <!-- 拍照上传对话框 -->
        <el-dialog
          v-model="showPhotoDialog"
          title="上传凭证照片"
          width="90%"
          :append-to-body="true"
          :close-on-click-modal="false"
          :show-close="false"
        >
          <div class="photo-upload-container">
            <div v-if="!photoList.length" class="photo-placeholder">
              <el-icon><Picture /></el-icon>
              <p>请上传凭证照片</p>
            </div>
            <div v-else class="photo-preview">
              <div 
                v-for="(photo, index) in photoList" 
                :key="index" 
                class="photo-item"
              >
                <img :src="photo.url" alt="凭证照片" />
                <div class="photo-delete" @click="removePhoto(index)">
                  <el-icon><Delete /></el-icon>
                </div>
              </div>
            </div>
            
            <div class="upload-actions">
              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handlePhotoChange"
                :multiple="true"
                accept="image/*"
              >
                <el-button type="primary" plain>
                  <el-icon><Upload /></el-icon>
                  选择照片
                </el-button>
              </el-upload>
              
              <el-button type="success" @click="takePhoto" plain>
                <el-icon><Camera /></el-icon>
                拍照
              </el-button>
            </div>
          </div>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="cancelUpload">取消</el-button>
              <el-button type="primary" @click="submitPhotos" :disabled="!photoList.length">提交</el-button>
            </span>
          </template>
        </el-dialog>
        
        <!-- 拍照组件 -->
        <el-dialog
          v-model="showCameraDialog"
          title="拍摄凭证照片"
          width="90%"
          :append-to-body="true"
          :close-on-click-modal="false"
        >
          <div class="camera-container" v-if="hasCamera">
            <video ref="videoRef" autoplay class="camera-video"></video>
            <div class="camera-actions">
              <el-button type="primary" @click="capturePhoto">拍照</el-button>
              <el-button @click="showCameraDialog = false">取消</el-button>
            </div>
          </div>
          <div v-else class="camera-error">
            <el-icon><WarningFilled /></el-icon>
            <p>无法访问摄像头，请检查权限或使用上传功能</p>
          </div>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElPageHeader, ElButton, ElCard, ElDialog, ElInput, ElIcon, ElMessage, ElUpload } from 'element-plus';
import { SuccessFilled, Aim, Picture, Upload, Camera, Delete, WarningFilled } from '@element-plus/icons-vue';

const router = useRouter();

// 状态控制
const taskStarted = ref(false);
const outboundStarted = ref(false);
const orderLoading = ref(false);

// 扫描页面数据
const outboundCode = ref('');

// 任务页面数据
const trainNumber = ref('');

// 订单列表
const orderList = reactive([]);

// 扫描对话框
const showScanDialog = ref(false);
const scannedCode = ref('');
const scanType = ref(null);
const currentScanningOrder = ref(null);
const scanInputLabel = ref('');
const scanInputRef = ref(null);

// 拍照上传相关
const showPhotoDialog = ref(false);
const showCameraDialog = ref(false);
const photoList = ref([]);
const hasCamera = ref(true);
const videoRef = ref(null);
const uploadRef = ref(null);
let mediaStream = null;

// 随机生成虚拟号码
const generateVirtualCode = () => {
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  outboundCode.value = `T${year}${month}${day}${randomNum}`;
};

// 处理扫描出库单
const handleScanOutbound = () => {
  if (!outboundCode.value) {
    ElMessage.warning('请输入出库单号');
    return;
  }
  
  // 模拟验证成功
  ElMessage.success('出库单扫描成功');
  taskStarted.value = true;
  
  // 设置车次号（从出库单号中提取）
  trainNumber.value = outboundCode.value;
};

// 开始出库流程
const startOutbound = () => {
  console.log(`开始为车次 ${trainNumber.value} 进行出库操作`);
  outboundStarted.value = true;
  orderList.length = 0;
  fetchOrderData();
};

// 获取订单数据
const fetchOrderData = async () => {
  orderLoading.value = true;
  console.log('正在获取订单数据...');
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockData = [
      { palletCode: 'PLT001', orderNumber: 'ORD1001', originalLocation: 'A1-01', status: 'completed' },
      { palletCode: 'PLT002', orderNumber: 'ORD1002', originalLocation: 'A1-02', status: 'pending' },
      { palletCode: 'PLT003', orderNumber: 'ORD1003', originalLocation: 'C3-10', status: 'pending' },
      { palletCode: 'PLT004', orderNumber: 'ORD1004', originalLocation: 'C3-11', status: 'pending' },
      { palletCode: 'PLT005', orderNumber: 'ORD1005', originalLocation: 'E5-20', status: 'pending' },
    ];

    const processedData = mockData.map(order => ({ 
      ...order, 
      palletScanned: false, 
      locationScanned: false,
      dockScanned: false 
    }));
    orderList.push(...processedData);
  } catch (error) {
    console.error('Failed to fetch order list:', error);
    ElMessage.error('加载订单失败');
  } finally {
    orderLoading.value = false;
  }
};

// 状态文本
const getStatusText = (status) => {
  return status === 'pending' ? '待出库' : '已出库';
};

// 返回到扫描页面
const resetToScan = () => {
  taskStarted.value = false;
  outboundStarted.value = false;
  outboundCode.value = '';
};

// 返回到任务页面
const backToTask = () => {
  outboundStarted.value = false;
};

// 返回按钮
const goBack = () => {
  router.back();
};

// 扫描对话框
const openScanDialog = () => {
  showScanDialog.value = true;
  nextTick(() => {
    scanInputRef.value?.focus();
  });
}

// 扫描卡板
const simulateScanPallet = (order) => {
  scanType.value = 'pallet';
  currentScanningOrder.value = order;
  scanInputLabel.value = order.palletCode;
  scannedCode.value = '';
  openScanDialog();
};

// 扫描库位
const simulateScanLocation = (order) => {
  if (!order.palletScanned) {
    ElMessage.warning('请先扫描卡板');
    return;
  }
  scanType.value = 'location';
  currentScanningOrder.value = order;
  scanInputLabel.value = order.originalLocation;
  scannedCode.value = '';
  openScanDialog();
};

// 扫描Dock
const simulateScanDock = (order) => {
  if (!order.palletScanned) {
    ElMessage.warning('请先扫描卡板');
    return;
  }
  scanType.value = 'dock';
  currentScanningOrder.value = order;
  scanInputLabel.value = 'DOCK';
  scannedCode.value = '';
  openScanDialog();
};

// 确认扫描
const confirmScan = () => {
  if (!currentScanningOrder.value || !scanType.value) return;

  const order = currentScanningOrder.value;
  const code = scannedCode.value.trim();

  if (!code) {
    ElMessage.warning('请输入扫描码');
    return;
  }

  let success = false;
  if (scanType.value === 'pallet') {
    if (code === order.palletCode) {
      order.palletScanned = true;
      ElMessage.success('卡板扫描成功');
      success = true;
    } else {
      ElMessage.error('卡板码不匹配');
    }
  } else if (scanType.value === 'location') {
    if (code === order.originalLocation) {
      order.locationScanned = true;
      ElMessage.success('库位扫描成功');
      success = true;
    } else {
      ElMessage.error('库位码不匹配');
    }
  } else if (scanType.value === 'dock') {
    // 对于Dock扫描，简化验证，只要有输入就认为是正确的
    if (code.toUpperCase().startsWith('DOCK')) {
      order.dockScanned = true;
      order.status = 'completed';
      ElMessage.success('Dock扫描成功，出库完成');
      success = true;
    } else {
      ElMessage.error('无效的Dock码，应以DOCK开头');
    }
  }

  if (success) {
    showScanDialog.value = false;
  } else {
    nextTick(() => {
      scanInputRef.value?.select();
    });
  }
};

// 清除扫描对话框
const clearScanDialog = () => {
  scannedCode.value = '';
};

// 计算是否所有订单都已出库
// eslint-disable-next-line
const allCompleted = computed(() => {
  if (orderList.length === 0) return false;
  return orderList.every(order => order.status === 'completed');
});

// 完成出库
const completeOutbound = () => {
  // 打开拍照上传对话框
  showPhotoDialog.value = true;
};

// 处理照片选择
const handlePhotoChange = (file) => {
  if (!file) return;
  
  // 检查文件类型
  if (!file.raw.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件');
    return;
  }
  
  // 检查文件大小，限制为5MB
  if (file.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过5MB');
    return;
  }
  
  // 创建预览URL
  const url = URL.createObjectURL(file.raw);
  
  // 添加到照片列表
  photoList.value.push({
    file: file.raw,
    url
  });
};

// 移除照片
const removePhoto = (index) => {
  // 释放URL占用的资源
  URL.revokeObjectURL(photoList.value[index].url);
  // 从列表中移除
  photoList.value.splice(index, 1);
};

// 拍照功能
const takePhoto = async () => {
  showCameraDialog.value = true;
  
  // 延迟初始化摄像头，确保DOM已渲染
  nextTick(() => {
    initCamera();
  });
};

// 初始化摄像头
const initCamera = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' }, // 优先使用后置摄像头
      audio: false 
    });
    
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      hasCamera.value = true;
    }
  } catch (error) {
    console.error('无法访问摄像头:', error);
    hasCamera.value = false;
    ElMessage.error('无法访问摄像头，请检查浏览器权限设置');
  }
};

// 捕获照片
const capturePhoto = () => {
  if (!videoRef.value || !mediaStream) return;
  
  // 创建Canvas元素来捕获视频帧
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const video = videoRef.value;
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // 在Canvas上绘制当前视频帧
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // 将Canvas转换为Blob
  canvas.toBlob((blob) => {
    // 创建预览URL
    const url = URL.createObjectURL(blob);
    
    // 添加到照片列表
    photoList.value.push({
      file: new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' }),
      url
    });
    
    // 关闭摄像头对话框
    closeCameraDialog();
  }, 'image/jpeg', 0.95);
};

// 关闭摄像头对话框
const closeCameraDialog = () => {
  showCameraDialog.value = false;
  
  // 停止所有视频轨道
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
};

// 提交照片
const submitPhotos = () => {
  if (!photoList.value.length) {
    ElMessage.warning('请至少上传一张凭证照片');
    return;
  }
  
  // 模拟上传
  ElMessage.success({
    message: `成功上传了 ${photoList.value.length} 张凭证照片`,
    duration: 2000
  });
  
  // 关闭对话框
  setTimeout(() => {
    // 清理资源
    photoList.value.forEach(photo => {
      URL.revokeObjectURL(photo.url);
    });
    photoList.value = [];
    showPhotoDialog.value = false;
    
    // 显示完成消息
    ElMessage.success({
      message: `车次 ${trainNumber.value} 出库完成!`,
      duration: 2000
    });
    
    // 可以在这里添加跳转逻辑
  }, 1000);
};

// 取消上传照片
const cancelUpload = () => {
  // 清理资源
  photoList.value.forEach(photo => {
    URL.revokeObjectURL(photo.url);
  });
  photoList.value = [];
  showPhotoDialog.value = false;
};

// 组件卸载时清理资源
onUnmounted(() => {
  // 关闭摄像头
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  
  // 释放所有照片URL
  photoList.value.forEach(photo => {
    URL.revokeObjectURL(photo.url);
  });
});
</script>

<style scoped lang="scss">
/* 外层包裹样式 */
.outbound-view-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 104px);
}

/* 手机外壳样式 */
.phone-mockup {
  width: 390px;
  height: 844px;
  border: 12px solid black;
  border-radius: 50px;
  background-color: #f9f9f9;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  padding: 15px;
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 150px;
    height: 25px;
    background-color: black;
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
    z-index: 2;
  }
}

.phone-screen {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  border-radius: 38px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

/* 扫描页面样式 */
.scan-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 38px;
  overflow: hidden;
}

.scan-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  padding: 20px;
}

.scan-icon {
  font-size: 50px;
  color: var(--el-color-primary);
  margin-bottom: 20px;
}

.scan-text {
  font-size: 18px;
  margin-bottom: 30px;
  color: #606266;
}

.scan-input-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.virtual-code-btn {
  margin-top: 20px;
}

/* 任务页面样式 */
.outbound-container, .outbound-confirm-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 38px;
  overflow: hidden;
  position: relative;
}

.el-page-header {
  background-color: #fff;
  padding: 10px 20px;
  flex-shrink: 0;
  border-bottom: 1px solid #eee;
}

.train-info {
  background-color: #fff;
  padding: 12px;
  margin: 8px;
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light);
  text-align: center;
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 16px;
    color: #303133;
  }
}

.confirm-button-container {
  padding: 8px;
  flex-shrink: 0;
}

.order-data-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 8px 8px 60px 8px;
}

.loading, .no-data {
  text-align: center;
  color: #909399;
  margin-top: 15px;
  font-size: 13px;
}

.order-card {
  margin-bottom: 8px;
  position: relative;

  &.outbound-completed {
    background-color: #f0f9eb;
    border-left: 4px solid var(--el-color-success);
  }

  :deep(.el-card__body) {
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
}

.order-details {
   flex-grow: 1;
}

.order-details p {
  margin: 3px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.4;

  strong {
    color: #303133;
    min-width: 60px;
    display: inline-block;
  }

  .status-pending {
    color: var(--el-color-warning);
    font-weight: bold;
  }
  .status-completed {
    color: var(--el-color-success);
    font-weight: bold;
  }
}

.scan-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  flex-shrink: 0;
}

.completed-indicator {
  display: flex;
  align-items: center;
  color: var(--el-color-success);
  font-weight: bold;
  gap: 4px;
  flex-shrink: 0;
  font-size: 13px;

  .el-icon {
    vertical-align: middle;
    font-size: 16px;
  }
}

/* 将 footer 按钮固定在手机屏幕内部的底部 */
.footer-button-inside-phone {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background-color: #fff;
  box-shadow: 0 -1px 4px rgba(0, 21, 41, 0.08);
  z-index: 10; 
  border-bottom-left-radius: 38px;
  border-bottom-right-radius: 38px;
}

// Dialog 样式
:deep(.el-dialog__body) {
    padding: 15px 20px;
}

:deep(.el-dialog__footer) {
     padding: 10px 20px;
     border-top: 1px solid var(--el-border-color-lighter);
}

/* 手机外壳的响应式样式 */
@media (max-height: 900px) {
  .phone-mockup {
    transform: scale(0.9);
  }
}
@media (max-width: 450px) {
  .outbound-view-wrapper {
      padding: 10px 0;
  }
   .phone-mockup {
    width: 95%;
    height: auto;
    min-height: 600px;
    max-height: 85vh;
    padding: 10px;
    border-width: 10px;
    border-radius: 40px;
     &::before {
       width: 120px;
       height: 20px;
       border-bottom-left-radius: 12px;
       border-bottom-right-radius: 12px;
    }
  }
   .phone-screen {
      border-radius: 30px;
   }
   .outbound-container, .outbound-confirm-container, .scan-container {
       border-radius: 30px;
   }
    .footer-button-inside-phone {
       border-bottom-left-radius: 30px;
       border-bottom-right-radius: 30px;
    }
}

/* 照片上传样式 */
.photo-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 200px;
  background-color: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  
  .el-icon {
    font-size: 48px;
    color: #c0c4cc;
    margin-bottom: 10px;
  }
  
  p {
    color: #909399;
    font-size: 14px;
  }
}

.photo-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

.photo-item {
  position: relative;
  width: calc(50% - 5px);
  padding-bottom: calc(50% - 5px);
  border-radius: 4px;
  overflow: hidden;
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .photo-delete {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 24px;
    height: 24px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    
    .el-icon {
      color: #fff;
      font-size: 16px;
    }
  }
}

.upload-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

/* 摄像头样式 */
.camera-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.camera-video {
  width: 100%;
  max-height: 50vh;
  background-color: #000;
  border-radius: 4px;
}

.camera-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.camera-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  
  .el-icon {
    font-size: 48px;
    color: #f56c6c;
    margin-bottom: 10px;
  }
  
  p {
    color: #606266;
    text-align: center;
  }
}
</style> 