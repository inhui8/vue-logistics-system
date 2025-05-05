<template>
  <div class="driver-app-container">
    <div class="phone-mockup">
      <div class="phone-screen">
        <!-- Header -->
        <div class="app-header">
          <!-- 返回按钮放在最左侧 -->
          <button v-if="showScan || showDetails" @click="goBack" class="back-button">&lt; {{ i18n.back }}</button>
          
          <!-- 标题居中 -->
          <div class="header-title">
            <span v-if="!showScan && !showDetails">{{ i18n.headerTitle }}</span>
            <span v-if="showScan">{{ i18n.scanTitle }}</span>
            <span v-if="showDetails">{{ i18n.detailsTitle }} - {{ currentDispatch.trainNumber }}</span>
          </div>
          
          <!-- 语言切换按钮放在最右侧 -->
          <div class="language-switch">
            <el-button type="text" size="small" @click="toggleLanguage">
              {{ currentLanguage === 'zh' ? 'EN' : '中' }}
            </el-button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="app-content">
          <!-- Initial View -->
          <div v-if="!showScan && !showDetails" class="home-view">
            <h2>{{ i18n.welcome }}</h2>
            <el-button type="primary" size="large" @click="goToScan" class="dispatch-button">
              <i class="el-icon-camera" style="margin-right: 8px;"></i> {{ i18n.vehicleDispatch }}
            </el-button>
            <!-- 可以添加其他功能入口 -->
          </div>

          <!-- Scan View -->
          <div v-if="showScan" class="scan-view">
            <p>{{ i18n.scanQrCodeTip }}</p>
            <div class="scanner-placeholder">
              <i class="el-icon-camera-solid scanner-icon"></i>
              <div class="scan-line"></div>
            </div>
            <el-button type="success" @click="simulateScan" style="margin-top: 20px;">
              {{ i18n.simulateScanSuccess }}
            </el-button>
          </div>

          <!-- Details View -->
          <div v-if="showDetails" class="details-view">
            <div class="details-list-container">
              <div class="dispatch-header-info">
                <p><strong>{{ i18n.dispatchNumber }}:</strong> {{ currentDispatch.trainNumber }}</p>
                <p><strong>{{ i18n.supplier }}:</strong> {{ currentDispatch.supplier || '-' }}</p>
                <p><strong>{{ i18n.loadingCompletion }}:</strong> {{ currentDispatch.loadingCompletionTime || '-' }}</p>
                <p><strong>{{ i18n.loadingType }}:</strong> {{ currentDispatch.dispatchLoadingType || '-' }}</p>
                <p><strong>{{ i18n.deliveryType }}:</strong> {{ currentDispatch.dispatchDeliveryType || '-' }}</p>
                <p><strong>{{ i18n.pickupStatus }}:</strong>
                   <el-tag :type="dispatchPickupStatus === i18n.pickedUp ? 'success' : 'warning'" size="small">{{ dispatchPickupStatus }}</el-tag>
                </p>
                <p v-if="firstPickupTime"><strong>{{ i18n.firstPickup }}:</strong> {{ firstPickupTime }}</p>
              </div>

              <!-- Updated: Batch Actions Area -->
              <div class="batch-actions">
                 <!-- New: Batch Confirm Pickup Button -->
                <el-button
                  v-if="batchableOrdersInfo" 
                  type="warning"
                  plain
                  size="small"
                  @click="handleBatchConfirmPickup"
                  style="margin-left: 10px;"
                >
                  {{ i18n.batchConfirmPickup }}
                </el-button>
                 <!-- Adjusted: Batch Mark Departed Button -->
                <el-button
                  v-if="batchableDepartureInfo"
                  type="primary"
                  plain
                  size="small"
                  @click="handleBatchDepart"
                  style="margin-left: 10px;"
                >
                  {{ i18n.batchMarkDepart }}
                </el-button>
              </div>

              <div class="dispatch-list">
                <div v-for="item in currentDispatch.orders" :key="item.pcNumber" class="dispatch-item" :class="{ 'has-exception': item.hasException }">
                  <div class="item-info">
                    <p class="pc-info-line">
                      <span><strong>{{ i18n.pcNumber }}:</strong> {{ item.pcNumber }}</span>
                      <span class="pc-tags">
                        <el-tag size="mini" type="info" effect="light">P{{ item.priority }}</el-tag>
                        <el-tag size="mini" :type="item.pcLoadingType === '卡板' ? 'primary' : 'success'" effect="light">
                          {{ item.pcLoadingType === '卡板' ? (currentLanguage === 'zh' ? '卡板' : 'Pallet') : 
                             item.pcLoadingType === '地板' ? (currentLanguage === 'zh' ? '地板' : 'Floor Loading') : 
                             item.pcLoadingType }}
                        </el-tag>
                      </span>
                    </p>
                    <p><strong>{{ i18n.originWarehouse }}:</strong> {{ item.originWarehouse }}</p>
                    <p class="address-info">{{ i18n.address }}: {{ item.originAddress || i18n.noAddress }}</p>
                    <p><strong>{{ i18n.destination }}:</strong> {{ item.destination }}</p>
                    <p class="address-info">{{ i18n.address }}: {{ item.destinationAddress || i18n.noAddress }}</p>
                    <p v-if="item.pcLoadingType === i18n.palletType"><strong>{{ i18n.palletCount }}:</strong> {{ item.quantity }}</p>
                    <p v-if="item.pcLoadingType === i18n.floorType"><strong>{{ i18n.boxCount }}:</strong> {{ item.quantity }}</p>
                    <p v-if="item.pickupTime" class="pickup-time"><strong>{{ i18n.pickup }}:</strong> {{ item.pickupTime }}</p>
                    <p v-if="item.departureTime" class="departure-time"><strong>{{ i18n.departure }}:</strong> {{ item.departureTime }}</p>
                    <el-tag v-if="item.hasException" type="danger" size="small" effect="dark" style="margin-top: 5px;">{{ i18n.exception }}</el-tag>
                  </div>
                  <div class="item-actions">
                    <el-button
                      v-if="item.status === 'pending'"
                      type="warning"
                      plain
                      size="small"
                      @click="showPickupConfirmationDialog(item)"
                    >
                      {{ i18n.confirmPickup }}
                    </el-button>
                    <el-button
                      v-if="item.status === 'pickup_confirmed'"
                      type="info"
                      size="small"
                      @click="markDeparted(item)"
                    >
                      {{ i18n.markDepart }}
                    </el-button>
                    <el-button
                      v-if="item.status === 'picked_up'"
                      type="primary"
                      size="small"
                      @click="markDelivered(item)"
                    >
                      {{ i18n.delivered }}
                    </el-button>
                    <el-button
                      v-if="item.status === 'delivered'"
                      type="warning"
                      size="small"
                      @click="uploadPOD(item)"
                    >
                      {{ i18n.uploadPOD }}
                    </el-button>
                    <el-tag v-if="item.status === 'pod_uploaded'" type="success" size="small">{{ i18n.podUploaded }}</el-tag>
                    <el-button
                      v-if="item.status !== 'pod_uploaded'"
                      type="danger"
                      plain
                      size="small"
                      @click="handleMarkException(item)"
                      style="margin-top: 5px;"
                    >
                      {{ i18n.markException }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <div class="details-footer">
              <el-button
                type="success"
                size="large"
                :disabled="!allTasksCompleted"
                @click="completeCurrentDispatch"
                class="complete-dispatch-button"
              >
                {{ i18n.allTasksCompleted }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- Footer/Nav (Optional) -->
        <!-- <div class="app-footer"></div> -->
      </div>
    </div>

    <!-- POD Upload Dialog (模拟) -->
     <el-dialog :title="i18n.uploadPODTitle" v-model="podDialogVisible" width="90%">
       <p>{{ i18n.uploadPODDesc }} <strong>{{ currentPodItem?.pcNumber }}</strong> {{ i18n.uploadPODDesc2 }}</p>
       <el-upload
         class="upload-demo"
         action="#"
         :http-request="handleDummyUpload"
         :on-success="handlePodUploadSuccess"
         :before-upload="beforePodUpload"
         multiple
         :limit="1"
         :on-exceed="handleExceed"
       >
         <el-button type="primary">{{ i18n.clickUpload }}</el-button>
         <template #tip>
           <div class="el-upload__tip">
             {{ i18n.uploadTip }}
           </div>
         </template>
       </el-upload>
       <template #footer>
         <span class="dialog-footer">
           <el-button @click="podDialogVisible = false">{{ i18n.cancel }}</el-button>
           <el-button type="primary" @click="confirmPodUpload">{{ i18n.confirmUpload }}</el-button>
         </span>
       </template>
     </el-dialog>

    <!-- 新增：跟进/异常记录 Dialog -->
    <el-dialog :title="i18n.followUpTitle" v-model="followUpDialogVisible" width="90%">
      <el-form :model="followUpForm" label-position="top">
        <el-form-item :label="i18n.followUpDesc">
          <el-input
            v-model="followUpForm.content"
            type="textarea"
            :rows="4"
            :placeholder="i18n.enterDetailDesc"
          ></el-input>
        </el-form-item>
        <el-form-item :label="i18n.type">
           <el-radio-group v-model="followUpForm.type">
             <el-radio label="primary">{{ i18n.regularFollowUp }}</el-radio>
             <el-radio label="warning">{{ i18n.importantReminder }}</el-radio>
             <el-radio label="danger">{{ i18n.exceptionReport }}</el-radio>
           </el-radio-group>
        </el-form-item>
        <el-form-item :label="i18n.uploadAttachment">
          <el-upload
            class="upload-demo"
            action="#"
            :http-request="handleFollowUpUpload"
            :before-upload="beforeFollowUpUpload"
            :on-remove="handleFollowUpRemove"
            :file-list="followUpForm.files"
            multiple
            :limit="3"
          >
            <el-button type="primary">{{ i18n.clickUpload }}</el-button>
            <template #tip>
              <div class="el-upload__tip">
                {{ i18n.maxThreeFiles }}
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="followUpDialogVisible = false">{{ i18n.cancel }}</el-button>
          <el-button type="primary" @click="saveFollowUp">{{ i18n.confirmSave }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- NEW: Pickup Confirmation Dialog -->
    <el-dialog :title="i18n.pickupConfirmTitle" v-model="pickupConfirmationDialogVisible" width="90%" :close-on-click-modal="false">
      <div v-if="currentItemForPickup" class="pickup-confirm-dialog-content">
        <p><strong>{{ i18n.pcNumber }}:</strong> {{ currentItemForPickup.pcNumber }}</p>
        <p><strong>{{ i18n.pickupWarehouse }}:</strong> {{ currentItemForPickup.originWarehouse }}</p>
        <p style="margin-top: 20px;">{{ i18n.confirmPickupQuestion }}</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pickupConfirmationDialogVisible = false">{{ i18n.no }}</el-button>
          <el-button type="primary" @click="confirmActualPickup">{{ i18n.yes }}</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'DriverDispatch',
  setup() {
    const showScan = ref(false);
    const showDetails = ref(false);
    const podDialogVisible = ref(false);
    const currentPodItem = ref(null);
    const uploadedFile = ref(null);
    const followUpDialogVisible = ref(false);
    const currentFollowUpItem = ref(null);
    const pickupConfirmationDialogVisible = ref(false);
    const currentItemForPickup = ref(null);
    
    const followUpForm = reactive({
      content: '',
      type: 'primary',
      files: []
    });
    
    // 添加语言切换相关的状态
    const currentLanguage = ref('zh'); // 默认中文
    
    // 国际化文本
    const i18n = computed(() => {
      return currentLanguage.value === 'zh' ? {
        // 中文
        headerTitle: '司机助手',
        scanTitle: '扫描派送单',
        detailsTitle: '派送详情',
        back: '返回',
        welcome: '欢迎，司机师傅！',
        vehicleDispatch: '车辆派送',
        scanQrCodeTip: '请扫描派送单上的二维码',
        simulateScanSuccess: '模拟扫码成功',
        
        // 派送详情页
        dispatchNumber: '派送号',
        supplier: '供应商',
        loadingCompletion: '装货完成',
        loadingType: '装车类型',
        deliveryType: '派送类型',
        pickupStatus: '提货状态',
        pickedUp: '已提货',
        notPickedUp: '未提货',
        firstPickup: '首单提货',
        
        // 批量操作
        batchConfirmPickup: '批量确认提货',
        batchMarkDepart: '批量标记出发',
        
        // 订单项标签
        pcNumber: 'PC号',
        palletType: '卡板',
        floorType: '地板',
        originWarehouse: '起运仓',
        address: '地址',
        noAddress: '暂无地址',
        destination: '目的地',
        palletCount: '板数',
        boxCount: '箱数',
        pickup: '提货',
        departure: '出发',
        exception: '异常',
        
        // 操作按钮
        confirmPickup: '确认提货',
        markDepart: '标记出发',
        delivered: '已送达',
        uploadPOD: '上传POD',
        podUploaded: 'POD已上传',
        markException: '标记异常',
        allTasksCompleted: '全部派送完成',
        
        // 对话框
        uploadPODTitle: '上传 POD',
        uploadPODDesc: '请为 PC号',
        uploadPODDesc2: '上传签收凭证。',
        clickUpload: '点击上传',
        uploadTip: '请上传图片文件 (jpg/png)，大小不超过 5MB',
        cancel: '取消',
        confirmUpload: '确认上传',
        
        followUpTitle: '跟进/异常记录',
        followUpDesc: '跟进内容/异常描述',
        enterDetailDesc: '请输入详细描述',
        type: '类型',
        regularFollowUp: '常规跟进',
        importantReminder: '重要提醒',
        exceptionReport: '异常上报',
        uploadAttachment: '上传附件 (图片/文件)',
        maxThreeFiles: '最多上传3个文件, 单个不超过 10MB',
        confirmSave: '确定保存',
        
        pickupConfirmTitle: '提货确认',
        pickupWarehouse: '提货仓库',
        confirmPickupQuestion: '是否确认已完成提货？',
        yes: '是',
        no: '否',
      } : {
        // 英文
        headerTitle: 'Driver Assistant',
        scanTitle: 'Scan Dispatch Order',
        detailsTitle: 'Dispatch Details',
        back: 'Back',
        welcome: 'Welcome, Driver!',
        vehicleDispatch: 'Vehicle Dispatch',
        scanQrCodeTip: 'Please scan the QR code on the dispatch order',
        simulateScanSuccess: 'Simulate Scan Success',
        
        // 派送详情页
        dispatchNumber: 'Dispatch No',
        supplier: 'Supplier',
        loadingCompletion: 'Loading Completed',
        loadingType: 'Loading Type',
        deliveryType: 'Delivery Type',
        pickupStatus: 'Pickup Status',
        pickedUp: 'Picked Up',
        notPickedUp: 'Not Picked Up',
        firstPickup: 'First Pickup',
        
        // 批量操作
        batchConfirmPickup: 'Batch Confirm Pickup',
        batchMarkDepart: 'Batch Mark Departure',
        
        // 订单项标签
        pcNumber: 'PC No',
        palletType: 'Pallet',
        floorType: 'Floor Loading',
        originWarehouse: 'Origin Warehouse',
        address: 'Address',
        noAddress: 'No Address',
        destination: 'Destination',
        palletCount: 'Pallet Count',
        boxCount: 'Box Count',
        pickup: 'Pickup',
        departure: 'Departure',
        exception: 'Exception',
        
        // 操作按钮
        confirmPickup: 'Confirm Pickup',
        markDepart: 'Mark Departure',
        delivered: 'Delivered',
        uploadPOD: 'Upload POD',
        podUploaded: 'POD Uploaded',
        markException: 'Mark Exception',
        allTasksCompleted: 'All Tasks Completed',
        
        // 对话框
        uploadPODTitle: 'Upload POD',
        uploadPODDesc: 'Please upload the receipt for PC No',
        uploadPODDesc2: '.',
        clickUpload: 'Click to Upload',
        uploadTip: 'Please upload image files (jpg/png), size < 5MB',
        cancel: 'Cancel',
        confirmUpload: 'Confirm Upload',
        
        followUpTitle: 'Follow-up/Exception Record',
        followUpDesc: 'Follow-up Content/Exception Description',
        enterDetailDesc: 'Please enter detailed description',
        type: 'Type',
        regularFollowUp: 'Regular Follow-up',
        importantReminder: 'Important Reminder',
        exceptionReport: 'Exception Report',
        uploadAttachment: 'Upload Attachments (Images/Files)',
        maxThreeFiles: 'Maximum 3 files, each less than 10MB',
        confirmSave: 'Confirm Save',
        
        pickupConfirmTitle: 'Pickup Confirmation',
        pickupWarehouse: 'Pickup Warehouse',
        confirmPickupQuestion: 'Confirm that pickup has been completed?',
        yes: 'Yes',
        no: 'No',
      };
    });
    
    // 切换语言方法
    const toggleLanguage = () => {
      currentLanguage.value = currentLanguage.value === 'zh' ? 'en' : 'zh';
    };

    const currentDispatch = reactive({
      trainNumber: '',
      dispatchLoadingType: '',
      dispatchDeliveryType: '',
      supplier: '',
      loadingCompletionTime: '',
      orders: []
    });

    const mockDispatchData = {
      'SCAN_RESULT_123': {
        trainNumber: 'TRK-SH-LA-001',
        dispatchLoadingType: '混装',
        dispatchDeliveryType: '一提多卸',
        supplier: 'ABC 物流公司',
        loadingCompletionTime: '2024-07-27 10:00 AM',
        orders: [
          { pcNumber: 'PC20240726001', originWarehouse: '上海仓', originAddress: '上海市浦东新区XXX路100号', destination: '洛杉矶客户A', destinationAddress: '123 Main St, Los Angeles, CA 90001', pcLoadingType: '卡板', quantity: 5, status: 'pending', hasException: false, priority: 2, pickupTime: null, departureTime: null },
          { pcNumber: 'PC20240726002', originWarehouse: '上海仓', originAddress: '上海市浦东新区XXX路100号', destination: '洛杉矶客户B', destinationAddress: '456 Industrial Ave, Los Angeles, CA 90021', pcLoadingType: '地板', quantity: 30, status: 'picked_up', hasException: false, priority: 1, pickupTime: '2024-07-27 11:00 AM', departureTime: '2024-07-27 11:05 AM' },
          { pcNumber: 'PC20240726003', originWarehouse: '洛杉矶仓', originAddress: '789 Port Rd, Long Beach, CA 90802', destination: '洛杉矶客户C', destinationAddress: '101 Commerce Dr, City of Industry, CA 91744', pcLoadingType: '卡板', quantity: 8, status: 'pending', hasException: false, priority: 3, pickupTime: null, departureTime: null },
          { pcNumber: 'PC20240726004', originWarehouse: '上海仓', originAddress: '上海市浦东新区XXX路100号', destination: '洛杉矶客户D', destinationAddress: '789 Sunset Blvd, Los Angeles, CA 90046', pcLoadingType: '卡板', quantity: 3, status: 'pickup_confirmed', hasException: false, priority: 4, pickupTime: '2024-07-27 11:15 AM', departureTime: null },
          { pcNumber: 'PC20240726005', originWarehouse: '上海仓', originAddress: '上海市浦东新区XXX路100号', destination: '洛杉矶客户E', destinationAddress: '111 Beverly Hills Dr, CA 90210', pcLoadingType: '地板', quantity: 15, status: 'pending', hasException: false, priority: 5, pickupTime: null, departureTime: null },
          { pcNumber: 'PC20240726006', originWarehouse: '上海仓', originAddress: '上海市浦东新区XXX路100号', destination: '洛杉矶客户F', destinationAddress: '222 Hollywood Blvd, CA 90028', pcLoadingType: '卡板', quantity: 7, status: 'pickup_confirmed', hasException: false, priority: 6, pickupTime: '2024-07-27 11:20 AM', departureTime: null },
        ]
      },
    };

    const goToScan = () => {
      showScan.value = true;
      showDetails.value = false;
      currentDispatch.trainNumber = '';
      currentDispatch.dispatchLoadingType = '';
      currentDispatch.dispatchDeliveryType = '';
      currentDispatch.supplier = '';
      currentDispatch.loadingCompletionTime = '';
      currentDispatch.orders = [];
    };

    const goBack = () => {
      if (showDetails.value) {
        showDetails.value = false;
        showScan.value = true;
        currentDispatch.trainNumber = '';
        currentDispatch.dispatchLoadingType = '';
        currentDispatch.dispatchDeliveryType = '';
        currentDispatch.supplier = '';
        currentDispatch.loadingCompletionTime = '';
        currentDispatch.orders = [];
      } else if (showScan.value) {
        showScan.value = false;
      }
    };

    const simulateScan = () => {
      const scanKey = 'SCAN_RESULT_123';
      const scannedData = mockDispatchData[scanKey];

      if (scannedData) {
        currentDispatch.trainNumber = scannedData.trainNumber;
        currentDispatch.dispatchLoadingType = scannedData.dispatchLoadingType;
        currentDispatch.dispatchDeliveryType = scannedData.dispatchDeliveryType;
        currentDispatch.supplier = scannedData.supplier;
        currentDispatch.loadingCompletionTime = scannedData.loadingCompletionTime;
        currentDispatch.orders = scannedData.orders
          .map(o => ({...o, hasException: o.hasException || false, pickupTime: o.pickupTime || null, departureTime: o.departureTime || null, originAddress: o.originAddress || '', destinationAddress: o.destinationAddress || '' }))
          .sort((a, b) => a.priority - b.priority);

        showScan.value = false;
        showDetails.value = true;

      } else {
        ElMessage.error('无效的派送单');
      }
    };

    const showPickupConfirmationDialog = (item) => {
      currentItemForPickup.value = item;
      pickupConfirmationDialogVisible.value = true;
    };

    const confirmActualPickup = () => {
      if (!currentItemForPickup.value) return;

      const pcNumberToUpdate = currentItemForPickup.value.pcNumber;
      const orderIndex = currentDispatch.orders.findIndex(o => o.pcNumber === pcNumberToUpdate);

      if (orderIndex !== -1 && currentDispatch.orders[orderIndex].status === 'pending') {
        const now = new Date().toLocaleString();
        const updatedOrder = {
          ...currentDispatch.orders[orderIndex],
          status: 'pickup_confirmed',
          pickupTime: now
        };
        currentDispatch.orders.splice(orderIndex, 1, updatedOrder);
        ElMessage.success(currentLanguage.value === 'zh' 
          ? `PC ${pcNumberToUpdate} 已确认提货` 
          : `PC ${pcNumberToUpdate} pickup confirmed`);
      } else {
        ElMessage.warning(currentLanguage.value === 'zh' 
          ? '无法确认提货，订单状态不正确或未找到' 
          : 'Unable to confirm pickup, order status incorrect or not found');
      }

      pickupConfirmationDialogVisible.value = false;
      currentItemForPickup.value = null;
    };

    const markDeparted = (item) => {
      const confirmText = currentLanguage.value === 'zh' 
        ? `确认 PC ${item.pcNumber} 已出发吗？` 
        : `Confirm PC ${item.pcNumber} has departed?`;
      const title = currentLanguage.value === 'zh' ? '标记出发' : 'Mark Departure';
      const confirmButtonText = currentLanguage.value === 'zh' ? '确定已出发' : 'Confirm Departure';
      const cancelButtonText = currentLanguage.value === 'zh' ? '取消' : 'Cancel';
      
      ElMessageBox.confirm(confirmText, title, {
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
        type: 'info',
      }).then(() => {
         const orderIndex = currentDispatch.orders.findIndex(o => o.pcNumber === item.pcNumber);
         if (orderIndex !== -1 && currentDispatch.orders[orderIndex].status === 'pickup_confirmed') {
           const updatedOrder = {
             ...currentDispatch.orders[orderIndex],
             status: 'picked_up',
             departureTime: new Date().toLocaleString()
           };
           currentDispatch.orders.splice(orderIndex, 1, updatedOrder);
           const successMsg = currentLanguage.value === 'zh' 
             ? `PC ${item.pcNumber} 已标记为出发` 
             : `PC ${item.pcNumber} marked as departed`;
           ElMessage.success(successMsg);
         }
       }).catch(() => {
         console.log(currentLanguage.value === 'zh' ? '标记出发操作已取消。' : 'Mark departure operation canceled.');
       });
    };

    const markDelivered = (item) => {
       const confirmText = currentLanguage.value === 'zh' 
         ? `确认将 PC ${item.pcNumber} 标记为已送达吗？` 
         : `Confirm marking PC ${item.pcNumber} as delivered?`;
       const title = currentLanguage.value === 'zh' ? '提示' : 'Confirm';
       const confirmButtonText = currentLanguage.value === 'zh' ? '确定' : 'Confirm';
       const cancelButtonText = currentLanguage.value === 'zh' ? '取消' : 'Cancel';
       
       ElMessageBox.confirm(confirmText, title, {
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
        type: 'warning',
      }).then(() => {
         const orderIndex = currentDispatch.orders.findIndex(o => o.pcNumber === item.pcNumber);
         if (orderIndex !== -1 && currentDispatch.orders[orderIndex].status === 'picked_up') {
             const updatedOrder = {
               ...currentDispatch.orders[orderIndex],
               status: 'delivered'
             };
             currentDispatch.orders.splice(orderIndex, 1, updatedOrder);
           const successMsg = currentLanguage.value === 'zh' 
             ? `PC ${item.pcNumber} 已标记为送达` 
             : `PC ${item.pcNumber} marked as delivered`;
           ElMessage.success(successMsg);
         }
       }).catch(() => {
         console.log(currentLanguage.value === 'zh' ? '标记送达操作已取消。' : 'Mark delivered operation canceled.');
       });
    };

    const uploadPOD = (item) => {
      currentPodItem.value = item;
      uploadedFile.value = null;
      podDialogVisible.value = true;
    };

     const handleDummyUpload = (options) => {
       const { file } = options;
       if (beforePodUpload(file)) {
          uploadedFile.value = file;
          ElMessage.info(`已选择文件: ${file.name}，请点击确认上传`);
          options.onSuccess(file);
       } else {
         options.onError(new Error('文件验证失败'));
       }
     };

     const confirmPodUpload = () => {
       if (!uploadedFile.value) {
         ElMessage.warning('请先选择要上传的文件');
         return;
       }
       if (!currentPodItem.value) return;

       console.log('开始上传文件:', uploadedFile.value.name, '给PC:', currentPodItem.value.pcNumber);
       new Promise((resolve) => setTimeout(resolve, 1500))
         .then(() => {
           console.log('模拟上传成功');
            const orderIndex = currentDispatch.orders.findIndex(o => o.pcNumber === currentPodItem.value.pcNumber);
             if (orderIndex !== -1 && currentDispatch.orders[orderIndex].status === 'delivered') {
                 const updatedOrder = {
                   ...currentDispatch.orders[orderIndex],
                   status: 'pod_uploaded'
                 };
                 currentDispatch.orders.splice(orderIndex, 1, updatedOrder);
               ElMessage.success('POD 上传成功！');
             } else {
                ElMessage.warning('无法上传POD，订单状态不正确或未找到');
             }
           podDialogVisible.value = false;
           currentPodItem.value = null;
           uploadedFile.value = null;
         })
         .catch(error => {
           console.error('模拟POD上传时出错:', error);
           ElMessage.error('POD 上传过程中出现错误');
         });
     };

     const handlePodUploadSuccess = (response, file, fileList) => {
       console.log("File selected/dummy success:", file.name, fileList);
     };

     const beforePodUpload = (file) => {
       const isImage = file.type === 'image/jpeg' || file.type === 'image/png';
       const isLt5M = file.size / 1024 / 1024 < 5;

       if (!isImage) {
         ElMessage.error('上传文件只能是 JPG/PNG 格式!');
       }
       if (!isLt5M) {
         ElMessage.error('上传文件大小不能超过 5MB!');
       }
       return isImage && isLt5M;
     };

     const handleExceed = (files, fileList) => {
        ElMessage.warning(`当前限制选择 1 个文件。您选择了 ${files.length + fileList.length} 个。`);
     };

     const handleMarkException = (item) => {
       currentFollowUpItem.value = item;
       followUpForm.content = '';
       followUpForm.type = 'danger';
       followUpForm.files = [];
       followUpDialogVisible.value = true;
     };

     const handleFollowUpUpload = (options) => {
       const { file } = options;
       if (beforeFollowUpUpload(file)) {
          ElMessage.success(`${file.name} 文件已选择`);
       } else {
         console.log('文件验证未通过:', file.name);
       }
     };

     const beforeFollowUpUpload = (file) => {
       const isLt10M = file.size / 1024 / 1024 < 10;
       if (!isLt10M) {
         ElMessage.error('上传文件大小不能超过 10MB!');
         return false;
       }
       return true;
     };

     const handleFollowUpRemove = (file, fileList) => {
       followUpForm.files = fileList;
       console.log('Removed file:', file.name);
     };

     const saveFollowUp = () => {
       if (!followUpForm.content) {
         ElMessage.warning('请输入跟进内容或异常描述');
         return;
       }
       if (!currentFollowUpItem.value) return;

       console.log('Saving follow-up for:', currentFollowUpItem.value.pcNumber);
       console.log('Content:', followUpForm.content);
       console.log('Type:', followUpForm.type);
       console.log('Files:', followUpForm.files.map(f => f.name));

       if (followUpForm.type === 'danger') {
          const orderIndex = currentDispatch.orders.findIndex(o => o.pcNumber === currentFollowUpItem.value.pcNumber);
           if (orderIndex !== -1) {
             const updatedOrder = {
               ...currentDispatch.orders[orderIndex],
               hasException: true
             };
             currentDispatch.orders.splice(orderIndex, 1, updatedOrder);
            ElMessage.success('异常已上报并记录');
           } else {
               ElMessage.warning('无法标记异常，未找到订单');
           }
       } else {
          ElMessage.success('跟进记录已保存');
       }

       followUpDialogVisible.value = false;
       currentFollowUpItem.value = null;
     };

    const allTasksCompleted = computed(() => {
      if (!currentDispatch.orders || currentDispatch.orders.length === 0) {
        return false;
      }
      return currentDispatch.orders.every(order => order.status === 'delivered' || order.status === 'pod_uploaded');
    });

    const completeCurrentDispatch = () => {
      if (!allTasksCompleted.value) {
        ElMessage.warning(currentLanguage.value === 'zh' ? '还有未完成的派送任务！' : 'There are still uncompleted dispatch tasks!');
        return;
      }

      const confirmText = currentLanguage.value === 'zh' 
        ? `确认完成车次 ${currentDispatch.trainNumber} 的所有派送任务吗？` 
        : `Confirm completing all dispatch tasks for ${currentDispatch.trainNumber}?`;
      const title = currentLanguage.value === 'zh' ? '提示' : 'Confirm';
      const confirmButtonText = currentLanguage.value === 'zh' ? '确定完成' : 'Complete';
      const cancelButtonText = currentLanguage.value === 'zh' ? '取消' : 'Cancel';
      
      ElMessageBox.confirm(confirmText, title, {
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
        type: 'success',
      }).then(() => {
        console.log('Dispatch completed:', currentDispatch.trainNumber);
        ElMessage.success(currentLanguage.value === 'zh' ? '车次派送已全部完成！' : 'All dispatch tasks completed!');
        showDetails.value = false;
        showScan.value = true;
        currentDispatch.trainNumber = '';
        currentDispatch.dispatchLoadingType = '';
        currentDispatch.dispatchDeliveryType = '';
        currentDispatch.supplier = '';
        currentDispatch.loadingCompletionTime = '';
        currentDispatch.orders = [];
      }).catch(() => {
        console.log(currentLanguage.value === 'zh' ? '全部派送完成操作已取消。' : 'Complete all dispatches operation canceled.');
      });
    };

    const batchableOrdersInfo = computed(() => {
        const pendingOrders = currentDispatch.orders.filter(order => order.status === 'pending');
        if (pendingOrders.length < 2) {
            return null;
        }

        const warehouseGroups = pendingOrders.reduce((acc, order) => {
            const warehouse = order.originWarehouse;
            if (!acc[warehouse]) {
                acc[warehouse] = [];
            }
            acc[warehouse].push(order);
            return acc;
        }, {});

        let largestGroup = null;
        let maxSize = 1;

        for (const warehouse in warehouseGroups) {
            if (warehouseGroups[warehouse].length > maxSize) {
                maxSize = warehouseGroups[warehouse].length;
                largestGroup = {
                    warehouse: warehouse,
                    orders: warehouseGroups[warehouse]
                };
            }
        }
        return largestGroup;
    });

    const batchableDepartureInfo = computed(() => {
        const confirmedOrders = currentDispatch.orders.filter(order => order.status === 'pickup_confirmed');
        if (confirmedOrders.length < 2) {
            return null;
        }
        const warehouseGroups = confirmedOrders.reduce((acc, order) => {
            const warehouse = order.originWarehouse;
            if (!acc[warehouse]) {
                acc[warehouse] = [];
            }
            acc[warehouse].push(order);
            return acc;
        }, {});

        let largestGroup = null;
        let maxSize = 1;

        for (const warehouse in warehouseGroups) {
            if (warehouseGroups[warehouse].length > maxSize) {
                maxSize = warehouseGroups[warehouse].length;
                largestGroup = {
                    warehouse: warehouse,
                    orders: warehouseGroups[warehouse]
                };
            }
        }
        return largestGroup;
    });

    const dispatchPickupStatus = computed(() => {
      if (!currentDispatch.orders || currentDispatch.orders.length === 0) {
        return currentLanguage.value === 'zh' ? '未知' : 'Unknown';
      }
      const isPickedUp = currentDispatch.orders.some(
        order => order.status === 'pickup_confirmed' || order.status === 'picked_up' || order.status === 'delivered' || order.status === 'pod_uploaded'
      );
      return isPickedUp ? i18n.value.pickedUp : i18n.value.notPickedUp;
    });

    const firstPickupTime = computed(() => {
      if (!currentDispatch.orders) return null;
      const pickupTimes = currentDispatch.orders
        .filter(order => order.pickupTime)
        .map(order => order.pickupTime);

      if (pickupTimes.length === 0) return null;
      return pickupTimes.sort()[0];
    });

    const handleBatchConfirmPickup = () => {
        const batchInfo = batchableOrdersInfo.value;
        if (!batchInfo) {
            ElMessage.warning('没有足够的可批量确认提货的同仓库订单');
            return;
        }

        const itemsToMark = batchInfo.orders;
        const pcNumbers = itemsToMark.map(item => item.pcNumber).join(', ');
        const warehouse = batchInfo.warehouse;

        const messageHtml = `
          <div>确认批量确认以下PC号已提货吗？</div>
          <div style="margin-top: 15px; line-height: 1.6;">
            <strong style="margin-right: 5px;">PC 号:</strong> ${pcNumbers}
          </div>
          <div style="line-height: 1.6;">
            <strong style="margin-right: 5px;">提货仓库:</strong> ${warehouse}
          </div>
        `;

        ElMessageBox.confirm(
          messageHtml,
          '批量确认提货',
          {
            confirmButtonText: '确认提货',
            cancelButtonText: '取消',
            type: 'info',
            dangerouslyUseHTMLString: true
          }
        ).then(() => {
            const now = new Date().toLocaleString();
            const itemsToMarkPcNumbers = new Set(itemsToMark.map(item => item.pcNumber));

            const updatedOrders = currentDispatch.orders.map(order => {
                if (itemsToMarkPcNumbers.has(order.pcNumber) && order.status === 'pending') {
                    return {
                        ...order,
                        status: 'pickup_confirmed',
                        pickupTime: now,
                    };
                }
                return order;
            });

            currentDispatch.orders = updatedOrders;

            ElMessage.success(`已批量确认 ${itemsToMark.length} 个PC已提货`);
        }).catch(() => {
            console.log('批量确认提货已取消');
        });
    };

    const handleBatchDepart = () => {
        const batchInfo = batchableDepartureInfo.value;
        if (!batchInfo) {
            ElMessage.warning('没有足够的可批量标记出发的同仓库订单');
            return;
        }

        const itemsToMark = batchInfo.orders;
        const pcNumbers = itemsToMark.map(item => item.pcNumber).join(', ');
        const warehouse = batchInfo.warehouse;

        const messageHtml = `
          <div>确认批量标记以下PC号为已出发吗？</div>
          <div style="margin-top: 15px; line-height: 1.6;">
            <strong style="margin-right: 5px;">PC 号:</strong> ${pcNumbers}
          </div>
          <div style="line-height: 1.6;">
            <strong style="margin-right: 5px;">出发仓库:</strong> ${warehouse}
          </div>
        `;

        ElMessageBox.confirm(
          messageHtml,
          '批量标记出发',
          {
            confirmButtonText: '确认出发',
            cancelButtonText: '取消',
            type: 'info',
            dangerouslyUseHTMLString: true
          }
        ).then(() => {
            const now = new Date().toLocaleString();
            const itemsToMarkPcNumbers = new Set(itemsToMark.map(item => item.pcNumber));

            const updatedOrders = currentDispatch.orders.map(order => {
                if (itemsToMarkPcNumbers.has(order.pcNumber) && order.status === 'pickup_confirmed') {
                    return {
                        ...order,
                        status: 'picked_up',
                        departureTime: now,
                    };
                }
                return order;
            });

            currentDispatch.orders = updatedOrders;

            ElMessage.success(`已批量标记 ${itemsToMark.length} 个PC为已出发`);
        }).catch(() => {
            console.log('批量标记出发已取消');
        });
    };

    return {
      showScan,
      showDetails,
      goToScan,
      goBack,
      simulateScan,
      currentDispatch,
      showPickupConfirmationDialog,
      confirmActualPickup,
      markDeparted,
      markDelivered,
      uploadPOD,
      podDialogVisible,
      currentPodItem,
      handleDummyUpload,
      handlePodUploadSuccess,
      beforePodUpload,
      handleExceed,
      confirmPodUpload,
      followUpDialogVisible,
      currentFollowUpItem,
      followUpForm,
      handleMarkException,
      handleFollowUpUpload,
      beforeFollowUpUpload,
      handleFollowUpRemove,
      saveFollowUp,
      allTasksCompleted,
      completeCurrentDispatch,
      batchableOrdersInfo,
      handleBatchConfirmPickup,
      batchableDepartureInfo,
      handleBatchDepart,
      pickupConfirmationDialogVisible,
      currentItemForPickup,
      dispatchPickupStatus,
      firstPickupTime,
      // 添加语言相关属性
      currentLanguage,
      i18n,
      toggleLanguage,
    };
  }
};
</script>

<style scoped>
.driver-app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 100px);
}

