import { getBaziFromLunar, analyzeBazi, formatBaziAnalysis } from './dist/core.js';

const bazi = getBaziFromLunar(1999, 4, 5, 19);
console.log('=== 八字排盘 ===');
console.log(JSON.stringify(bazi, null, 2));

const analysis = analyzeBazi(bazi.year, bazi.month, bazi.day, bazi.hour);
console.log('\n=== 五行分析 ===');
console.log(JSON.stringify(analysis, null, 2));

console.log('\n=== 格式化报告 ===');
console.log(formatBaziAnalysis(analysis));
