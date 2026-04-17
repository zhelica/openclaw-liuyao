import { getBaziFromLunar, analyzeBazi, formatBaziAnalysis } from './dist/core.js';

const bazi = getBaziFromLunar(1998, 1, 16, 0);
console.log('=== 八字排盘结果 ===');
console.log(JSON.stringify(bazi, null, 2));

const analysis = analyzeBazi(bazi.year, bazi.month, bazi.day, bazi.hour);
console.log('\n=== 五行分析结果 ===');
console.log(JSON.stringify(analysis, null, 2));

console.log('\n=== 格式化报告 ===');
console.log(formatBaziAnalysis(analysis));
