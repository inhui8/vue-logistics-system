<template>
  <el-dialog
    title="文件上传"
    v-model="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="100px">
      <!-- 文件标签选择 -->
      <el-form-item label="文件标签" required>
        <el-select v-model="form.fileTag" placeholder="请选择文件标签" style="width: 100%">
          <el-option label="异常文件" value="abnormal"></el-option>
          <el-option label="留底文件" value="record"></el-option>
        </el-select>
      </el-form-item>

      <!-- 备注信息 -->
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
        ></el-input>
      </el-form-item>

      <!-- 文件上传区域 -->
      <el-form-item label="上传文件" required>
        <el-upload
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :file-list="fileList"
          :limit="5"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 .pdf、.jpg、.jpeg、.png 格式，单个文件不超过 10MB
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :disabled="!isValid">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'FileUploadWithTagDialog',
  components: {
    UploadFilled
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'submit', 'cancel'],
  setup(props, { emit }) {
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    })

    const form = ref({
      fileTag: '',
      remark: '',
      files: []
    })

    const fileList = ref([])

    // 表单验证
    const isValid = computed(() => {
      return form.value.fileTag && fileList.value.length > 0
    })

    // 处理文件变化
    const handleFileChange = (file) => {
      // 验证文件类型
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!validTypes.includes(file.raw.type)) {
        ElMessage.error('不支持的文件类型')
        return false
      }

      // 验证文件大小（10MB）
      const maxSize = 10 * 1024 * 1024
      if (file.raw.size > maxSize) {
        ElMessage.error('文件大小不能超过 10MB')
        return false
      }

      form.value.files.push(file.raw)
    }

    // 处理文件移除
    const handleFileRemove = (file) => {
      const index = form.value.files.findIndex(f => f === file.raw)
      if (index > -1) {
        form.value.files.splice(index, 1)
      }
    }

    // 处理提交
    const handleSubmit = () => {
      if (!isValid.value) {
        ElMessage.warning('请选择文件标签并上传文件')
        return
      }

      emit('submit', {
        fileTag: form.value.fileTag,
        remark: form.value.remark,
        files: form.value.files
      })
    }

    // 处理关闭
    const handleClose = () => {
      form.value = {
        fileTag: '',
        remark: '',
        files: []
      }
      fileList.value = []
      emit('cancel')
    }

    return {
      dialogVisible,
      form,
      fileList,
      isValid,
      handleFileChange,
      handleFileRemove,
      handleSubmit,
      handleClose
    }
  }
}
</script>

<style scoped>
.upload-area {
  width: 100%;
}

.el-upload {
  width: 100%;
}

.el-upload-dragger {
  width: 100%;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 