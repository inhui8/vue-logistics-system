<!-- eslint-disable -->
<template>
  <el-dialog
    title="文件上传"
    v-model="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="upload-container">
      <!-- 文件类型选择 -->
      <div class="form-section">
        <div class="form-label required">文件类型：</div>
        <div class="form-content">
          <el-radio-group v-model="form.fileType">
            <el-radio label="record">留底文件</el-radio>
            <el-radio label="abnormal">异常文件</el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 备注信息 -->
      <div class="form-section">
        <div class="form-label">备注：</div>
        <div class="form-content">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          ></el-input>
        </div>
      </div>

      <!-- 文件上传区域 -->
      <div class="form-section">
        <div class="form-label required">上传文件：</div>
        <div class="form-content">
          <el-upload
            ref="uploadRef"
            class="upload-area"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :on-preview="handleFilePreview"
            :file-list="fileList"
            :limit="5"
            multiple
            drag
            accept=".pdf,.jpg,.jpeg,.png"
          >
            <el-icon class="el-icon-upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .pdf、.jpg、.jpeg、.png 格式，单个文件不超过 10MB
              </div>
            </template>
          </el-upload>
        </div>
      </div>

      <!-- 文件预览区域 -->
      <div class="form-section" v-if="previewVisible">
        <div class="form-label">预览：</div>
        <div class="form-content">
          <div class="preview-container">
            <div class="preview-header">
              <div class="preview-title">{{ previewFile.name }}</div>
              <el-button type="text" @click="closePreview">关闭</el-button>
            </div>
            <div class="preview-content">
              <img v-if="isImageFile(previewFile)" :src="previewUrl" class="preview-image" />
              <div v-else class="preview-placeholder">
                <document class="preview-icon" />
                <div>{{ previewFile.name }}</div>
                <el-button type="primary" size="small" @click="downloadFile">下载查看</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :disabled="!isValid" :loading="uploading">
          {{ uploading ? '上传中...' : '确定' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { UploadFilled, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'TrainFileUploadDialog',
  components: {
    UploadFilled,
    Document
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    trainId: {
      type: [String, Number],
      default: ''
    }
  },
  emits: ['update:visible', 'submit', 'cancel'],
  setup(props, { emit }) {
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    });

    const uploadRef = ref(null);
    const uploading = ref(false);

    // 表单数据
    const form = ref({
      fileType: 'record', // 默认为留底文件
      remark: '',
      files: []
    });

    // 文件列表
    const fileList = ref([]);

    // 预览相关
    const previewVisible = ref(false);
    const previewFile = ref({});
    const previewUrl = ref('');

    // 表单验证
    const isValid = computed(() => {
      return form.value.fileType && form.value.files.length > 0;
    });

    // 处理文件变化
    const handleFileChange = (file) => {
      // 验证文件类型
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const fileType = file.raw.type;
      
      if (!validTypes.includes(fileType)) {
        ElMessage.error('不支持的文件类型');
        return false;
      }

      // 验证文件大小（10MB）
      const maxSize = 10 * 1024 * 1024;
      if (file.raw.size > maxSize) {
        ElMessage.error('文件大小不能超过 10MB');
        return false;
      }

      // 添加到文件列表
      if (!form.value.files.includes(file.raw)) {
        form.value.files.push(file.raw);
      }
    };

    // 处理文件移除
    const handleFileRemove = (file) => {
      const index = form.value.files.findIndex(f => f === file.raw);
      if (index > -1) {
        form.value.files.splice(index, 1);
      }
    };

    // 判断是否为图片文件
    const isImageFile = (file) => {
      if (!file || !file.name) return false;
      const extension = file.name.split('.').pop().toLowerCase();
      return ['jpg', 'jpeg', 'png'].includes(extension);
    };

    // 处理文件预览
    const handleFilePreview = (file) => {
      previewFile.value = file;
      if (isImageFile(file)) {
        // 图片文件，创建预览URL
        previewUrl.value = URL.createObjectURL(file.raw);
      } else {
        // 非图片文件
        previewUrl.value = '';
      }
      previewVisible.value = true;
    };

    // 关闭预览
    const closePreview = () => {
      previewVisible.value = false;
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
        previewUrl.value = '';
      }
    };

    // 下载文件
    const downloadFile = () => {
      if (previewFile.value && previewFile.value.raw) {
        const url = URL.createObjectURL(previewFile.value.raw);
        const a = document.createElement('a');
        a.href = url;
        a.download = previewFile.value.name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
      }
    };

    // 处理提交
    const handleSubmit = async () => {
      if (!isValid.value) {
        ElMessage.warning('请选择文件类型并上传文件');
        return;
      }

      uploading.value = true;
      try {
        // 构建提交数据
        const formData = {
          trainId: props.trainId,
          fileTag: form.value.fileType,
          remark: form.value.remark,
          files: form.value.files
        };

        // 触发提交事件
        emit('submit', formData);
      } catch (error) {
        console.error('文件上传失败:', error);
        ElMessage.error('文件上传失败');
      } finally {
        uploading.value = false;
      }
    };

    // 处理关闭
    const handleClose = () => {
      // 清理预览URL
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
      }
      
      // 重置表单
      form.value = {
        fileType: 'record',
        remark: '',
        files: []
      };
      fileList.value = [];
      previewVisible.value = false;
      
      // 触发关闭事件
      emit('cancel');
      dialogVisible.value = false;
    };

    // 监听visible变化
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        // 打开弹窗时，重置表单
        form.value = {
          fileType: 'record',
          remark: '',
          files: []
        };
        fileList.value = [];
        previewVisible.value = false;
      }
    });

    return {
      dialogVisible,
      form,
      fileList,
      uploadRef,
      uploading,
      previewVisible,
      previewFile,
      previewUrl,
      isValid,
      handleFileChange,
      handleFileRemove,
      handleFilePreview,
      isImageFile,
      closePreview,
      downloadFile,
      handleSubmit,
      handleClose
    };
  }
};
</script>

<style scoped>
.upload-container {
  padding: 20px 0;
}

.form-section {
  display: flex;
  margin-bottom: 20px;
}

.form-label {
  width: 100px;
  text-align: right;
  padding-right: 12px;
  color: #606266;
  line-height: 32px;
}

.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.form-content {
  flex: 1;
}

.upload-area {
  width: 100%;
}

.el-upload {
  width: 100%;
}

.el-upload-dragger {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.preview-container {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  background-color: #f8f8f8;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.preview-title {
  font-weight: bold;
  color: #303133;
}

.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background-color: #fff;
  border-radius: 4px;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #909399;
}

.preview-icon {
  font-size: 48px;
}
</style> 