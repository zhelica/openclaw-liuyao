// 测试脚本 - 验证八字分析和六爻计算
import { analyzeBazi, formatBaziAnalysis, calculateFiveGua, getBaziFromLunar } from './dist/core.js';

// ==================== 八字排盘测试 ====================
console.log("=== 八字排盘测试 ===\n");

// 测试: 农历1999年12月18日20时
console.log("输入: 农历1999年12月18日20时");
const bazi = getBaziFromLunar(1999, 12, 18, 20);
console.log("八字排盘结果:", bazi.bazi);

// 进行完整八字分析
const analysis = analyzeBazi(bazi.year, bazi.month, bazi.day, bazi.hour);
console.log(formatBaziAnalysis(analysis));

// ==================== 六爻计算测试 ====================
console.log("\n\n=== 六爻计算测试 ===");
const result = calculateFiveGua("223 323 333 323 322 323");
console.log("本卦:", result.ben.nameCn);
console.log("变卦:", result.bian.nameCn);
console.log("互卦:", result.hu.nameCn);
console.log("综卦:", result.zong.nameCn);
console.log("交卦:", result.jiao.nameCn);
console.log("错卦:", result.cuo.nameCn);
