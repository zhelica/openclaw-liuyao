// 测试脚本 - 验证六爻计算
import { calculateFiveGua, extractNumbers } from './core.js';

const testInput = "233 332 333 222 233 233";
console.log("输入:", testInput);

// 计算五卦 - 直接传入原始字符串
const result = calculateFiveGua(testInput);
console.log("Result:", JSON.stringify(result, null, 2));

console.log("\n=== 本卦 ===");
console.log("二进制:", result.ben.binary);
console.log("卦名:", result.ben.nameCn);
console.log("索引:", result.ben.id);

console.log("\n=== 变卦 ===");
console.log("二进制:", result.bian.binary);
console.log("卦名:", result.bian.nameCn);
console.log("索引:", result.bian.id);

console.log("\n=== 互卦 ===");
console.log("二进制:", result.hu.binary);
console.log("卦名:", result.hu.nameCn);

console.log("\n=== 综卦 ===");
console.log("二进制:", result.zong.binary);
console.log("卦名:", result.zong.nameCn);

console.log("\n=== 交卦 ===");
console.log("二进制:", result.jiao.binary);
console.log("卦名:", result.jiao.nameCn);

console.log("\n=== 错卦 ===");
console.log("二进制:", result.cuo.binary);
console.log("卦名:", result.cuo.nameCn);

// 手动验证：223 332 223 222 333 233
console.log("\n=== 手动验证 ===");
const sums = [
  2+2+3, // 初
  3+3+2, // 二
  2+2+3, // 三
  2+2+2, // 四
  3+3+3, // 五
  2+3+3  // 上
];
console.log("求和结果:", sums);

// 6=老阴, 7=少阳, 8=少阴, 9=老阳
const yaos = sums.map(s => {
  if (s === 6) return { val: s, name: "老阴", bin: 0,动: true };
  if (s === 7) return { val: s, name: "少阳", bin: 1,动: false };
  if (s === 8) return { val: s, name: "少阴", bin: 0,动: false };
  if (s === 9) return { val: s, name: "老阳", bin: 1,动: true };
  return { val: s, name: "未知", bin: 0,动: false };
});
console.log("爻位信息:", yaos.map(y => `${y.val}=${y.name}${y.动?'↔':''}`).join(', '));

const binArray = yaos.map(y => y.bin);
console.log("二进制数组 (初到上):", binArray);

// 八卦映射: 111=Qian, 110=Xun, 101=Li, 100=Kan, 011=Zhen, 010=Gen, 001=Kan, 000= Kun
// 这里代码里 lowerBits = [2][1][0], upperBits = [5][4][3]
const lowerBits = `${binArray[2]}${binArray[1]}${binArray[0]}`;
const upperBits = `${binArray[5]}${binArray[4]}${binArray[3]}`;
console.log("下卦位:", lowerBits);
console.log("上卦位:", upperBits);
