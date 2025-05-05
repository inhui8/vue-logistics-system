<!-- eslint-disable -->
<template>
  <el-dialog
    title="跟进记录"
    v-model="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <div class="follow-up-container">
      <!-- 历史记录列表 -->
      <div class="follow-up-history">
        <div class="follow-up-header-controls">
          <h4>历史记录</h4>
          <div class="follow-up-filters">
            <el-select v-model="filterTarget" placeholder="筛选对象" size="small" clearable>
              <el-option label="全部" value=""></el-option>
              <el-option label="内部跟进" value="internal"></el-option>
              <el-option label="供应商跟进" value="supplier"></el-option>
              <el-option label="客户跟进" value="customer-service"></el-option>
            </el-select>
            <el-select v-model="filterType" placeholder="筛选类型" size="small" clearable>
              <el-option label="全部" value=""></el-option>
              <el-option label="常规跟进" value="primary"></el-option>
              <el-option label="重要跟进" value="warning"></el-option>
              <el-option label="紧急跟进" value="danger"></el-option>
            </el-select>
          </div>
        </div>
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in filteredRecords"
            :key="index"
            :timestamp="record.time"
            :type="record.type"
          >
            <div class="follow-up-item">
              <div class="follow-up-header">
                <span class="follow-up-target-badge" :class="getTargetClass(record.target)">
                  {{ getTargetLabel(record.target) }}
                </span>
                <span v-if="record.status" class="follow-up-status" :class="'status-' + record.status">
                  {{ getStatusLabel(record.status) }}
                </span>
                <span v-if="record.isImportant" class="follow-up-important-flag">
                  <el-icon><Warning /></el-icon> 重要
                </span>
              </div>
              <div class="follow-up-content">{{ record.content }}</div>
              <div class="follow-up-info">
                <span class="follow-up-operator">操作人：{{ record.operator }}</span>
                <span v-if="record.department" class="follow-up-department">部门：{{ record.department }}</span>
                <span v-if="record.relatedOrder" class="follow-up-related-order">关联订单：{{ record.relatedOrder }}</span>
              </div>
              <div v-if="record.files && record.files.length" class="follow-up-files">
                <el-tag
                  v-for="file in record.files"
                  :key="file.id"
                  type="info"
                  size="small"
                  class="file-tag"
                  @click="handleFilePreview(file)"
                >
                  <el-icon><Document /></el-icon>
                  {{ file.name }}
                </el-tag>
              </div>
              <div v-if="record.reply" class="follow-up-reply">
                <div class="reply-header">回复信息：</div>
                <div class="reply-content">{{ record.reply.content }}</div>
                <div class="reply-info">回复人：{{ record.reply.operator }} ({{ record.reply.time }})</div>
              </div>
              
              <!-- 回复操作区 -->
              <div class="follow-up-actions">
                <el-button 
                  type="text" 
                  size="small" 
                  @click="showReplyForm(index)"
                  v-if="!record.replyFormVisible"
                >
                  <el-icon><ChatLineRound /></el-icon> 回复
                </el-button>
              </div>
              
              <!-- 回复表单 -->
              <div v-if="record.replyFormVisible" class="follow-up-reply-form">
                <el-input
                  v-model="record.replyDraft"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入回复内容"
                ></el-input>
                <div class="reply-form-actions">
                  <el-button size="small" @click="cancelReply(index)">取消</el-button>
                  <el-button type="primary" size="small" @click="submitReply(index)">提交回复</el-button>
                </div>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
        <div v-if="filteredRecords.length === 0" class="no-records">
          <el-empty description="暂无跟进记录"></el-empty>
        </div>
      </div>
      
      <!-- 添加新记录 -->
      <el-form :model="form" label-width="80px">
        <el-form-item label="跟进内容" required>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入跟进内容"
          ></el-input>
        </el-form-item>
        
        <!-- 新增：跟进对象选项 -->
        <el-form-item label="跟进对象" required>
          <el-select v-model="form.target" placeholder="请选择跟进对象" style="width: 100%">
            <el-option label="内部跟进" value="internal"></el-option>
            <el-option label="供应商跟进" value="supplier"></el-option>
            <el-option label="客户跟进" value="customer-service"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="跟进类型">
          <el-select v-model="form.type" placeholder="请选择跟进类型" style="width: 100%">
            <el-option label="常规跟进" value="primary"></el-option>
            <el-option label="重要跟进" value="warning"></el-option>
            <el-option label="紧急跟进" value="danger"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="上传文件">
          <el-upload
            class="upload-demo"
            action="/api/upload"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :before-remove="beforeRemove"
            multiple
            :limit="3"
            :on-exceed="handleExceed"
            :file-list="form.files"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传jpg/png/pdf文件，且不超过500kb
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, defineComponent, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Document, Warning, ChatLineRound } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'FollowUp',
  components: {
    Document,
    Warning,
    ChatLineRound
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
    existingRecords: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:visible', 'submit', 'cancel', 'reply'],
  setup(props, { emit }) {
    const dialogVisible = ref(false);
    const records = ref([]);
    const form = ref({
      content: '',
      type: 'primary',
      target: 'internal', // 默认为内部跟进
      files: []
    });
    
    // 添加过滤状态
    const filterTarget = ref('');
    const filterType = ref('');
    
    // 计算过滤后的记录
    const filteredRecords = computed(() => {
      if (!filterTarget.value && !filterType.value) {
        return records.value || [];
      }
      
      if (!records.value) return [];
      
      return records.value.filter(record => {
        const targetMatch = !filterTarget.value || record.target === filterTarget.value;
        const typeMatch = !filterType.value || record.type === filterType.value;
        return targetMatch && typeMatch;
      });
    });

    // 监听visible属性变化
    watch(() => props.visible, (newValue) => {
      dialogVisible.value = newValue;
      if (newValue) {
        try {
          // 初始化数据，如果没有传入记录则提供示例数据
          if (props.existingRecords && props.existingRecords.length > 0) {
            records.value = props.existingRecords.map(record => ({
              ...record,
              replyFormVisible: false,
              replyDraft: ''
            }));
          } else {
            // 提供示例数据
            records.value = [
              {
                time: '2024-05-20 15:30:45',
                content: '已联系供应商确认装车时间，预计明天上午10点到达',
                type: 'primary',
                target: 'supplier',
                operator: '张三',
                department: '物流部',
                status: 'processing',
                files: [],
                replyFormVisible: false,
                replyDraft: ''
              },
              {
                time: '2024-05-19 11:25:18',
                content: '客户反馈货物包装有轻微损坏，已安排补发并更新订单状态',
                type: 'warning',
                target: 'customer-service',
                operator: '李四',
                department: '客服部',
                isImportant: true,
                relatedOrder: 'ORD20240519-001',
                status: 'pending',
                files: [
                  { id: 1, name: '货物损坏照片.jpg' },
                  { id: 2, name: '补发确认单.pdf' }
                ],
                replyFormVisible: false,
                replyDraft: ''
              },
              {
                time: '2024-05-18 09:12:36',
                content: '已完成内部审核，批次号PC20240518-003通过质检',
                type: 'primary',
                target: 'internal',
                operator: '王五',
                department: '质检部',
                status: 'completed',
                files: [],
                reply: {
                  content: '确认记录已收到，请继续跟进后续装车事宜',
                  operator: '赵六',
                  time: '2024-05-18 10:30:22'
                },
                replyFormVisible: false,
                replyDraft: ''
              },
              {
                time: '2024-05-17 16:42:50',
                content: '货物已准备完毕，等待司机到达提货',
                type: 'danger',
                target: 'internal',
                operator: '赵六',
                department: '仓储部',
                status: 'urgent',
                isImportant: true,
                files: [],
                replyFormVisible: false,
                replyDraft: ''
              }
            ];
          }
          
          // 重置表单和筛选条件
          form.value = {
            content: '',
            type: 'primary',
            target: 'internal',
            files: []
          };
          filterTarget.value = '';
          filterType.value = '';
        } catch (error) {
          console.error('初始化跟进记录数据失败:', error);
          ElMessage.error('加载跟进记录失败，请重试');
          records.value = [];
        }
      }
    });

    // 监听dialogVisible变化，同步更新父组件的visible
    watch(dialogVisible, (newValue) => {
      if (!newValue) {
        emit('update:visible', false);
      }
    });

    // 获取跟进对象标签
    const getTargetLabel = (target) => {
      const targetMap = {
        'internal': '内部跟进',
        'supplier': '供应商跟进',
        'customer-service': '客服跟进'
      };
      return targetMap[target] || '内部跟进';
    };

    // 获取跟进对象CSS类
    const getTargetClass = (target) => {
      const classMap = {
        'internal': 'target-internal',
        'supplier': 'target-supplier',
        'customer-service': 'target-customer'
      };
      return classMap[target] || 'target-internal';
    };
    
    // 获取状态标签
    const getStatusLabel = (status) => {
      const statusMap = {
        'pending': '待处理',
        'processing': '处理中',
        'completed': '已完成',
        'urgent': '紧急',
        'delayed': '延迟',
        'cancelled': '已取消'
      };
      return statusMap[status] || status;
    };

    // 文件处理方法
    const handlePreview = (file) => {
      console.log('预览文件:', file);
      // 文件预览逻辑
    };

    const handleRemove = (file, fileList) => {
      console.log('移除文件:', file, fileList);
      form.value.files = fileList;
    };

    const beforeRemove = (file) => {
      return ElMessageBox.confirm(`确定移除 ${file.name}？`);
    };

    const handleExceed = (files, uploadFiles) => {
      ElMessageBox.warning(
        `当前限制选择 3 个文件，本次选择了 ${files.length} 个文件，共选择了 ${
          files.length + uploadFiles.length
        } 个文件`
      );
    };

    const handleFilePreview = (file) => {
      console.log('预览历史文件:', file);
      // 历史文件预览逻辑
    };

    // 提交处理
    const handleSubmit = () => {
      if (!form.value.content) {
        ElMessage.warning('请输入跟进内容');
        return;
      }

      if (!form.value.target) {
        ElMessage.warning('请选择跟进对象');
        return;
      }

      // 创建新的跟进记录
      const newRecord = {
        time: new Date().toLocaleString(),
        content: form.value.content,
        type: form.value.type,
        target: form.value.target,
        operator: '当前用户', // 实际应用中应从用户会话中获取
        files: form.value.files
      };

      // 向父组件提交新记录
      emit('submit', {
        trainId: props.trainData && props.trainData.id,
        record: newRecord
      });

      // 重置表单
      form.value = {
        content: '',
        type: 'primary',
        target: 'internal',
        files: []
      };

      // 关闭对话框
      dialogVisible.value = false;
    };

    // 取消处理
    const handleCancel = () => {
      emit('cancel');
      dialogVisible.value = false;
    };

    // 关闭对话框
    const handleClose = () => {
      dialogVisible.value = false;
    };

    // 回复操作
    const showReplyForm = (index) => {
      try {
        if (records.value && records.value[index]) {
          records.value[index].replyFormVisible = true;
          records.value[index].replyDraft = '';
        }
      } catch (error) {
        console.error('显示回复表单失败:', error);
      }
    };

    const cancelReply = (index) => {
      try {
        if (records.value && records.value[index]) {
          records.value[index].replyFormVisible = false;
          records.value[index].replyDraft = '';
        }
      } catch (error) {
        console.error('取消回复失败:', error);
      }
    };

    const submitReply = (index) => {
      try {
        if (!records.value || !records.value[index]) {
          return;
        }
        
        const record = records.value[index];
        const replyContent = record.replyDraft;

        if (!replyContent) {
          ElMessage.warning('请输入回复内容');
          return;
        }

        // 创建新的回复记录
        const newReply = {
          content: replyContent,
          operator: '当前用户', // 实际应用中应从用户会话中获取
          time: new Date().toLocaleString()
        };

        // 更新记录的回复
        record.reply = newReply;
        record.replyFormVisible = false;
        record.replyDraft = '';
        
        // 通知父组件回复已添加
        try {
          emit('reply', {
            recordId: record.id || index,
            recordTime: record.time,
            originalContent: record.content,
            reply: newReply,
            trainId: props.trainData && props.trainData.id
          });
        
          ElMessage.success('回复已提交');
        } catch (error) {
          console.error('提交回复通知失败:', error);
          ElMessage.warning('回复已保存，但通知系统失败');
        }
      } catch (error) {
        console.error('提交回复失败:', error);
        ElMessage.error('提交回复失败，请重试');
      }
    };

    return {
      dialogVisible,
      records,
      filteredRecords,
      filterTarget,
      filterType,
      form,
      getTargetLabel,
      getTargetClass,
      getStatusLabel,
      handlePreview,
      handleRemove,
      beforeRemove,
      handleExceed,
      handleFilePreview,
      handleSubmit,
      handleCancel,
      handleClose,
      showReplyForm,
      cancelReply,
      submitReply
    };
  }
});
</script>

