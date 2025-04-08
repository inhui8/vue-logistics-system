<!-- eslint-disable -->
<template>
  <el-dialog
    title="更新签收"
    v-model="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="upload-pod-container">
      <!-- 签收时间 -->
      <div class="form-item">
        <label class="label">签收时间：</label>
        <el-date-picker
          v-model="receiveTime"
          type="datetime"
          placeholder="请选择日期时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="date-picker"
        />
      </div>

      <!-- POD文件上传区域 -->
      <div class="upload-area">
        <label class="label">POD文件：</label>
        <div class="upload-boxes">
          <!-- ISA文件上传 -->
          <div class="upload-box">
            <div class="upload-content" @click="handleIsaUpload">
              <i class="el-icon-upload"></i>
              <p class="upload-text">将ISA文件拖到此处，或点击上传</p>
            </div>
            <input
              ref="isaFileInput"
              type="file"
              style="display: none"
              @change="handleIsaFileChange"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>
          
          <!-- BOL文件上传 -->
          <div class="upload-box">
            <div class="upload-content" @click="handleBolUpload">
              <i class="el-icon-upload"></i>
              <p class="upload-text">将BOL文件拖到此处，或点击上传</p>
            </div>
            <input
              ref="bolFileInput"
              type="file"
              style="display: none"
              @change="handleBolFileChange"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="uploading">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'UploadPodDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'submit', 'cancel'],
  setup(props, { emit }) {
    const dialogVisible = ref(props.visible);
    const receiveTime = ref('');
    const isaFileInput = ref(null);
    const bolFileInput = ref(null);
    const isaFile = ref(null);
    const bolFile = ref(null);
    const uploading = ref(false);

    // 监听visible属性变化
    watch(() => props.visible, (newVal) => {
      dialogVisible.value = newVal;
    });

    // 处理ISA文件上传点击
    const handleIsaUpload = () => {
      isaFileInput.value.click();
    };

    // 处理BOL文件上传点击
    const handleBolUpload = () => {
      bolFileInput.value.click();
    };

    // 处理ISA文件选择
    const handleIsaFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        isaFile.value = file;
        ElMessage.success(`已选择ISA文件: ${file.name}`);
      }
    };

    // 处理BOL文件选择
    const handleBolFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        bolFile.value = file;
        ElMessage.success(`已选择BOL文件: ${file.name}`);
      }
    };

    // 处理关闭
    const handleClose = () => {
      dialogVisible.value = false;
      emit('update:visible', false);
      emit('cancel');
      // 重置表单
      receiveTime.value = '';
      isaFile.value = null;
      bolFile.value = null;
      if (isaFileInput.value) isaFileInput.value.value = '';
      if (bolFileInput.value) bolFileInput.value.value = '';
    };

    // 处理提交
    const handleSubmit = async () => {
      if (!receiveTime.value) {
        ElMessage.warning('请选择签收时间');
        return;
      }

      if (!isaFile.value && !bolFile.value) {
        ElMessage.warning('请至少上传一个POD文件');
        return;
      }

      uploading.value = true;
      try {
        // 这里添加文件上传逻辑
        const formData = new FormData();
        formData.append('receiveTime', receiveTime.value);
        if (isaFile.value) formData.append('isaFile', isaFile.value);
        if (bolFile.value) formData.append('bolFile', bolFile.value);

        // 触发提交事件
        emit('submit', formData);
        handleClose();
      } catch (error) {
        console.error('上传失败:', error);
        ElMessage.error('上传失败，请重试');
      } finally {
        uploading.value = false;
      }
    };

    return {
      dialogVisible,
      receiveTime,
      isaFileInput,
      bolFileInput,
      uploading,
      handleIsaUpload,
      handleBolUpload,
      handleIsaFileChange,
      handleBolFileChange,
      handleClose,
      handleSubmit
    };
  }
};
</script>

<style scoped>
.upload-pod-container {
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.label {
  width: 80px;
  color: #606266;
  font-size: 14px;
}

.date-picker {
  width: 220px;
}

.upload-area {
  display: flex;
  margin-bottom: 20px;
}

.upload-boxes {
  flex: 1;
  display: flex;
  gap: 20px;
}

.upload-box {
  flex: 1;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.3s;
  background-color: #fff;
}

.upload-box:hover {
  border-color: #409EFF;
}

.upload-content {
  padding: 40px 20px;
  text-align: center;
}

.upload-content i {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.dialog-footer {
  padding-top: 20px;
  text-align: right;
}
</style> 