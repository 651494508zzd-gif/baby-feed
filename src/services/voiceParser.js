// 语音解析服务 - 解析自然语言
import { RecordType, RecordUnit } from './storageService';

// 奶类关键词
const MILK_KEYWORDS = ['喝奶', '奶', '配方奶', '母乳', '奶瓶', '奶粉'];
// 辅食关键词
const SOLID_KEYWORDS = ['辅食', '米粉', '粥', '面条', '果泥', '蔬果', '吃'];

// 解析时间
const parseTime = (text) => {
  const now = new Date();

  // 匹配 "13:00" 或 "13点" 格式
  const timeMatch = text.match(/(\d{1,2})[:点](\d{2})?/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;

    // 检查是否有"下午"或"晚上"
    if ((text.includes('下午') || text.includes('晚上')) && hour < 12) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour + 12, minute);
    }
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  }

  // 匹配 "12点半" 格式
  const halfMatch = text.match(/(\d{1,2})点半/);
  if (halfMatch) {
    const hour = parseInt(halfMatch[1]);
    let finalHour = hour;
    if ((text.includes('下午') || text.includes('晚上')) && hour < 12) {
      finalHour = hour + 12;
    }
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), finalHour, 30);
  }

  // 默认返回当前时间
  return now;
};

// 解析类型
const parseType = (text) => {
  // 检查奶类关键词
  for (const keyword of MILK_KEYWORDS) {
    if (text.includes(keyword)) {
      return RecordType.MILK;
    }
  }

  // 检查辅食关键词
  for (const keyword of SOLID_KEYWORDS) {
    if (text.includes(keyword)) {
      return RecordType.SOLID;
    }
  }

  return null;
};

// 中文数字转阿拉伯数字
const chineseNumberToArabic = (text) => {
  const chineseNumMap = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
  };

  // 匹配中文数字组合
  const chineseNumMatch = text.match(/([零一二三四五六七八九十]+)/);
  if (!chineseNumMatch) return null;

  const chineseNum = chineseNumMatch[1];

  // 处理纯十（如"九十"、"十五"）
  if (chineseNum.length >= 2 && chineseNum.includes('十')) {
    let result = 0;
    const parts = chineseNum.split('十');

    if (parts[0] === '' || parts[0] === '十') {
      // 十、十五 -> 10, 15
      result = parts[1] ? chineseNumMap[parts[1]] : 10;
    } else if (parts[1] === '') {
      // 九十 -> 90
      result = chineseNumMap[parts[0]] * 10;
    } else {
      // 二十五 -> 25
      result = (chineseNumMap[parts[0]] || 1) * 10 + (chineseNumMap[parts[1]] || 0);
    }
    return result;
  }

  // 处理个位数
  if (chineseNum.length === 1) {
    return chineseNumMap[chineseNum] !== undefined ? chineseNumMap[chineseNum] : null;
  }

  return null;
};

// 解析数量
const parseAmount = (text) => {
  // 先尝试匹配阿拉伯数字
  const numMatch = text.match(/(\d+)/);
  let amount = null;

  if (numMatch) {
    amount = parseInt(numMatch[1]);
  } else {
    // 尝试匹配中文数字
    amount = chineseNumberToArabic(text);
  }

  if (!amount) return null;

  // 判断单位
  if (text.includes('克') || text.includes('g')) {
    return { amount, unit: RecordUnit.G };
  }

  // 默认 ml
  return { amount, unit: RecordUnit.ML };
};

// 解析语音输入
export const parseVoiceInput = (text) => {
  const timestamp = parseTime(text);
  const type = parseType(text);
  const amountData = parseAmount(text);

  if (!type || !amountData) {
    return null;
  }

  return {
    timestamp: timestamp.toISOString(),
    type,
    amount: amountData.amount,
    unit: amountData.unit,
    originalText: text,
  };
};

// 获取类型的显示名称
export const getTypeName = (type) => {
  return type === RecordType.MILK ? '喝奶' : '辅食';
};

// 获取类型的图标
export const getTypeIcon = (type) => {
  return type === RecordType.MILK ? '🍼' : '🍚';
};
