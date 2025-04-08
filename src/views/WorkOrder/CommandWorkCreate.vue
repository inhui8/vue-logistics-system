<template>
    <div class="work-order-create-container">
      <el-page-header @back="goBack" content="创建新工单"></el-page-header>
  
      <el-card class="form-card" shadow="never">
          <el-form :model="form" ref="workOrderFormRef" :rules="rules" label-width="120px">
              <el-form-item label="工单类型" prop="type">
                   <el-select v-model="form.type" placeholder="请选择工单类型">
                      <el-option label="异常订单处理" value="exception"></el-option>
                      <el-option label="指令执行" value="command"></el-option>
                      <el-option label="订单预警响应" value="warning"></el-option>
                      <el-option label="增值服务请求" value="value_added"></el-option>
                      <el-option label="其他问题" value="other"></el-option>
                  </el-select>
              </el-form-item>
  
              <el-form-item label="关联订单号" prop="orderNo">
                  <el-input v-model="form.orderNo" placeholder="请输入关联的订单号 (选填)"></el-input>
                  <!-- 可以考虑添加搜索或选择订单的功能 -->
              </el-form-item>
  
              <el-form-item label="优先级" prop="priority">
                   <el-select v-model="form.priority" placeholder="请选择优先级">
                      <el-option label="紧急" value="urgent"></el-option>
                      <el-option label="高" value="high"></el-option>
                      <el-option label="中" value="medium"></el-option>
                      <el-option label="低" value="low"></el-option>
                  </el-select>
              </el-form-item>
  
              <el-form-item label="工单标题" prop="subject">
                  <el-input v-model="form.subject" placeholder="请简要描述问题或任务"></el-input>
              </el-form-item>
  
              <!-- 根据工单类型动态显示字段 -->
              <el-form-item v-if="form.type === 'exception'" label="异常类型" prop="exceptionType">
                   <el-select v-model="form.exceptionType" placeholder="请选择异常类型">
                      <el-option label="缺货" value="out_of_stock"></el-option>
                      <el-option label="地址错误" value="address_error"></el-option>
                      <el-option label="支付问题" value="payment_issue"></el-option>
                      <el-option label="客户投诉" value="customer_complaint"></el-option>
                       <el-option label="系统错误" value="system_error"></el-option>
                       <!-- 可以添加更多类型 -->
                  </el-select>
              </el-form-item>
  
              <el-form-item v-if="form.type === 'warning'" label="预警来源" prop="warningSource">
                  <el-input v-model="form.warningSource" placeholder="例如：低库存预警、潜在延误预警"></el-input>
              </el-form-item>
  
               <el-form-item v-if="form.type === 'value_added'" label="服务项目" prop="serviceItem">
                  <el-input v-model="form.serviceItem" placeholder="例如：礼品包装、特殊配送、安装调试"></el-input>
              </el-form-item>
  
              <el-form-item :label="descriptionLabel" prop="description">
                   <el-input
                      type="textarea"
                      :rows="5"
                      placeholder="请详细描述情况、指令内容或服务要求"
                      v-model="form.description">
                  </el-input>
              </el-form-item>
  
               <el-form-item label="最晚完成时间" prop="dueAt">
                   <el-date-picker
                      v-model="form.dueAt"
                      type="datetime"
                      placeholder="选择日期时间">
                  </el-date-picker>
              </el-form-item>
  
               <el-form-item label="库位" prop="location">
                   <el-input v-model="form.location" placeholder="请输入库位信息"></el-input>
              </el-form-item>
  
               <el-form-item label="板数" prop="palletCount">
                   <el-input-number v-model="form.palletCount" :min="0" :precision="0" placeholder="请输入板数"></el-input-number>
              </el-form-item>
  
               <el-form-item label="附件">
                   <el-upload
                      class="upload-demo"
                      action="#"
                      :auto-upload="false"
                      multiple>
                      <el-button type="primary">点击上传</el-button>
                      <template #tip>
                          <div class="el-upload__tip">上传截图或文件有助于更快解决问题</div>
                      </template>
                  </el-upload>
              </el-form-item>
  
              <el-form-item label="指派给" prop="assignee">
                  <!-- 这里可以使用用户/团队选择器组件 -->
                   <el-select v-model="form.assignee" placeholder="选择处理人或团队" filterable clearable>
                       <!-- 假设 users 是从 API 获取的用户列表 -->
                      <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
                  </el-select>
              </el-form-item>
  
               <el-form-item label="抄送给">
                  <!-- 类似指派给，但可能是多选 -->
                  <el-select v-model="form.cc" placeholder="选择抄送人 (可选)" multiple filterable clearable>
                      <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
                  </el-select>
              </el-form-item>
  
               <!-- 如果需要显示关联的客户信息 -->
              <el-form-item v-if="form.relatedCustomer" label="客户信息">
                  <span>{{ form.relatedCustomer.name }} (ID: {{ form.relatedCustomer.id }})</span>
              </el-form-item>
  
               <el-form-item>
                   <el-button type="primary" @click="submitForm">提交工单</el-button>
                  <el-button @click="resetForm">重置</el-button>
              </el-form-item>
          </el-form>
      </el-card>
  
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage } from 'element-plus'; // 引入提示
  
  const router = useRouter();
  const workOrderFormRef = ref(null); // 表单引用
  
  // 模拟用户数据 (实际应从API获取)
  const users = ref([
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
      { id: 3, name: '客服团队' },
  ]);
  
  const form = reactive({
      type: 'exception', // 默认工单类型
      orderNo: '',
      priority: 'medium', // 默认优先级
      subject: '',
      exceptionType: '',
      warningSource: '',
      serviceItem: '',
      description: '',
      dueAt: null,
      location: '',
      palletCount: 0,
      attachments: [], // 存储附件信息
      assignee: null,
      cc: [],
      relatedCustomer: null, // 示例：关联的客户信息
  });
  
  // 动态计算描述标签
  const descriptionLabel = computed(() => {
      switch (form.type) {
          case 'command': return '指令内容';
          case 'value_added': return '服务要求';
          case 'exception':
          case 'warning':
          case 'other':
          default:
              return '详细情况';
      }
  });
  
  // 表单验证规则
  const rules = reactive({
      type: [
          { required: true, message: '请选择工单类型', trigger: 'change' },
      ],
      priority: [
          { required: true, message: '请选择优先级', trigger: 'change' },
      ],
      subject: [
          { required: true, message: '请输入工单标题', trigger: 'blur' },
          { min: 5, message: '标题长度至少 5 个字符', trigger: 'blur' },
      ],
      description: [
          { required: true, message: '请输入详细情况', trigger: 'blur' },
          { min: 10, message: '描述内容至少 10 个字符', trigger: 'blur' },
      ],
      dueAt: [
          { required: true, message: '请选择最晚完成时间', trigger: 'change' },
      ],
      location: [
          { required: true, message: '请输入库位信息', trigger: 'blur' },
      ],
      palletCount: [
          { required: true, message: '请输入板数', trigger: 'blur' },
          { type: 'number', min: 0, message: '板数必须大于等于0', trigger: 'blur' },
      ],
      exceptionType: [
          // 仅当类型为 exception 时需要
          { validator: (rule, value, callback) => {
              if (form.type === 'exception' && !value) {
                  callback(new Error('请选择异常类型'));
              } else {
                  callback();
              }
           }, trigger: 'change' }
      ],
      warningSource: [
          { validator: (rule, value, callback) => {
              if (form.type === 'warning' && !value) {
                  callback(new Error('请输入预警来源'));
              } else {
                  callback();
              }
           }, trigger: 'blur' }
      ],
      serviceItem: [
          { validator: (rule, value, callback) => {
              if (form.type === 'value_added' && !value) {
                  callback(new Error('请输入服务项目'));
              } else {
                  callback();
              }
           }, trigger: 'blur' }
      ],
      assignee: [
          { required: true, message: '请选择处理人或团队', trigger: 'change' },
      ],
  });
  
  const goBack = () => {
      router.back();
  };
  
  const submitForm = () => {
      workOrderFormRef.value.validate((valid) => {
          if (valid) {
              console.log('Submit!', form);
              // 在这里调用 API 提交表单数据
              ElMessage.success('工单创建成功!');
              // 提交成功后可以跳转到列表页或详情页
              // router.push('/work-order/list');
          } else {
              console.log('error submit!!');
              ElMessage.error('表单校验失败，请检查输入');
              return false;
          }
      });
  };
  
  const resetForm = () => {
      workOrderFormRef.value.resetFields();
      // 可能需要手动重置非表单项关联的数据，例如附件列表
      form.attachments = [];
      form.relatedCustomer = null;
      // 根据需要设置默认值
      form.type = 'exception';
      form.priority = 'medium';
  };
  
  onMounted(() => {
      // 可以在这里获取必要的初始数据，比如用户信息等
      // fetchUsers();
      // 如果是从特定上下文（如订单详情页）跳转过来的，可以预填部分信息
      // const { relatedOrderNo } = router.currentRoute.value.query;
      // if(relatedOrderNo) form.orderNo = relatedOrderNo;
  });
  
  </script>
  
  <style scoped>
  .work-order-create-container {
    padding: 20px;
  }
  
  .el-page-header {
    margin-bottom: 20px;
  }
  
  .form-card {
      /* 可选，为表单添加卡片样式 */
  }
  
  .el-select {
      width: 100%; /* 让下拉选择框撑满 */
  }
  
  .el-date-picker {
      width: 100%;
  }
  
  .upload-demo {
      /* 上传组件样式调整 */
  }
  
  .el-upload__tip {
      font-size: 12px;
      color: #909399;
      margin-top: 7px;
  }
  </style> 