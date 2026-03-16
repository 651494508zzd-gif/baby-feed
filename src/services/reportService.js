// 周报生成服务
import { RecordType } from './storageService';

// 计算每日统计
const calculateDailyStats = (records) => {
  const dailyStats = {};

  records.forEach(record => {
    const date = new Date(record.timestamp).toDateString();
    if (!dailyStats[date]) {
      dailyStats[date] = { milk: 0, solid: 0, count: 0 };
    }

    if (record.type === RecordType.MILK) {
      dailyStats[date].milk += record.amount;
    } else {
      dailyStats[date].solid += record.amount;
    }
    dailyStats[date].count += 1;
  });

  return dailyStats;
};

// 生成周报
export const generateWeeklyReport = (records) => {
  if (!records || records.length === 0) {
    return {
      totalMilk: 0,
      totalSolid: 0,
      avgMilkPerDay: 0,
      avgSolidPerDay: 0,
      totalRecords: 0,
      dailyStats: {},
      suggestions: ['暂无数据，请先记录宝宝的喂养情况'],
    };
  }

  // 计算总量
  const totalMilk = records
    .filter(r => r.type === RecordType.MILK)
    .reduce((sum, r) => sum + r.amount, 0);

  const totalSolid = records
    .filter(r => r.type === RecordType.SOLID)
    .reduce((sum, r) => sum + r.amount, 0);

  // 获取记录的天数
  const dates = new Set(records.map(r => new Date(r.timestamp).toDateString()));
  const daysCount = dates.size || 1;

  // 计算日均
  const avgMilkPerDay = Math.round(totalMilk / daysCount);
  const avgSolidPerDay = Math.round(totalSolid / daysCount);

  // 每日统计
  const dailyStats = calculateDailyStats(records);

  // 生成建议
  const suggestions = generateSuggestions(avgMilkPerDay, avgSolidPerDay, records);

  return {
    totalMilk,
    totalSolid,
    avgMilkPerDay,
    avgSolidPerDay,
    totalRecords: records.length,
    daysCount,
    dailyStats,
    suggestions,
  };
};

// 生成建议
const generateSuggestions = (avgMilkPerDay, avgSolidPerDay, records) => {
  const suggestions = [];

  // 奶量建议
  if (avgMilkPerDay < 400) {
    suggestions.push('📊 奶量偏低：建议适当增加奶量，确保宝宝营养充足');
  } else if (avgMilkPerDay > 1000) {
    suggestions.push('📊 奶量偏高：建议适当控制，避免过度喂养');
  } else {
    suggestions.push('✅ 奶量正常：保持在合理范围内');
  }

  // 辅食建议
  if (avgSolidPerDay < 50) {
    suggestions.push('🥣 辅食偏少：可以尝试增加辅食种类和量');
  } else if (avgSolidPerDay > 200) {
    suggestions.push('🥣 辅食量适中：注意观察宝宝消化情况');
  } else {
    suggestions.push('✅ 辅食量正常：继续保持');
  }

  // 规律性建议
  const recordsByHour = {};
  records.forEach(r => {
    const hour = new Date(r.timestamp).getHours();
    recordsByHour[hour] = (recordsByHour[hour] || 0) + 1;
  });

  const hours = Object.keys(recordsByHour).map(Number).sort((a, b) => a - b);
  if (hours.length > 1) {
    const gap = hours[hours.length - 1] - hours[0];
    if (gap > 8) {
      suggestions.push('⏰ 喂养间隔较大：建议尽量保持规律喂养');
    }
  }

  // 记录次数建议
  if (records.length < 7) {
    suggestions.push('📝 记录次数较少：坚持记录有助于更好地了解宝宝的习惯');
  }

  return suggestions;
};
