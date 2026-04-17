/**
 * 六爻易经 - OpenClaw Plugin (New API)
 * 基于《周易》六爻占卜法，提供本卦、变卦、互卦、综卦、错卦五维解读
 * 以及八字排盘（年柱、月柱、日柱、时柱）、每日黄历
 */

import type { PluginRuntime } from "openclaw/plugin-sdk";

import {
    calculateFiveGua,
    extractNumbers,
    extractQuestion,
    getBazi,
    getBaziFromLunar,
    getHuangLi,
    formatHuangLi,
    analyzeBazi,
    formatBaziAnalysis,
    type DivinationSession,
} from "./core.js";

// ==================== 上下文接口 ====================

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

// ==================== 触发判断函数 ====================

/**
 * 判断是否触发六爻占卜
 */
function shouldTrigger(text: string): boolean {
    if (!text) return false;
    
    const hasNumbers = /([23]{3}\s*){6}/.test(text);
    const keywords = ["算卦", "占卜", "周易", "易经", "起卦", "六爻"];
    const hasKeyword = keywords.some(k => text.includes(k));
    
    return hasNumbers || (hasKeyword && text.length > 5);
}

/**
 * 判断是否触发八字排盘
 */
function shouldTriggerBazi(text: string): boolean {
    if (!text) return false;
    
    const baziKeywords = ["八字", "排盘", "命盘", "生辰", "出生日期", "出生于", "几月几日生", "什么时辰生"];
    const hasBaziKeyword = baziKeywords.some(k => text.includes(k));
    
    const hasDateFormat = /(\d{4}[\d\-./年]{1,8}[时]?)|(\d{8,10})/.test(text);
    const hasShichen = ["子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时"].some(s => text.includes(s));
    
    return hasBaziKeyword || (hasDateFormat && text.length > 4);
}

/**
 * 判断是否触发今日黄历
 */
function shouldTriggerHuangLi(text: string): boolean {
    if (!text) return false;
    
    const huangLiKeywords = ["今日黄历", "黄历", "老黄历", "今日宜忌", "每日宜忌", "今日运势", "今日吉凶", "看黄历", "查黄历"];
    const hasKeyword = huangLiKeywords.some(k => text.includes(k));
    
    if (text.trim() === "黄历" || text.trim() === "今日黄历") {
        return true;
    }
    
    return hasKeyword;
}

// ==================== 欢迎消息函数 ====================

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

function getBaziWelcomeMessage(): string {
    return `📅 **八字排盘**

欢迎使用**八字排盘**，我是基于中国传统命理的智能助手。

**使用方法：**
告诉我您的出生日期和时间，例如：
- "1990年5月15日出生"
- "2026年03月01日20:00"
- "2026030120"

**输入格式：**
- 公历生日（年月日时）
- 出生时辰（如：戌时、子时等）

> 💡 提示：如果不确定具体时辰，请提供大致时间范围，我会尽量准确推算。`;
}

function getHuangLiWelcomeMessage(): string {
    return `📅 **今日黄历**

欢迎使用**今日黄历**，为您提供传统的黄道吉日查询服务。

**使用方法：**
直接说"今日黄历"或"黄历"，即可查看今天的详细信息。

也可以指定日期查询，例如：
- "2026年4月16日黄历"
- "查一下明天的黄历"

> 💡 提示：黄历包含宜忌、冲煞、吉神方位、彭祖百忌等传统民俗信息。`;
}

// ==================== 出生信息提取函数 ====================

/**
 * 从文本中提取出生时间信息
 */
