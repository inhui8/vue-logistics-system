// 通用的验证规则
export const rules = {
  required: (message = '此项必填') => ({
    required: true,
    message,
    trigger: 'blur'
  }),
  
  length: (min, max, message) => ({
    min,
    max,
    message: message || `长度应在 ${min} 到 ${max} 个字符之间`,
    trigger: 'blur'
  }),
  
  pattern: (pattern, message) => ({
    pattern,
    message,
    trigger: 'blur'
  })
};

// 标签 Key 格式验证
export const validateTagKey = (rule, value, callback) => {
  const pattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/;
  if (!value) {
    callback(new Error('标签 Key 不能为空'));
    return;
  }
  if (!pattern.test(value)) {
    callback(new Error('格式不正确 (应为: domain.name.field，以小写字母开头，仅允许小写字母、数字和点)'));
    return;
  }
  callback();
};

// 枚举值验证
export const validateEnumValues = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return '枚举类型必须至少定义一个值';
  }
  
  const keys = new Set();
  for (const item of values) {
    if (!item.key || !item.value) {
      return '枚举的 Key 和 Value 不能为空';
    }
    if (keys.has(item.key)) {
      return '枚举 Key 不能重复';
    }
    keys.add(item.key);
  }
  
  return '';
};

// 标签分组规则验证
export const validateGroupRules = (rules) => {
  if (!Array.isArray(rules) || rules.length === 0) {
    return '至少需要一个规则组';
  }

  for (const group of rules) {
    if (!Array.isArray(group.conditions) || group.conditions.length === 0) {
      return '规则组不能为空';
    }

    for (const condition of group.conditions) {
      if (!condition.tagKey) {
        return '请选择标签';
      }
      if (!condition.operator) {
        return '请选择操作符';
      }
      if (condition.value === null || condition.value === undefined || condition.value === '') {
        return '请输入或选择值';
      }
    }

    if (group.conditions.length > 1 && !group.relation) {
      return '请选择条件关系';
    }
  }

  return '';
};

// 错误消息格式化
export const formatError = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (Array.isArray(error)) {
    return error.map(e => formatError(e)).join('; ');
  }
  if (typeof error === 'object' && error !== null) {
    return error.message || JSON.stringify(error);
  }
  return '未知错误';
};

// 异步操作错误处理
export const handleAsyncError = async (promise, customError) => {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    console.error('Operation failed:', error);
    return [customError || formatError(error), null];
  }
};

// 表单验证工具
export const validateForm = async (formRef) => {
  try {
    await formRef.validate();
    return [null, true];
  } catch (error) {
    return [formatError(error), false];
  }
}; 