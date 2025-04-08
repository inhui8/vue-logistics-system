<!-- eslint-disable -->
<template>
  <el-table-column :label="label" :width="width" fixed="right">
    <template #default="scope">
      <div v-if="!scope.row.isGroup">
        <el-dropdown trigger="click" @command="(command) => handleCommand(command, scope.row)">
          <el-button size="small" type="primary">
            {{ buttonText }} <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item 
                v-for="action in actions" 
                :key="action.command" 
                :command="action.command"
                :disabled="action.disabled && typeof action.disabled === 'function' ? action.disabled(scope.row) : false"
              >
                <i v-if="action.icon" :class="action.icon"></i> {{ action.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        
        <template v-if="additionalButtons && additionalButtons.length > 0">
          <el-button 
            v-for="button in additionalButtons"
            :key="button.command"
            :type="button.type || 'default'"
            :size="button.size || 'small'"
            :disabled="button.disabled && typeof button.disabled === 'function' ? button.disabled(scope.row) : false"
            @click="handleButtonClick(button.command, scope.row)"
          >
            <i v-if="button.icon" :class="button.icon"></i> {{ button.label }}
          </el-button>
        </template>
      </div>
    </template>
  </el-table-column>
</template>

<script>
export default {
  name: 'OperationColumn',
  props: {
    label: {
      type: String,
      default: '操作'
    },
    width: {
      type: [String, Number],
      default: 120
    },
    buttonText: {
      type: String,
      default: '操作'
    },
    actions: {
      type: Array,
      default: () => []
      /* 
      示例: [
        { label: '编辑', command: 'edit', icon: 'el-icon-edit' },
        { label: '删除', command: 'delete', icon: 'el-icon-delete', disabled: (row) => row.status === 'completed' }
      ]
      */
    },
    additionalButtons: {
      type: Array,
      default: () => []
      /*
      示例: [
        { label: '查看', command: 'view', icon: 'el-icon-view', type: 'info', size: 'small' }
      ]
      */
    }
  },
  emits: ['command', 'button-click'],
  setup(props, { emit }) {
    const handleCommand = (command, row) => {
      emit('command', { command, row });
    };
    
    const handleButtonClick = (command, row) => {
      emit('button-click', { command, row });
    };
    
    return {
      handleCommand,
      handleButtonClick
    };
  }
}
</script>

<style scoped>
.el-button + .el-button {
  margin-left: 5px;
}
</style> 