function extractBirthInfo(text: string): { year?: number; month?: number; day?: number; hour?: number; shichen?: string; isLunar: boolean; valid: boolean } {
    let year: number | undefined, month: number | undefined, day: number | undefined, hour: number | undefined;
    let shichen: string | null = null;
    let isLunar = false;
    
    if (text.includes('农历') || text.includes('阴历')) {
        isLunar = true;
    }
    
    const pureDigits = text.match(/(\d{10})|(\d{8})|(\d{6})|(\d{4})/);
    if (pureDigits) {
        const digits = pureDigits[0];
        if (digits.length >= 4) year = parseInt(digits.substring(0, 4));
        if (digits.length >= 6) month = parseInt(digits.substring(4, 6));
        if (digits.length >= 8) day = parseInt(digits.substring(6, 8));
        if (digits.length >= 10) hour = parseInt(digits.substring(8, 10));
    }
    
    if (!year) {
        const separated = text.match(/(\d{4})[\-./年](\d{1,2})[\-./月](\d{1,2})[日]?/);
        if (separated) {
            year = parseInt(separated[1]);
            month = parseInt(separated[2]);
            day = parseInt(separated[3]);
        }
    }
    
    if (!year) {
        const yearOnly = text.match(/(\d{4})年/);
        if (yearOnly) year = parseInt(yearOnly[1]);
    }
    
    if (year && !month) {
        const monthOnly = text.match(/(\d{1,2})月/);
        if (monthOnly) month = parseInt(monthOnly[1]);
    }
    
    if (month) {
        const dayOnly = text.match(/(\d{1,2})日?/);
        if (dayOnly) day = parseInt(dayOnly[1]);
    }
    
    const timeMatch = text.match(/(\d{1,2})[:时]/);
    if (timeMatch) hour = parseInt(timeMatch[1]);
    
    const shichenMatch = text.match(/(子|丑|寅|卯|辰|巳|午|未|申|酉|戌|亥)时/);
    if (shichenMatch) {
        shichen = shichenMatch[1];
        const shichenMap: Record<string, number> = {
            '子': 23, '丑': 1, '寅': 3, '卯': 5,
            '辰': 7, '巳': 9, '午': 11, '未': 13,
            '申': 15, '酉': 17, '戌': 19, '亥': 21
        };
        if (hour === undefined) {
            hour = shichenMap[shichen];
        }
    }
    
    const valid = !!(year && year >= 1900 && year <= 2100 &&
                   month && month >= 1 && month <= 12 &&
                   day && day >= 1 && day <= 31 &&
                   hour !== undefined && hour >= 0 && hour <= 23);
    
    return { year, month, day, hour, shichen: shichen || undefined, isLunar, valid };
}

// ==================== 八字解读函数 ====================

function generateBaziInterpretation(bazi: ReturnType<typeof getBazi> & { lunarYear?: number; lunarMonth?: number; lunarDay?: number; solarDate?: string }, isLunar = false): string {
    const { year, month, day, hour, bazi: baziStr, shichen } = bazi;
    
    const lunarInfo = isLunar && bazi.lunarYear 
        ? `\n- **农历生日**：${bazi.lunarYear}年${bazi.lunarMonth}月${bazi.lunarDay}日\n- **公历转换**：${bazi.solarDate}`
        : '';
    
    const body = `
## 📋 **八字信息**

- **出生日期**：${year}年${month}月${day}日
- **出生时辰**：${hour}时 (${shichen})${lunarInfo}

---

## 🎯 **排盘结果**

### 四柱八字

| 柱 | 天干 | 地支 |
|---|---|---|
| 年柱 | ${bazi.yearGan} | ${bazi.yearZhi} |
| 月柱 | ${bazi.monthGan} | ${bazi.monthZhi} |
| 日柱 | ${bazi.dayGan} | ${bazi.dayZhi} |
| 时柱 | ${bazi.hourGan} | ${bazi.hourZhi} |

---

### **完整八字**

\`\`\`
${baziStr}
\`\`\`

> 💡 **解读提示**：完整八字解读需要结合五行、生肖、十神、大运等多维度分析。如需深入解读，请继续与我交流！`;
    
    return body;
}

function buildBaziReply(bazi: ReturnType<typeof getBazi>, isLunar = false): string {
    const header = `
📅 **八字排盘 · 结果**
━━━━━━━━━━━━━━━
`;
    const interpretation = generateBaziInterpretation(bazi, isLunar);
    return `${header}${interpretation}`;
}

// ==================== 六爻解读函数 ====================

