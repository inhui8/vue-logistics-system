<!-- eslint-disable -->
<template>
  <div class="batch-detail-container">
    <!-- 头部操作栏 -->
    <div class="detail-header">
      <el-button @click="goBack" icon="el-icon-back">返回</el-button>
      <div class="header-title">出库批次详情</div>
      <div class="header-actions">
        <el-button type="primary" @click="handleEdit">编辑</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <!-- 详情页Tab切换 -->
    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="基本信息" name="basic">
        <!-- 基本信息区域 -->
        <div class="basic-info-section">
          <h3 class="section-title">批次基本信息</h3>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="批次号">{{ basicInfo.batchNumber }}</el-descriptions-item>
            <el-descriptions-item label="装车类型">
              <el-select v-model="basicInfo.loadingType" size="small" style="width: 120px">
                <el-option label="卡板" value="卡板"></el-option>
                <el-option label="地板" value="地板"></el-option>
                <el-option label="混装" value="混装"></el-option>
                <el-option label="快递" value="快递"></el-option>
              </el-select>
            </el-descriptions-item>
            <el-descriptions-item label="派送标签">
              <el-select v-model="basicInfo.deliveryTag" size="small" style="width: 120px">
                <el-option label="优先派送" value="优先派送"></el-option>
                <el-option label="标准派送" value="标准派送"></el-option>
                <el-option label="特殊派送" value="特殊派送"></el-option>
                <el-option label="自提" value="自提"></el-option>
                <el-option label="快递派送" value="快递派送"></el-option>
                <el-option label="整车运输" value="整车运输"></el-option>
              </el-select>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ basicInfo.createTime }}</el-descriptions-item>
            <el-descriptions-item label="预约日期">
              <el-date-picker
                v-model="basicInfo.appointmentDate"
                type="datetime"
                size="small"
                style="width: 180px"
                placeholder="选择日期时间">
              </el-date-picker>
            </el-descriptions-item>
            <el-descriptions-item label="预约号">
              <el-input v-model="basicInfo.appointmentNumber" size="small" style="width: 120px"></el-input>
            </el-descriptions-item>
            <el-descriptions-item label="派送方式">
              <el-select v-model="basicInfo.deliveryMethod" size="small" style="width: 120px">
                <el-option label="自配送" value="自配送"></el-option>
                <el-option label="第三方" value="第三方"></el-option>
                <el-option label="快递" value="快递"></el-option>
              </el-select>
            </el-descriptions-item>
            <el-descriptions-item label="创建人">
              <el-input v-model="basicInfo.creator" size="small" disabled style="width: 120px"></el-input>
            </el-descriptions-item>
            <el-descriptions-item label="供应商">
              <el-select v-model="basicInfo.supplier" size="small" style="width: 150px">
                <el-option v-for="supplier in supplierOptions" 
                  :key="supplier.value" 
                  :label="supplier.label" 
                  :value="supplier.value">
                </el-option>
              </el-select>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getBatchStatusType(basicInfo.batchStatus)">{{ basicInfo.batchStatus }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="卡板数">
              <el-input-number v-model="basicInfo.palletCount" size="small" :min="0" style="width: 120px"></el-input-number>
            </el-descriptions-item>
            <el-descriptions-item label="出库体积">
              <el-input-number v-model="basicInfo.outboundVolume" size="small" :min="0" :precision="2" style="width: 120px"></el-input-number>
            </el-descriptions-item>
            <el-descriptions-item label="目的地">
              <el-input v-model="basicInfo.destination" size="small" style="width: 150px"></el-input>
            </el-descriptions-item>
            <el-descriptions-item label="备注">
              <el-input v-model="basicInfo.remark" size="small" style="width: 200px"></el-input>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <el-tab-pane label="PC明细" name="pc">
        <!-- PC明细表格 -->
        <div class="pc-detail-section">
          <div class="section-header">
            <h3 class="section-title">PC明细</h3>
            <div class="section-actions">
              <el-button type="primary" size="small" @click="handleAddPC">添加PC</el-button>
              <el-button size="small" @click="handleExportPC">导出PC</el-button>
            </div>
          </div>
          
          <el-table :data="pcDetailData" border style="width: 100%">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column prop="pcNumber" label="PC号" width="120"></el-table-column>
            <el-table-column prop="appointmentParty" label="预约方" width="100">
              <template #default="scope">
                <el-input v-model="scope.row.appointmentParty" size="small" style="width: 100px"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="appointmentTime" label="预约时间" width="150">
              <template #default="scope">
                <el-date-picker
                  v-model="scope.row.appointmentTime"
                  type="datetime"
                  size="small"
                  style="width: 150px"
                  placeholder="选择日期时间">
                </el-date-picker>
              </template>
            </el-table-column>
            <el-table-column prop="appointmentNumber" label="预约号" width="120">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.appointmentNumber" 
                  size="small" 
                  style="width: 120px">
                </el-input>
              </template>
            </el-table-column>
            <el-table-column prop="startWarehouse" label="起始仓库" width="120" sortable></el-table-column>
            <el-table-column prop="destination" label="目的地" width="150" sortable>
              <template #default="scope">
                <span style="color: #1890ff" v-if="scope.row.destination && scope.row.destination.includes('Amazon')">
                  {{ scope.row.destination }}
                </span>
                <span v-else>{{ scope.row.destination }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="palletCount" label="板数" width="100" sortable>
              <template #default="scope">
                <el-input v-model.number="scope.row.palletCount" type="number" min="0" size="small" style="width: 80px"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="weight" label="重量(kg)" width="120" sortable>
              <template #default="scope">
                <el-input v-model.number="scope.row.weight" type="number" min="0" size="small" step="0.01" style="width: 100px"></el-input> 
              </template>
            </el-table-column>
            <el-table-column prop="loadingType" label="装车类型" width="100" sortable>
              <template #default="scope">
                <el-select v-model="scope.row.loadingType" size="small" style="width: 100px">
                  <el-option label="卡板" value="卡板"></el-option>
                  <el-option label="地板" value="地板"></el-option>
                  <el-option label="混装" value="混装"></el-option>
                  <el-option label="快递" value="快递"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="boxCount" label="箱数" width="100" sortable>
               <template #default="scope">
                <el-input v-model.number="scope.row.boxCount" type="number" min="0" size="small" style="width: 80px"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="volume" label="方数(m³)" width="120" sortable> 
              <template #default="scope">
                <el-input v-model.number="scope.row.volume" type="number" min="0" size="small" step="0.01" style="width: 100px"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" sortable>
              <template #default="scope">
                <el-tag :type="getPCStatusTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" width="120">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.remark" 
                  size="small" 
                  style="width: 120px">
                </el-input>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="scope">
                <el-button type="text" size="small" @click="handleViewPC(scope.row)">查看</el-button>
                <el-dropdown size="small" @command="command => handlePCCommand(command, scope.row)">
                  <el-button type="text" size="small">
                    更多<i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="uploadPod">上传POD</el-dropdown-item>
                      <el-dropdown-item command="followUp">跟进记录</el-dropdown-item>
                      <el-dropdown-item command="memo">MEMO</el-dropdown-item>
                      <el-dropdown-item command="exception">标记异常</el-dropdown-item>
                      <el-dropdown-item command="delete">删除PC</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="费用明细" name="expense">
        <!-- 费用明细组件 -->
        <div class="expense-detail-section">
          <div class="expense-header">
            <h3 class="section-title">费用明细</h3>
            <div class="expense-actions">
              <el-button type="primary" size="small" @click="handleAddExpense">添加费用</el-button>
              <el-button type="success" size="small" @click="handleBatchPushExpense">批量推送费用</el-button>
              <el-button size="small" @click="handleExportExpense">导出费用</el-button>
            </div>
          </div>
          
          <!-- 费用类型分类 -->
          <el-tabs v-model="expenseActiveTab" type="card" class="expense-type-tabs">
            <el-tab-pane label="全部费用" name="all">
              <el-table :data="allExpenses" border style="width: 100%" @selection-change="handleExpenseSelectionChange">
                <el-table-column type="selection" width="55"></el-table-column>
                <el-table-column prop="pcNumber" label="PC号" width="120"></el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getExpenseStatusTagType(scope.row.status)">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="fromWarehouse" label="起始仓库" width="120"></el-table-column>
                <el-table-column prop="toWarehouse" label="目的仓库" width="120"></el-table-column>
                <el-table-column prop="paymentNo" label="付款申请号" width="150"></el-table-column>
                <el-table-column prop="supplier" label="供应商" width="120"></el-table-column>
                <el-table-column prop="expenseType" label="费用类型" width="120">
                  <template #default="scope">
                    <el-select v-model="scope.row.expenseType" size="small" style="width: 100px">
                      <el-option v-for="type in expenseTypes" 
                        :key="type.value" 
                        :label="type.label" 
                        :value="type.value">
                      </el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="expenseRemark" label="费用备注" width="200">
                  <template #default="scope">
                    <el-input
                      v-model="scope.row.expenseRemark"
                      size="small"
                      placeholder="请输入备注"
                    ></el-input>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="金额" width="120">
                  <template #default="scope">
                    <el-input-number
                      v-model="scope.row.amount"
                      size="small"
                      :min="0"
                      :precision="2"
                      :step="100"
                      style="width: 100px"
                    ></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="expenseDate" label="费用日期" width="120"></el-table-column>
                <el-table-column prop="operator" label="操作人" width="100"></el-table-column>
                <el-table-column prop="operateTime" label="操作时间" width="150"></el-table-column>
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="scope">
                    <el-button type="text" size="small" @click="handleEditExpense(scope.row)">编辑</el-button>
                    <el-dropdown size="small" @command="command => handleExpenseCommand(command, scope.row)">
                      <el-button type="text" size="small">
                        更多<i class="el-icon-arrow-down el-icon--right"></i>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="push">推送费用</el-dropdown-item>
                          <el-dropdown-item command="delete">删除</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="派送费" name="delivery">
              <el-table :data="deliveryExpenses" border style="width: 100%">
                <el-table-column type="selection" width="55"></el-table-column>
                <el-table-column prop="pcNumber" label="PC号" width="120"></el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getExpenseStatusTagType(scope.row.status)">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="金额" width="120">
                  <template #default="scope">
                    <el-input-number
                      v-model="scope.row.amount"
                      size="small"
                      :min="0"
                      :precision="2"
                      :step="100"
                      style="width: 100px"
                    ></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="paymentStatus" label="支付状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getPaymentStatusTagType(scope.row.paymentStatus)">
                      {{ scope.row.paymentStatus }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="expenseRemark" label="费用备注" width="200">
                  <template #default="scope">
                    <el-input
                      v-model="scope.row.expenseRemark"
                      size="small"
                      placeholder="请输入备注"
                    ></el-input>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="scope">
                    <el-button type="text" size="small" @click="handleEditExpense(scope.row)">编辑</el-button>
                    <el-button type="text" size="small" @click="handleDeleteExpense(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="异常费" name="abnormal">
              <el-table :data="abnormalExpenses" border style="width: 100%">
                <el-table-column type="selection" width="55"></el-table-column>
                <el-table-column prop="expenseType" label="费用类型" width="120"></el-table-column>
                <el-table-column prop="amount" label="金额" width="120"></el-table-column>
                <el-table-column prop="paymentStatus" label="支付状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getPaymentStatusTagType(scope.row.paymentStatus)">
                      {{ scope.row.paymentStatus }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="expenseRemark" label="费用备注" width="200"></el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="其他费用" name="other">
              <el-table :data="otherExpenses" border style="width: 100%">
                <el-table-column type="selection" width="55"></el-table-column>
                <el-table-column prop="expenseType" label="费用类型" width="120"></el-table-column>
                <el-table-column prop="amount" label="金额" width="120"></el-table-column>
                <el-table-column prop="paymentStatus" label="支付状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getPaymentStatusTagType(scope.row.paymentStatus)">
                      {{ scope.row.paymentStatus }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="expenseRemark" label="费用备注" width="200"></el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>

          <!-- 费用统计 -->
          <div class="expense-summary">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="总费用">
                <span class="total-amount">{{ totalExpense }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="已支付">
                <span class="paid-amount">{{ paidExpense }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="未支付">
                <span class="unpaid-amount">{{ unpaidExpense }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="文件上传" name="file">
        <!-- 文件上传区域 -->
        <div class="file-upload-section">
          <div class="upload-header">
            <h3 class="section-title">文件管理</h3>
            <div>
              <el-button type="primary" size="small" @click="showFileUploadDialog">上传文件</el-button>
              <el-button type="success" size="small" @click="handleBatchApprove">批量审核</el-button>
            </div>
          </div>
          
          <!-- 文件列表 -->
          <el-table :data="fileList" border style="width: 100%" @selection-change="handleFileSelectionChange">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column prop="fileName" label="文件名" min-width="200"></el-table-column>
            <el-table-column prop="fileType" label="文件类型" width="120">
              <template #default="scope">
                <el-tag :type="getFileTypeTagType(scope.row.fileType)">{{ getFileTypeLabel(scope.row.fileType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="fileSize" label="文件大小" width="120"></el-table-column>
            <el-table-column prop="uploadTime" label="上传时间" width="180"></el-table-column>
            <el-table-column prop="uploadBy" label="上传人" width="120"></el-table-column>
            <el-table-column prop="status" label="审核状态" width="120">
              <template #default="scope">
                <el-tag :type="getFileStatusTagType(scope.row.status)">
                  {{ getFileStatusLabel(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150"></el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-dropdown size="small" @command="command => handleFileCommand(command, scope.row)">
                  <el-button type="text" size="small">
                    更多<i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="preview">预览</el-dropdown-item>
                      <el-dropdown-item command="download">下载</el-dropdown-item>
                      <el-dropdown-item command="approve" v-if="scope.row.status === 'pending'">审核通过</el-dropdown-item>
                      <el-dropdown-item command="reject" v-if="scope.row.status === 'pending'">审核不通过</el-dropdown-item>
                      <el-dropdown-item command="pushCustomerService" v-if="scope.row.status === 'approved'">推送客服</el-dropdown-item>
                      <el-dropdown-item command="pushCustomer" v-if="scope.row.status === 'approved'">推送客户</el-dropdown-item>
                      <el-dropdown-item command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加PC对话框 -->
    <el-dialog title="添加PC到批次" v-model="addPcDialogVisible" width="70%">
      <el-input
        v-model="searchPcQuery"
        placeholder="搜索PC号"
        size="small"
        clearable
        style="margin-bottom: 10px; width: 300px;"
      ></el-input>
      <el-table
        :data="filteredAvailablePcs"
        border
        style="width: 100%"
        height="400px"
        @selection-change="handleAvailablePcSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="pcNumber" label="PC号" width="150"></el-table-column>
        <el-table-column prop="appointmentParty" label="预约方" width="100"></el-table-column>
        <el-table-column prop="appointmentTime" label="预约时间" width="160"></el-table-column>
        <el-table-column prop="appointmentNumber" label="预约号" width="120"></el-table-column>
        <el-table-column prop="startWarehouse" label="起始仓库" width="120"></el-table-column>
        <el-table-column prop="destination" label="目的地" width="150"></el-table-column>
        <el-table-column prop="palletCount" label="板数" width="80"></el-table-column>
        <el-table-column prop="weight" label="重量(kg)" width="100"></el-table-column>
        <el-table-column prop="loadingType" label="装车类型" width="100"></el-table-column>
        <el-table-column prop="boxCount" label="箱数" width="80"></el-table-column>
        <el-table-column prop="volume" label="方数(m³)" width="100"></el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelAddPc">取消</el-button>
          <el-button type="primary" @click="handleConfirmAddPc">确认添加</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 费用明细对话框 -->
    <el-dialog title="费用编辑" v-model="expenseDialogVisible" width="600px">
      <el-form :model="currentExpense" label-width="100px">
        <el-form-item label="PC号">
          <el-select v-model="currentExpense.pcNumber" placeholder="选择PC号" style="width: 100%">
            <el-option 
              v-for="pc in pcDetailData" 
              :key="pc.pcNumber" 
              :label="pc.pcNumber" 
              :value="pc.pcNumber">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="费用类型">
          <el-select v-model="currentExpense.expenseType" placeholder="选择费用类型" style="width: 100%">
            <el-option v-for="type in expenseTypes" 
              :key="type.value" 
              :label="type.label" 
              :value="type.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="currentExpense.amount" :min="0" :precision="2" :step="100" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="currentExpense.paymentStatus" placeholder="选择支付状态" style="width: 100%">
            <el-option label="已付款" value="已付款"></el-option>
            <el-option label="待付款" value="待付款"></el-option>
            <el-option label="部分付款" value="部分付款"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="费用备注">
          <el-input 
            v-model="currentExpense.expenseRemark" 
            type="textarea" 
            rows="3"
            placeholder="请输入费用备注"
            style="width: 100%"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleExpenseCancel">取消</el-button>
          <el-button type="primary" @click="handleExpenseSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 文件上传弹窗 -->
    <el-dialog title="文件上传" v-model="fileUploadDialogVisible" width="600px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="文件类型">
          <el-select v-model="uploadForm.fileType" placeholder="选择文件类型" style="width: 100%">
            <el-option label="POD文件" value="pod"></el-option>
            <el-option label="签收单" value="receipt"></el-option>
            <el-option label="发票" value="invoice"></el-option>
            <el-option label="其他文件" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关联PC">
          <el-select v-model="uploadForm.relatedPC" multiple placeholder="选择关联的PC号" style="width: 100%">
            <el-option 
              v-for="pc in pcDetailData" 
              :key="pc.pcNumber" 
              :label="pc.pcNumber" 
              :value="pc.pcNumber">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :file-list="uploadFileList"
            :on-change="handleFileChange"
            multiple
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持jpg、png、pdf格式文件，单个文件不超过10MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="uploadForm.remark" 
            type="textarea" 
            rows="3"
            placeholder="请输入备注"
            style="width: 100%"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelUpload">取消</el-button>
          <el-button type="primary" @click="handleConfirmUpload">确认上传</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

export default {
  name: 'OutgoingBatchDetail',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const batchId = route.params.id;

    // 当前激活的标签页
    const activeTab = ref('basic');

    // 供应商选项
    const supplierOptions = ref([
      { label: 'KKS LOGISTICS LLC', value: 'KKS LOGISTICS LLC' },
      { label: '第三方物流公司A', value: '第三方物流公司A' },
      { label: '第三方物流公司B', value: '第三方物流公司B' }
    ]);

    // 基本信息数据
    const basicInfo = ref({
      id: batchId,
      batchNumber: 'PC2504220106',
      loadingType: '卡板',
      deliveryTag: '标准派送',
      createTime: '2023-07-15 10:00:00',
      appointmentDate: '2023-07-15 14:00:00',
      appointmentNumber: 'APPT20230715001',
      deliveryMethod: '第三方',
      creator: '张三',
      supplier: 'KKS LOGISTICS LLC',
      batchStatus: '待出库',
      palletCount: 1,
      outboundVolume: 2.5,
      destination: '深圳市南山区',
      remark: 'kks私人地址第三车5'
    });

    // PC明细数据
    const pcDetailData = ref([
      {
        pcNumber: 'PC123456',
        loadingType: '卡板',
        orderType: '普通订单',
        destination: '深圳市南山区',
        palletCount: 1,
        weight: 800,
        volume: 1.5,
        appointmentNumber: 'APPT20230715001',
        appointmentTime: '2023-07-15 14:00:00',
        appointmentParty: '客户A',
        status: '待出库',
        remark: '无',
        startWarehouse: '东莞仓库',
        boxCount: 10
      },
      {
        pcNumber: 'PC654321',
        loadingType: '地板',
        orderType: '加急订单',
        destination: 'Amazon 洛杉矶仓库',
        palletCount: 3,
        weight: 1500,
        volume: 3.5,
        appointmentNumber: 'APPT20230716002',
        appointmentTime: '2023-07-16 10:00:00',
        appointmentParty: '客户B',
        status: '待确认预约',
        remark: '优先处理',
        startWarehouse: '广州仓库',
        boxCount: 25
      }
    ]);

    // 添加PC相关
    const addPcDialogVisible = ref(false);
    const availablePcs = ref([]); // 存储可添加的PC列表
    const searchPcQuery = ref(''); // PC搜索查询
    const selectedPcsToAdd = ref([]); // 在对话框中选中的PC

    // 费用模块相关
    const expenseActiveTab = ref('all');
    const expenseDialogVisible = ref(false);
    const currentExpense = ref({
      pcNumber: '',
      expenseType: '',
      amount: 0,
      paymentStatus: '待付款',
      expenseRemark: ''
    });
    const selectedExpenses = ref([]);

    // 费用类型选项
    const expenseTypes = ref([
      { label: '派送费', value: 'delivery' },
      { label: '装车费', value: 'loading' },
      { label: '等时费', value: 'waiting' },
      { label: '异常费', value: 'abnormal' },
      { label: '其他费用', value: 'other' }
    ]);

    // 费用数据
    const allExpenses = ref([
      {
        id: '1',
        pcNumber: 'PC123456',
        status: '已推送',
        fromWarehouse: '东莞仓库',
        toWarehouse: '深圳市南山区',
        paymentNo: 'PAY20230715001',
        supplier: 'KKS LOGISTICS LLC',
        expenseType: 'delivery',
        expenseRemark: '标准派送费',
        amount: 1000,
        expenseDate: '2023-07-15',
        operator: '张三',
        operateTime: '2023-07-15 11:00:00',
        paymentStatus: '已付款'
      },
      {
        id: '2',
        pcNumber: 'PC654321',
        status: '待推送',
        fromWarehouse: '广州仓库',
        toWarehouse: 'Amazon 洛杉矶仓库',
        paymentNo: '',
        supplier: 'KKS LOGISTICS LLC',
        expenseType: 'loading',
        expenseRemark: '加急装车费',
        amount: 500,
        expenseDate: '2023-07-16',
        operator: '李四',
        operateTime: '2023-07-16 09:00:00',
        paymentStatus: '待付款'
      }
    ]);

    // 根据类型筛选费用
    const deliveryExpenses = computed(() => {
      return allExpenses.value.filter(expense => expense.expenseType === 'delivery');
    });

    const abnormalExpenses = computed(() => {
      return allExpenses.value.filter(expense => expense.expenseType === 'abnormal');
    });

    const otherExpenses = computed(() => {
      return allExpenses.value.filter(expense => expense.expenseType === 'other');
    });

    // 费用统计
    const totalExpense = computed(() => {
      return allExpenses.value.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2);
    });

    const paidExpense = computed(() => {
      return allExpenses.value
        .filter(expense => expense.paymentStatus === '已付款')
        .reduce((sum, expense) => sum + expense.amount, 0)
        .toFixed(2);
    });

    const unpaidExpense = computed(() => {
      return allExpenses.value
        .filter(expense => expense.paymentStatus !== '已付款')
        .reduce((sum, expense) => sum + expense.amount, 0)
        .toFixed(2);
    });

    // 获取费用状态样式
    const getExpenseStatusTagType = (status) => {
      const statusMap = {
        '待推送': 'warning',
        '已推送': 'success',
        '已拒绝': 'danger'
      };
      return statusMap[status] || 'info';
    };

    // 获取支付状态样式
    const getPaymentStatusTagType = (status) => {
      const statusMap = {
        '已付款': 'success',
        '待付款': 'warning',
        '部分付款': 'info'
      };
      return statusMap[status] || 'info';
    };

    // 返回上一页
    const goBack = () => {
      router.back();
    };

    // 编辑操作
    const handleEdit = () => {
      ElMessage.success('触发编辑操作');
    };

    // 导出操作
    const handleExport = () => {
      ElMessage.success('触发导出操作');
    };

    // 获取批次状态样式
    const getBatchStatusType = (status) => {
      const statusMap = {
        '待出库': 'warning',
        '待确认订舱': 'info',
        '待确认预约': 'info',
        '已出库': 'success',
        '已签收': 'success',
        '已签收POD': 'success'
      };
      return statusMap[status] || 'info';
    };

    // 获取派送标签样式
    const getDeliveryTagType = (tag) => {
      const tagMap = {
        '优先派送': 'danger',
        '标准派送': 'primary',
        '特殊派送': 'warning',
        '自提': 'info',
        '快递派送': 'success',
        '整车运输': 'warning'
      };
      return tagMap[tag] || 'info';
    };

    // 获取PC状态标签样式
    const getPCStatusTagType = (status) => {
      const statusMap = {
        '待出库': 'warning',
        '待确认预约': 'info',
        '已出库': 'success',
        '已签收': 'success',
        '已签收POD': 'success',
        '异常': 'danger'
      };
      return statusMap[status] || 'info';
    };

    // 添加PC
    const handleAddPC = () => {
      fetchAvailablePcs();
      addPcDialogVisible.value = true;
    };

    // 导出PC
    const handleExportPC = () => {
      ElMessage.success('触发导出PC操作');
    };

    // 查看PC详情
    const handleViewPC = (row) => {
      ElMessage.success(`查看PC: ${row.pcNumber}`);
    };

    // PC下拉菜单操作
    const handlePCCommand = (command, row) => {
      switch (command) {
        case 'uploadPod':
          ElMessage.success(`上传POD: ${row.pcNumber}`);
          break;
        case 'followUp':
          ElMessage.success(`添加跟进记录: ${row.pcNumber}`);
          break;
        case 'memo':
          ElMessage.success(`添加MEMO: ${row.pcNumber}`);
          break;
        case 'exception':
          ElMessage.success(`标记异常: ${row.pcNumber}`);
          break;
        case 'delete':
          ElMessage.success(`删除PC: ${row.pcNumber}`);
          break;
      }
    };

    // 模拟的可添加PC列表
    const fetchAvailablePcs = () => {
      const existingPcNumbers = pcDetailData.value.map(pc => pc.pcNumber);
      // 模拟数据，确保包含所有对话框表格中显示的字段
      availablePcs.value = [
        { pcNumber: 'PC777777', appointmentParty: '客户C', appointmentTime: '2024-03-10 10:00:00', appointmentNumber: 'BK777', startWarehouse: '东莞仓库', destination: '芝加哥', palletCount: 5, weight: 1000, loadingType: '卡板', boxCount: 80, volume: 2 },
        { pcNumber: 'PC888888', appointmentParty: '客户D', appointmentTime: '2024-03-11 11:00:00', appointmentNumber: 'BK888', startWarehouse: '广州仓库', destination: '纽约', palletCount: 8, weight: 1800, loadingType: '地板', boxCount: 200, volume: 4 },
        { pcNumber: 'PC999999', appointmentParty: '客户E', appointmentTime: '2024-03-12 15:30:00', appointmentNumber: 'BK999', startWarehouse: '深圳仓库', destination: '洛杉矶', palletCount: 12, weight: 3000, loadingType: '混装', boxCount: 150, volume: 6 },
      ].filter(pc => !existingPcNumbers.includes(pc.pcNumber));
    };

    // 计算属性：过滤可添加的PC列表
    const filteredAvailablePcs = computed(() => {
      if (!searchPcQuery.value) {
        return availablePcs.value;
      }
      return availablePcs.value.filter(pc => 
        pc.pcNumber.toLowerCase().includes(searchPcQuery.value.toLowerCase())
      );
    });

    // 添加PC对话框 - 处理选中项变化
    const handleAvailablePcSelectionChange = (selection) => {
      selectedPcsToAdd.value = selection;
    };

    // 添加PC对话框 - 确认添加
    const handleConfirmAddPc = () => {
      if (selectedPcsToAdd.value.length === 0) {
        ElMessage.warning('请至少选择一个PC进行添加');
        return;
      }
      // 将选中的PC添加到pcDetailData
      const pcsToAdd = selectedPcsToAdd.value.map(pc => ({
        pcNumber: pc.pcNumber,
        appointmentParty: pc.appointmentParty || '',
        appointmentTime: pc.appointmentTime || '',
        appointmentNumber: pc.appointmentNumber || '',
        startWarehouse: pc.startWarehouse || 'N/A',
        destination: pc.destination || 'N/A',
        palletCount: pc.palletCount || 0,
        weight: pc.weight || 0,
        loadingType: pc.loadingType || '卡板',
        boxCount: pc.boxCount || 0,
        volume: pc.volume || 0,
        status: '待出库',
        remark: ''
      }));
      pcDetailData.value.push(...pcsToAdd);
      ElMessage.success(`成功添加 ${pcsToAdd.length} 个PC`);
      addPcDialogVisible.value = false;
    };

    // 添加PC对话框 - 取消
    const handleCancelAddPc = () => {
      addPcDialogVisible.value = false;
    };

    // 添加费用
    const handleAddExpense = () => {
      currentExpense.value = {
        pcNumber: pcDetailData.value.length > 0 ? pcDetailData.value[0].pcNumber : '',
        expenseType: 'delivery',
        amount: 0,
        paymentStatus: '待付款',
        expenseRemark: ''
      };
      expenseDialogVisible.value = true;
    };

    // 编辑费用
    const handleEditExpense = (row) => {
      currentExpense.value = { ...row };
      expenseDialogVisible.value = true;
    };

    // 费用表格选择变化
    const handleExpenseSelectionChange = (selection) => {
      selectedExpenses.value = selection;
    };

    // 删除费用
    const handleDeleteExpense = (row) => {
      ElMessage.success(`删除费用: ${row.id}`);
      const index = allExpenses.value.findIndex(item => item.id === row.id);
      if (index !== -1) {
        allExpenses.value.splice(index, 1);
      }
    };

    // 批量推送费用
    const handleBatchPushExpense = () => {
      if (selectedExpenses.value.length === 0) {
        ElMessage.warning('请先选择要推送的费用');
        return;
      }
      ElMessage.success(`批量推送 ${selectedExpenses.value.length} 条费用`);
    };

    // 导出费用
    const handleExportExpense = () => {
      ElMessage.success('触发导出费用操作');
    };

    // 费用下拉菜单操作
    const handleExpenseCommand = (command, row) => {
      switch (command) {
        case 'push':
          ElMessage.success(`推送费用: ${row.id}`);
          row.status = '已推送';
          break;
        case 'delete':
          handleDeleteExpense(row);
          break;
      }
    };

    // 费用对话框确认
    const handleExpenseSubmit = () => {
      if (!currentExpense.value.pcNumber) {
        ElMessage.warning('请选择PC号');
        return;
      }
      if (!currentExpense.value.expenseType) {
        ElMessage.warning('请选择费用类型');
        return;
      }
      if (currentExpense.value.amount <= 0) {
        ElMessage.warning('请输入有效金额');
        return;
      }

      // 如果存在ID则更新，否则添加新记录
      if (currentExpense.value.id) {
        const index = allExpenses.value.findIndex(item => item.id === currentExpense.value.id);
        if (index !== -1) {
          allExpenses.value[index] = { ...currentExpense.value };
        }
        ElMessage.success('费用已更新');
      } else {
        // 创建新费用
        const newExpense = {
          ...currentExpense.value,
          id: `EXP${Date.now()}`,
          status: '待推送',
          expenseDate: new Date().toISOString().split('T')[0],
          operator: '当前用户',
          operateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        allExpenses.value.push(newExpense);
        ElMessage.success('费用已添加');
      }
      expenseDialogVisible.value = false;
    };

    // 费用对话框取消
    const handleExpenseCancel = () => {
      expenseDialogVisible.value = false;
    };

    // 文件上传相关
    const fileUploadDialogVisible = ref(false);
    const uploadFileList = ref([]);
    const selectedFiles = ref([]);
    const uploadForm = ref({
      fileType: 'pod',
      relatedPC: [],
      remark: ''
    });

    // 文件列表数据
    const fileList = ref([
      {
        id: '1',
        fileName: 'POD_20230715.pdf',
        fileType: 'pod',
        fileSize: '2.5MB',
        uploadTime: '2023-07-15 10:30:00',
        uploadBy: 'KKS LOGISTICS LLC',
        status: 'pending',
        remark: '供应商POD文件'
      },
      {
        id: '2',
        fileName: 'invoice.pdf',
        fileType: 'invoice',
        fileSize: '1.2MB',
        uploadTime: '2023-07-15 11:00:00',
        uploadBy: '张三',
        status: 'approved',
        remark: '发票文件'
      },
      {
        id: '3',
        fileName: 'receipt_PC123456.jpg',
        fileType: 'receipt',
        fileSize: '0.8MB',
        uploadTime: '2023-07-16 09:15:00',
        uploadBy: '李四',
        status: 'rejected',
        remark: '签收单有问题，请重新上传'
      }
    ]);

    // 获取文件类型标签样式
    const getFileTypeTagType = (type) => {
      const typeMap = {
        'pod': 'success',
        'receipt': 'primary',
        'invoice': 'warning',
        'other': 'info'
      };
      return typeMap[type] || 'info';
    };

    // 获取文件类型显示名称
    const getFileTypeLabel = (type) => {
      const labelMap = {
        'pod': 'POD文件',
        'receipt': '签收单',
        'invoice': '发票',
        'other': '其他文件'
      };
      return labelMap[type] || '未知类型';
    };

    // 获取文件状态标签样式
    const getFileStatusTagType = (status) => {
      const statusMap = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger'
      };
      return statusMap[status] || 'info';
    };

    // 获取文件状态显示名称
    const getFileStatusLabel = (status) => {
      const labelMap = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝'
      };
      return labelMap[status] || '未知状态';
    };

    // 显示文件上传对话框
    const showFileUploadDialog = () => {
      uploadForm.value = {
        fileType: 'pod',
        relatedPC: pcDetailData.value.length > 0 ? [pcDetailData.value[0].pcNumber] : [],
        remark: ''
      };
      uploadFileList.value = [];
      fileUploadDialogVisible.value = true;
    };

    // 文件选择变化事件
    const handleFileChange = (file, fileList) => {
      uploadFileList.value = fileList;
    };

    // 确认上传文件
    const handleConfirmUpload = () => {
      if (uploadFileList.value.length === 0) {
        ElMessage.warning('请选择要上传的文件');
        return;
      }
      if (uploadForm.value.relatedPC.length === 0) {
        ElMessage.warning('请选择关联的PC');
        return;
      }

      // 模拟上传文件
      uploadFileList.value.forEach(file => {
        const newFile = {
          id: `FILE${Date.now()}`,
          fileName: file.name,
          fileType: uploadForm.value.fileType,
          fileSize: formatFileSize(file.size),
          uploadTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          uploadBy: '当前用户',
          status: 'pending',
          remark: uploadForm.value.remark
        };
        fileList.value.push(newFile);
      });

      ElMessage.success(`成功上传 ${uploadFileList.value.length} 个文件`);
      fileUploadDialogVisible.value = false;
    };

    // 格式化文件大小
    const formatFileSize = (size) => {
      if (size < 1024) {
        return size + 'B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(1) + 'KB';
      } else {
        return (size / (1024 * 1024)).toFixed(1) + 'MB';
      }
    };

    // 取消上传
    const handleCancelUpload = () => {
      fileUploadDialogVisible.value = false;
    };

    // 文件表格选择变化
    const handleFileSelectionChange = (selection) => {
      selectedFiles.value = selection;
    };

    // 批量审核
    const handleBatchApprove = () => {
      if (selectedFiles.value.length === 0) {
        ElMessage.warning('请先选择要审核的文件');
        return;
      }
      
      selectedFiles.value.forEach(file => {
        if (file.status === 'pending') {
          file.status = 'approved';
        }
      });
      
      ElMessage.success(`已批量审核通过 ${selectedFiles.value.length} 个文件`);
    };

    // 文件操作下拉菜单
    const handleFileCommand = (command, row) => {
      switch (command) {
        case 'preview':
          ElMessage.success(`预览文件: ${row.fileName}`);
          break;
        case 'download':
          ElMessage.success(`下载文件: ${row.fileName}`);
          break;
        case 'approve':
          row.status = 'approved';
          ElMessage.success(`审核通过: ${row.fileName}`);
          break;
        case 'reject':
          row.status = 'rejected';
          ElMessage.success(`审核拒绝: ${row.fileName}`);
          break;
        case 'pushCustomerService':
          ElMessage.success(`推送客服: ${row.fileName}`);
          break;
        case 'pushCustomer':
          ElMessage.success(`推送客户: ${row.fileName}`);
          break;
        case 'delete':
          const index = fileList.value.findIndex(item => item.id === row.id);
          if (index !== -1) {
            fileList.value.splice(index, 1);
          }
          ElMessage.success(`删除文件: ${row.fileName}`);
          break;
      }
    };

    onMounted(() => {
      // 这里可以添加获取批次详情的API调用
      console.log('加载批次ID:', batchId);
    });

    return {
      activeTab,
      basicInfo,
      pcDetailData,
      goBack,
      handleEdit,
      handleExport,
      getBatchStatusType,
      getDeliveryTagType,
      getPCStatusTagType,
      supplierOptions,
      // PC明细相关
      handleAddPC,
      handleExportPC,
      handleViewPC,
      handlePCCommand,
      // 添加PC对话框相关
      addPcDialogVisible,
      searchPcQuery,
      filteredAvailablePcs,
      handleAvailablePcSelectionChange,
      handleConfirmAddPc,
      handleCancelAddPc,
      // 费用相关
      expenseActiveTab,
      allExpenses,
      deliveryExpenses,
      abnormalExpenses,
      otherExpenses,
      totalExpense,
      paidExpense,
      unpaidExpense,
      expenseTypes,
      handleAddExpense,
      handleEditExpense,
      handleDeleteExpense,
      handleBatchPushExpense,
      handleExportExpense,
      handleExpenseCommand,
      getExpenseStatusTagType,
      getPaymentStatusTagType,
      handleExpenseSelectionChange,
      selectedExpenses,
      expenseDialogVisible,
      currentExpense,
      handleExpenseSubmit,
      handleExpenseCancel,
      // 文件上传相关
      fileList,
      fileUploadDialogVisible,
      uploadFileList,
      uploadForm,
      selectedFiles,
      getFileTypeTagType,
      getFileTypeLabel,
      getFileStatusTagType,
      getFileStatusLabel,
      showFileUploadDialog,
      handleFileChange,
      handleConfirmUpload,
      handleCancelUpload,
      handleFileSelectionChange,
      handleBatchApprove,
      handleFileCommand
    };
  }
};
</script>

<style scoped>
.batch-detail-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-title {
  flex-grow: 1;
  font-size: 20px;
  font-weight: bold;
  margin-left: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.detail-tabs {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.section-title {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
  font-size: 18px;
  font-weight: bold;
}

.basic-info-section {
  margin-bottom: 30px;
}

.pc-detail-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-actions {
  display: flex;
  gap: 10px;
}

/* 表格样式优化 */
:deep(.el-table) {
  margin-bottom: 20px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: bold;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-title {
    margin-left: 0;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

.expense-detail-section {
  /* 增加内边距，使费用明细区域更美观 */
  padding: 10px 0;
}

.expense-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.expense-actions {
  display: flex;
  gap: 10px;
}

.expense-type-tabs {
  margin-bottom: 20px;
}

.expense-summary {
  margin-top: 20px;
}

.total-amount {
  color: #409EFF;
  font-weight: bold;
}

.paid-amount {
  color: #67C23A;
  font-weight: bold;
}

.unpaid-amount {
  color: #E6A23C;
  font-weight: bold;
}

.file-upload-section {
  margin-bottom: 30px;
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.upload-demo {
  width: 100%;
}
</style> 