.phone-mockup {
  width: 375px;
  height: 750px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 36px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.phone-screen {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden;
}

.app-header {
  background-color: #409EFF;
  color: white;
  padding: 15px;
  font-size: 18px;
  font-weight: bold;
  position: relative;
  flex-shrink: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: 60px;
  text-align: left;
}

.header-title {
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 10px;
}

/* 添加语言切换按钮样式 */
.language-switch {
  width: 60px;
  text-align: right;
}

.language-switch .el-button {
  color: white;
  font-weight: bold;
}

.app-content {
  flex-grow: 1;
  padding: 0;
  overflow-y: hidden;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.app-content::-webkit-scrollbar {
  display: none;
}
.app-content {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.home-view {
  text-align: center;
  padding-top: 50px;
}

.home-view h2 {
    margin-bottom: 40px;
    color: #333;
}

.dispatch-button {
    width: 80%;
    height: 50px;
    font-size: 16px;
}

.scan-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.scanner-placeholder {
  width: 200px;
  height: 200px;
  border: 2px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.scanner-icon {
  font-size: 60px;
  color: #ccc;
}

.scan-line {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(to right, transparent, #4CAF50, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  50% { top: calc(100% - 3px); }
  100% { top: 0; }
}

.details-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.details-list-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 20px 20px 20px;
}

.dispatch-header-info {
  padding: 15px 20px;
  background-color: #f0f9eb;
  border-bottom: 1px solid #e1f3d8;
  margin-bottom: 15px;
}

.dispatch-header-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}

.dispatch-header-info p strong {
  color: #303133;
  min-width: 70px;
  display: inline-block;
}

.batch-actions {
  padding: 10px 20px;
  margin-bottom: 10px;
  text-align: right;
}

.dispatch-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.dispatch-item {
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  transition: border-color 0.3s ease;
}

.item-info {
  flex-grow: 1;
}

.item-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #555;
}

.address-info {
  font-size: 12px;
  color: #888;
  margin-top: -3px;
  margin-bottom: 8px;
}

.pc-info-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.pc-info-line strong {
  margin-right: 5px;
}

.pc-tags {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.pc-tags .el-tag {
  margin: 0 !important;
}

.pickup-time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-left: 0;
  flex-shrink: 0;
}

.item-actions .el-button {
    width: 90px;
}

.item-actions .el-tag {
    width: 90px;
    text-align: center;
}

.upload-demo {
  text-align: center;
}
.el-dialog__body {
    padding: 20px;
}
.el-upload__tip {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}

.details-footer {
  flex-shrink: 0;
  padding: 15px 20px;
  background-color: #fff;
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
}

.complete-dispatch-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
}

.pickup-confirm-dialog-content p {
  margin: 10px 0;
  font-size: 14px;
}

.pickup-confirm-dialog-content p strong {
  display: inline-block;
  min-width: 70px;
}
</style> 