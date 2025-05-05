<template>
  <!-- 包裹层，用于居中显示手机模型 -->
  <div class="stocking-view-wrapper">
    <div class="phone-mockup">
      <div class="phone-screen">
        <!-- 原 StockingConfirm.vue 的内容放在这里 -->
        <div class="stocking-confirm-container-el">
          <el-page-header @back="goBack" content="确认备货">
          </el-page-header>

          <div class="train-info-el">
            <h2>车次号: {{ trainNumber }}</h2>
            <!-- 可以添加更多从上一个页面传递过来的车次信息 -->
          </div>

          <div class="confirm-button-container-el" v-if="!stockingStarted">
            <el-button type="primary" @click="startStocking" style="width: 100%;">确认备货开始</el-button>
          </div>

          <!-- PC/卡板号维度的订单数据区域 -->
          <div v-if="stockingStarted" class="order-data-area-el">
            <p v-if="orderLoading" class="loading-el">加载订单中...</p>
            <el-card 
              shadow="never" 
              v-for="order in orderList" 
              :key="order.palletCode" 
              class="order-card-el" 
              :class="{ 'stocked-el': order.status === 'stocked' }"
            >
              <div class="order-details-el">
                <p><strong>卡板号:</strong> {{ order.palletCode }}</p>
                <p><strong>PC号:</strong> {{ order.orderNumber }}</p>
                <p><strong>原库位:</strong> {{ order.originalLocation }}</p>
                <p><strong>指定库位:</strong> {{ order.targetLocation }}</p>
                <p><strong>状态:</strong> <span :class="`status-${order.status}-el`">{{ getStatusText(order.status) }}</span></p>
              </div>
              <div class="scan-actions-el" v-if="order.status === 'pending'">
                <el-button size="small" type="primary" @click="simulateScanPallet(order)" plain>扫卡板</el-button>
                <el-button size="small" type="warning" @click="simulateScanOriginalLocation(order)" :disabled="!order.palletScanned" plain>扫原库位</el-button>
                <el-button size="small" type="success" @click="simulateScanTargetLocation(order)" :disabled="!order.originalLocationScanned" plain>扫新库位</el-button>
              </div>
              <div v-if="order.status === 'stocked'" class="stocked-indicator-el">
                 <el-icon color="#67C23A" size="18"><SuccessFilled /></el-icon> 已备货
              </div>
            </el-card>
            <p v-if="!orderList.length && !orderLoading" class="no-data-el">没有需要备货的订单</p>
          </div>

           <!-- 模拟扫描输入 Dialog -->
          <el-dialog
             v-model="showScanDialog"
             :title="`扫描${scanType === 'pallet' ? '卡板' : scanType === 'originalLocation' ? '原库位' : '新库位'}: ${scanInputLabel}`"
             width="90%" 
             :append-to-body="true"
             :close-on-click-modal="false"
             @closed="clearScanDialog" 
           >
             <el-input
               v-model="scannedCode"
               :placeholder="`请输入模拟 ${scanType === 'pallet' ? '卡板' : scanType === 'originalLocation' ? '原库位' : '新库位'} 码`"
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

           <!-- 总体备货完成按钮 (修改 v-if 条件) -->
           <div class="footer-button-inside-phone" v-if="stockingStarted"> 
              <el-button type="success" @click="completeStocking" style="width: 100%;">备货完成</el-button>
           </div>

        </div> 
        <!-- 原内容结束 -->
        
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
import { ref, reactive, onMounted, computed, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElPageHeader, ElButton, ElCard, ElDialog, ElInput, ElIcon, ElMessage, ElUpload } from 'element-plus';
import { SuccessFilled, Picture, Upload, Camera, Delete, WarningFilled } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

const trainId = ref(null);
const trainNumber = ref(null);
const stockingStarted = ref(false);

const orderList = reactive([]);
const orderLoading = ref(false);

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

onMounted(() => {
  trainId.value = route.params.trainId;
  trainNumber.value = route.params.trainNumber;

  if (!trainId.value || !trainNumber.value) {
    ElMessage.error('无效的车次信息');
    // router.replace({ name: 'Stocking' });
  }
});

