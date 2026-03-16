// 存储服务 - 使用 localStorage 本地存储
const STORAGE_KEY = 'baby_feed_records';

export const RecordType = {
  MILK: 'milk',
  SOLID: 'solid',
};

export const RecordUnit = {
  ML: 'ml',
  G: 'g',
};

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 获取所有记录
export const getRecords = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// 保存记录
export const saveRecord = (record) => {
  const records = getRecords();
  const newRecord = {
    ...record,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  records.push(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return newRecord;
};

// 删除记录
export const deleteRecord = (id) => {
  const records = getRecords();
  const filtered = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// 获取指定日期范围的记录
export const getRecordsByDateRange = (startDate, endDate) => {
  const records = getRecords();
  return records.filter(r => {
    const recordDate = new Date(r.timestamp);
    return recordDate >= startDate && recordDate <= endDate;
  });
};

// 获取今天的记录
export const getTodayRecords = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getRecordsByDateRange(today, tomorrow);
};

// 获取本周的记录
export const getWeekRecords = () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return getRecordsByDateRange(startOfWeek, endOfWeek);
};