<style scoped>
.follow-up-container {
  max-height: 600px;
  overflow-y: auto;
}

.follow-up-history {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.follow-up-header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.follow-up-filters {
  display: flex;
  gap: 8px;
}

.follow-up-history h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.follow-up-item {
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  margin-bottom: 10px;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.follow-up-header {
  display: flex;
  margin-bottom: 8px;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.follow-up-content {
  color: #303133;
  line-height: 1.5;
  margin-bottom: 8px;
}

.follow-up-info {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 8px;
  color: #909399;
  font-size: 13px;
}

.follow-up-operator, 
.follow-up-department, 
.follow-up-related-order {
  display: inline-flex;
  align-items: center;
}

.follow-up-files {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

/* 跟进对象标签样式 */
.follow-up-target-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: white;
  display: inline-block;
}

.target-internal {
  background-color: #409EFF;
}

.target-supplier {
  background-color: #67C23A;
}

.target-customer {
  background-color: #E6A23C;
}

/* 状态标签样式 */
.follow-up-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  display: inline-block;
  background-color: #f0f0f0;
  color: #606266;
}

.status-pending {
  background-color: #E6A23C;
  color: white;
}

.status-processing {
  background-color: #409EFF;
  color: white;
}

.status-completed {
  background-color: #67C23A;
  color: white;
}

.status-urgent {
  background-color: #F56C6C;
  color: white;
}

.status-delayed {
  background-color: #909399;
  color: white;
}

.status-cancelled {
  background-color: #303133;
  color: white;
}

/* 重要标记样式 */
.follow-up-important-flag {
  color: #F56C6C;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: bold;
}

/* 回复样式 */
.follow-up-reply {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f8f8f8;
  border-left: 3px solid #409EFF;
  border-radius: 0 4px 4px 0;
}

.reply-header {
  font-size: 13px;
  font-weight: bold;
  color: #606266;
  margin-bottom: 5px;
}

.reply-content {
  color: #303133;
  font-size: 13px;
  margin-bottom: 5px;
}

.reply-info {
  color: #909399;
  font-size: 12px;
}

/* 回复操作区样式 */
.follow-up-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.follow-up-actions .el-button {
  padding: 4px 8px;
  font-size: 12px;
}

.follow-up-actions .el-icon {
  margin-right: 4px;
}

/* 回复表单样式 */
.follow-up-reply-form {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  border: 1px solid #e6e6e6;
}

.reply-form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  gap: 8px;
}

/* 无记录样式 */
.no-records {
  padding: 20px 0;
  display: flex;
  justify-content: center;
}

/* 滚动条样式 */
.follow-up-container::-webkit-scrollbar {
  width: 6px;
}

.follow-up-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.follow-up-container::-webkit-scrollbar-track {
  background: #f4f4f5;
}
</style>