const goBack = () => {
  router.back();
};

const startStocking = () => {
  console.log(`开始为车次 ${trainNumber.value} (ID: ${trainId.value}) 进行备货`);
  stockingStarted.value = true;
  orderList.length = 0;
  fetchOrderData();
};

const fetchOrderData = async () => {
  orderLoading.value = true;
  console.log('正在获取订单数据...');
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockData = [
      { palletCode: 'PLT001', orderNumber: 'ORD1001', originalLocation: 'A1-01', targetLocation: 'B2-05', status: 'stocked' },
      { palletCode: 'PLT002', orderNumber: 'ORD1002', originalLocation: 'A1-02', targetLocation: 'B2-06', status: 'pending' },
      { palletCode: 'PLT003', orderNumber: 'ORD1003', originalLocation: 'C3-10', targetLocation: 'D4-11', status: 'pending' },
      { palletCode: 'PLT004', orderNumber: 'ORD1004', originalLocation: 'C3-11', targetLocation: 'D4-12', status: 'pending' },
      { palletCode: 'PLT005', orderNumber: 'ORD1005', originalLocation: 'E5-20', targetLocation: 'F6-21', status: 'pending' },
    ];

    const processedData = mockData.map(order => ({ 
      ...order, 
      palletScanned: false, 
      originalLocationScanned: false,
      targetLocationScanned: false 
    }));
    orderList.push(...processedData);
  } catch (error) {
    console.error('Failed to fetch order list:', error);
    ElMessage.error('加载订单失败');
  } finally {
    orderLoading.value = false;
  }
};

const getStatusText = (status) => {
  return status === 'pending' ? '待备货' : '已备货';
};

const openScanDialog = () => {
  showScanDialog.value = true;
  nextTick(() => {
    scanInputRef.value?.focus();
  });
}

const simulateScanPallet = (order) => {
  scanType.value = 'pallet';
  currentScanningOrder.value = order;
  scanInputLabel.value = order.palletCode;
  scannedCode.value = '';
  openScanDialog();
};

const simulateScanOriginalLocation = (order) => {
  if (!order.palletScanned) {
    ElMessage.warning('请先扫描卡板');
    return;
  }
  scanType.value = 'originalLocation';
  currentScanningOrder.value = order;
  scanInputLabel.value = order.originalLocation;
  scannedCode.value = '';
  openScanDialog();
};

const simulateScanTargetLocation = (order) => {
  if (!order.originalLocationScanned) {
    ElMessage.warning('请先扫描原库位');
    return;
  }
  scanType.value = 'targetLocation';
  currentScanningOrder.value = order;
  scanInputLabel.value = order.targetLocation;
  scannedCode.value = '';
  openScanDialog();
};

const confirmScan = () => {
  if (!currentScanningOrder.value || !scanType.value) return;

  const order = currentScanningOrder.value;
  const code = scannedCode.value.trim();

  if (!code) {
    ElMessage.warning('请输入扫描码');
    return;
  }

  console.log(`模拟扫描 ${scanType.value}: ${code}`);

  let success = false;
  if (scanType.value === 'pallet') {
    if (code === order.palletCode) {
      order.palletScanned = true;
      ElMessage.success('卡板扫描成功');
      success = true;
    } else {
      ElMessage.error('卡板码不匹配');
    }
  } else if (scanType.value === 'originalLocation') {
    if (code === order.originalLocation) {
      order.originalLocationScanned = true;
      ElMessage.success('原库位扫描成功');
      success = true;
    } else {
      ElMessage.error('原库位码不匹配');
    }
  } else if (scanType.value === 'targetLocation') {
    if (code === order.targetLocation) {
      order.targetLocationScanned = true;
      order.status = 'stocked';
      ElMessage.success('新库位扫描成功，备货完成');
      success = true;
    } else {
      ElMessage.error('新库位码不匹配');
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

const clearScanDialog = () => {
  scannedCode.value = '';
};

// eslint-disable-next-line
const allStocked = computed(() => {
  if (orderList.length === 0) return false;
  return orderList.every(order => order.status === 'stocked');
});

const completeStocking = () => {
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

// 取消上传照片
const cancelUpload = () => {
  // 清理资源
  photoList.value.forEach(photo => {
    URL.revokeObjectURL(photo.url);
  });
  photoList.value = [];
  showPhotoDialog.value = false;
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
      message: `车次 ${trainNumber.value} 备货完成!`,
      duration: 2000
    });
    
    // 可以在这里添加跳转逻辑
  }, 1000);
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
.stocking-view-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 104px); // Adjust based on your layout
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

