/**
 * 六爻易经 - OpenClaw Plugin (New API)
 * 基于《周易》六爻占卜法，提供本卦、变卦、互卦、综卦、错卦五维解读
 */

// 1. 导入运行时类型 (如果不需要调用 subagent，其实可以不导入，用 any 代替 context)
// 如果确实需要 runtime 功能，请确保路径正确，否则先用 any
import type { PluginRuntime } from "openclaw/plugin-sdk";

import {
  calculateFiveGua,
  extractNumbers,
  extractQuestion,
  type DivinationSession,
} from "./core.js";

// 2. 定义上下文接口 (兼容新旧版本结构)
interface LiuYaoContext {
  message: {
    content?: {
      text?: string;
    };
    senderId?: string;
  };
  session?: {
    id?: string;
    key?: string;
  };
  runtime?: PluginRuntime;
  [key: string]: any;
}

// 3. 内部触发判断逻辑 (原 trigger 方法迁移至此)
function shouldTrigger(text: string): boolean {
  if (!text) return false;
  
  // 检查是否包含 6 组 3 位数字 (2 或 3)
  const hasNumbers = /([23]{3}\s*){6}/.test(text);
  
  // 检查关键词触发
  const keywords = ["算卦", "占卜", "周易", "易经", "起卦", "六爻"];
  const hasKeyword = keywords.some(k => text.includes(k));
  
  // 策略：如果有完整数字，直接触发；如果有关键词且内容较长，也触发
  return hasNumbers || (hasKeyword && text.length > 5);
}

/**
 * 获取欢迎消息
 */
function getWelcomeMessage(): string {
  return `🔮 **六爻易经**

欢迎来到**六爻易经**，我是基于《周易》的智能占卜助手。

**使用方法：**
请心中默念所问之事，投掷硬币 6 次，每次 3 枚。
记录每次的结果："字"(正面) = 3，"花"(反面) = 2 ,告诉我三枚硬币对应的数字。

**输入格式：**
按顺序发送 6 组数字，例如：
\`223 333 222 323 332 233\`

你也可以在数字后面加上你的问题，例如：
\`223 333 222 323 332 233 问事业发展\`

> 💡 规则：3 = 阳(字/正面)，2 = 阴(花/反面)。顺序从初爻（最下）到上爻（最上）。`;
}

/**
 * 生成解卦解读（基础版，后续可接入 LLM）
 */
function generateInterpretation(divination: DivinationSession, question: string): string {
  const { ben, bian, hu, zong, cuo, movingLines, sums } = divination;
  
  // 判断吉凶
  const isJixiong = judgeJixiong(divination);
  
  const movingLinesText = Array.isArray(movingLines) 
    ? (movingLines.length > 0 ? movingLines.join(", ") : "无动爻 (静卦)") 
    : movingLines;

  const body = `
## 📋 **解卦概要**

**您的问题**：${question || "未提供具体问题"}

### 一、本卦解读 · ${ben.symbol} ${ben.nameCn}
${ben.meaning}

本卦代表**现状**，是您当前所处的状态和环境。

### 二、变卦解读 · ${bian.symbol} ${bian.nameCn}
${bian.meaning}

变卦代表**未来变化**，是事情发展的趋势和结果。

### 三、互卦解读 · ${hu.symbol} ${hu.nameCn}
${hu.meaning}

互卦代表**变化过程**，是事情发展中的中间状态。

### 四、综卦解读 · ${zong.symbol} ${zong.nameCn}
${zong.meaning}

综卦代表**换位思考**，从不同角度看待问题。

### 五、错卦解读 · ${cuo.symbol} ${cuo.nameCn}
${cuo.meaning}

错卦代表**潜在对立面**，提醒您注意的风险和挑战。

---

## 🎯 **综合建议**

1. **顺势而为**：本卦 ${ben.nameCn} 显示当前形势 ${isJixiong.current}，宜${isJixiong.action1}

2. **关注变化**：${movingLinesText !== "无动爻 (静卦)" 
    ? `注意动爻 ${movingLinesText}，这是事情变化的关键点` 
    : "目前局势稳定，无显著动爻，保持现状即可"}

3. **平衡思考**：结合错卦 ${cuo.nameCn} 的提醒，${isJixiong.risk}

---

> 💡 如需更深入的个性化解读，请继续与我交流，告诉我您对哪个方面更感兴趣。`;
  
  return body;
}

/**
 * 判断吉凶趋势
 */
