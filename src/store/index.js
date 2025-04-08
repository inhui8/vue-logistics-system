import { createStore } from 'vuex'

export default createStore({
  state: {
    // 表格数据
    tableData: [],
    // 当前页码
    currentPage: 1,
    // 每页显示条数
    pageSize: 20,
    // 总条数
    total: 0,
    // 筛选条件
    filters: [],
    // 排序设置
    sortSettings: [],
    // 分组设置
    groupSettings: {
      level1: '',
      level2: '',
      level3: ''
    },
    // 字段配置
    fieldSettings: []
  },
  getters: {
    // 获取分页后的数据
    paginatedData(state) {
      const start = (state.currentPage - 1) * state.pageSize
      const end = start + state.pageSize
      return state.tableData.slice(start, end)
    }
  },
  mutations: {
    // 设置表格数据
    SET_TABLE_DATA(state, data) {
      state.tableData = data
      state.total = data.length
    },
    // 设置当前页码
    SET_CURRENT_PAGE(state, page) {
      state.currentPage = page
    },
    // 设置每页显示条数
    SET_PAGE_SIZE(state, size) {
      state.pageSize = size
    },
    // 设置筛选条件
    SET_FILTERS(state, filters) {
      state.filters = filters
    },
    // 设置排序设置
    SET_SORT_SETTINGS(state, settings) {
      state.sortSettings = settings
    },
    // 设置分组设置
    SET_GROUP_SETTINGS(state, settings) {
      state.groupSettings = settings
    },
    // 设置字段配置
    SET_FIELD_SETTINGS(state, settings) {
      state.fieldSettings = settings
    },
    // 设置分组数据
    setGroupedData(state, data) {
      state.tableData = data
      state.total = data.length
    }
  },
  actions: {
    // 加载表格数据
    loadTableData({ commit }) {
      // 模拟从API获取数据
      const mockData = Array(100).fill().map((_, index) => ({
        id: index + 1,
        containerNo: `CONT${100000 + index}`,
        waybillNo: `WB${200000 + index}`,
        customerService: ['张三', '李四', '王五'][Math.floor(Math.random() * 3)],
        originalAddress: `原地址 ${index + 1}`,
        address: `地址 ${index + 1}`,
        city: ['洛杉矶', '纽约', '芝加哥', '休斯顿'][Math.floor(Math.random() * 4)],
        state: ['CA', 'NY', 'IL', 'TX'][Math.floor(Math.random() * 4)],
        zipCode: Math.floor(10000 + Math.random() * 90000).toString(),
        deliveryArea: ['东区', '西区', '南区', '北区'][Math.floor(Math.random() * 4)],
        warehouseCode: `WH${index % 10 + 1}`,
        channel: ['空运', '海运', '陆运'][Math.floor(Math.random() * 3)],
        boxCount: Math.floor(1 + Math.random() * 10),
        weight: Math.floor(100 + Math.random() * 900),
        volume: (Math.random() * 10).toFixed(2),
        palletCount: Math.floor(1 + Math.random() * 5),
        location: `A${Math.floor(1 + Math.random() * 9)}-${Math.floor(1 + Math.random() * 9)}`,
        eta: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString().split('T')[0],
        pickupTime: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000).toISOString().split('T')[0],
        arrivalTime: new Date(Date.now() - Math.floor(Math.random() * 15) * 86400000).toISOString().split('T')[0],
        unloadingTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString().split('T')[0],
        appointmentNo: `AP${300000 + index}`,
        deliveryAppointmentTime: new Date(Date.now() + Math.floor(Math.random() * 10) * 86400000).toISOString().split('T')[0],
        pcNo: `PC${400000 + index}`,
        status: ['pending', 'appointed', 'phone', 'email', 'platform', 'completed', 'cancelled'][Math.floor(Math.random() * 7)],
        tags: Math.random() > 0.5 ? ['加急', '特殊处理', '易碎品', '重物', '需要叉车'].slice(0, Math.floor(Math.random() * 3) + 1) : [],
        memo: Math.random() > 0.7 ? `备注信息 ${index + 1}` : '',
        followUpRecord: Math.random() > 0.8 ? `跟进记录 ${index + 1}` : ''
      }))
      
      commit('SET_TABLE_DATA', mockData)
    },
    // 应用筛选
    applyFilters({ state, commit }) {
      // 如果没有筛选条件，直接返回所有数据
      if (!state.filters || state.filters.length === 0) {
        return;
      }

      // 从原始数据中筛选
      const originalData = Array(100).fill().map((_, index) => ({
        id: index + 1,
        containerNo: `CONT${100000 + index}`,
        waybillNo: `WB${200000 + index}`,
        customerService: ['张三', '李四', '王五'][Math.floor(Math.random() * 3)],
        originalAddress: `原地址 ${index + 1}`,
        address: `地址 ${index + 1}`,
        city: ['洛杉矶', '纽约', '芝加哥', '休斯顿'][Math.floor(Math.random() * 4)],
        state: ['CA', 'NY', 'IL', 'TX'][Math.floor(Math.random() * 4)],
        zipCode: Math.floor(10000 + Math.random() * 90000).toString(),
        deliveryArea: ['东区', '西区', '南区', '北区'][Math.floor(Math.random() * 4)],
        warehouseCode: `WH${index % 10 + 1}`,
        channel: ['空运', '海运', '陆运'][Math.floor(Math.random() * 3)],
        boxCount: Math.floor(1 + Math.random() * 10),
        weight: Math.floor(100 + Math.random() * 900),
        volume: (Math.random() * 10).toFixed(2),
        palletCount: Math.floor(1 + Math.random() * 5),
        location: `A${Math.floor(1 + Math.random() * 9)}-${Math.floor(1 + Math.random() * 9)}`,
        eta: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString().split('T')[0],
        pickupTime: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000).toISOString().split('T')[0],
        arrivalTime: new Date(Date.now() - Math.floor(Math.random() * 15) * 86400000).toISOString().split('T')[0],
        unloadingTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString().split('T')[0],
        appointmentNo: `AP${300000 + index}`,
        deliveryAppointmentTime: new Date(Date.now() + Math.floor(Math.random() * 10) * 86400000).toISOString().split('T')[0],
        pcNo: `PC${400000 + index}`,
        status: ['pending', 'appointed', 'phone', 'email', 'platform', 'completed', 'cancelled'][Math.floor(Math.random() * 7)],
        tags: Math.random() > 0.5 ? ['加急', '特殊处理', '易碎品', '重物', '需要叉车'].slice(0, Math.floor(Math.random() * 3) + 1) : [],
        memo: Math.random() > 0.7 ? `备注信息 ${index + 1}` : '',
        followUpRecord: Math.random() > 0.8 ? `跟进记录 ${index + 1}` : ''
      }));

      // 应用筛选条件
      const filteredData = originalData.filter(item => {
        // 检查每个筛选条件
        return state.filters.every(filter => {
          if (!filter.field || !filter.operator || filter.value === undefined || filter.value === '') {
            return true; // 跳过无效的筛选条件
          }

          const fieldValue = item[filter.field];
          const filterValue = filter.value;

          // 根据操作符进行筛选
          switch (filter.operator) {
            case 'eq': // 等于
              return fieldValue == filterValue;
            case 'neq': // 不等于
              return fieldValue != filterValue;
            case 'contains': // 包含
              return String(fieldValue).includes(String(filterValue));
            case 'not_contains': // 不包含
              return !String(fieldValue).includes(String(filterValue));
            case 'gt': // 大于
              return Number(fieldValue) > Number(filterValue);
            case 'lt': // 小于
              return Number(fieldValue) < Number(filterValue);
            default:
              return true;
          }
        });
      });

      // 更新表格数据
      commit('SET_TABLE_DATA', filteredData);
      commit('SET_CURRENT_PAGE', 1); // 重置为第一页
    },
    // 应用排序
    applySort({ state, commit }) {
      // 如果没有排序设置，直接返回
      if (!state.sortSettings || state.sortSettings.length === 0) {
        return;
      }

      // 复制当前数据进行排序
      const sortedData = [...state.tableData];

      // 应用排序
      sortedData.sort((a, b) => {
        // 遍历所有排序条件
        for (const sort of state.sortSettings) {
          if (!sort.field || !sort.direction) {
            continue; // 跳过无效的排序条件
          }

          const fieldA = a[sort.field];
          const fieldB = b[sort.field];
          
          // 如果值相等，继续下一个排序条件
          if (fieldA === fieldB) {
            continue;
          }
          
          // 根据排序方向返回比较结果
          if (sort.direction === 'asc') {
            // 升序
            if (typeof fieldA === 'string' && typeof fieldB === 'string') {
              return fieldA.localeCompare(fieldB);
            } else {
              return fieldA > fieldB ? 1 : -1;
            }
          } else {
            // 降序
            if (typeof fieldA === 'string' && typeof fieldB === 'string') {
              return fieldB.localeCompare(fieldA);
            } else {
              return fieldA < fieldB ? 1 : -1;
            }
          }
        }
        
        return 0; // 所有条件都相等
      });

      // 更新表格数据
      commit('SET_TABLE_DATA', sortedData);
      commit('SET_CURRENT_PAGE', 1); // 重置为第一页
    },
    // 应用分组
    applyGroup({ state, commit }, { groupFields }) {
      if (!groupFields || groupFields.length === 0) {
        commit('setGroupedData', []);
        return;
      }

      const getFieldLabel = (field) => {
        const fieldMap = {
          containerNo: '集装箱号',
          waybillNo: '运单号',
          customerService: '客服',
          originalAddress: '原始地址',
          address: '地址',
          city: 'City',
          state: 'State',
          zipCode: 'Zip_Code',
          email: '邮箱',
          phone: '电话',
          deliveryArea: '派送区域',
          warehouseCode: '仓库代码',
          channel: '渠道',
          boxCount: '箱数',
          weight: '重量',
          volume: '方数',
          palletCount: '板数',
          location: '库位',
          eta: 'ETA',
          pickupTime: '提柜时间',
          arrivalTime: '抵仓时间',
          expectedUnloadingTime: '预计拆柜时间',
          unloadingTime: '拆柜完成时间',
          appointmentNo: '预约号',
          deliveryAppointmentTime: '派送预约时间',
          pcNo: 'PC号',
          status: '预约状态',
          tags: '标签',
          followUpRecord: '跟进记录',
          memo: '备注',
          internalNote: '内部备注',
          lianyuPrice: '报价(联宇)',
          shippingMark: '唛头',
          inquiryPrice: '询价平台报价'
        };
        return fieldMap[field] || field;
      };

      const data = [...state.tableData];
      const groupedData = [];
      const groupMap = new Map();

      // 处理分组数据
      data.forEach(item => {
        let currentLevel = groupedData;
        let currentPath = '';
        let parentItem = null;

        // 处理每个分组级别
        for (let i = 0; i < groupFields.length; i++) {
          const field = groupFields[i];
          const value = item[field];
          const fieldLabel = getFieldLabel(field);
          const groupKey = `${currentPath}/${field}:${value}`;
          
          // 查找或创建当前级别的分组
          let group = currentLevel.find(g => g.groupKey === groupKey);
          
          if (!group) {
            group = {
              id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              groupKey,
              groupName: `${fieldLabel}: ${value || '空'}`,
              isGroup: true,
              groupLevel: i,
              children: [],
              items: [],
              count: 0,
              totalWeight: 0,
              totalVolume: 0,
              totalBoxCount: 0,
              containerNoSummary: '',
              waybillNoSummary: ''
            };
            
            // 设置分组样式
            if (i === 0) {
              group.groupClass = 'level-1-group';
            } else if (i === 1) {
              group.groupClass = 'level-2-group';
            } else {
              group.groupClass = 'level-3-group';
            }
            
            currentLevel.push(group);
            groupMap.set(groupKey, group);
          }
          
          // 更新统计信息
          group.items.push(item);
          group.count = group.items.length;
          group.totalWeight += parseFloat(item.weight || 0);
          group.totalVolume += parseFloat(item.volume || 0);
          group.totalBoxCount += parseInt(item.boxCount || 0, 10);
          
          // 更新摘要信息
          group.containerNoSummary = `共 ${group.count} 条记录，总重量: ${group.totalWeight.toFixed(2)}kg`;
          group.waybillNoSummary = `总箱数: ${group.totalBoxCount}，总体积: ${group.totalVolume.toFixed(2)}m³`;
          
          // 为下一级分组做准备
          currentPath = groupKey;
          currentLevel = group.children;
          parentItem = group;
        }
        
        // 将原始数据项添加到最后一级分组的子项中
        if (parentItem) {
          // 添加原始数据项到分组的子项中，但保留其原始属性
          const clonedItem = {...item, parentGroupKey: parentItem.groupKey};
          parentItem.children.push(clonedItem);
        }
      });

      // 将所有分组和数据项合并到一个扁平数组中
      const flattenedData = [];
      
      // 递归函数，用于展开所有分组和数据项
      function flattenGroups(groups, level = 0) {
        groups.forEach(group => {
          // 添加分组项
          flattenedData.push(group);
          
          // 添加该分组下的所有数据项
          if (group.items && group.items.length > 0) {
            group.items.forEach(item => {
              // 创建一个新的数据项，添加标识以便于样式处理
              const dataItem = {...item, dataParentGroupKey: group.groupKey};
              flattenedData.push(dataItem);
            });
          }
          
          // 如果有子分组，递归处理
          const childGroups = group.children.filter(child => child.isGroup);
          if (childGroups.length > 0) {
            flattenGroups(childGroups, level + 1);
          }
        });
      }
      
      flattenGroups(groupedData);
      
      commit('setGroupedData', flattenedData);
    },
    // 应用字段配置
    applyFieldSettings({ state }) {
      // 实际应用中可能需要保存用户的字段配置
      console.log('应用字段配置:', state.fieldSettings)
    },
    
    // 搜索数据
    searchData({ commit }, searchParams) {
      // 模拟从API获取数据
      const originalData = Array(100).fill().map((_, index) => ({
        id: index + 1,
        containerNo: `CONT${100000 + index}`,
        waybillNo: `WB${200000 + index}`,
        customerService: ['张三', '李四', '王五'][Math.floor(Math.random() * 3)],
        originalAddress: `原地址 ${index + 1}`,
        address: `地址 ${index + 1}`,
        city: ['洛杉矶', '纽约', '芝加哥', '休斯顿'][Math.floor(Math.random() * 4)],
        state: ['CA', 'NY', 'IL', 'TX'][Math.floor(Math.random() * 4)],
        zipCode: Math.floor(10000 + Math.random() * 90000).toString(),
        deliveryArea: ['东区', '西区', '南区', '北区'][Math.floor(Math.random() * 4)],
        warehouseCode: `WH${index % 10 + 1}`,
        channel: ['空运', '海运', '陆运'][Math.floor(Math.random() * 3)],
        boxCount: Math.floor(1 + Math.random() * 10),
        weight: Math.floor(100 + Math.random() * 900),
        volume: (Math.random() * 10).toFixed(2),
        palletCount: Math.floor(1 + Math.random() * 5),
        location: `A${Math.floor(1 + Math.random() * 9)}-${Math.floor(1 + Math.random() * 9)}`,
        eta: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString().split('T')[0],
        pickupTime: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000).toISOString().split('T')[0],
        arrivalTime: new Date(Date.now() - Math.floor(Math.random() * 15) * 86400000).toISOString().split('T')[0],
        unloadingTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString().split('T')[0],
        appointmentNo: `AP${300000 + index}`,
        deliveryAppointmentTime: new Date(Date.now() + Math.floor(Math.random() * 10) * 86400000).toISOString().split('T')[0],
        pcNo: `PC${400000 + index}`,
        status: ['pending', 'appointed', 'phone', 'email', 'platform', 'completed', 'cancelled'][Math.floor(Math.random() * 7)],
        tags: Math.random() > 0.5 ? ['加急', '特殊处理', '易碎品', '重物', '需要叉车'].slice(0, Math.floor(Math.random() * 3) + 1) : [],
        memo: Math.random() > 0.7 ? `备注信息 ${index + 1}` : '',
        followUpRecord: Math.random() > 0.8 ? `跟进记录 ${index + 1}` : ''
      }));

      // 应用搜索条件
      let filteredData = [...originalData];

      // 处理日期范围筛选
      if (searchParams.dateRange && searchParams.dateRange.length === 2 && searchParams.dateType) {
        const startDate = new Date(searchParams.dateRange[0]);
        const endDate = new Date(searchParams.dateRange[1]);
        
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(item[searchParams.dateType]);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }

      // 处理号码搜索
      if (searchParams.searchNumber && searchParams.searchType) {
        filteredData = filteredData.filter(item => {
          return String(item[searchParams.searchType]).includes(searchParams.searchNumber);
        });
      }

      // 处理模糊搜索
      if (searchParams.fuzzySearchText) {
        const searchText = searchParams.fuzzySearchText.toLowerCase();
        filteredData = filteredData.filter(item => {
          // 在多个字段中搜索
          return (
            (item.memo && item.memo.toLowerCase().includes(searchText)) ||
            (item.followUpRecord && item.followUpRecord.toLowerCase().includes(searchText)) ||
            (item.zipCode && item.zipCode.toLowerCase().includes(searchText)) ||
            (item.containerNo && item.containerNo.toLowerCase().includes(searchText)) ||
            (item.waybillNo && item.waybillNo.toLowerCase().includes(searchText))
          );
        });
      }

      // 更新表格数据
      commit('SET_TABLE_DATA', filteredData);
      commit('SET_CURRENT_PAGE', 1); // 重置为第一页
    }
  }
}) 