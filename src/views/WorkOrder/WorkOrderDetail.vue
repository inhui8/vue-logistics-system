<template>
  <div class="work-order-detail-container">
    <el-page-header @back="goBack" :content="`工单详情: ${workOrder.subject || '加载中...'}`"></el-page-header>

    <div v-if="loading" class="loading-state">
        <el-skeleton :rows="10" animated />
    </div>

    <div v-else>
        <!-- 工单头部信息卡片 -->
        <el-card class="info-card" shadow="never">
            <div class="work-order-header">
                <h2 class="work-order-title">{{ workOrder.subject }}</h2>
                <el-tag :type="getStatusType(workOrder.status)" effect="dark">{{ getStatusText(workOrder.status) }}</el-tag>
            </div>

            <div class="work-order-meta">
                <div class="meta-item">
                    <span class="meta-label">工单号:</span>
                    <span class="meta-value">{{ workOrder.id }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">工单类型:</span>
                    <span class="meta-value">{{ getTypeText(workOrder.type) }}</span>
                </div>
                <div v-if="workOrder.orderNo" class="meta-item">
                    <span class="meta-label">关联订单号:</span>
                    <span class="meta-value">
                        <el-link @click="viewOrder(workOrder.orderNo)" type="primary">{{ workOrder.orderNo }}</el-link>
                    </span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">优先级:</span>
                    <span class="meta-value">
                        <el-tag :type="getPriorityType(workOrder.priority)" size="small">{{ getPriorityText(workOrder.priority) }}</el-tag>
                    </span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">创建人:</span>
                    <span class="meta-value">{{ workOrder.creator }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">处理人:</span>
                    <span class="meta-value">{{ workOrder.assignee || '未指派' }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">创建时间:</span>
                    <span class="meta-value">{{ formatDateTime(workOrder.createdAt) }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">期望完成时间:</span>
                    <span class="meta-value">{{ formatDateTime(workOrder.expectedCompletionTime) }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">最后更新:</span>
                    <span class="meta-value">{{ formatDateTime(workOrder.updatedAt) }}</span>
                </div>
            </div>

            <!-- 根据工单类型显示特定字段 -->
            <div v-if="workOrder.type === 'exception'" class="meta-item">
                <span class="meta-label">异常类型:</span>
                <span class="meta-value">{{ workOrder.exceptionType }}</span>
            </div>

            <div v-if="workOrder.type === 'warning'" class="meta-item">
                <span class="meta-label">预警来源:</span>
                <span class="meta-value">{{ workOrder.warningSource }}</span>
            </div>

            <div v-if="workOrder.type === 'value_added'" class="meta-item">
                <span class="meta-label">服务项目:</span>
                <span class="meta-value">{{ workOrder.serviceItem }}</span>
            </div>

            <!-- 工单操作按钮组 -->
            <div class="work-order-actions">
                <el-button-group>
                    <el-button type="primary" @click="handleProcess" v-if="canProcess">开始处理</el-button>
                    <el-button @click="handleReassign" v-if="canReassign">转派</el-button>
                    <el-button @click="handleUpdateStatus" v-if="canUpdateStatus">更新状态</el-button>
                    <el-button type="success" @click="handleComplete" v-if="canComplete">标记为解决</el-button>
                    <el-button @click="handleClose" v-if="canClose">关闭工单</el-button>
                    <el-button @click="handleReopen" v-if="isClosed">重新打开</el-button>
                </el-button-group>
            </div>
        </el-card>

        <!-- 工单详情内容 -->
        <el-card class="content-card" shadow="never">
            <div class="card-header">
                <h3>{{ getDescriptionTitle(workOrder.type) }}</h3>
            </div>
            <div class="content-body">
                <pre class="description-content">{{ workOrder.description }}</pre>
            </div>
            
            <!-- 附件区域 -->
            <div v-if="workOrder.attachments && workOrder.attachments.length > 0" class="attachments-section">
                <h4>附件</h4>
                <div class="attachments-list">
                    <div v-for="(attachment, index) in workOrder.attachments" :key="index" class="attachment-item">
                        <el-link :href="attachment.url" target="_blank" type="primary">
                            {{ attachment.name }} ({{ formatFileSize(attachment.size) }})
                        </el-link>
                    </div>
                </div>
            </div>
        </el-card>

        <!-- 工单处理记录区域 -->
        <el-card class="records-card" shadow="never">
            <div class="card-header">
                <h3>处理记录</h3>
                <el-button size="small" @click="showAddRecordDialog">添加备注</el-button>
            </div>

            <el-timeline>
                <el-timeline-item
                    v-for="(record, index) in workOrder.records"
                    :key="index"
                    :type="getRecordType(record.type)"
                    :color="getRecordColor(record.type)"
                    :timestamp="formatDateTime(record.timestamp)">
                    <div class="record-item">
                        <div class="record-header">
                            <span class="record-type">{{ getRecordTypeText(record.type) }}</span>
                            <span class="record-user">{{ record.user }}</span>
                        </div>
                        <div class="record-content">{{ record.content }}</div>
                        <!-- 添加附件显示 -->
                        <div v-if="record.attachments && record.attachments.length > 0" class="record-attachments">
                            <div class="attachments-header">附件：</div>
                            <div class="attachments-list">
                                <div v-for="(attachment, attachIndex) in record.attachments" 
                                     :key="attachIndex" 
                                     class="attachment-item">
                                    <el-link 
                                        :href="attachment.url" 
                                        target="_blank" 
                                        type="primary"
                                        @click.prevent="previewAttachment(attachment)">
                                        {{ attachment.name }} ({{ formatFileSize(attachment.size) }})
                                    </el-link>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-timeline-item>
            </el-timeline>
        </el-card>
    </div>

    <!-- 添加处理记录对话框 -->
    <el-dialog v-model="recordDialogVisible" title="添加处理记录" width="500px">
        <el-form :model="recordForm" ref="recordFormRef">
            <el-form-item label="记录类型" prop="type">
                <el-select v-model="recordForm.type">
                    <el-option label="处理过程记录" value="process"></el-option>
                    <el-option label="内部沟通" value="note"></el-option>
                    <el-option label="状态更新" value="status"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="内容" prop="content">
                <el-input 
                    type="textarea" 
                    v-model="recordForm.content" 
                    rows="4" 
                    placeholder="请输入处理过程或备注信息"></el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="recordDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitRecord">提交</el-button>
            </span>
        </template>
    </el-dialog>

    <!-- 转派对话框 -->
    <el-dialog v-model="reassignDialogVisible" title="转派工单" width="500px">
        <el-form :model="reassignForm" ref="reassignFormRef">
            <el-form-item label="转派给" prop="assignee">
                <el-select v-model="reassignForm.assignee" filterable placeholder="选择处理人">
                    <el-option 
                        v-for="user in users" 
                        :key="user.id" 
                        :label="user.name" 
                        :value="user.id">
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="转派原因" prop="reason">
                <el-input 
                    type="textarea" 
                    v-model="reassignForm.reason" 
                    rows="3" 
                    placeholder="请输入转派原因"></el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="reassignDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitReassign">确认转派</el-button>
            </span>
        </template>
    </el-dialog>

    <!-- 更新状态对话框 -->
    <el-dialog v-model="statusDialogVisible" title="更新工单状态" width="500px">
        <el-form :model="statusForm" ref="statusFormRef">
            <el-form-item label="新状态" prop="status">
                <el-select v-model="statusForm.status">
                    <el-option label="处理中" value="processing"></el-option>
                    <el-option label="待确认" value="pending_confirmation"></el-option>
                    <el-option label="已解决" value="resolved"></el-option>
                    <el-option label="已关闭" value="closed"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="状态说明" prop="comment">
                <el-input 
                    type="textarea" 
                    v-model="statusForm.comment" 
                    rows="3" 
                    placeholder="请输入状态变更说明"></el-input>
            </el-form-item>
            <el-form-item label="附件">
                <el-upload
                    class="status-upload"
                    action="#"
                    :auto-upload="false"
                    :on-change="handleFileChange"
                    :on-remove="handleFileRemove"
                    :file-list="statusForm.fileList"
                    multiple>
                    <el-button type="primary">选择文件</el-button>
                    <template #tip>
                        <div class="el-upload__tip">支持任意格式文件，单个文件不超过10MB</div>
                    </template>
                </el-upload>
            </el-form-item>
            <!-- 文件预览区域 -->
            <div v-if="previewVisible" class="preview-container">
                <div class="preview-header">
                    <span>文件预览</span>
                    <el-button type="text" @click="closePreview">关闭</el-button>
                </div>
                <div class="preview-content" v-if="previewFile">
                    <!-- 图片预览 -->
                    <img v-if="isImage(previewFile)" :src="previewUrl" class="preview-image" />
                    <!-- PDF预览 -->
                    <iframe v-else-if="isPdf(previewFile)" :src="previewUrl" class="preview-pdf"></iframe>
                    <!-- 其他文件类型 -->
                    <div v-else class="preview-other">
                        <el-icon><Document /></el-icon>
                        <span>{{ previewFile.name }}</span>
                        <el-button type="primary" size="small" @click="downloadFile(previewFile)">下载</el-button>
                    </div>
                </div>
            </div>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="statusDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitStatusUpdate">确认更新</el-button>
            </span>
        </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Document } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const loading = ref(true);

// 模拟用户数据
const users = ref([
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
    { id: 3, name: '客服团队' },
]);

// 模拟工单数据
const workOrder = reactive({
    id: 'WO202307250001',
    subject: '客户反馈订单延迟问题',
    type: 'exception',
    status: 'pending',  // pending, processing, pending_confirmation, resolved, closed
    priority: 'high',
    orderNo: 'ORD202307250123', // 关联订单号
    creator: '张三',
    assignee: '李四',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 一天前
    updatedAt: new Date(),
    expectedCompletionTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 两天后
    exceptionType: '客户投诉', // 对于异常工单
    description: '客户反馈他的订单已经延迟3天未发货，客户情绪激动，需要尽快处理。客户电话：13800138000',
    attachments: [
        { name: '客户投诉截图.png', url: '#', size: 1024 * 512 }, // 512KB
        { name: '订单详情.pdf', url: '#', size: 1024 * 1024 * 2 }, // 2MB
    ],
    records: [
        {
            type: 'create',
            user: '张三',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            content: '创建工单'
        },
        {
            type: 'assign',
            user: '系统',
            timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
            content: '工单已指派给李四'
        },
        {
            type: 'note',
            user: '李四',
            timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
            content: '已联系客户，告知原因是由于商品缺货，预计明天可以发货'
        },
        {
            type: 'status',
            user: '李四',
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
            content: '状态更新为：处理中'
        }
    ]
});

// 对话框相关状态
const recordDialogVisible = ref(false);
const reassignDialogVisible = ref(false);
const statusDialogVisible = ref(false);

// 表单引用
const recordFormRef = ref(null);
const reassignFormRef = ref(null);
const statusFormRef = ref(null);

// 表单数据
const recordForm = reactive({
    type: 'process',
    content: ''
});

const reassignForm = reactive({
    assignee: null,
    reason: ''
});

// 文件预览相关状态
const previewVisible = ref(false);
const previewFile = ref(null);
const previewUrl = ref('');

// 文件处理相关函数
const handleFileChange = (file) => {
    // 文件大小限制：10MB
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
        ElMessage.error('文件大小不能超过 10MB!');
        return false;
    }
    
    // 如果是图片或PDF，生成预览URL
    if (isImage(file.raw) || isPdf(file.raw)) {
        previewUrl.value = URL.createObjectURL(file.raw);
        previewFile.value = file;
        previewVisible.value = true;
    }
    
    return true;
};

const handleFileRemove = (file) => {
    // 如果移除的是当前预览的文件，关闭预览
    if (previewFile.value && previewFile.value.uid === file.uid) {
        closePreview();
    }
};

const closePreview = () => {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
    }
    previewVisible.value = false;
    previewFile.value = null;
    previewUrl.value = '';
};

const isImage = (file) => {
    return file.type.startsWith('image/');
};

const isPdf = (file) => {
    return file.type === 'application/pdf';
};

const downloadFile = (file) => {
    // 创建下载链接
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file.raw);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

// 修改状态表单数据结构
const statusForm = reactive({
    status: 'processing',
    comment: '',
    fileList: []
});

// 修改状态更新提交函数
const submitStatusUpdate = async () => {
    if (!statusForm.comment.trim()) {
        ElMessage.warning('请输入状态变更说明');
        return;
    }

    try {
        // 处理文件上传
        const uploadedFiles = await Promise.all(
            statusForm.fileList.map(async file => {
                // 这里应该调用实际的文件上传API
                // const formData = new FormData();
                // formData.append('file', file.raw);
                // const response = await api.uploadFile(formData);
                // return response.data;
                
                // 模拟上传成功
                return {
                    name: file.name,
                    url: URL.createObjectURL(file.raw),
                    size: file.size
                };
            })
        );

        // 添加状态更新记录
        workOrder.records.push({
            type: 'status',
            user: '当前用户', // 实际应用中应该获取当前登录用户
            timestamp: new Date(),
            content: `状态更新为：${getStatusText(statusForm.status)}。说明：${statusForm.comment}`,
            attachments: uploadedFiles
        });

        // 更新工单状态
        workOrder.status = statusForm.status;
        workOrder.updatedAt = new Date();

        ElMessage.success(`工单状态已更新为：${getStatusText(statusForm.status)}`);
        statusDialogVisible.value = false;
        
        // 清理预览和文件列表
        closePreview();
        statusForm.fileList = [];
    } catch (error) {
        console.error('Failed to update status:', error);
        ElMessage.error('更新状态失败');
    }
};

// 计算属性：按钮是否可见/可用
const canProcess = computed(() => {
    return workOrder.status === 'pending';
});

const canReassign = computed(() => {
    return ['pending', 'processing'].includes(workOrder.status);
});

const canUpdateStatus = computed(() => {
    return ['processing', 'pending_confirmation'].includes(workOrder.status);
});

const canComplete = computed(() => {
    return ['processing', 'pending_confirmation'].includes(workOrder.status);
});

const canClose = computed(() => {
    return ['resolved'].includes(workOrder.status);
});

const isClosed = computed(() => {
    return workOrder.status === 'closed';
});

// 辅助函数
const formatDateTime = (date) => {
    if (!date) return '未设置';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getStatusText = (status) => {
    const statusMap = {
        'pending': '待处理',
        'processing': '处理中',
        'pending_confirmation': '待确认',
        'resolved': '已解决',
        'closed': '已关闭'
    };
    return statusMap[status] || status;
};

const getStatusType = (status) => {
    const typeMap = {
        'pending': 'warning',
        'processing': 'primary',
        'pending_confirmation': 'info',
        'resolved': 'success',
        'closed': 'info'
    };
    return typeMap[status] || 'info';
};

const getTypeText = (type) => {
    const typeMap = {
        'exception': '异常订单处理',
        'command': '指令执行',
        'warning': '订单预警响应',
        'value_added': '增值服务请求',
        'other': '其他问题'
    };
    return typeMap[type] || type;
};

const getPriorityText = (priority) => {
    const priorityMap = {
        'urgent': '紧急',
        'high': '高',
        'medium': '中',
        'low': '低'
    };
    return priorityMap[priority] || priority;
};

const getPriorityType = (priority) => {
    const typeMap = {
        'urgent': 'danger',
        'high': 'warning',
        'medium': 'info',
        'low': 'success'
    };
    return typeMap[priority] || 'info';
};

const getDescriptionTitle = (type) => {
    const titleMap = {
        'command': '指令内容',
        'value_added': '服务要求',
        'exception': '详细情况',
        'warning': '详细情况',
        'other': '详细情况'
    };
    return titleMap[type] || '详细情况';
};

const getRecordType = (recordType) => {
    const typeMap = {
        'create': 'primary',
        'assign': 'info',
        'note': 'info',
        'process': 'warning',
        'status': 'success'
    };
    return typeMap[recordType] || 'info';
};

const getRecordColor = (recordType) => {
    const colorMap = {
        'create': '#409EFF',
        'assign': '#909399',
        'note': '#E6A23C',
        'process': '#409EFF',
        'status': '#67C23A'
    };
    return colorMap[recordType] || '#909399';
};

const getRecordTypeText = (recordType) => {
    const textMap = {
        'create': '创建工单',
        'assign': '指派工单',
        'note': '内部备注',
        'process': '处理记录',
        'status': '状态更新'
    };
    return textMap[recordType] || recordType;
};

// 页面加载数据
const loadWorkOrderData = async () => {
    try {
        const workOrderId = route.params.id;
        // 模拟API请求
        console.log(`Loading work order: ${workOrderId}`);
        // 实际应用中，这里会发起API请求获取工单数据
        // const response = await api.getWorkOrder(workOrderId);
        // Object.assign(workOrder, response.data);
        
        // 模拟延迟加载
        setTimeout(() => {
            loading.value = false;
        }, 1000);
    } catch (error) {
        console.error('Failed to load work order:', error);
        ElMessage.error('加载工单数据失败');
        loading.value = false;
    }
};

// 页面方法
const goBack = () => {
    router.back();
};

const viewOrder = (orderNo) => {
    router.push(`/order/detail/${orderNo}`);
};

// 对话框相关方法
const showAddRecordDialog = () => {
    recordForm.type = 'process';
    recordForm.content = '';
    recordDialogVisible.value = true;
};

const submitRecord = () => {
    if (!recordForm.content.trim()) {
        ElMessage.warning('请输入记录内容');
        return;
    }

    // 添加记录
    workOrder.records.push({
        type: recordForm.type,
        user: '当前用户', // 实际应用中应该获取当前登录用户
        timestamp: new Date(),
        content: recordForm.content
    });

    ElMessage.success('记录已添加');
    recordDialogVisible.value = false;
    workOrder.updatedAt = new Date();
};

// 处理转派
const handleReassign = () => {
    reassignForm.assignee = null;
    reassignForm.reason = '';
    reassignDialogVisible.value = true;
};

const submitReassign = () => {
    if (!reassignForm.assignee) {
        ElMessage.warning('请选择处理人');
        return;
    }

    // 获取处理人名称
    const assignee = users.value.find(u => u.id === reassignForm.assignee)?.name || '未知用户';
    
    // 添加转派记录
    workOrder.records.push({
        type: 'assign',
        user: '当前用户', // 实际应用中应该获取当前登录用户
        timestamp: new Date(),
        content: `工单已转派给 ${assignee}。原因：${reassignForm.reason || '无'}`
    });

    // 更新处理人
    workOrder.assignee = assignee;
    workOrder.updatedAt = new Date();

    ElMessage.success(`工单已转派给 ${assignee}`);
    reassignDialogVisible.value = false;
};

// 处理状态更新
const handleUpdateStatus = () => {
    statusForm.status = 'processing'; // 默认值
    statusForm.comment = '';
    statusDialogVisible.value = true;
};

// 其他操作方法
const handleProcess = () => {
    ElMessageBox.confirm('确认开始处理该工单?', '操作确认', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info'
    }).then(() => {
        workOrder.status = 'processing';
        workOrder.updatedAt = new Date();
        
        // 添加记录
        workOrder.records.push({
            type: 'status',
            user: '当前用户', // 实际应用中应该获取当前登录用户
            timestamp: new Date(),
            content: '开始处理工单'
        });
        
        ElMessage.success('工单状态已更新为：处理中');
    }).catch(() => {});
};

const handleComplete = () => {
    ElMessageBox.prompt('请输入解决方案', '标记为已解决', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (value) => {
            if (!value.trim()) {
                return '解决方案不能为空';
            }
            return true;
        }
    }).then(({ value }) => {
        workOrder.status = 'resolved';
        workOrder.updatedAt = new Date();
        
        // 添加记录
        workOrder.records.push({
            type: 'status',
            user: '当前用户', // 实际应用中应该获取当前登录用户
            timestamp: new Date(),
            content: `工单已解决。解决方案：${value}`
        });
        
        ElMessage.success('工单已标记为已解决');
    }).catch(() => {});
};

const handleClose = () => {
    ElMessageBox.confirm('确认关闭该工单?', '操作确认', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        workOrder.status = 'closed';
        workOrder.updatedAt = new Date();
        
        // 添加记录
        workOrder.records.push({
            type: 'status',
            user: '当前用户', // 实际应用中应该获取当前登录用户
            timestamp: new Date(),
            content: '工单已关闭'
        });
        
        ElMessage.success('工单已关闭');
    }).catch(() => {});
};