/* 原 StockingConfirm.vue 的样式，作用于手机屏幕内部 */
.stocking-confirm-container-el {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* background-color: #f0f2f5; */
  border-radius: 38px;
  overflow: hidden; 
  position: relative; // Needed for absolute positioning of footer
}

.el-page-header {
  background-color: #fff;
  padding: 10px 20px;
  // box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  flex-shrink: 0;
  border-bottom: 1px solid #eee;
}

.train-info-el {
  background-color: #fff;
  padding: 12px; // 减少 padding
  margin: 8px;   // 减少 margin
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light);
  text-align: center;
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 16px; // 减小字体
    color: #303133;
  }
}

.confirm-button-container-el {
  padding: 8px; // 减少 padding
  flex-shrink: 0;
}

.order-data-area-el {
  flex-grow: 1;
  overflow-y: auto;
  padding: 8px 8px 60px 8px; // 调整 padding, 增加底部 padding 为按钮留空间
}

.loading-el, .no-data-el {
  text-align: center;
  color: #909399;
  margin-top: 15px;
  font-size: 13px; // 减小字体
}

.order-card-el {
  margin-bottom: 8px;
  position: relative;

  &.stocked-el {
    background-color: #f0f9eb;
    border-left: 4px solid var(--el-color-success);
  }

  :deep(.el-card__body) {
    padding: 10px 12px; // 减少卡片内边距
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px; // 增加内容和按钮间距
  }
}

.order-details-el {
   flex-grow: 1; // 让详情区域占据更多空间
}

.order-details-el p {
  margin: 3px 0; // 减少行间距
  font-size: 13px; // 减小字体
  color: #606266;
  line-height: 1.4;

  strong {
    color: #303133;
    min-width: 60px; // 减小宽度
    display: inline-block;
  }

  .status-pending-el {
    color: var(--el-color-warning);
    font-weight: bold;
  }
  .status-stocked-el {
    color: var(--el-color-success);
    font-weight: bold;
  }
}

.scan-actions-el {
  display: flex;
  flex-direction: column;
  gap: 6px; // 减少按钮间距
  align-items: flex-end;
  flex-shrink: 0;
  // margin-left: 10px;
}

.stocked-indicator-el {
  display: flex;
  align-items: center;
  color: var(--el-color-success);
  font-weight: bold;
  gap: 4px; // 减少间距
  flex-shrink: 0;
 //  margin-left: 10px;
   font-size: 13px; // 减小字体

  .el-icon {
    vertical-align: middle;
    font-size: 16px; // 调整图标大小
  }
}

/* 将 footer 按钮固定在手机屏幕内部的底部 */
.footer-button-inside-phone {
  position: absolute; // 相对于 .stocking-confirm-container-el 定位
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px; // 减少 padding
  background-color: #fff;
  box-shadow: 0 -1px 4px rgba(0, 21, 41, 0.08);
  z-index: 10; 
  border-bottom-left-radius: 38px; // 匹配屏幕圆角
  border-bottom-right-radius: 38px;
}

// Dialog 样式保持不变
:deep(.el-dialog__body) {
    padding: 15px 20px;
}

:deep(.el-dialog__footer) {
     padding: 10px 20px;
     border-top: 1px solid var(--el-border-color-lighter);
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

/* 手机外壳的响应式样式 */
@media (max-height: 900px) {
  .phone-mockup {
    transform: scale(0.9);
  }
}
@media (max-width: 450px) {
  .stocking-view-wrapper {
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
   .stocking-confirm-container-el {
       border-radius: 30px;
   }
    .footer-button-inside-phone {
       border-bottom-left-radius: 30px;
       border-bottom-right-radius: 30px;
    }
}
</style> 