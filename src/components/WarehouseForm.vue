<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="平台" prop="platform">
          <el-select v-model="formData.platform" placeholder="请选择平台" style="width: 100%;">
            <el-option label="Amazon" value="Amazon"></el-option>
            <el-option label="Walmart" value="Walmart"></el-option>
            <el-option label="eBay" value="eBay"></el-option>
            <el-option label="Shopify" value="Shopify"></el-option>
            <el-option label="Other" value="Other"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="仓库代码" prop="warehouseCode">
          <el-input v-model="formData.warehouseCode" placeholder="请输入仓库代码"></el-input>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="国家" prop="country">
          <el-select v-model="formData.country" placeholder="请选择国家" style="width: 100%;">
            <el-option label="美国" value="US"></el-option>
            <el-option label="加拿大" value="CA"></el-option>
            <el-option label="墨西哥" value="MX"></el-option>
            <el-option label="中国" value="CN"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="省/州" prop="state">
          <el-input v-model="formData.state" placeholder="请输入省/州"></el-input>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="城市" prop="city">
          <el-input v-model="formData.city" placeholder="请输入城市"></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="邮编" prop="zipCode">
          <el-input v-model="formData.zipCode" placeholder="请输入邮编"></el-input>
        </el-form-item>
      </el-col>
    </el-row>
    <el-form-item label="地址1" prop="address1">
      <el-input v-model="formData.address1" placeholder="请输入详细地址"></el-input>
    </el-form-item>
    <el-form-item label="地址2" prop="address2">
      <el-input v-model="formData.address2" placeholder="请输入详细地址（可选）"></el-input>
    </el-form-item>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入电子邮箱"></el-input>
        </el-form-item>
      </el-col>
       <el-col :span="12">
         <el-form-item label="限高(Inch)" prop="maxHeight">
          <el-input-number v-model="formData.maxHeight" :min="0" controls-position="right" style="width: 100%;"></el-input-number>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
         <el-form-item label="快递服务商" prop="expressProvider">
          <el-select v-model="formData.expressProvider" placeholder="请选择快递服务商" style="width: 100%;">
            <el-option label="UPS" value="UPS"></el-option>
            <el-option label="FedEx" value="FedEx"></el-option>
            <el-option label="DHL" value="DHL"></el-option>
            <el-option label="USPS" value="USPS"></el-option>
             <el-option label="Other" value="Other"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="状态" prop="status">
           <el-switch
              v-model="formData.status"
              active-value="normal"
              inactive-value="closed"
              active-text="启用"
              inactive-text="禁用"
            />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script>
import { ref, reactive, watch, nextTick } from 'vue'

export default {
  name: 'WarehouseForm',
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    },
    mode: {
      type: String,
      default: 'add' // 'add' or 'edit'
    }
  },
  emits: ['update:modelValue', 'submit'],
  setup(props) {
    const formRef = ref(null)
    const defaultFormData = () => ({
      platform: 'Amazon',
      warehouseCode: '',
      country: 'US',
      state: '',
      city: '',
      zipCode: '',
      address1: '',
      address2: '',
      email: '',
      expressProvider: '',
      maxHeight: null,
      status: 'normal'
    })

    const formData = reactive(defaultFormData())

    const rules = reactive({
      platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
      warehouseCode: [{ required: true, message: '请输入仓库代码', trigger: 'blur' }],
      country: [{ required: true, message: '请选择国家', trigger: 'change' }],
      state: [{ required: true, message: '请输入省/州', trigger: 'blur' }],
      city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
      zipCode: [{ required: true, message: '请输入邮编', trigger: 'blur' }],
      address1: [{ required: true, message: '请输入地址1', trigger: 'blur' }],
      maxHeight: [{ required: true, message: '请输入限高', trigger: 'blur' }, { type: 'number', message: '限高必须是数字'}],
      status: [{ required: true, message: '请选择状态', trigger: 'change' }]
    })

    // Watch for changes in initialData to populate form for editing
    watch(() => props.initialData, (newData) => {
      if (props.mode === 'edit' && newData && Object.keys(newData).length > 0) {
        Object.assign(formData, defaultFormData(), newData) // Merge defaults with new data
      } else {
        Object.assign(formData, defaultFormData()) // Reset to defaults for add mode
      }
       // Ensure form validation state is reset when data changes
      nextTick(() => {
        formRef.value?.clearValidate()
      })
    }, { immediate: true, deep: true })

    const validate = () => {
      return formRef.value?.validate()
    }

    const getFormData = () => {
       // Combine address lines if needed or return as is
      const dataToSubmit = { ...formData };
      // Example: Combine address lines
      // dataToSubmit.location = formData.address1 + (formData.address2 ? ' ' + formData.address2 : '');
      // delete dataToSubmit.address1;
      // delete dataToSubmit.address2;
      return dataToSubmit;
    }

    const resetForm = () => {
      Object.assign(formData, defaultFormData())
       nextTick(() => {
        formRef.value?.clearValidate()
      })
    }

    return {
      formRef,
      formData,
      rules,
      validate,
      getFormData,
      resetForm
    }
  }
}
</script>

<style scoped>
.el-form-item {
  margin-bottom: 18px; /* Adjust spacing */
}
.el-select, .el-input-number {
  width: 100%;
}
</style> 