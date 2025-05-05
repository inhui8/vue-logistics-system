<!-- eslint-disable -->
<template>
  <div class="train-detail-container">
    <!-- 头部操作栏 -->
    <div class="detail-header">
      <el-button @click="goBack" icon="el-icon-back">返回</el-button>
      <div class="header-title">运单详情</div>
      <div class="header-actions">
        <el-button type="primary" @click="handleEdit">编辑</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <!-- 详情页Tab切换 -->
    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="基本信息" name="basic">
        <!-- 一级表格：重要字段 -->
        <div class="basic-info-section">
          <h3 class="section-title">运单基本信息</h3>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="车次号">{{ basicInfo.trainNumber }}</el-descriptions-item>
            <el-descriptions-item label="装车类型">
              <el-select v-model="basicInfo.loadingType" size="small" style="width: 120px">
                <el-option label="卡板" value="卡板"></el-option>
                <el-option label="地板" value="地板"></el-option>
                <el-option label="混装" value="混装"></el-option>
                <el-option label="快递" value="快递"></el-option>
              </el-select>
            </el-descriptions-item>
            <el-descriptions-item label="派送类型">
              <el-select v-model="basicInfo.deliveryType" size="small" style="width: 120px">
                <el-option label="整车" value="整车"></el-option>
                <el-option label="散板" value="散板"></el-option>
                <el-option label="一提多卸" value="一提多卸"></el-option>
                <el-option label="多提一卸" value="多提一卸"></el-option>
                <el-option label="多提多卸" value="多提多卸"></el-option>
                <el-option label="快递" value="快递"></el-option>
              </el-select>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ basicInfo.createTime }}</el-descriptions-item>
            <el-descriptions-item label="装车预约时间">
              <el-date-picker
                v-model="basicInfo.loadingAppointmentTime"
                type="datetime"
                size="small"
                style="width: 180px"
                placeholder="选择日期时间">
              </el-date-picker>
            </el-descriptions-item>
            <el-descriptions-item label="车牌号">
              <el-input v-model="basicInfo.licensePlate" size="small" style="width: 120px"></el-input>
            </el-descriptions-item>
            <el-descriptions-item label="司机电话">
              <el-input v-model="basicInfo.driverPhone" size="small" style="width: 120px"></el-input>
            </el-descriptions-item>
            <el-descriptions-item label="司机姓名">
              <el-input v-model="basicInfo.driverName" size="small" style="width: 120px"></el-input>
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
              <el-tag :type="getStatusTagType(basicInfo.status)">{{ basicInfo.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="板数">
              <el-input-number v-model="basicInfo.palletCount" size="small" :min="0" style="width: 120px"></el-input-number>
            </el-descriptions-item>
            <el-descriptions-item label="货物重量">
              <el-input-number v-model="basicInfo.weight" size="small" :min="0" :precision="2" style="width: 120px"></el-input-number>
            </el-descriptions-item>
            <el-descriptions-item label="方数(CBM)">
              <el-input-number v-model="basicInfo.cbm" size="small" :min="0" :precision="2" style="width: 120px"></el-input-number>
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
            <el-table-column prop="destination" label="目的地" width="150" sortable></el-table-column>
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
            <el-table-column prop="priority" label="优先级" width="90" sortable>
               <template #default="scope">
                <el-input v-model.number="scope.row.priority" type="number" min="1" size="small" style="width: 70px"></el-input>
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
              <el-table :data="allExpenses" border style="width: 100%">
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
            <el-tab-pane label="异常费" name="abnormal">
              <el-table :data="abnormalExpenses" border style="width: 100%">
                <el-table-column type="selection" width="55"></el-table-column>
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
                <el-table-column prop="amount" label="金额" width="120"></el-table-column>
                <el-table-column prop="currency" label="币种" width="80"></el-table-column>
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
            <el-tab-pane label="等时费" name="waiting">
              <el-table :data="waitingExpenses" border style="width: 100%">
                <el-table-column type="selection" width="55"></el-table-column>
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
                <el-table-column prop="amount" label="金额" width="120"></el-table-column>
                <el-table-column prop="currency" label="币种" width="80"></el-table-column>
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
            <el-tab-pane label="装车费" name="loading">
              <el-table :data="loadingExpenses" border style="width: 100%">
                <el-table-column type="selection" width="55"></el-table-column>
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
                <el-table-column prop="amount" label="金额" width="120"></el-table-column>
                <el-table-column prop="currency" label="币种" width="80"></el-table-column>
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
            <el-tab-pane label="其他费用" name="other">
              <el-table :data="otherExpenses" border style="width: 100%">
                <el-table-column type="selection" width="55"></el-table-column>
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
                <el-table-column prop="amount" label="金额" width="120"></el-table-column>
                <el-table-column prop="currency" label="币种" width="80"></el-table-column>
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
                <el-tag :type="getPodStatusTagType(scope.row.status)">
                  {{ getPodStatusLabel(scope.row.status) }}
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

    <!-- 费用明细对话框 -->
    <expense-detail-dialog
      v-model:visible="expenseDialogVisible"
      :expense-data="currentExpense"
      :expense-type="expenseActiveTab"
      @submit="handleExpenseSubmit"
      @cancel="handleExpenseCancel"
    />

    <!-- 文件上传弹窗 -->
    <train-file-upload-dialog
      v-model:visible="fileUploadDialogVisible"
      :train-id="basicInfo.id"
      @submit="handleFileUploadSubmit"
      @cancel="handleFileUploadCancel"
    />

    <!-- POD上传弹窗 -->
    <upload-pod-dialog
      v-model:visible="podDialogVisible"
      :current-pod-row="currentPodRow"
      @submit="handlePodSubmit"
      @cancel="handlePodCancel"
    />

    <!-- 文件上传带标签弹窗 -->
    <FileUploadWithTagDialog
      v-model="fileUploadWithTagVisible"
      :current-row="currentFileRow"
      @submit="handleFileUploadWithTagSubmit"
      @cancel="handleFileUploadWithTagCancel"
    />

    <!-- 添加PC对话框 -->
    <el-dialog title="添加PC到运单" v-model="addPcDialogVisible" width="70%">
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
        <el-table-column prop="priority" label="优先级" width="80"></el-table-column>
        <el-table-column prop="volume" label="方数(m³)" width="100"></el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelAddPc">取消</el-button>
          <el-button type="primary" @click="handleConfirmAddPc">确认添加</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import ExpenseDetailDialog from '@/components/logistics/ExpenseDetailDialog.vue';
import TrainFileUploadDialog from '@/components/logistics/TrainFileUploadDialog.vue';
import UploadPodDialog from '@/components/logistics/UploadPodDialog.vue';
import FileUploadWithTagDialog from '@/components/logistics/FileUploadWithTagDialog.vue';

export default {
  name: 'TrainDetail',
  components: {
    ExpenseDetailDialog,
    TrainFileUploadDialog,
    UploadPodDialog,
    FileUploadWithTagDialog
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const trainId = route.params.id;

    // 当前激活的标签页
    const activeTab = ref('basic');

    // 文件上传弹窗显示状态
    const fileUploadDialogVisible = ref(false);

    // 选中的文件
    const selectedFiles = ref([]);

    // 费用明细对话框显示状态
    const expenseDialogVisible = ref(false);
    const currentExpense = ref(null);

    // POD上传相关
    const podDialogVisible = ref(false);
    const currentPodRow = ref(null);

    // 文件列表数据
    const fileList = ref([
      {
        id: '1',
        fileName: 'POD_20230715.pdf',
        fileType: 'pod',
        fileSize: '2.5MB',
        uploadTime: '2023-07-15 10:30:00',
        uploadBy: '供应商A',
        status: 'pending',
        remark: '供应商POD文件'
      },
      {
        id: '2',
        fileName: 'invoice.pdf',
        fileType: 'normal',
        fileSize: '1.2MB',
        uploadTime: '2023-07-15 11:00:00',
        uploadBy: '供应商A',
        status: 'pending',
        remark: '发票文件'
      }
    ]);

    // 基本信息数据
    const basicInfo = ref({
      id: trainId,
      trainNumber: 'TRAIN20230715001',
      loadingType: '整车',
      deliveryType: '派送',
      createTime: '2023-07-15 10:00:00',
      loadingAppointmentTime: '2023-07-15 14:00:00',
      licensePlate: '粤B12345',
      driverPhone: '13800138000',
      driverName: '张三',
      supplier: '物流供应商A',
      status: '已登记',
      palletCount: '20',
      weight: '5000kg',
      cbm: '10m³'
    });

    // PC明细数据
    const pcDetailData = ref([
      {
        pcNumber: 'PC123456',
        loadingType: '整车',
        orderType: '普通订单',
        destination: '深圳市南山区',
        palletCount: '10',
        weight: '2500kg',
        volume: '5m³',
        appointmentNumber: 'APT20230715001',
        appointmentTime: '2023-07-15 14:00:00',
        appointmentParty: '客户A',
        status: '待装车',
        remark: '无'
      }
    ]);

    // 费用明细相关数据
    const expenseActiveTab = ref('all');
    const allExpenses = ref([
      {
        id: '1',
        pcNumber: 'PC123456',
        status: '已付款',
        fromWarehouse: '美西一号仓',
        toWarehouse: '美西二号仓',
        paymentNo: 'PAY20230715001',
        supplier: '物流供应商A',
        expenseType: 'delivery',
        expenseRemark: '基础派送费',
        amount: '2000.00',
        expenseDate: '2023-07-15',
        operator: '张三',
        operateTime: '2023-07-15 10:30:00',
        type: 'delivery'
      },
      {
        id: '2',
        pcNumber: 'PC123457',
        status: '已审核',
        fromWarehouse: '美西一号仓',
        toWarehouse: '美西二号仓',
        paymentNo: 'PAY20230715002',
        supplier: '物流供应商A',
        expenseType: 'delivery',
        expenseRemark: '偏远地区附加费',
        amount: '500.00',
        expenseDate: '2023-07-15',
        operator: '李四',
        operateTime: '2023-07-15 11:20:00',
        type: 'delivery'
      },
      {
        id: '3',
        pcNumber: 'PC123458',
        status: '已锁单',
        fromWarehouse: '美西一号仓',
        toWarehouse: '美西二号仓',
        paymentNo: 'PAY20230715003',
        supplier: '物流供应商A',
        expenseType: 'exception',
        expenseRemark: '货物破损赔偿',
        amount: '800.00',
        expenseDate: '2023-07-16',
        operator: '王五',
        operateTime: '2023-07-16 09:15:00',
        type: 'abnormal'
      }
    ]);

    // 派送费数据
    const deliveryExpenses = ref([
      {
        id: '1',
        pcNumber: 'PC123456',
        status: '已付款',
        fromWarehouse: '美西一号仓',
        toWarehouse: '美西二号仓',
        paymentNo: 'PAY20230715001',
        supplier: '物流供应商A',
        expenseType: 'delivery',
        expenseRemark: '基础派送费',
        amount: '2000.00',
        expenseDate: '2023-07-15',
        operator: '张三',
        operateTime: '2023-07-15 10:30:00'
      },
      {
        id: '2',
        pcNumber: 'PC123457',
        status: '已审核',
        fromWarehouse: '美西一号仓',
        toWarehouse: '美西二号仓',
        paymentNo: 'PAY20230715002',
        supplier: '物流供应商A',
        expenseType: 'delivery',
        expenseRemark: '偏远地区附加费',
        amount: '500.00',
        expenseDate: '2023-07-15',
        operator: '李四',
        operateTime: '2023-07-15 11:20:00'
      }
    ]);

    // 异常费数据
    const abnormalExpenses = ref([
      {
        id: '3',
        pcNumber: 'PC123458',
        status: '已锁单',
        fromWarehouse: '美西一号仓',
        toWarehouse: '美西二号仓',
        paymentNo: 'PAY20230715003',
        supplier: '物流供应商A',
        expenseType: 'exception',
        expenseRemark: '货物破损赔偿',
        amount: '800.00',
        expenseDate: '2023-07-16',
        operator: '王五',
        operateTime: '2023-07-16 09:15:00'
      }
    ]);

    // 等时费数据
    const waitingExpenses = ref([
      {
        id: '4',
        pcNumber: 'PC123456',
        status: '已付款',
        fromWarehouse: '美西一号仓',
        toWarehouse: '美西二号仓',
        paymentNo: 'PAY20230715004',
        supplier: '物流供应商A',
        expenseType: 'waiting',
        expenseRemark: '装货等待费',
        amount: '300.00',
        expenseDate: '2023-07-16',
        operator: '赵六',
        operateTime: '2023-07-16 14:30:00'
      }
    ]);

    // 装车费数据
    const loadingExpenses = ref([
      {
        id: '5',
        pcNumber: 'PC123457',
        status: '已审核',
        fromWarehouse: '美西一号仓',
        toWarehouse: '美西二号仓',
        paymentNo: 'PAY20230715005',
        supplier: '物流供应商A',
        expenseType: 'loading',
        expenseRemark: '装车人工费',
        amount: '600.00',
        expenseDate: '2023-07-16',
        operator: '钱七',
        operateTime: '2023-07-16 16:45:00'
      }
    ]);

    // 其他费用数据
    const otherExpenses = ref([
      {
        id: '6',
        pcNumber: 'PC123458',
        status: '已付款',
        fromWarehouse: '美西一号仓',
        toWarehouse: '美西二号仓',
        paymentNo: 'PAY20230715006',
        supplier: '物流供应商A',
        expenseType: 'other',
        expenseRemark: '保险费',
        amount: '200.00',
        expenseDate: '2023-07-17',
        operator: '孙八',
        operateTime: '2023-07-17 09:00:00'
      }
    ]);

    // 计算总费用
    const totalExpense = computed(() => {
      const allExpenses = [
        ...deliveryExpenses.value,
        ...abnormalExpenses.value,
        ...waitingExpenses.value,
        ...loadingExpenses.value,
        ...otherExpenses.value
      ];
      return allExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0).toFixed(2);
    });

    // 计算已支付费用
    const paidExpense = computed(() => {
      const allExpenses = [
        ...deliveryExpenses.value,
        ...abnormalExpenses.value,
        ...waitingExpenses.value,
        ...loadingExpenses.value,
        ...otherExpenses.value
      ];
      return allExpenses
        .filter(expense => expense.paymentStatus === '已支付')
        .reduce((sum, expense) => sum + Number(expense.amount), 0)
        .toFixed(2);
    });

    // 计算未支付费用
    const unpaidExpense = computed(() => {
      const allExpenses = [
        ...deliveryExpenses.value,
        ...abnormalExpenses.value,
        ...waitingExpenses.value,
        ...loadingExpenses.value,
        ...otherExpenses.value
      ];
      return allExpenses
        .filter(expense => expense.paymentStatus === '未支付')
        .reduce((sum, expense) => sum + Number(expense.amount), 0)
        .toFixed(2);
    });

    // 获取状态标签类型
    const getStatusTagType = (status) => {
      const statusMap = {
        '待登记': 'info',
        '已登记': 'primary',
        '装车中': 'warning',
        '装车完成': 'success',
        '已发货': 'success',
        '已签收': 'success',
        '已取消': 'danger'
      };
      return statusMap[status] || 'info';
    };

    // 获取PC状态标签类型
    const getPCStatusTagType = (status) => {
      const statusMap = {
        '待装车': 'info',
        '装车中': 'warning',
        '已装车': 'success',
        '已发货': 'success',
        '已签收': 'success',
        '异常': 'danger'
      };
      return statusMap[status] || 'info';
    };

    // 获取文件类型标签类型
    const getFileTypeTagType = (type) => {
      return type === 'abnormal' ? 'danger' : 'primary';
    };

    // 获取文件类型显示标签
    const getFileTypeLabel = (type) => {
      return type === 'abnormal' ? '异常文件' : '留底文件';
    };

    // 返回上一页
    const goBack = () => {
      router.go(-1);
    };

    // 编辑运单
    const handleEdit = () => {
      ElMessage.info('编辑运单功能待实现');
    };

    // 导出运单
    const handleExport = () => {
      ElMessage.info('导出运单功能待实现');
    };

    // 添加PC
    const handleAddPC = () => {
      fetchAvailablePcs(); // 获取最新的可添加PC列表
      searchPcQuery.value = ''; // 清空搜索框
      selectedPcsToAdd.value = []; // 清空选择
      // 确保下次打开对话框时表格选择状态被清除 (如果 Element Plus 未自动处理)
      // 可选: find the table ref and call clearSelection()
      addPcDialogVisible.value = true;
    };

    // 导出PC明细
    const handleExportPC = () => {
      ElMessage.info('导出PC明细功能待实现');
    };

    // 查看PC明细
    const handleViewPC = (row) => {
      ElMessage.info(`查看PC明细：${row.pcNumber}`);
    };

    // 编辑PC明细
    const handleEditPC = (row) => {
      ElMessage.info(`编辑PC明细：${row.pcNumber}`);
    };

    // 处理PC明细更多操作
    const handlePCCommand = (command, row) => {
      switch (command) {
        case 'uploadPod':
          handleUploadPod(row);
          break;
        case 'followUp':
          ElMessage.info(`跟进记录：${row.pcNumber}`);
          break;
        case 'memo':
          ElMessage.info(`MEMO：${row.pcNumber}`);
          break;
        case 'exception':
          ElMessage.info(`标记异常：${row.pcNumber}`);
          break;
        case 'delete':
          ElMessageBox.confirm(
            `确定要删除PC ${row.pcNumber} 吗？`,
            '提示',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }
          ).then(() => {
            // --- 删除逻辑开始 ---
            const index = pcDetailData.value.findIndex(pc => pc.pcNumber === row.pcNumber);
            if (index !== -1) {
              pcDetailData.value.splice(index, 1);
              ElMessage.success(`已删除PC ${row.pcNumber}`);
            } else {
              ElMessage.error('未找到要删除的PC');
            }
            // --- 删除逻辑结束 ---
          }).catch(() => {
            ElMessage.info('已取消删除操作');
            // 取消删除
          });
          break;
        default:
          break;
      }
    };

    // 显示文件上传弹窗
    const showFileUploadDialog = () => {
      fileUploadDialogVisible.value = true;
    };

    // 处理文件上传提交
    const handleFileUploadSubmit = (formData) => {
      // 模拟添加文件到列表
      const newFile = {
        id: String(fileList.value.length + 1),
        fileName: formData.files[0].name,
        fileType: formData.fileTag,
        fileSize: `${(formData.files[0].size / (1024 * 1024)).toFixed(1)}MB`,
        uploadTime: new Date().toLocaleString(),
        uploadBy: '当前用户',
        remark: formData.remark || ''
      };
      
      fileList.value.unshift(newFile);
      ElMessage.success('文件上传成功');
      fileUploadDialogVisible.value = false;
    };

    // 处理文件表格选择变化
    const handleFileSelectionChange = (selection) => {
      selectedFiles.value = selection;
    };

    // 处理文件上传取消
    const handleFileUploadCancel = () => {
      fileUploadDialogVisible.value = false;
    };

    // 预览文件
    const handlePreviewFile = (row) => {
      ElMessage.info(`预览文件：${row.fileName}`);
    };

    // 下载文件
    const handleDownloadFile = (row) => {
      ElMessage.success(`文件 ${row.fileName} 开始下载`);
    };

    // 删除文件
    const handleDeleteFile = (row) => {
      ElMessageBox.confirm(
        `确定要删除文件 ${row.fileName} 吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        fileList.value = fileList.value.filter(item => item.id !== row.id);
        ElMessage.success(`已删除文件 ${row.fileName}`);
      }).catch(() => {
        // 取消删除
      });
    };

    // 获取支付状态标签类型
    const getPaymentStatusTagType = (status) => {
      return status === '已支付' ? 'success' : 'warning';
    };

    // 添加费用
    const handleAddExpense = () => {
      currentExpense.value = null;
      expenseDialogVisible.value = true;
    };

    // 导出费用
    const handleExportExpense = () => {
      ElMessage.info('导出费用功能待实现');
    };

    // 编辑费用
    const handleEditExpense = (row) => {
      currentExpense.value = { ...row };
      expenseDialogVisible.value = true;
    };

    // 删除费用
    const handleDeleteExpense = (row) => {
      ElMessageBox.confirm(
        `确定要删除费用 ${row.expenseType} 吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 根据费用类型删除对应的费用
        const expenseTypes = {
          delivery: deliveryExpenses,
          abnormal: abnormalExpenses,
          waiting: waitingExpenses,
          loading: loadingExpenses,
          other: otherExpenses
        };
        
        const expenses = expenseTypes[expenseActiveTab.value];
        if (expenses) {
          const index = expenses.value.findIndex(item => item.id === row.id);
          if (index !== -1) {
            expenses.value.splice(index, 1);
            ElMessage.success('删除成功');
          }
        }
      }).catch(() => {
        // 取消删除
      });
    };

    // 处理费用提交
    const handleExpenseSubmit = (formData) => {
      const expenseTypes = {
        delivery: deliveryExpenses,
        abnormal: abnormalExpenses,
        waiting: waitingExpenses,
        loading: loadingExpenses,
        other: otherExpenses
      };
      
      const expenses = expenseTypes[expenseActiveTab.value];
      if (expenses) {
        if (currentExpense.value) {
          // 编辑现有费用
          const index = expenses.value.findIndex(item => item.id === currentExpense.value.id);
          if (index !== -1) {
            expenses.value[index] = {
              ...currentExpense.value,
              ...formData
            };
          }
        } else {
          // 添加新费用
          const newExpense = {
            id: String(expenses.value.length + 1),
            ...formData
          };
          expenses.value.push(newExpense);
        }
        ElMessage.success(currentExpense.value ? '费用更新成功' : '费用添加成功');
      }
      expenseDialogVisible.value = false;
    };

    // 处理费用取消
    const handleExpenseCancel = () => {
      expenseDialogVisible.value = false;
    };

    // 获取费用状态标签类型
    const getExpenseStatusTagType = (status) => {
      const statusMap = {
        '已付款': 'success',
        '已审核': 'warning',
        '已锁单': 'info'
      };
      return statusMap[status] || 'info';
    };

    // 处理费用更多操作
    const handleExpenseCommand = (command, row) => {
      switch (command) {
        case 'push':
          ElMessageBox.confirm(
            `确定要推送费用 ${row.expenseType} 吗？`,
            '提示',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }
          ).then(() => {
            // 推送费用逻辑
            ElMessage.success('费用推送成功');
          }).catch(() => {
            // 取消推送
          });
          break;
        case 'delete':
          handleDeleteExpense(row);
          break;
      }
    };

    // 选中的费用
    const selectedExpenses = ref([]);

    // 处理表格选择变化
    const handleSelectionChange = (selection) => {
      selectedExpenses.value = selection;
    };

    // 修改批量推送费用的方法
    const handleBatchPushExpense = () => {
      if (selectedExpenses.value.length === 0) {
        ElMessage.warning('请选择要推送的费用');
        return;
      }

      ElMessageBox.confirm(
        `确定要批量推送 ${selectedExpenses.value.length} 条费用记录吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 批量推送逻辑
        ElMessage.success('批量推送成功');
      }).catch(() => {
        // 取消推送
      });
    };

    // 组件挂载时加载数据
    onMounted(() => {
      // 可以在这里调用API获取详情数据
      console.log('加载运单详情：', trainId);
    });

    // 费用类型数据
    const expenseTypes = ref([
      { value: 'delivery', label: '派送费', type: 'success' },
      { value: 'loading', label: '装车费', type: 'primary' },
      { value: 'waiting', label: '等时费', type: 'warning' },
      { value: 'exception', label: '异常费', type: 'danger' },
      { value: 'storage', label: '仓储费', type: 'warning' },
      { value: 'other', label: '其他费用', type: 'info' }
    ]);

    // 获取费用类型标签
    const getExpenseTypeLabel = (type) => {
      const expenseType = expenseTypes.value.find(t => t.value === type);
      return expenseType ? expenseType.label : type;
    };

    // 获取费用类型标签类型
    const getExpenseTypeTag = (type) => {
      const expenseType = expenseTypes.value.find(t => t.value === type);
      return expenseType ? expenseType.type : 'info';
    };

    // 获取POD状态标签类型
    const getPodStatusTagType = (status) => {
      const statusMap = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger'
      };
      return statusMap[status] || 'info';
    };

    // 获取POD状态显示标签
    const getPodStatusLabel = (status) => {
      const statusMap = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝'
      };
      return statusMap[status] || status;
    };

    // 处理文件相关操作
    const handleFileCommand = (command, row) => {
      switch (command) {
        case 'preview':
          handlePreviewFile(row);
          break;
        case 'download':
          handleDownloadFile(row);
          break;
        case 'approve':
          ElMessageBox.confirm(
            '确定要通过该文件的审核吗？',
            '提示',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }
          ).then(() => {
            row.status = 'approved';
            ElMessage.success('文件审核通过');
          }).catch(() => {
            // 取消审核
          });
          break;
        case 'reject':
          ElMessageBox.confirm(
            '确定要拒绝该文件的审核吗？',
            '提示',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }
          ).then(() => {
            row.status = 'rejected';
            ElMessage.success('文件审核已拒绝');
          }).catch(() => {
            // 取消审核
          });
          break;
        case 'delete':
          handleDeleteFile(row);
          break;
        case 'pushCustomerService':
          ElMessage.info(`推送客服: ${row.fileName}`);
          // 推送客服逻辑
          break;
        case 'pushCustomer':
          ElMessage.info(`推送客户: ${row.fileName}`);
          // 推送客户逻辑
          break;
      }
    };

    // 仓库选项
    const warehouseOptions = ref([
      { label: '美西一号仓', value: 'warehouse1' },
      { label: '美西二号仓', value: 'warehouse2' },
      { label: '美西三号仓', value: 'warehouse3' },
      { label: '美东一号仓', value: 'warehouse4' },
      { label: '美东二号仓', value: 'warehouse5' }
    ]);

    // 目的地选项
    const destinationOptions = ref([
      { label: '洛杉矶', value: 'LA' },
      { label: '旧金山', value: 'SF' },
      { label: '纽约', value: 'NY' },
      { label: '西雅图', value: 'SEA' },
      { label: '芝加哥', value: 'CHI' }
    ]);

    // 供应商选项
    const supplierOptions = ref([
      { label: '物流供应商A', value: 'supplierA' },
      { label: '物流供应商B', value: 'supplierB' },
      { label: '物流供应商C', value: 'supplierC' },
      { label: '物流供应商D', value: 'supplierD' }
    ]);

    // 处理POD上传
    const handleUploadPod = (row) => {
      currentPodRow.value = row;
      podDialogVisible.value = true;
    };

    // 处理POD提交
    const handlePodSubmit = async (formData) => {
      try {
        // 这里添加实际的API调用
        console.log('提交POD数据:', formData);
        
        // 更新本地数据
        if (currentPodRow.value) {
          currentPodRow.value.podStatus = '已上传';
          currentPodRow.value.podUploadTime = formData.receiptTime;
          
          // 更新表格数据
          const index = fileList.value.findIndex(item => item.id === currentPodRow.value.id);
          if (index !== -1) {
            fileList.value[index] = { ...currentPodRow.value };
          }
        }
        
        ElMessage.success('POD上传成功');
        podDialogVisible.value = false;
      } catch (error) {
        console.error('POD上传失败:', error);
        ElMessage.error('POD上传失败');
      }
    };

    // 处理POD取消
    const handlePodCancel = () => {
      podDialogVisible.value = false;
      currentPodRow.value = null;
    };

    // 在 script 部分添加
    const fileUploadWithTagVisible = ref(false);
    const currentFileRow = ref(null);

    // 处理文件上传
    const handleFileUploadWithTag = (row) => {
      currentFileRow.value = row;
      fileUploadWithTagVisible.value = true;
    };

    // 处理文件上传提交
    const handleFileUploadWithTagSubmit = async (formData) => {
      try {
        // 这里添加实际的API调用
        console.log('提交文件数据:', formData);
        
        // 更新本地数据
        if (currentFileRow.value) {
          // 这里可以根据需要更新相关字段
          currentFileRow.value.fileTag = formData.fileTag;
          currentFileRow.value.fileRemark = formData.remark;
          
          // 更新表格数据
          const index = fileList.value.findIndex(item => item.id === currentFileRow.value.id);
          if (index !== -1) {
            fileList.value[index] = { ...currentFileRow.value };
          }
        }
        
        ElMessage.success('文件上传成功');
        fileUploadWithTagVisible.value = false;
      } catch (error) {
        console.error('文件上传失败:', error);
        ElMessage.error('文件上传失败');
      }
    };

    // 处理文件上传取消
    const handleFileUploadWithTagCancel = () => {
      fileUploadWithTagVisible.value = false;
      currentFileRow.value = null;
    };

    // 批量审核文件
    const handleBatchApprove = () => {
      if (selectedFiles.value.length === 0) {
        ElMessage.warning('请选择需要审核的文件');
        return;
      }

      const pendingFiles = selectedFiles.value.filter(file => file.status === 'pending');

      if (pendingFiles.length === 0) {
        ElMessage.warning('选中的文件都已审核，无需重复操作');
        return;
      }

      ElMessageBox.confirm(
        `确定要批量审核通过选中的 ${pendingFiles.length} 个文件吗？`,
        '批量审核确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        pendingFiles.forEach(file => {
          // 找到原始列表中的文件并更新状态
          const originalFile = fileList.value.find(f => f.id === file.id);
          if (originalFile) {
            originalFile.status = 'approved';
          }
        });
        ElMessage.success(`已成功批量审核 ${pendingFiles.length} 个文件`);
        // 清空选择，如果需要的话
        // this.$refs.fileTable.clearSelection(); // Vue 2 写法，Vue 3 需要获取 ref
      }).catch(() => {
        ElMessage.info('已取消批量审核操作');
      });
    };

    // 添加PC对话框相关
    const addPcDialogVisible = ref(false);
    const availablePcs = ref([]); // 存储可添加的PC列表
    const searchPcQuery = ref(''); // PC搜索查询
    const selectedPcsToAdd = ref([]); // 在对话框中选中的PC

    // 模拟的可添加PC列表 (实际应从API获取，确保字段全面)
    const fetchAvailablePcs = () => {
      const existingPcNumbers = pcDetailData.value.map(pc => pc.pcNumber);
      // 模拟数据，确保包含所有对话框表格中显示的字段
      availablePcs.value = [
        { pcNumber: 'PC777777', appointmentParty: '客户C', appointmentTime: '2024-03-10 10:00:00', appointmentNumber: 'BK777', startWarehouse: '东莞仓库', destination: '芝加哥', palletCount: 5, weight: 1000, loadingType: '卡板', boxCount: 80, priority: 1, volume: 2 },
        { pcNumber: 'PC888888', appointmentParty: '客户D', appointmentTime: '2024-03-11 11:00:00', appointmentNumber: 'BK888', startWarehouse: '广州仓库', destination: '纽约', palletCount: 8, weight: 1800, loadingType: '地板', boxCount: 200, priority: 2, volume: 4 },
        { pcNumber: 'PC999999', appointmentParty: '客户E', appointmentTime: '2024-03-12 15:30:00', appointmentNumber: 'BK999', startWarehouse: '深圳仓库', destination: '洛杉矶', palletCount: 12, weight: 3000, loadingType: '混装', boxCount: 150, priority: 3, volume: 6 },
        // 过滤掉已在当前运单中的PC
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
      // 将选中的PC添加到pcDetailData，映射所有需要的字段
      const pcsToAdd = selectedPcsToAdd.value.map(pc => ({
        // 从 availablePcs 复制所有已有字段
        pcNumber: pc.pcNumber,
        appointmentParty: pc.appointmentParty || '',
        appointmentTime: pc.appointmentTime || '',
        appointmentNumber: pc.appointmentNumber || '',
        startWarehouse: pc.startWarehouse || 'N/A', // 添加起始仓库
        destination: pc.destination || 'N/A',
        palletCount: pc.palletCount || 0,
        weight: pc.weight || 0,
        loadingType: pc.loadingType || '卡板', // 添加装车类型
        boxCount: pc.boxCount || 0,         // 添加箱数
        priority: pc.priority || 3,         // 添加优先级
        volume: pc.volume || 0,
        // 添加/设置默认状态和其他主表需要的字段
        status: '待装车',
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

    return {
      activeTab,
      basicInfo,
      pcDetailData,
      fileList,
      fileUploadDialogVisible,
      expenseActiveTab,
      allExpenses,
      deliveryExpenses,
      abnormalExpenses,
      waitingExpenses,
      loadingExpenses,
      otherExpenses,
      totalExpense,
      paidExpense,
      unpaidExpense,
      getStatusTagType,
      getPCStatusTagType,
      getFileTypeTagType,
      getFileTypeLabel,
      goBack,
      handleEdit,
      handleExport,
      handleAddPC,
      handleExportPC,
      handleViewPC,
      handleEditPC,
      handlePCCommand,
      showFileUploadDialog,
      handleFileUploadSubmit,
      handleFileUploadCancel,
      handlePreviewFile,
      handleDownloadFile,
      handleDeleteFile,
      getPaymentStatusTagType,
      handleAddExpense,
      handleExportExpense,
      handleEditExpense,
      handleDeleteExpense,
      expenseDialogVisible,
      currentExpense,
      handleExpenseSubmit,
      handleExpenseCancel,
      getExpenseStatusTagType,
      handleExpenseCommand,
      handleBatchPushExpense,
      selectedExpenses,
      handleSelectionChange,
      expenseTypes,
      getExpenseTypeLabel,
      getExpenseTypeTag,
      getPodStatusTagType,
      getPodStatusLabel,
      handleFileCommand,
      warehouseOptions,
      destinationOptions,
      supplierOptions,
      podDialogVisible,
      currentPodRow,
      handleUploadPod,
      handlePodSubmit,
      handlePodCancel,
      fileUploadWithTagVisible,
      currentFileRow,
      handleFileUploadWithTag,
      handleFileUploadWithTagSubmit,
      handleFileUploadWithTagCancel,
      handleBatchApprove,
      handleFileSelectionChange,
      selectedFiles,
      // 添加PC相关导出
      addPcDialogVisible,
      searchPcQuery,
      filteredAvailablePcs,
      handleConfirmAddPc,
      handleCancelAddPc,
      handleAvailablePcSelectionChange
    };
  }
};
</script>

<style scoped>
.train-detail-container {
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

.expense-detail-section {
  /* 增加内边距，使费用明细区域更美观 */
  padding: 10px 0;
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
</style> 