const handleReopen = () => {
    ElMessageBox.prompt('请输入重新打开原因', '重新打开工单', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (value) => {
            if (!value.trim()) {
                return '原因不能为空';
            }
            return true;
        }
    }).then(({ value }) => {
        workOrder.status = 'processing';
        workOrder.updatedAt = new Date();
        
        // 添加记录
        workOrder.records.push({
            type: 'status',
            user: '当前用户', // 实际应用中应该获取当前登录用户
            timestamp: new Date(),
            content: `工单已重新打开。原因：${value}`
        });
        
        ElMessage.success('工单已重新打开');
    }).catch(() => {});
};

// 附件预览处理函数
const previewAttachment = (attachment) => {
    // 根据文件类型处理预览
    const fileExtension = attachment.name.split('.').pop().toLowerCase();
    const isImageFile = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
    const isPdfFile = fileExtension === 'pdf';

    if (isImageFile || isPdfFile) {
        previewUrl.value = attachment.url;
        previewFile.value = attachment;
        previewVisible.value = true;
    } else {
        // 非图片或PDF文件，直接下载
        window.open(attachment.url, '_blank');
    }
};

// 页面加载
onMounted(() => {
    loadWorkOrderData();
});

</script>

<style scoped>
.work-order-detail-container {
  padding: 20px;
}

