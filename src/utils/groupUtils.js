/**
 * 根据指定字段对数据进行多级分组
 * @param {Array} data 原始数据
 * @param {Array} groupFields 分组字段数组
 * @param {Function} getFieldLabel 获取字段标签的函数
 * @returns {Array} 分组后的数据
 */
export function groupDataByFields(data, groupFields, getFieldLabel) {
  if (!groupFields || groupFields.length === 0 || !data || data.length === 0) {
    return data;
  }

  // 分组后的数据
  const groupedData = [];
  // 用于缓存分组的Map
  const groupMap = new Map();

  // 对每条数据项进行分组处理
  data.forEach(item => {
    let currentLevel = groupedData;
    let currentPath = '';
    let parentItem = null;
    
    // 处理每个分组级别
    for (let i = 0; i < groupFields.length; i++) {
      const field = groupFields[i];
      const value = item[field] || '未分类';
      const fieldLabel = getFieldLabel ? getFieldLabel(field) : field;
      const groupKey = `${currentPath}/${field}:${value}`;
      
      // 查找或创建当前级别的分组
      let group = currentLevel.find(g => g.groupKey === groupKey);
      
      if (!group) {
        group = {
          id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          groupKey,
          groupName: `${fieldLabel}: ${value}`,
          isGroup: true,
          groupLevel: i,
          children: [],
          items: [],
          count: 0
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
      
      // 为下一级分组做准备
      currentPath = groupKey;
      currentLevel = group.children;
      parentItem = group;
    }
    
    // 将原始数据项添加到最后一级分组的子项中
    if (parentItem) {
      // 添加原始数据项到分组的子项中，但保留其原始属性
      const clonedItem = { ...item, dataParentGroupKey: parentItem.groupKey };
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
      
      // 如果有子分组，递归处理
      const childGroups = group.children.filter(child => child.isGroup);
      if (childGroups.length > 0) {
        flattenGroups(childGroups, level + 1);
      } else {
        // 如果没有子分组，添加该分组下的所有数据项
        group.children.forEach(item => {
          if (!item.isGroup) {
            flattenedData.push(item);
          }
        });
      }
    });
  }
  
  flattenGroups(groupedData);
  
  return flattenedData;
}

/**
 * 获取分组标签类型
 * @param {Number} level 分组级别
 * @returns {String} 标签类型
 */
export function getGroupTagType(level) {
  const types = ['', 'primary', 'success', 'warning'];
  return types[level] || 'info';
} 