function generateInterpretation(divination: DivinationSession, question: string): string {
    const { ben, bian, hu, zong, cuo, movingLines, sums } = divination;
    
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

function judgeJixiong(divination: DivinationSession): {
    current: string;
    action1: string;
    action2: string;
    risk: string;
} {
    const { ben, sums } = divination;
    
    const hasMoving = sums.some(s => s === 6 || s === 9);
    
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

function buildReply(divination: DivinationSession, question: string): string {
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

// ==================== 主入口函数 ====================

export default async function liuYaoHandler(context: LiuYaoContext): Promise<{ content: { text: string } } | void> {
    const text = context.message?.content?.text || "";
    
    // B. 八字排盘处理
    if (shouldTriggerBazi(text)) {
        try {
            const birthInfo = extractBirthInfo(text);
            
            if (!birthInfo.valid) {
                return {
                    content: {
                        text: getBaziWelcomeMessage(),
                    },
                };
            }
            
            let bazi;
            if (birthInfo.isLunar) {
                bazi = getBaziFromLunar(
                    birthInfo.year!,
                    birthInfo.month!,
                    birthInfo.day!,
                    birthInfo.hour!
                );
            } else {
                bazi = getBazi(
                    birthInfo.year!,
                    birthInfo.month!,
                    birthInfo.day!,
                    birthInfo.hour!
                );
            }
            
            // 完整八字分析
            const analysis = analyzeBazi(
                bazi.year,
                bazi.month,
                bazi.day,
                bazi.hour
            );
            
            // 检查是否需要完整分析报告
            if (text.includes('分析') || text.includes('详解') || text.includes('完整') || text.includes('用神')) {
                const reply = formatBaziAnalysis(analysis);
                return {
                    content: {
                        text: reply,
                    },
                };
            }
            
            // 普通八字回复（简要版）
            const reply = buildBaziReply(bazi, birthInfo.isLunar);
            return {
                content: {
                    text: reply,
                },
            };
        } catch (error) {
            console.error("[LiuYao] Bazi Error:", error);
            return {
                content: {
                    text: `❌ **八字排盘失败**\n\n${error instanceof Error ? error.message : "未知错误"}\n\n请检查日期格式是否正确。`,
                },
            };
        }
    }
    
    // C. 今日黄历处理
    if (shouldTriggerHuangLi(text)) {
        try {
            const today = new Date();
            let year = today.getFullYear();
            let month = today.getMonth() + 1;
            let day = today.getDate();
            
            if (/(\d{4})[\-./年](\d{1,2})[\-./月](\d{1,2})/.test(text)) {
                const match = text.match(/(\d{4})[\-./年](\d{1,2})[\-./月](\d{1,2})/);
                if (match) {
                    year = parseInt(match[1]);
                    month = parseInt(match[2]);
                    day = parseInt(match[3]);
                }
            } else if (/明天/.test(text)) {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                year = tomorrow.getFullYear();
                month = tomorrow.getMonth() + 1;
                day = tomorrow.getDate();
            } else if (/昨天/.test(text)) {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                year = yesterday.getFullYear();
                month = yesterday.getMonth() + 1;
                day = yesterday.getDate();
            }
            
            const huangLi = getHuangLi(year, month, day);
            const reply = formatHuangLi(huangLi);
            
            return {
                content: {
                    text: reply,
                },
            };
        } catch (error) {
            console.error("[LiuYao] HuangLi Error:", error);
            return {
                content: {
                    text: `❌ **黄历查询失败**\n\n${error instanceof Error ? error.message : "未知错误"}`,
                },
            };
        }
    }
    
    // A. 六爻占卜处理
    if (!shouldTrigger(text)) {
        return;
    }

    try {
        const numbers = extractNumbers(text);
        
        if (!numbers) {
            return {
                content: {
                    text: getWelcomeMessage(),
                },
            };
        }
        
        const question = extractQuestion(text, numbers);
        const divination = calculateFiveGua(numbers);
        const reply = buildReply(divination, question);
        
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