.el-page-header {
  margin-bottom: 20px;
}

.loading-state {
  padding: 20px;
}

.info-card, .content-card, .records-card {
  margin-bottom: 20px;
}

.work-order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.work-order-title {
  margin: 0;
  font-size: 20px;
}

.work-order-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
}

.meta-label {
  color: #909399;
  margin-right: 8px;
  min-width: 80px;
}

.work-order-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #EBEEF5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
}

.content-body {
  margin-bottom: 20px;
}

.description-content {
  white-space: pre-wrap;
  font-family: inherit;
  margin: 0;
  padding: 12px;
  background-color: #F5F7FA;
  border-radius: 4px;
}

.attachments-section {
  margin-top: 20px;
}

.attachments-section h4 {
  margin-bottom: 10px;
}

.attachment-item {
  margin-bottom: 8px;
}

.record-item {
  padding: 0 0 8px 0;
}

.record-header {
  display: flex;
  margin-bottom: 5px;
}

.record-type {
  font-weight: bold;
  margin-right: 10px;
}

.record-user {
  color: #606266;
}

.record-content {
  color: #303133;
}

.status-upload {
    .el-upload {
        margin-right: 10px;
    }
    .el-upload__tip {
        line-height: 1.2;
        margin-top: 5px;
        color: #909399;
    }
}

.preview-container {
    margin-top: 15px;
    border: 1px solid #EBEEF5;
    border-radius: 4px;
}

.preview-header {
    padding: 10px;
    border-bottom: 1px solid #EBEEF5;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.preview-content {
    padding: 15px;
    min-height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.preview-image {
    max-width: 100%;
    max-height: 300px;
    object-fit: contain;
}

.preview-pdf {
    width: 100%;
    height: 400px;
    border: none;
}

.preview-other {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #909399;
    
    .el-icon {
        font-size: 48px;
    }
}

.record-attachments {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #EBEEF5;
}

.attachments-header {
    font-size: 13px;
    color: #909399;
    margin-bottom: 5px;
}

.attachments-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.attachment-item {
    font-size: 13px;
}
</style> 