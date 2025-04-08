/**
 * 物流系统组件库
 */
import LogisticsTable from './LogisticsTable.vue';
import GroupableTable from './GroupableTable.vue';
import FilterArea from './FilterArea.vue';
import TableToolbar from './TableToolbar.vue';
import EditableTableColumn from './EditableTableColumn.vue';
import OperationColumn from './OperationColumn.vue';
import directives from './directives';

// 所有组件列表
const components = {
  LogisticsTable,
  GroupableTable,
  FilterArea,
  TableToolbar,
  EditableTableColumn,
  OperationColumn
};

/**
 * 注册所有组件和指令的插件
 * @param {import('vue').App} app Vue应用实例
 * @param {Object} options 配置选项
 */
const LogisticsComponents = {
  install(app, options = {}) {
    // 注册组件
    Object.keys(components).forEach(name => {
      app.component(name, components[name]);
    });
    
    // 注册指令
    Object.keys(directives).forEach(name => {
      app.directive(name, directives[name]);
    });
    
    // 添加全局配置
    app.config.globalProperties.$logistics = {
      // 默认配置项
      config: {
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        ...options
      },
      
      // 工具方法
      utils: {
        // 格式化日期
        formatDate(date, format) {
          if (!date) return '';
          
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) return '';
          
          format = format || app.config.globalProperties.$logistics.config.dateFormat;
          
          const formatMap = {
            'YYYY': dateObj.getFullYear(),
            'MM': String(dateObj.getMonth() + 1).padStart(2, '0'),
            'DD': String(dateObj.getDate()).padStart(2, '0'),
            'HH': String(dateObj.getHours()).padStart(2, '0'),
            'mm': String(dateObj.getMinutes()).padStart(2, '0'),
            'ss': String(dateObj.getSeconds()).padStart(2, '0'),
          };
          
          return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formatMap[match]);
        },
        
        // 将列表数据转换为树形结构
        listToTree(list, options = {}) {
          const { idKey = 'id', parentKey = 'parentId', childrenKey = 'children' } = options;
          
          const map = {};
          const roots = [];
          
          // 创建节点映射
          list.forEach(item => {
            map[item[idKey]] = {
              ...item,
              [childrenKey]: []
            };
          });
          
          // 构建树结构
          list.forEach(item => {
            const parentId = item[parentKey];
            if (parentId && map[parentId]) {
              // 有父节点，添加到父节点的children中
              map[parentId][childrenKey].push(map[item[idKey]]);
            } else {
              // 没有父节点或父节点不存在，作为根节点
              roots.push(map[item[idKey]]);
            }
          });
          
          return roots;
        },
        
        // 从树形结构中提取ID数组
        getIdsFromTree(tree, options = {}) {
          const { idKey = 'id', childrenKey = 'children' } = options;
          const ids = [];
          
          function traverse(nodes) {
            if (!nodes || !nodes.length) return;
            
            nodes.forEach(node => {
              ids.push(node[idKey]);
              if (node[childrenKey] && node[childrenKey].length) {
                traverse(node[childrenKey]);
              }
            });
          }
          
          traverse(tree);
          return ids;
        }
      }
    };
  }
};

// 导出所有组件和插件
export {
  LogisticsTable,
  GroupableTable,
  FilterArea,
  TableToolbar,
  EditableTableColumn,
  OperationColumn,
  directives
};

export default LogisticsComponents; 