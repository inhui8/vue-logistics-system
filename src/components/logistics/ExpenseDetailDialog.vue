<!-- eslint-disable -->
<template>
  <el-dialog
    title="费用明细"
    v-model="dialogVisible"
    width="1200px"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    class="expense-detail-dialog"
  >
    <!-- 基本信息区域 -->
    <div class="basic-info">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="车次号">{{ basicInfo.trainNumber }}</el-descriptions-item>
        <el-descriptions-item label="装车类型">{{ basicInfo.loadingType }}</el-descriptions-item>
        <el-descriptions-item label="派送类型">{{ basicInfo.deliveryType }}</el-descriptions-item>
        <el-descriptions-item label="装车预约时间">{{ basicInfo.loadingAppointmentTime }}</el-descriptions-item>
        <el-descriptions-item label="Memo">
          <div class="memo-content">
            <span>{{ basicInfo.memo }}</span>
            <el-button type="primary" link @click="showMemoDialog">查看历史</el-button>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ basicInfo.remarks }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 费用明细表格 -->
    <div class="expense-table">
      <el-table 
        :data="tableData" 
        border 
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa' }"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="pcNumber" label="PC号" width="150">
          <template #default="scope">
            <el-select
              v-if="!scope.row.isPushed"
              v-model="scope.row.pcNumber"
              placeholder="请选择PC号"
              style="width: 100%"
              @change="handlePCChange(scope.row)"
            >
              <el-option
                v-for="pc in availablePCs"
                :key="pc.pcNumber"
                :label="pc.pcNumber"
                :value="pc.pcNumber"
              />
            </el-select>
            <span v-else :class="{ 'pushed-text': scope.row.isPushed }">{{ scope.row.pcNumber }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="appointmentTime" label="预约时间" width="160">
          <template #default="scope">
            <span :class="{ 'pushed-text': scope.row.isPushed }">{{ scope.row.appointmentTime }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="appointmentNumber" label="预约号" width="120">
          <template #default="scope">
            <span :class="{ 'pushed-text': scope.row.isPushed }">{{ scope.row.appointmentNumber }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="destination" label="目的地" width="180">
          <template #default="scope">
            <span :class="{ 'pushed-text': scope.row.isPushed }">{{ scope.row.destination }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="palletCount" label="板数" width="80">
          <template #default="scope">
            <span :class="{ 'pushed-text': scope.row.isPushed }">{{ scope.row.palletCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="重量" width="100">
          <template #default="scope">
            <span :class="{ 'pushed-text': scope.row.isPushed }">{{ scope.row.weight }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="volume" label="方数" width="100">
          <template #default="scope">
            <span :class="{ 'pushed-text': scope.row.isPushed }">{{ scope.row.volume }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="driverDepartureTime" label="司机出发时间" width="160">
          <template #default="scope">
            <span :class="{ 'pushed-text': scope.row.isPushed }">{{ scope.row.driverDepartureTime }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="driverArrivalTime" label="司机到达时间" width="160">
          <template #default="scope">
            <span :class="{ 'pushed-text': scope.row.isPushed }">{{ scope.row.driverArrivalTime }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="warehouseCompleteTime" label="交仓完成时间" width="160">
          <template #default="scope">
            <span :class="{ 'pushed-text': scope.row.isPushed }">{{ scope.row.warehouseCompleteTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="费用类型" width="120">
          <template #default="scope">
            <el-select
              v-if="!scope.row.isPushed"
              v-model="scope.row.expenseType"
              placeholder="请选择"
              style="width: 100%"
            >
              <el-option
                v-for="type in expenseTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
            <span v-else :class="{ 'pushed-text': scope.row.isPushed }">
              {{ getExpenseTypeLabel(scope.row.expenseType) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="费用备注" width="200">
          <template #default="scope">
            <el-input
              v-if="!scope.row.isPushed"
              v-model="scope.row.expenseRemark"
              type="textarea"
              :rows="1"
              placeholder="请输入费用备注"
              size="small"
            />
            <span v-else :class="{ 'pushed-text': scope.row.isPushed }">
              {{ scope.row.expenseRemark || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="费用" width="150">
          <template #default="scope">
            <el-input
              v-if="!scope.row.isPushed"
              v-model.number="scope.row.expense"
              size="small"
              type="number"
              :controls="false"
              @input="handleExpenseInput(scope.row)"
              @blur="handleExpenseChange(scope.row)"
            />
            <span v-else class="pushed-expense">{{ scope.row.expense }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button
                v-if="!scope.row.isPushed"
                type="primary"
                size="small"
                @click="handlePushExpense(scope.row)"
                :disabled="!scope.row.pcNumber"
              >
                推送费用
              </el-button>
              <el-button
                v-if="scope.row.isPushed"
                type="info"
                size="small"
                @click="handleCancelPush(scope.row)"
              >
                取消推送
              </el-button>
              <el-button
                type="primary"
                link
                size="small"
                @click="showFollowUpDialog(scope.row)"
              >
                跟进记录
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- MEMO历史记录弹窗 -->
    <el-dialog
      v-model="memoDialogVisible"
      title="MEMO历史记录"
      width="600px"
      append-to-body
    >
      <div class="memo-history">
        <div v-for="(memo, index) in memoHistory" :key="index" class="memo-item">
          <div class="memo-header">
            <span class="memo-time">{{ memo.createTime }}</span>
            <span class="memo-user">{{ memo.createUser }}</span>
          </div>
          <div class="memo-text">{{ memo.content }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- 跟进记录弹窗 -->
    <el-dialog
      v-model="followUpDialogVisible"
      title="跟进记录"
      width="800px"
      append-to-body
    >
      <div class="follow-up-history">
        <div v-for="(record, index) in followUpHistory" :key="index" class="follow-up-item">
          <div class="follow-up-header">
            <span class="follow-up-time">{{ record.createTime }}</span>
            <span class="follow-up-user">{{ record.createUser }}</span>
          </div>
          <div class="follow-up-content">
            <div class="follow-up-text">{{ record.content }}</div>
            <div v-if="record.images?.length" class="follow-up-images">
              <el-image
                v-for="(img, imgIndex) in record.images"
                :key="imgIndex"
                :src="img"
                :preview-src-list="record.images"
                fit="cover"
                class="follow-up-image"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- 添加新跟进记录 -->
      <div class="add-follow-up">
        <el-input
          v-model="newFollowUp.content"
          type="textarea"
          rows="3"
          placeholder="请输入跟进内容"
        />
        <div class="upload-images">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :on-change="handleImageChange"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
        </div>
        <el-button type="primary" @click="submitFollowUp">提交跟进</el-button>
      </div>
    </el-dialog>

    <!-- POD图片预览弹窗 -->
    <el-dialog
      v-model="podDialogVisible"
      title="POD图片"
      width="800px"
      append-to-body
    >
      <div class="pod-images">
        <el-image
          v-for="(img, index) in currentPodImages"
          :key="index"
          :src="img"
          :preview-src-list="currentPodImages"
          fit="cover"
          class="pod-image"
        />
      </div>
    </el-dialog>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'ExpenseDetailDialog',
  components: {
    Plus
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    trainData: {
      type: Object,
      default: () => ({})
    },
    expenseType: {
      type: String,
      default: 'all'
    }
  },
  emits: ['update:visible', 'expense-pushed', 'push-cancelled'],
  data() {
    return {
      dialogVisible: false,
      memoDialogVisible: false,
      followUpDialogVisible: false,
      podDialogVisible: false,
      basicInfo: {
        trainNumber: '',
        loadingType: '',
        deliveryType: '',
        loadingAppointmentTime: '',
        memo: '',
        remarks: ''
      },
      tableData: [{
        pcNumber: '',
        appointmentTime: '',
        appointmentNumber: '',
        destination: '',
        palletCount: '',
        weight: '',
        volume: '',
        driverDepartureTime: '',
        driverArrivalTime: '',
        warehouseCompleteTime: '',
        podImages: [],
        expense: 0,
        expenseType: '',
        expenseRemark: '',
        isPushed: false
      }],
      memoHistory: [],
      followUpHistory: [],
      currentPodImages: [],
      newFollowUp: {
        content: '',
        images: []
      },
      selectedPcData: null,
      expenseTypes: [
        { value: 'delivery', label: '派送费' },
        { value: 'exception', label: '异常费' },
        { value: 'storage', label: '仓储费' },
        { value: 'other', label: '其他费用' }
      ]
    }
  },
  computed: {
    availablePCs() {
      // 获取当前订单的所有PC号
      return this.trainData.children || [];
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(val) {
        this.dialogVisible = val;
        if (val) {
          this.initData();
        }
      }
    },
    dialogVisible(val) {
      if (!val) {
        this.$emit('update:visible', false);
      }
    }
  },
  methods: {
    async initData() {
      // 初始化基本信息
      this.basicInfo = {
        trainNumber: this.trainData.trainNumber || '',
        loadingType: this.trainData.loadingType || '',
        deliveryType: this.trainData.deliveryType || '',
        loadingAppointmentTime: this.trainData.loadingAppointmentTime || '',
        memo: this.trainData.Memo || '',
        remarks: this.trainData.warehouseRemarks || ''
      };

      // 初始化表格数据
      this.tableData = [{
        pcNumber: '',
        appointmentTime: '',
        appointmentNumber: '',
        destination: '',
        palletCount: '',
        weight: '',
        volume: '',
        driverDepartureTime: '',
        driverArrivalTime: '',
        warehouseCompleteTime: '',
        podImages: [],
        expense: 0,
        expenseType: '',
        expenseRemark: '',
        isPushed: false
      }];
    },
    handlePCChange(row) {
      // 当选择PC号时，自动填充相关信息
      const selectedPC = this.availablePCs.find(pc => pc.pcNumber === row.pcNumber);
      if (selectedPC) {
        row.appointmentTime = selectedPC.bookingTime;
        row.appointmentNumber = selectedPC.bookingNumber;
        row.destination = selectedPC.destination;
        row.palletCount = selectedPC.palletCount;
        row.weight = selectedPC.weight;
        row.volume = selectedPC.volume;
        row.driverDepartureTime = selectedPC.DriverStartTime;
        row.driverArrivalTime = selectedPC.DriverEndTime;
        row.warehouseCompleteTime = selectedPC.Arrived;
        row.podImages = selectedPC.podImages || [];
      }
    },
    async showMemoDialog() {
      // 暂时使用模拟数据
      this.memoHistory = [{
        createTime: new Date().toLocaleString(),
        createUser: '系统',
        content: this.trainData.Memo || '暂无MEMO记录'
      }];
      this.memoDialogVisible = true;
    },
    async showFollowUpDialog(row) {
      this.selectedPcData = row;
      // 暂时使用模拟数据
      this.followUpHistory = [{
        createTime: new Date().toLocaleString(),
        createUser: '系统',
        content: this.trainData.Followup || '暂无跟进记录'
      }];
      this.followUpDialogVisible = true;
    },
    handleViewPOD(row) {
      this.currentPodImages = row.podImages || [];
      this.podDialogVisible = true;
    },
    handleImageChange(file) {
      // 处理图片上传
      const isImage = file.raw.type.startsWith('image/');
      if (!isImage) {
        ElMessage.error('只能上传图片文件!');
        return;
      }
      this.newFollowUp.images.push(file.url);
    },
    async submitFollowUp() {
      if (!this.newFollowUp.content.trim()) {
        ElMessage.warning('请输入跟进内容');
        return;
      }

      try {
        // 提交跟进记录
        await fetch(`/api/pc/${this.selectedPcData.pcNumber}/follow-up`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.newFollowUp)
        });

        // 刷新跟进记录
        const response = await fetch(`/api/pc/${this.selectedPcData.pcNumber}/follow-up-history`);
        const data = await response.json();
        this.followUpHistory = data;

        // 清空表单
        this.newFollowUp = {
          content: '',
          images: []
        };

        ElMessage.success('提交成功');
      } catch (error) {
        console.error('提交跟进记录失败:', error);
        ElMessage.error('提交失败，请重试');
      }
    },
    handleExpenseChange(row) {
      console.log('费用变更:', row);
    },
    getRowClassName({ row }) {
      return row.isPushed ? 'pushed-row' : '';
    },
    handleExpenseInput(row) {
      // 确保类型为数字
      if (row.expense) {
        row.expense = Number(row.expense);
      }
    },
    handlePushExpense(row) {
      if (!row.pcNumber) {
        ElMessage.warning('请选择PC号');
        return;
      }
      if (!row.expenseType) {
        ElMessage.warning('请选择费用类型');
        return;
      }
      if (!row.expense) {
        ElMessage.warning('请输入费用金额');
        return;
      }
      // 设置推送状态
      row.isPushed = true;
      this.$emit('expense-pushed', row);
      ElMessage.success('费用推送成功');
    },
    handleCancelPush(row) {
      // 取消推送状态
      row.isPushed = false;
      this.$emit('push-cancelled', row);
      ElMessage.success('已取消推送');
    },
    handleClose() {
      this.dialogVisible = false;
    },
    getExpenseTypeLabel(type) {
      const expenseType = this.expenseTypes.find(t => t.value === type);
      return expenseType ? expenseType.label : type;
    }
  }
}
</script>

<style scoped>
.expense-detail-dialog .basic-info {
  margin-bottom: 20px;
}

.expense-detail-dialog .expense-table {
  margin-top: 20px;
}

.expense-detail-dialog .pushed-expense {
  color: #909399;
  background-color: #f5f7fa;
  padding: 5px 10px;
  border-radius: 4px;
  display: inline-block;
  width: 100%;
  text-align: right;
}

.expense-detail-dialog :deep(.el-descriptions) {
  margin-bottom: 20px;
}

.expense-detail-dialog :deep(.el-descriptions__cell) {
  padding: 12px 20px;
}

.expense-detail-dialog :deep(.el-input-number) {
  width: 100%;
}

.memo-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.memo-history {
  max-height: 400px;
  overflow-y: auto;
}

.memo-item {
  padding: 12px;
  border-bottom: 1px solid #EBEEF5;
}

.memo-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #909399;
  font-size: 12px;
}

.memo-text {
  color: #303133;
  line-height: 1.5;
}

.follow-up-history {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.follow-up-item {
  padding: 12px;
  border-bottom: 1px solid #EBEEF5;
}

.follow-up-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #909399;
  font-size: 12px;
}

.follow-up-content {
  color: #303133;
  line-height: 1.5;
}

.follow-up-images {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.follow-up-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  object-fit: cover;
}

.add-follow-up {
  padding-top: 20px;
  border-top: 1px solid #EBEEF5;
}

.upload-images {
  margin: 16px 0;
}

.pod-images {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.pod-image {
  width: 200px;
  height: 200px;
  border-radius: 4px;
  object-fit: cover;
}

.pushed-row {
  background-color: #f5f7fa !important;
}

.pushed-row:hover > td {
  background-color: #f5f7fa !important;
}

.pushed-text {
  color: #909399;
}

.expense-detail-dialog :deep(.pushed-row td) {
  background-color: #f5f7fa !important;
}

.expense-detail-dialog :deep(.el-table__row.pushed-row:hover td) {
  background-color: #f5f7fa !important;
}

.expense-detail-dialog :deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #f5f7fa;
}

.expense-detail-dialog :deep(.el-input.is-disabled .el-input__inner) {
  color: #909399;
}
</style> 