import { ElMessage, ElNotification } from 'element-plus';
import { formatError } from './validation';

// 错误级别
export const ErrorLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

// 错误类型
export const ErrorType = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  BUSINESS: 'business',
  SYSTEM: 'system'
};

// 错误处理配置
const errorConfig = {
  [ErrorType.VALIDATION]: {
    level: ErrorLevel.WARNING,
    duration: 3000,
    showNotification: false
  },
  [ErrorType.NETWORK]: {
    level: ErrorLevel.ERROR,
    duration: 5000,
    showNotification: true
  },
  [ErrorType.BUSINESS]: {
    level: ErrorLevel.WARNING,
    duration: 4000,
    showNotification: false
  },
  [ErrorType.SYSTEM]: {
    level: ErrorLevel.ERROR,
    duration: 0, // 0 表示不会自动关闭
    showNotification: true
  }
};

// 统一错误处理函数
export const handleError = (error, type = ErrorType.SYSTEM) => {
  const config = errorConfig[type] || errorConfig[ErrorType.SYSTEM];
  const message = formatError(error);

  // 控制台输出错误信息
  if (config.level === ErrorLevel.ERROR) {
    console.error(message, error);
  } else if (config.level === ErrorLevel.WARNING) {
    console.warn(message, error);
  }

  // 显示消息提示
  if (config.showNotification) {
    ElNotification({
      title: type === ErrorType.SYSTEM ? '系统错误' : '操作失败',
      message,
      type: config.level,
      duration: config.duration
    });
  } else {
    ElMessage({
      message,
      type: config.level,
      duration: config.duration,
      showClose: true
    });
  }

  // 如果是系统错误，可以在这里添加错误上报逻辑
  if (type === ErrorType.SYSTEM) {
    // TODO: 添加错误上报逻辑
    // reportError(error);
  }
};

// 异步操作包装器
export const asyncWrapper = async (promise, options = {}) => {
  const {
    type = ErrorType.BUSINESS,
    showError = true,
    customError
  } = options;

  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    if (showError) {
      handleError(customError || error, type);
    }
    return [error, null];
  }
};

// API 错误处理
export const handleApiError = (error) => {
  // 处理网络错误
  if (!error.response) {
    handleError('网络连接失败，请检查网络设置', ErrorType.NETWORK);
    return;
  }

  // 处理 HTTP 状态码错误
  const status = error.response.status;
  const data = error.response.data;

  switch (status) {
    case 400:
      handleError(data.message || '请求参数错误', ErrorType.VALIDATION);
      break;
    case 401:
      handleError('用户未登录或登录已过期', ErrorType.BUSINESS);
      // TODO: 跳转到登录页面
      break;
    case 403:
      handleError('没有操作权限', ErrorType.BUSINESS);
      break;
    case 404:
      handleError('请求的资源不存在', ErrorType.BUSINESS);
      break;
    case 500:
      handleError('服务器内部错误', ErrorType.SYSTEM);
      break;
    default:
      handleError('操作失败，请稍后重试', ErrorType.SYSTEM);
  }
};

// 表单错误处理
export const handleFormError = (error, formRef) => {
  if (!error) return;

  // 如果是表单验证错误
  if (formRef && error.fields) {
    const firstField = Object.keys(error.fields)[0];
    const firstError = error.fields[firstField][0]?.message;
    handleError(firstError, ErrorType.VALIDATION);
    return;
  }

  // 其他错误
  handleError(error, ErrorType.BUSINESS);
}; 