function judgeJixiong(divination: DivinationSession): {
  current: string;
  action1: string;
  action2: string;
  risk: string;
} {
  const { ben, sums } = divination;
  
  // 简单规则：有动爻则变，无动爻则静
  const hasMoving = sums.some(s => s === 6 || s === 9);
  
  // 64 卦简易吉凶表（部分）
  const jixiongMap: Record<number, { status: string; action: string; risk: string }> = {
    1: { status: "上吉", action: "积极进取", risk: "注意过于刚进" },
    2: { status: "上吉", action: "厚德载物", risk: "避免过于保守" },
    5: { status: "吉", action: "耐心等待", risk: "切忌急躁冒进" },
    6: { status: "凶", action: "及时止损", risk: "避免争端诉讼" },
    8: { status: "吉", action: "亲善待人", risk: "防止小人暗算" },
    10: { status: "吉", action: "谨慎行事", risk: "注意礼仪规范" },
    11: { status: "上吉", action: "把握机遇", risk: "防止乐极生悲" },
    12: { status: "凶", action: "收敛蛰伏", risk: "防止小人当道" },
    13: { status: "吉", action: "广结善缘", risk: "防止意见不合" },
    14: { status: "吉", action: "大有收获", risk: "防止骄傲自满" },
    25: { status: "凶", action: "顺其自然", risk: "防止妄行招祸" },
    26: { status: "吉", action: "积累储备", risk: "防止半途而废" },
    29: { status: "凶", action: "坚守正道", risk: "防止沉迷陷阱" },
    30: { status: "吉", action: "顺势而为", risk: "防止过于刚烈" },
    35: { status: "吉", action: "循序渐进", risk: "防止急于求成" },
    42: { status: "吉", action: "积极行动", risk: "防止过犹不及" },
    49: { status: "吉", action: "适时变革", risk: "防止草率从事" },
    51: { status: "震", action: "谨慎应对", risk: "防止突发变故" },
    55: { status: "丰", action: "把握时机", risk: "防止乐极生悲" },
    63: { status: "既济", action: "保持成果", risk: "防止功亏一篑" },
    64: { status: "未济", action: "继续努力", risk: "防止功败垂成" },
  };
  
  const info = jixiongMap[ben.id] || { 
    status: "中平", 
    action: "随缘自适", 
    risk: "保持谨慎" 
  };
  
  return {
    current: info.status,
    action1: info.action,
    action2: hasMoving ? "注意观察变化" : "保持稳定",
    risk: info.risk,
  };
}

/**
 * 构建回复消息
 */
function buildReply(
  divination: DivinationSession,
  question: string,
  context: LiuYaoContext
): string {
  const { ben, bian, hu, zong, cuo, movingLines } = divination;
  
  const movingLinesText = Array.isArray(movingLines) 
    ? (movingLines.length > 0 ? movingLines.join(", ") : "无动爻 (静卦)")
    : movingLines;
  
  const header = `
🔮 **六爻易经 · 占卜结果**
━━━━━━━━━━━━━━━
📊 **卦象组合**
• 本卦：${ben.symbol} **${ben.nameCn}** (${ben.id}卦) - 现状
• 变卦：${bian.symbol} **${bian.nameCn}** (${bian.id}卦) - 未来
• 互卦：${hu.symbol} **${hu.nameCn}** (${hu.id}卦) - 过程
• 综卦：${zong.symbol} **${zong.nameCn}** (${zong.id}卦) - 换位
• 错卦：${cuo.symbol} **${cuo.nameCn}** (${cuo.id}卦) - 潜能
━━━━━━━━━━━━━━━
🎲 **动爻信息**：${movingLinesText}
━━━━━━━━━━━━━━━
`;
  
  const interpretation = generateInterpretation(divination, question);
  
  return `${header}\n${interpretation}`;
}

/**
 * 🚀 主入口函数
 * OpenClaw 将直接调用此函数
 */
export default async function liuYaoHandler(context: LiuYaoContext): Promise<{ content: { text: string } } | void> {
  const text = context.message?.content?.text || "";
  
  // A. 触发判断 (如果外部配置了关键词，此步可省略，但保留作为保险)
  if (!shouldTrigger(text)) {
    return; // 不处理，返回 void
  }

  try {
    // 1. 提取数字部分
    const numbers = extractNumbers(text);
    
    // 如果没有提取到数字，但触发了关键词，返回欢迎语
    if (!numbers) {
      return {
        content: {
          text: getWelcomeMessage(),
        },
      };
    }
    
    // 2. 提取用户问题
    const question = extractQuestion(text, numbers);
    
    // 3. 计算五卦
    const divination = calculateFiveGua(numbers);
    
    // 4. 构建回复
    const reply = buildReply(divination, question, context);
    
    return {
      content: {
        text: reply,
      },
    };
  } catch (error) {
    console.error("[LiuYao] Error:", error);
    return {
      content: {
        text: `❌ **解析失败**\n\n${error instanceof Error ? error.message : "未知错误"}\n\n请检查输入格式，确保是 6 组由 2 和 3 组成的数字。`,
      },
    };
  }
}