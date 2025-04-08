/* eslint-disable */
<template>
  <div class="fbx-container">
    <h1>FBX预约管理</h1>
    
    <!-- 标签页 -->
    <div class="tabs-container">
      <el-tabs v-model="activeTab" type="card" @tab-click="handleTabClick">
        <el-tab-pane
          v-for="view in views"
          :key="view.id"
          :label="view.name"
          :name="view.id"
        >
          <template #label>
            <span>{{ view.name }} ({{ view.count }})</span>
            <el-dropdown v-if="view.id !== 'all'" trigger="click" @command="handleViewCommand($event, view)">
              <span class="el-dropdown-link">
                <el-icon><more /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="copy">复制视图</el-dropdown-item>
                  <el-dropdown-item command="rename">重命名</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-tab-pane>
        <el-tab-pane label="[+]" name="add" @click="handleAddView"></el-tab-pane>
      </el-tabs>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-area">
      <el-card>
        <!-- 时间筛选 -->
        <div class="search-row">
          <div class="date-filter">
            <el-select v-model="dateType" placeholder="选择日期类型" style="width: 150px;">
              <el-option label="ETA" value="eta"></el-option>
              <el-option label="提柜时间" value="pickupTime"></el-option>
              <el-option label="抵仓时间" value="arrivalTime"></el-option>
              <el-option label="预计拆柜时间" value="expectedUnloadingTime"></el-option>
              <el-option label="拆柜完成时间" value="unloadingTime"></el-option>
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              style="width: 340px; margin-left: 10px;"
            ></el-date-picker>
          </div>
        </div>

        <!-- 多号码搜索 -->
        <div class="search-row">
          <div class="multi-search">
            <el-select v-model="searchType" placeholder="选择搜索类型" style="width: 150px;">
              <el-option label="柜号" value="containerNo"></el-option>
              <el-option label="SO号" value="soNo"></el-option>
              <el-option label="货件编号" value="shipmentCode"></el-option>
              <el-option label="追踪编号" value="trackingNumber"></el-option>
            </el-select>
            <el-input
              v-model="searchNumber"
              placeholder="请输入搜索内容"
              style="width: 200px; margin-left: 10px;"
              clearable
            ></el-input>
          </div>
        </div>

        <!-- 模糊搜索 -->
        <div class="search-row">
          <div class="fuzzy-search">
            <el-input
              v-model="fuzzySearchText"
              placeholder="模糊搜索(MEMO/跟进记录/ref_number/zip_code等)"
              style="width: 400px;"
              clearable
            >
              <template #prefix>
                <el-icon><search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="button-group">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button-group>
        <el-button @click="showFilterModal">
          <el-icon><Search /></el-icon> 筛选
        </el-button>
        <el-button @click="showSortModal">
          <el-icon><Sort /></el-icon> 排序
        </el-button>
        <el-button @click="showGroupModal">
          <el-icon><Files /></el-icon> 分组
        </el-button>
        <el-button @click="showFieldModal">
          <el-icon><Setting /></el-icon> 字段配置
        </el-button>
      </el-button-group>
      <el-button-group style="margin-left: 10px;">
        <el-button @click="handleBatchOperation('followUp')">批量跟进</el-button>
        <el-button @click="handleBatchOperation('memo')">批量MEMO</el-button>
        <el-button @click="handleBatchOperation('createPC')">创建PC</el-button>
        <el-button @click="handleExport">导出报表</el-button>
      </el-button-group>
      <el-button type="primary" style="margin-left: 10px;" @click="handleSaveView">保存视图</el-button>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table
        ref="dataTable"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        height="calc(100vh - 180px)"
        @selection-change="handleSelectionChange"
        row-key="id"
        :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div class="expanded-row">
              <!-- 如果是分组行，不显示展开内容 -->
              <template v-if="!props.row.isGroup">
              <el-table
                :data="props.row.shipments || []"
                style="width: 100%"
                border
                size="small"
              >
                <el-table-column prop="shipmentCode" label="货件编码" width="180"></el-table-column>
                <el-table-column prop="trackingNumber" label="追踪编号" width="180"></el-table-column>
                <el-table-column prop="quantity" label="数量" width="100"></el-table-column>
                <el-table-column prop="status" label="订单状态" width="120">
                  <template #default="scope">
                    <el-tag :type="getStatusType(scope.row.status)">
                      {{ getStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="selection" width="55"></el-table-column>
        
        <!-- 分组信息列 -->
        <el-table-column v-if="hasGroupedData" label="分组信息" width="200">
          <template #default="scope">
            <span v-if="scope.row.isGroup" class="group-name">
              <el-tag :type="getGroupTagType(scope.row.groupLevel)">
                {{ scope.row.groupName }}
              </el-tag>
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="containerNo" label="集装箱号" width="150">
          <template #default="scope">
            <span v-if="scope.row.isGroup" class="group-summary">{{ scope.row.containerNoSummary }}</span>
            <div v-else class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'containerNo')">
              <el-input
                v-if="scope.row.editing === 'containerNo'"
                v-model="scope.row.containerNo"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'containerNo')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'containerNo')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'containerNo')">{{ scope.row.containerNo }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="waybillNo" label="运单号" width="150">
          <template #default="scope">
            <span v-if="scope.row.isGroup" class="group-summary">{{ scope.row.waybillNoSummary }}</span>
            <div v-else class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'waybillNo')">
              <el-input
                v-if="scope.row.editing === 'waybillNo'"
                v-model="scope.row.waybillNo"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'waybillNo')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'waybillNo')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'waybillNo')">{{ scope.row.waybillNo }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="customerService" label="客服" width="100">
          <template #default="scope">
            <span v-if="!scope.row.isGroup">{{ scope.row.customerService }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="originalAddress" label="原地址信息" width="200">
          <template #default="scope">
            <span v-if="!scope.row.isGroup">{{ scope.row.originalAddress }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" width="200">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'address')">
              <el-input
                v-if="scope.row.editing === 'address'"
                v-model="scope.row.address"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'address')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'address')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'address')">{{ scope.row.address }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="city" label="City" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'city')">
              <el-input
                v-if="scope.row.editing === 'city'"
                v-model="scope.row.city"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'city')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'city')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'city')">{{ scope.row.city }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="state" label="State" width="80">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'state')">
              <el-input
                v-if="scope.row.editing === 'state'"
                v-model="scope.row.state"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'state')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'state')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'state')">{{ scope.row.state }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="zipCode" label="Zip_Code" width="100">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'zipCode')">
              <el-input
                v-if="scope.row.editing === 'zipCode'"
                v-model="scope.row.zipCode"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'zipCode')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'zipCode')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'zipCode')">{{ scope.row.zipCode }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryArea" label="派送区域" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'deliveryArea')">
              <el-input
                v-if="scope.row.editing === 'deliveryArea'"
                v-model="scope.row.deliveryArea"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'deliveryArea')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'deliveryArea')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'deliveryArea')">{{ scope.row.deliveryArea }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="warehouseCode" label="仓库代码" width="100">
          <template #default="scope">
            <span v-if="!scope.row.isGroup">{{ scope.row.warehouseCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="渠道" width="80">
          <template #default="scope">
            <span v-if="!scope.row.isGroup">{{ scope.row.channel }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="boxCount" label="箱数" width="80">
          <template #default="scope">
            <span v-if="scope.row.isGroup" class="group-summary">{{ scope.row.totalBoxCount }}</span>
            <div v-else class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'boxCount')">
              <el-input
                v-if="scope.row.editing === 'boxCount'"
                v-model="scope.row.boxCount"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'boxCount')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'boxCount')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'boxCount')">{{ scope.row.boxCount }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="重量" width="80">
          <template #default="scope">
            <span v-if="scope.row.isGroup" class="group-summary">{{ scope.row.totalWeight.toFixed(2) }}</span>
            <div v-else class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'weight')">
              <el-input
                v-if="scope.row.editing === 'weight'"
                v-model="scope.row.weight"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'weight')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'weight')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'weight')">{{ scope.row.weight }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="volume" label="方数" width="80">
          <template #default="scope">
            <span v-if="scope.row.isGroup" class="group-summary">{{ scope.row.totalVolume.toFixed(2) }}</span>
            <div v-else class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'volume')">
              <el-input
                v-if="scope.row.editing === 'volume'"
                v-model="scope.row.volume"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'volume')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'volume')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'volume')">{{ scope.row.volume }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="palletCount" label="板数" width="80">
          <template #default="scope">
            <span v-if="!scope.row.isGroup">{{ scope.row.palletCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="100">
          <template #default="scope">
            <span v-if="!scope.row.isGroup">{{ scope.row.location }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="eta" label="ETA" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'eta')">
              <el-date-picker
                v-if="scope.row.editing === 'eta'"
                v-model="scope.row.eta"
                type="datetime"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'eta')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'eta')">{{ scope.row.eta }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="pickupTime" label="提柜时间" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'pickupTime')">
              <el-date-picker
                v-if="scope.row.editing === 'pickupTime'"
                v-model="scope.row.pickupTime"
                type="datetime"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'pickupTime')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'pickupTime')">{{ scope.row.pickupTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="arrivalTime" label="抵仓时间" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'arrivalTime')">
              <el-date-picker
                v-if="scope.row.editing === 'arrivalTime'"
                v-model="scope.row.arrivalTime"
                type="datetime"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'arrivalTime')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'arrivalTime')">{{ scope.row.arrivalTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="expectedUnloadingTime" label="预计拆柜时间" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'expectedUnloadingTime')">
              <el-date-picker
                v-if="scope.row.editing === 'expectedUnloadingTime'"
                v-model="scope.row.expectedUnloadingTime"
                type="datetime"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'expectedUnloadingTime')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'expectedUnloadingTime')">{{ scope.row.expectedUnloadingTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="unloadingTime" label="拆柜完成时间" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'unloadingTime')">
              <el-date-picker
                v-if="scope.row.editing === 'unloadingTime'"
                v-model="scope.row.unloadingTime"
                type="datetime"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'unloadingTime')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'unloadingTime')">{{ scope.row.unloadingTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="appointmentNo" label="预约号" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'appointmentNo')">
              <el-input
                v-if="scope.row.editing === 'appointmentNo'"
                v-model="scope.row.appointmentNo"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'appointmentNo')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'appointmentNo')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'appointmentNo')">{{ scope.row.appointmentNo }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryAppointmentTime" label="派送预约时间" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'deliveryAppointmentTime')">
              <el-date-picker
                v-if="scope.row.editing === 'deliveryAppointmentTime'"
                v-model="scope.row.deliveryAppointmentTime"
                type="datetime"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'deliveryAppointmentTime')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'deliveryAppointmentTime')">{{ scope.row.deliveryAppointmentTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryTime" label="送货时间" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'deliveryTime')">
              <el-date-picker
                v-if="scope.row.editing === 'deliveryTime'"
                v-model="scope.row.deliveryTime"
                type="datetime"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'deliveryTime')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'deliveryTime')">{{ scope.row.deliveryTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryCompany" label="送货公司" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'deliveryCompany')">
              <el-input
                v-if="scope.row.editing === 'deliveryCompany'"
                v-model="scope.row.deliveryCompany"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'deliveryCompany')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'deliveryCompany')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'deliveryCompany')">{{ scope.row.deliveryCompany }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryDriver" label="送货司机" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'deliveryDriver')">
              <el-input
                v-if="scope.row.editing === 'deliveryDriver'"
                v-model="scope.row.deliveryDriver"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'deliveryDriver')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'deliveryDriver')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'deliveryDriver')">{{ scope.row.deliveryDriver }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryPhone" label="司机电话" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDblClick(scope.row, 'deliveryPhone')">
              <el-input
                v-if="scope.row.editing === 'deliveryPhone'"
                v-model="scope.row.deliveryPhone"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'deliveryPhone')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'deliveryPhone')"
                v-focus
              />
              <span v-else @click="handleCellClick(scope.row, 'deliveryPhone')">{{ scope.row.deliveryPhone }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="pcNo" label="PC号" width="120">
          <template #default="scope">
            <span v-if="!scope.row.isGroup">{{ scope.row.pcNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="预约状态" width="200">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell">
              <el-select
                v-if="scope.row.editing === 'status'"
                v-model="scope.row.status"
                multiple
                filterable
                collapse-tags
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'status')"
                v-focus
              >
                <el-option
                  v-for="option in editableFields.status.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <div v-else class="tags-wrapper" @click="handleCellClick(scope.row, 'status')">
                <template v-if="Array.isArray(scope.row.status) && scope.row.status.length > 0">
                  <el-tag
                    v-for="status in scope.row.status"
                    :key="status"
                    :type="getStatusType(status)"
                    size="small"
                    closable
                    @close.stop="handleTagClose(scope.row, 'status', status)"
                  >
                    {{ getStatusText(status) }}
                  </el-tag>
                </template>
                <template v-else-if="typeof scope.row.status === 'string' && scope.row.status">
                  <el-tag
                    :type="getStatusType(scope.row.status)"
                    size="small"
                    closable
                    @close.stop="handleTagClose(scope.row, 'status', scope.row.status)"
                  >
                {{ getStatusText(scope.row.status) }}
              </el-tag>
                </template>
                <el-tag v-else size="small" type="info">未设置</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" width="200">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell">
              <el-select
                v-if="scope.row.editing === 'tags'"
                v-model="scope.row.tags"
                multiple
                filterable
                allow-create
                default-first-option
                collapse-tags
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'tags')"
                v-focus
              >
                <el-option
                  v-for="tag in editableFields.tags.options"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
              <div v-else class="tags-wrapper" @click="handleCellClick(scope.row, 'tags')">
                <el-tag
                  v-for="tag in (scope.row.tags || [])"
                  :key="tag"
                  size="small"
                  closable
                  @close.stop="handleTagClose(scope.row, 'tags', tag)"
                >
                  {{ tag }}
                </el-tag>
                <el-tag v-if="!scope.row.tags || scope.row.tags.length === 0" size="small" type="info">未设置</el-tag>
              </div>
            </div>
              </template>
        </el-table-column>
        <el-table-column prop="followUpRecord" label="跟进记录" width="200">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell">
              <el-input
                v-if="scope.row.editing === 'followUpRecord'"
                v-model="scope.row.followUpRecord"
                type="textarea"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'followUpRecord')"
                v-focus
              />
              <div v-else @click="handleCellClick(scope.row, 'followUpRecord')" class="cell-content">
                {{ scope.row.followUpRecord || '暂无记录' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="memo" label="备注" width="200">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell">
              <el-input
                v-if="scope.row.editing === 'memo'"
                v-model="scope.row.memo"
                type="textarea"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'memo')"
                v-focus
              />
              <div v-else @click="handleCellClick(scope.row, 'memo')" class="cell-content">
                {{ scope.row.memo || '暂无备注' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="internalNote" label="内部备注" width="150">
          <template #default="scope">
            <span v-if="!scope.row.isGroup">{{ scope.row.internalNote }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lianyuPrice" label="报价(联宇)" width="120">
          <template #default="scope">
            <span v-if="!scope.row.isGroup">{{ scope.row.lianyuPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="shippingMark" label="唛头" width="120">
          <template #default="scope">
            <span v-if="!scope.row.isGroup">{{ scope.row.shippingMark }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="inquiryPrice" label="询价平台报价" width="120">
          <template #default="scope">
            <span v-if="!scope.row.isGroup">{{ scope.row.inquiryPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-dropdown v-if="!scope.row.isGroup" trigger="click" @command="handleCommand($event, scope.row)">
              <el-button type="primary" size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="palletDetail">卡板明细</el-dropdown-item>
                  <el-dropdown-item command="copyAddress">复制地址信息</el-dropdown-item>
                  <el-dropdown-item command="followUp">跟进记录</el-dropdown-item>
                  <el-dropdown-item command="memo">MEMO</el-dropdown-item>
                  <el-dropdown-item command="markException">标记异常</el-dropdown-item>
                  <el-dropdown-item command="history">历史记录</el-dropdown-item>
                  <el-dropdown-item command="detail">详情</el-dropdown-item>
                  <el-dropdown-item command="cost">费用明细</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页器 -->
    <div class="pagination-container">
      <div class="pagination-info">
        显示 {{ paginationInfo.startRow }}-{{ paginationInfo.endRow }} 条，共 {{ total }} 条
      </div>
      <div class="pagination-size-select">
        每页显示
        <el-select v-model="pageSize" @change="handleSizeChange" style="width: 80px;">
          <el-option :value="10" label="10条"></el-option>
          <el-option :value="20" label="20条"></el-option>
          <el-option :value="50" label="50条"></el-option>
          <el-option :value="100" label="100条"></el-option>
        </el-select>
        条
      </div>
      <el-pagination
        background
        layout="prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>

    <!-- 筛选弹窗 -->
    <el-dialog
      v-model="filterModalVisible"
      title="筛选设置"
      width="600px"
    >
      <div class="filter-list">
        <div v-for="(filter, index) in filters" :key="index" class="filter-item">
          <el-select v-model="filter.field" placeholder="选择字段">
            <el-option
              v-for="field in fieldOptions"
              :key="field.value"
              :label="field.label"
              :value="field.value"
            ></el-option>
          </el-select>
          <el-select v-model="filter.operator" placeholder="选择操作符">
            <el-option label="等于" value="eq"></el-option>
            <el-option label="不等于" value="neq"></el-option>
            <el-option label="包含" value="contains"></el-option>
            <el-option label="不包含" value="not_contains"></el-option>
            <el-option label="大于" value="gt"></el-option>
            <el-option label="小于" value="lt"></el-option>
          </el-select>
          <el-input v-model="filter.value" placeholder="输入值"></el-input>
          <el-button type="danger" @click="removeFilter(index)">删除</el-button>
        </div>
      </div>
      <el-button type="primary" @click="addFilter">添加筛选条件</el-button>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="filterModalVisible = false">取消</el-button>
          <el-button type="primary" @click="applyFilters">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 排序弹窗 -->
    <el-dialog
      v-model="sortModalVisible"
      title="排序设置"
      width="500px"
    >
      <div class="sort-list">
        <div v-for="(sort, index) in sortSettings" :key="index" class="sort-item">
          <el-select v-model="sort.field" placeholder="选择字段">
            <el-option
              v-for="field in fieldOptions"
              :key="field.value"
              :label="field.label"
              :value="field.value"
            ></el-option>
          </el-select>
          <el-select v-model="sort.direction" placeholder="排序方向">
            <el-option label="升序" value="asc"></el-option>
            <el-option label="降序" value="desc"></el-option>
          </el-select>
          <el-button type="danger" @click="removeSort(index)">删除</el-button>
        </div>
      </div>
      <el-button type="primary" @click="addSort">添加排序</el-button>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="sortModalVisible = false">取消</el-button>
          <el-button type="primary" @click="applySortSettings">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分组弹窗 -->
    <el-dialog
      v-model="groupModalVisible"
      title="分组设置"
      width="500px"
    >
      <div class="group-settings">
        <div class="group-level">
          <span class="group-level-label">第一级分组：</span>
          <el-select v-model="groupSettings.level1" placeholder="请选择字段" clearable>
            <el-option
              v-for="field in groupableFields"
              :key="field.value"
              :label="field.label"
              :value="field.value"
            ></el-option>
          </el-select>
        </div>
        <div class="group-level">
          <span class="group-level-label">第二级分组：</span>
          <el-select v-model="groupSettings.level2" placeholder="请选择字段" clearable>
            <el-option
              v-for="field in groupableFields"
              :key="field.value"
              :label="field.label"
              :value="field.value"
            ></el-option>
          </el-select>
        </div>
        <div class="group-level">
          <span class="group-level-label">第三级分组：</span>
          <el-select v-model="groupSettings.level3" placeholder="请选择字段" clearable>
            <el-option
              v-for="field in groupableFields"
              :key="field.value"
              :label="field.label"
              :value="field.value"
            ></el-option>
          </el-select>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="groupModalVisible = false">取消</el-button>
          <el-button type="primary" @click="applyGroupSettings">应用</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 字段配置弹窗 -->
    <el-dialog
      v-model="fieldModalVisible"
      title="字段配置"
      width="600px"
    >
      <div class="field-list">
        <el-checkbox-group v-model="selectedFields">
          <div v-for="field in allFields" :key="field.value" class="field-item">
            <el-checkbox :label="field.value">{{ field.label }}</el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetFieldSettings">重置</el-button>
          <el-button @click="fieldModalVisible = false">取消</el-button>
          <el-button type="primary" @click="applyFieldSettings">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 单元格编辑弹窗 -->
    <el-dialog
      v-model="cellEditDialogVisible"
      :title="editingCell.title"
      width="600px"
      destroy-on-close
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="cell-edit-content">
        <template v-if="editingCell.type === 'tags'">
          <el-select
            v-model="editingCell.value"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="请选择或输入标签"
          >
            <el-option
              v-for="tag in editingCell.options"
              :key="tag"
              :label="tag"
              :value="tag"
            ></el-option>
          </el-select>
        </template>
        <template v-else-if="editingCell.type === 'status'">
          <el-select 
            v-model="editingCell.value" 
            placeholder="请选择状态"
            style="width: 100%"
          >
            <el-option
              v-for="status in editingCell.options"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            ></el-option>
          </el-select>
        </template>
        <template v-else-if="editingCell.type === 'datetime'">
          <el-date-picker
            v-model="editingCell.value"
            type="datetime"
            placeholder="选择日期时间"
            style="width: 100%"
          ></el-date-picker>
        </template>
        <template v-else>
          <el-input
            v-model="editingCell.value"
            :type="editingCell.type === 'textarea' ? 'textarea' : 'text'"
            :rows="4"
            :placeholder="'请输入' + editingCell.title"
            style="width: 100%"
          ></el-input>
        </template>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cellEditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleDialogEditConfirm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 字段详情弹窗 -->
    <el-dialog
      v-model="cellDetailDialogVisible"
      :title="editingCell.title + '详情'"
      width="600px"
    >
      <div class="cell-detail-content">
        <div class="detail-item" v-if="cellDetailData.currentValue">
          <div class="detail-label">当前值：</div>
          <div class="detail-value">{{ cellDetailData.currentValue }}</div>
        </div>
        <div class="detail-item" v-if="cellDetailData.historyValues">
          <div class="detail-label">历史记录：</div>
          <div class="detail-value">
            <el-timeline>
              <el-timeline-item
                v-for="(history, index) in cellDetailData.historyValues"
                :key="index"
                :timestamp="history.time"
              >
                {{ history.value }}
                <div class="history-operator">操作人：{{ history.operator }}</div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 新增/编辑视图弹窗 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="viewDialogType === 'add' ? '新增视图' : '编辑视图'"
      width="500px"
    >
      <div class="view-form">
        <el-form :model="viewForm" label-width="80px">
          <el-form-item label="视图名称" required>
            <el-input v-model="viewForm.name" placeholder="请输入视图名称"></el-input>
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="viewForm.description"
              type="textarea"
              placeholder="请输入视图描述"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleViewSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量操作弹窗 -->
    <el-dialog
      v-model="batchDialogVisible"
      :title="batchDialogTitle"
      width="600px"
    >
      <div class="batch-content">
        <template v-if="batchOperation === 'followUp'">
          <el-form :model="batchForm" label-width="80px">
            <el-form-item label="跟进记录" required>
              <el-input
                v-model="batchForm.followUp"
                type="textarea"
                rows="4"
                placeholder="请输入跟进记录"
              ></el-input>
            </el-form-item>
          </el-form>
        </template>
        <template v-else-if="batchOperation === 'memo'">
          <el-form :model="batchForm" label-width="80px">
            <el-form-item label="MEMO" required>
              <el-input
                v-model="batchForm.memo"
                type="textarea"
                rows="4"
                placeholder="请输入MEMO"
              ></el-input>
            </el-form-item>
          </el-form>
        </template>
        <template v-else-if="batchOperation === 'createPC'">
          <el-form :model="batchForm" label-width="100px">
            <el-form-item label="PC类型" required>
              <el-radio-group v-model="batchForm.pcType">
                <el-radio label="delivery">派送PC</el-radio>
                <el-radio label="transfer">调拨PC</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="目标仓库" v-if="batchForm.pcType === 'transfer'">
              <el-select v-model="batchForm.targetWarehouse" placeholder="请选择目标仓库">
                <el-option
                  v-for="warehouse in warehouseOptions"
                  :key="warehouse.value"
                  :label="warehouse.label"
                  :value="warehouse.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </template>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleBatchSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import { useStore } from 'vuex'
import { Search, Sort, Files, Setting, ArrowDown, More } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'FBXView',
  components: {
    Search,
    Sort,
    Files,
    Setting,
    ArrowDown,
    More
  },
  setup() {
    const store = useStore()
    
    // 标签页
    const activeTab = ref('all')
    
    // 日期筛选
    const dateType = ref('eta')
    const dateRange = ref([])
    
    // 多号码搜索
    const searchType = ref('containerNo')
    const searchNumber = ref('')
    
    // 模糊搜索
    const fuzzySearchText = ref('')
    
    // 表格数据
    const tableData = computed(() => store.getters.paginatedData)
    const total = computed(() => store.state.total)
    
    // 分页
    const currentPage = ref(1)
    const pageSize = ref(20)
    const paginationInfo = computed(() => {
      const startRow = (currentPage.value - 1) * pageSize.value + 1
      const endRow = Math.min(startRow + pageSize.value - 1, total.value)
      return {
        startRow,
        endRow
      }
    })
    
    // 选中的行
    const selectedRows = ref([])
    
    // 弹窗显示状态
    const filterModalVisible = ref(false)
    const sortModalVisible = ref(false)
    const groupModalVisible = ref(false)
    const fieldModalVisible = ref(false)
    
    // 筛选设置
    const filters = ref([])
    
    // 排序设置
    const sortSettings = ref([])
    
    // 分组设置
    const groupSettings = reactive({
      level1: '',
      level2: '',
      level3: ''
    })
    
    // 字段配置
    const allFields = [
      { label: '柜号', value: 'containerNo' },
      { label: '运单号', value: 'waybillNo' },
      { label: '客服', value: 'customerService' },
      { label: '原地址信息', value: 'originalAddress' },
      { label: '地址', value: 'address' },
      { label: 'City', value: 'city' },
      { label: 'State', value: 'state' },
      { label: 'Zip_Code', value: 'zipCode' },
      { label: '邮箱', value: 'email' },
      { label: '电话', value: 'phone' },
      { label: '派送区域', value: 'deliveryArea' },
      { label: '仓库代码', value: 'warehouseCode' },
      { label: '渠道', value: 'channel' },
      { label: '箱数', value: 'boxCount' },
      { label: '重量', value: 'weight' },
      { label: '方数', value: 'volume' },
      { label: '板数', value: 'palletCount' },
      { label: '库位', value: 'location' },
      { label: 'ETA', value: 'eta' },
      { label: '提柜时间', value: 'pickupTime' },
      { label: '抵仓时间', value: 'arrivalTime' },
      { label: '预计拆柜时间', value: 'expectedUnloadingTime' },
      { label: '拆柜完成时间', value: 'unloadingTime' },
      { label: '预约号', value: 'appointmentNo' },
      { label: '派送预约时间', value: 'deliveryAppointmentTime' },
      { label: 'PC号', value: 'pcNo' },
      { label: '预约状态', value: 'status' },
      { label: '标签', value: 'tags' },
      { label: '跟进记录', value: 'followUpRecord' },
      { label: '备注', value: 'memo' },
      { label: '内部备注', value: 'internalNote' },
      { label: '报价(联宇)', value: 'lianyuPrice' },
      { label: '唛头', value: 'shippingMark' },
      { label: '询价平台报价', value: 'inquiryPrice' }
    ]
    const selectedFields = ref(allFields.map(field => field.value))
    
    // 字段选项（用于筛选和排序）
    const fieldOptions = computed(() => {
      return allFields.filter(field => selectedFields.value.includes(field.value))
    })
    
    // 可分组字段
    const groupableFields = computed(() => {
      return [
        { label: '集装箱号', value: 'containerNo' },
        { label: '运单号', value: 'waybillNo' },
        { label: '客服', value: 'customerService' },
        { label: '原始地址', value: 'originalAddress' },
        { label: '地址', value: 'address' },
        { label: 'City', value: 'city' },
        { label: 'State', value: 'state' },
        { label: 'Zip_Code', value: 'zipCode' },
        { label: '邮箱', value: 'email' },
        { label: '电话', value: 'phone' },
        { label: '派送区域', value: 'deliveryArea' },
        { label: '仓库代码', value: 'warehouseCode' },
        { label: '渠道', value: 'channel' },
        { label: '箱数', value: 'boxCount' },
        { label: '重量', value: 'weight' },
        { label: '方数', value: 'volume' },
        { label: '板数', value: 'palletCount' },
        { label: '库位', value: 'location' },
        { label: 'ETA', value: 'eta' },
        { label: '提柜时间', value: 'pickupTime' },
        { label: '抵仓时间', value: 'arrivalTime' },
        { label: '预计拆柜时间', value: 'expectedUnloadingTime' },
        { label: '拆柜完成时间', value: 'unloadingTime' },
        { label: '预约号', value: 'appointmentNo' },
        { label: '派送预约时间', value: 'deliveryAppointmentTime' },
        { label: 'PC号', value: 'pcNo' },
        { label: '预约状态', value: 'status' },
        { label: '标签', value: 'tags' },
        { label: '跟进记录', value: 'followUpRecord' },
        { label: '备注', value: 'memo' },
        { label: '内部备注', value: 'internalNote' },
        { label: '报价(联宇)', value: 'lianyuPrice' },
        { label: '唛头', value: 'shippingMark' },
        { label: '询价平台报价', value: 'inquiryPrice' }
      ]
    })
    
    // 视图管理
    const views = ref([
      { id: 'all', name: '全部', count: 0 },
      { id: 'pending', name: '待预约', count: 0 },
      { id: 'appointed', name: '已预约', count: 0 }
    ])
    const viewDialogVisible = ref(false)
    const viewDialogType = ref('add')
    const viewForm = reactive({
      name: '',
      description: '',
      filters: [],
      sortSettings: [],
      groupSettings: {},
      selectedFields: []
    })

    // 批量操作
    const batchDialogVisible = ref(false)
    const batchOperation = ref('')
    const batchForm = reactive({
      followUp: '',
      memo: '',
      pcType: 'delivery',
      targetWarehouse: ''
    })
    const warehouseOptions = [
      { label: '仓库A', value: 'A' },
      { label: '仓库B', value: 'B' },
      { label: '仓库C', value: 'C' }
    ]

    // 计算属性
    const batchDialogTitle = computed(() => {
      switch (batchOperation.value) {
        case 'followUp':
          return '批量添加跟进记录'
        case 'memo':
          return '批量添加MEMO'
        case 'createPC':
          return '创建PC'
        default:
          return ''
      }
    })

    // 状态选项
    const statusOptions = [
      { label: '待处理', value: 'pending' },
      { label: '处理中', value: 'processing' },
      { label: '已发货', value: 'shipped' },
      { label: '已送达', value: 'delivered' },
      { label: '已取消', value: 'cancelled' }
    ]

    // 可用标签
    const availableTags = ['加急', '特殊处理', '易碎品', '重物', '需要叉车']

    // 计算属性
    const hasGroupedData = computed(() => {
      return tableData.value.some(item => item.isGroup);
    });

    // 获取分组标签类型
    const getGroupTagType = (level) => {
      const types = ['', 'primary', 'success', 'warning'];
      return types[level] || 'info';
    };

    // 获取行的类名
    const getRowClassName = ({ row }) => {
      if (row.isGroup) {
        return row.groupClass || '';
      }
      if (row.dataParentGroupKey) {
        // 为子数据项添加样式
        return `data-row data-parent-group-key-${row.dataParentGroupKey.replace(/[^a-zA-Z0-9]/g, '-')}`;
      }
      return '';
    }

    // 初始化
    onMounted(() => {
      const today = new Date()
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(today.getMonth() - 1)
      dateRange.value = [oneMonthAgo, today]
      
      store.dispatch('loadTableData')
      loadViewsFromStorage()
    })
    
    // 搜索和重置
    const handleSearch = () => {
      const searchParams = {
        dateType: dateType.value,
        dateRange: dateRange.value,
        searchType: searchType.value,
        searchNumber: searchNumber.value,
        fuzzySearchText: fuzzySearchText.value
      }
      
      store.dispatch('searchData', searchParams)
    }
    
    const handleReset = () => {
      dateType.value = 'eta'
      const today = new Date()
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(today.getMonth() - 1)
      dateRange.value = [oneMonthAgo, today]
      searchType.value = 'containerNo'
      searchNumber.value = ''
      fuzzySearchText.value = ''
      
      handleSearch()
    }
    
    // 表格选择
    const handleSelectionChange = (rows) => {
      selectedRows.value = rows
    }
    
    // 分页
    const handleCurrentChange = (page) => {
      currentPage.value = page
      store.commit('SET_CURRENT_PAGE', page)
    }
    
    const handleSizeChange = (size) => {
      pageSize.value = size
      store.commit('SET_PAGE_SIZE', size)
    }
    
    // 筛选
    const showFilterModal = () => {
      filterModalVisible.value = true
    }
    
    const addFilter = () => {
      filters.value.push({
        field: '',
        operator: 'eq',
        value: ''
      })
    }
    
    const removeFilter = (index) => {
      filters.value.splice(index, 1)
    }
    
    const applyFilters = () => {
      store.commit('SET_FILTERS', filters.value)
      store.dispatch('applyFilters')
      filterModalVisible.value = false
    }
    
    // 排序
    const showSortModal = () => {
      sortModalVisible.value = true
    }
    
    const addSort = () => {
      sortSettings.value.push({
        field: '',
        direction: 'asc'
      })
    }
    
    const removeSort = (index) => {
      sortSettings.value.splice(index, 1)
    }
    
    const applySortSettings = () => {
      store.commit('SET_SORT_SETTINGS', sortSettings.value)
      store.dispatch('applySort')
      sortModalVisible.value = false
    }
    
    // 分组
    const showGroupModal = () => {
      groupModalVisible.value = true
    }
    
    const applyGroupSettings = () => {
      const groupFields = [];
      if (groupSettings.level1) groupFields.push(groupSettings.level1);
      if (groupSettings.level2) groupFields.push(groupSettings.level2);
      if (groupSettings.level3) groupFields.push(groupSettings.level3);
      
      store.dispatch('applyGroup', { groupFields });
      groupModalVisible.value = false;
    }
    
    // 字段配置
    const showFieldModal = () => {
      fieldModalVisible.value = true
    }
    
    const resetFieldSettings = () => {
      selectedFields.value = allFields.map(field => field.value)
    }
    
    const applyFieldSettings = () => {
      store.commit('SET_FIELD_SETTINGS', selectedFields.value)
      store.dispatch('applyFieldSettings')
      fieldModalVisible.value = false
    }

    // 单元格编辑相关
    const cellEditDialogVisible = ref(false)
    const cellDetailDialogVisible = ref(false)
    const editingCell = reactive({
      row: null,
      field: '',
      value: '',
      title: '',
      type: 'text',
      options: [],
      placeholder: ''
    })
    const cellDetailData = reactive({
      currentValue: '',
      historyValues: []
    })

    // 可编辑字段配置
    const editableFields = {
      address: { type: 'text', title: '地址', placeholder: '请输入地址' },
      city: { type: 'text', title: 'City', placeholder: '请输入城市' },
      state: { type: 'text', title: 'State', placeholder: '请输入州/省' },
      zipCode: { type: 'text', title: 'Zip_Code', placeholder: '请输入邮编' },
      email: { type: 'email', title: '邮箱', placeholder: '请输入邮箱' },
      phone: { type: 'text', title: '电话', placeholder: '请输入联系方式' },
      deliveryArea: { type: 'text', title: '派送区域', placeholder: '请输入派送区域' },
      appointmentNo: { type: 'text', title: '预约号', placeholder: '请输入预约号' },
      deliveryAppointmentTime: { type: 'datetime', title: '派送预约时间', placeholder: '请选择派送预约时间' },
      status: { 
        type: 'tags', 
        title: '预约状态',
        options: [
          { label: '已预约', value: 'appointed' },
          { label: '未预约', value: 'pending' },
          { label: '电话预约', value: 'phone' },
          { label: '邮件预约', value: 'email' },
          { label: '平台预约', value: 'platform' }
        ]
      },
      tags: { 
        type: 'tags', 
        title: '标签',
        options: ['加急', '特殊处理', '易碎品', '重物', '需要叉车']
      },
      followUpRecord: { type: 'textarea', title: '跟进记录', placeholder: '请输入跟进记录' },
      memo: { type: 'textarea', title: '备注', placeholder: '请输入备注' },
      internalNote: { type: 'textarea', title: '内部备注', placeholder: '请输入内部备注' },
      lianyuPrice: { type: 'text', title: '报价(联宇)', placeholder: '请输入报价' }
    }

    // 处理单元格点击
    const handleCellClick = (row, field) => {
      const fieldConfig = editableFields[field]
      if (!fieldConfig) return
      
      // 设置当前编辑的字段
      row.editing = field
    }

    // 处理单元格双击
    const handleCellDblClick = async (row, field) => {
      const fieldConfig = editableFields[field]
      if (!fieldConfig) return

      editingCell.row = row
      editingCell.field = field
      editingCell.title = fieldConfig.title
      editingCell.type = fieldConfig.type
      editingCell.value = row[field]
      editingCell.options = fieldConfig.options || []
      
      // 对于长文本字段，使用textarea类型
      if (['address', 'memo', 'followUpRecord'].includes(field)) {
        editingCell.type = 'textarea'
      }
      
      cellEditDialogVisible.value = true
    }

    // 处理单元格编辑确认（单击编辑时的失焦保存）
    const handleCellEditConfirm = async (row, field) => {
      if (!row || !field) return

      try {
        await store.dispatch('updateField', {
          id: row.id,
          field: field,
          value: row[field]
        })
        
        // 清除编辑状态
        row.editing = null
        ElMessage.success('修改成功')
      } catch (error) {
        ElMessage.error('修改失败')
      }
    }

    // 处理弹窗编辑确认（双击编辑时的确认按钮）
    const handleDialogEditConfirm = async () => {
      if (!editingCell.row || !editingCell.field) return

      try {
        await store.dispatch('updateField', {
          id: editingCell.row.id,
          field: editingCell.field,
          value: editingCell.value
        })
        
        // 更新本地数据
        editingCell.row[editingCell.field] = editingCell.value
        
        // 关闭弹窗
        cellEditDialogVisible.value = false
        ElMessage.success('修改成功')
      } catch (error) {
        ElMessage.error('修改失败')
      }
    }

    // 视图操作
    const handleTabClick = (tab) => {
      if (tab.props.name === 'add') {
        handleAddView()
      }
    }

    const handleAddView = () => {
      viewDialogType.value = 'add'
      viewForm.name = ''
      viewForm.description = ''
      viewDialogVisible.value = true
    }

    // 处理更多操作
    const handleCommand = (command, row) => {
      let addressInfo = ''
      
      switch (command) {
        case 'palletDetail':
          // 处理卡板明细
          break
        case 'copyAddress':
          // 复制地址信息到剪贴板
          addressInfo = `${row.address}, ${row.city}, ${row.state} ${row.zipCode}`
          navigator.clipboard.writeText(addressInfo)
            .then(() => {
              ElMessage.success('地址已复制到剪贴板')
            })
            .catch(err => {
              console.error('复制失败:', err)
              ElMessage.error('复制地址失败')
            })
          break
        case 'followUp':
          // 处理跟进记录
          break
        case 'memo':
          // 处理MEMO
          break
        case 'markException':
          // 标记异常
          break
        case 'history':
          // 查看历史记录
          break
        case 'detail':
          // 查看详情
          break
        case 'cost':
          // 查看费用明细
          break
      }
    }

    // 视图命令处理
    const handleViewCommand = (command, view) => {
      switch (command) {
        case 'copy':
          viewDialogType.value = 'copy'
          viewForm.name = `${view.name} 副本`
          viewForm.description = ''
          viewDialogVisible.value = true
          break
        case 'rename':
          viewDialogType.value = 'rename'
          viewForm.name = view.name
          viewForm.description = view.description || ''
          viewDialogVisible.value = true
          break
        case 'delete':
          ElMessageBox.confirm(
            '确定要删除该视图吗？',
            '提示',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }
          ).then(() => {
            // 删除视图逻辑
            const index = views.value.findIndex(v => v.id === view.id)
            if (index > -1) {
              views.value.splice(index, 1)
              // 保存到本地存储
              saveViewsToStorage()
            }
          })
          break
      }
    }

    const handleViewSubmit = () => {
      if (!viewForm.name) {
        ElMessage.warning('请输入视图名称')
        return
      }

      const newView = {
        id: Date.now().toString(),
        name: viewForm.name,
        description: viewForm.description,
        filters: [...filters.value],
        sortSettings: [...sortSettings.value],
        groupSettings: { ...groupSettings },
        selectedFields: [...selectedFields.value],
        count: 0
      }

      if (viewDialogType.value === 'add' || viewDialogType.value === 'copy') {
        views.value.push(newView)
      } else if (viewDialogType.value === 'rename') {
        const index = views.value.findIndex(v => v.id === activeTab.value)
        if (index > -1) {
          views.value[index] = { ...views.value[index], ...newView }
        }
      }

      // 保存到本地存储
      saveViewsToStorage()
      viewDialogVisible.value = false
    }

    const handleSaveView = () => {
      const currentView = views.value.find(v => v.id === activeTab.value)
      if (!currentView) return

      currentView.filters = [...filters.value]
      currentView.sortSettings = [...sortSettings.value]
      currentView.groupSettings = { ...groupSettings }
      currentView.selectedFields = [...selectedFields.value]

      // 保存到本地存储
      saveViewsToStorage()
      ElMessage.success('视图保存成功')
    }

    // 批量操作
    const handleBatchOperation = (operation) => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请先选择要操作的数据')
        return
      }

      batchOperation.value = operation
      batchForm.followUp = ''
      batchForm.memo = ''
      batchForm.pcType = 'delivery'
      batchForm.targetWarehouse = ''
      batchDialogVisible.value = true
    }

    const handleBatchSubmit = () => {
      // 根据不同的批量操作类型处理
      switch (batchOperation.value) {
        case 'followUp':
          if (!batchForm.followUp) {
            ElMessage.warning('请输入跟进记录')
            return
          }
          // 处理批量添加跟进记录
          break
        case 'memo':
          if (!batchForm.memo) {
            ElMessage.warning('请输入MEMO')
            return
          }
          // 处理批量添加MEMO
          break
        case 'createPC':
          if (batchForm.pcType === 'transfer' && !batchForm.targetWarehouse) {
            ElMessage.warning('请选择目标仓库')
            return
          }
          // 处理创建PC
          break
      }

      batchDialogVisible.value = false
      ElMessage.success('操作成功')
    }

    // 导出报表
    const handleExport = () => {
      // 导出当前筛选范围的数据
      console.log('导出报表', {
        filters: filters.value,
        sortSettings: sortSettings.value
      })
    }

    // 本地存储
    const saveViewsToStorage = () => {
      localStorage.setItem('fbx-views', JSON.stringify(views.value))
    }

    const loadViewsFromStorage = () => {
      const savedViews = localStorage.getItem('fbx-views')
      if (savedViews) {
        views.value = JSON.parse(savedViews)
      }
    }

    // 订单状态处理
    const getStatusType = (status) => {
      const statusMap = {
        pending: 'info',
        appointed: 'success',
        phone: 'warning',
        email: 'warning',
        platform: 'warning',
        completed: 'success',
        cancelled: 'danger'
      }
      return statusMap[status] || 'info'
    }

    const getStatusText = (status) => {
      const statusMap = {
        pending: '未预约',
        appointed: '已预约',
        phone: '电话预约',
        email: '邮件预约',
        platform: '平台预约',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    }

    // 自定义指令：自动聚焦
    const vFocus = {
      mounted: (el) => {
        // 对于 el-select 等组件，需要获取其输入框元素
        const input = el.querySelector('input')
        if (input) {
          input.focus()
        } else {
          el.focus()
        }
      }
    }

    // 处理标签关闭
    const handleTagClose = (row, field, tag) => {
      if (!row[field]) return
      
      const index = row[field].indexOf(tag)
      if (index > -1) {
        const newValues = [...row[field]]
        newValues.splice(index, 1)
        row[field] = newValues
        handleCellEditConfirm(row, field)
      }
    }

    return {
      activeTab,
      dateType,
      dateRange,
      searchType,
      searchNumber,
      fuzzySearchText,
      tableData,
      total,
      currentPage,
      pageSize,
      paginationInfo,
      selectedRows,
      filterModalVisible,
      sortModalVisible,
      groupModalVisible,
      fieldModalVisible,
      filters,
      sortSettings,
      groupSettings,
      allFields,
      selectedFields,
      fieldOptions,
      groupableFields,
      handleSearch,
      handleReset,
      handleSelectionChange,
      handleCurrentChange,
      handleSizeChange,
      showFilterModal,
      addFilter,
      removeFilter,
      applyFilters,
      showSortModal,
      addSort,
      removeSort,
      applySortSettings,
      showGroupModal,
      applyGroupSettings,
      showFieldModal,
      resetFieldSettings,
      applyFieldSettings,
      cellEditDialogVisible,
      cellDetailDialogVisible,
      editingCell,
      cellDetailData,
      statusOptions,
      availableTags,
      handleCellClick,
      handleCellDblClick,
      handleCellEditConfirm,
      handleDialogEditConfirm,
      handleCommand,
      views,
      viewDialogVisible,
      viewDialogType,
      viewForm,
      batchDialogVisible,
      batchOperation,
      batchForm,
      batchDialogTitle,
      warehouseOptions,
      handleTabClick,
      handleAddView,
      handleViewCommand,
      handleViewSubmit,
      handleSaveView,
      handleBatchOperation,
      handleBatchSubmit,
      handleExport,
      getStatusType,
      getStatusText,
      vFocus,
      handleTagClose,
      hasGroupedData,
      getGroupTagType,
      getRowClassName
    }
  }
}
</script>

<style scoped>
.fbx-container {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.tabs-container {
  margin-bottom: 20px;
}

.filter-area {
  margin-bottom: 20px;
}

.search-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.date-filter {
  display: flex;
  align-items: center;
}

.date-filter .el-select {
  margin-right: 10px;
}

.multi-search {
  display: flex;
  align-items: center;
}

.fuzzy-search {
  display: flex;
  align-items: center;
}

.button-group {
  margin-left: auto;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-start;
}

.table-container {
  margin-bottom: 20px;
}

.expanded-row {
  padding: 20px;
}

.expanded-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.expanded-info p {
  margin-bottom: 10px;
  line-height: 1.5;
}

.expanded-info p:last-child {
  margin-bottom: 0;
}

.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pagination-info, .pagination-size-select {
  color: #606266;
}

.pagination-size-select {
  display: flex;
  align-items: center;
}

.pagination-size-select .el-select {
  margin: 0 5px;
}

/* 弹窗样式 */
.filter-item, .sort-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.filter-item > *, .sort-item > * {
  margin-right: 10px;
}

.group-level {
  margin-bottom: 15px;
}

.group-level label {
  display: block;
  margin-bottom: 5px;
}

.field-item {
  margin-bottom: 10px;
}

.cell-edit-content {
  padding: 20px;
  min-height: 120px;
}

.cell-edit-content .el-input,
.cell-edit-content .el-select,
.cell-edit-content .el-date-picker {
  width: 100%;
}

.cell-edit-content .el-textarea {
  font-size: 14px;
}

.cell-edit-content .el-select .el-tag {
  margin: 2px 4px;
}

.cell-detail-content {
  padding: 20px;
}

.detail-item {
  margin-bottom: 20px;
}

.detail-label {
  font-weight: bold;
  margin-bottom: 10px;
}

.detail-value {
  color: #606266;
}

.history-operator {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409EFF;
}

.el-dropdown-link .el-icon {
  transform: rotate(90deg);
}

.el-tabs :deep(.el-tabs__item) {
  display: flex;
  align-items: center;
}

.view-form {
  padding: 20px;
}

.batch-content {
  padding: 20px;
}

.editable-cell {
  padding: 5px;
  cursor: pointer;
}

.editable-cell:hover {
  background-color: #f5f7fa;
}

.editable-cell span {
  display: block;
  min-height: 24px;
  line-height: 24px;
}

.editable-cell .el-input,
.editable-cell .el-select,
.editable-cell .el-date-picker {
  width: 100%;
}

.editable-cell .el-tag {
  margin: 2px;
}

.tags-wrapper {
  min-height: 30px;
  padding: 2px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  cursor: pointer;
}

.tags-wrapper:hover {
  background-color: #f5f7fa;
}

.cell-content {
  padding: 5px;
  min-height: 24px;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.cell-content:hover {
  background-color: #f5f7fa;
}

.group-name {
  font-weight: bold;
}

.group-summary {
  color: #409EFF;
  font-weight: bold;
}

.level-1-group {
  background-color: #f0f9ff;
}

.level-2-group {
  background-color: #f4f4f5;
}

.level-3-group {
  background-color: #fafafa;
}

/* 添加数据项缩进样式 */
.el-table :deep(.data-parent-group-key-) td:first-child {
  padding-left: 30px;
}
</style> 