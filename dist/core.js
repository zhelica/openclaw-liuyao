/**
 * 六爻易经 - 核心算法引擎
 * 基于《周易》六爻占卜法，计算本卦、变卦、互卦、综卦、交卦、错卦
 * 以及八字排盘算法（年柱、月柱、日柱、时柱）
 * 使用 lunar-javascript 库实现精确的日柱计算
 */
import { Solar, Lunar } from 'lunar-javascript';
// ==================== 八字排盘算法 ====================
/** 天干数组 */
export const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
/** 地支数组 */
export const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
/** 时辰名称映射（地支） */
export const SHICHEN_DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
/** 年上起月口诀表（年干 -> 寅月起首天干索引） */
const YUE_JIA_KOUJUE = {
    '甲': 2, '己': 2, // 甲己之年丙作首
    '乙': 4, '庚': 4, // 乙庚之岁戊为头
    '丙': 6, '辛': 6, // 丙辛之岁寻庚起
    '丁': 8, '壬': 8, // 丁壬壬位顺行流
    '癸': 0, '戊': 0, // 戊癸之年何方发，甲寅之上好追求
};
// ==================== 八字五行分析算法 ====================
/** 天干五行 */
const GAN_WUXING = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
};
/** 地支五行 */
const ZHI_WUXING = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木',
    '辰': '土', '巳': '火', '午': '火', '未': '土',
    '申': '金', '酉': '金', '戌': '土', '亥': '水'
};
/** 五行相生 —— 正确！我生 */
const WUXING_SHENG = {
    '金': '水', // 金生水
    '水': '木', // 水生木
    '木': '火', // 木生火
    '火': '土', // 火生土
    '土': '金' // 土生金
};
/** 五行相克 —— 正确！克我 */
const WUXING_KE = {
    '金': '火', // 火克金
    '水': '土', // 土克水
    '木': '金', // 金克木
    '火': '水', // 水克火
    '土': '木' // 木克土
};
/** 季节定义 */
const SEASON_MAP = {
    '寅': '春', '卯': '春', '辰': '春',
    '巳': '夏', '午': '夏', '未': '夏',
    '申': '秋', '酉': '秋', '戌': '秋',
    '亥': '冬', '子': '冬', '丑': '冬'
};
/** 季节调候用神 */
const SEASON_TIAOHOU = {
    '春': '金', // 春天喜金
    '夏': '水', // 夏天喜水
    '秋': '木', // 秋天喜木
    '冬': '火' // 冬天喜火
};
/**
 * 获取季节
 */
function getSeason(monthZhi) {
    return SEASON_MAP[monthZhi] || '冬';
}
/**
 * 获取地支藏干主气（简化版）
 */
/**
 * 获取地支本气天干（正确古法本气，仅1个）
 */
function getZhiMainGan(zhi) {
    const map = {
        子: '壬', // 本气水
        丑: '己', // 本气土
        寅: '甲', // 本气木
        卯: '乙', // 本气木
        辰: '戊', // 本气土
        巳: '丙', // 本气火
        午: '丁', // 本气火
        未: '己', // 本气土
        申: '庚', // 本气金
        酉: '辛', // 本气金
        戌: '戊', // 本气土
        亥: '壬', // 本气水
    };
    return map[zhi] || '戊';
}
/**
 * 【古法子平专业版】八字五行与格局分析
 */
export function analyzeBazi(yearZhu, monthZhu, dayZhu, hourZhu) {
    // 1. 提取四柱天干地支
    const yearGan = yearZhu[0];
    const yearZhi = yearZhu[1];
    const monthGan = monthZhu[0];
    const monthZhi = monthZhu[1];
    const dayGan = dayZhu[0];
    const dayZhi = dayZhu[1];
    const hourGan = hourZhu[0];
    const hourZhi = hourZhu[1];
    // 2. 日主（核心：本人）
    const riZhu = dayGan;
    const riWuXing = GAN_WUXING[riZhu];
    const allGan = [yearGan, monthGan, dayGan, hourGan];
    const allZhi = [yearZhi, monthZhi, dayZhi, hourZhi];
    // 3. 提取所有五行（天干 + 地支本气）
    const allWuXing = [
        GAN_WUXING[yearGan],
        GAN_WUXING[monthGan],
        GAN_WUXING[dayGan],
        GAN_WUXING[hourGan],
        GAN_WUXING[getZhiMainGan(yearZhi)], // 地支本气五行
        GAN_WUXING[getZhiMainGan(monthZhi)],
        GAN_WUXING[getZhiMainGan(dayZhi)],
        GAN_WUXING[getZhiMainGan(hourZhi)],
    ];
    // 五行统计
    const wuXingCount = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
    allWuXing.forEach(wx => wx && (wuXingCount[wx]++));
    // 4. 月令 + 季节 + 调候（古法第一优先）
    const monthWuXing = ZHI_WUXING[monthZhi];
    const season = getSeason(monthZhi);
    const tiaoHouWuXing = SEASON_TIAOHOU[season];
    const hasTiaoHou = allWuXing.includes(tiaoHouWuXing);
    const tiaoHouJi = !!tiaoHouWuXing;
    // ==============================================
    // 【古法旺衰】得令 → 得地 → 得势
    // ==============================================
    const deLing = monthWuXing === riWuXing || WUXING_SHENG[monthWuXing] === riWuXing;
    const diZhiGen = allZhi.filter(z => ZHI_WUXING[z] === riWuXing || WUXING_SHENG[riWuXing] === ZHI_WUXING[z]).length;
    const deDi = diZhiGen > 0;
    const ganShi = allGan.filter(g => GAN_WUXING[g] === riWuXing || WUXING_SHENG[riWuXing] === GAN_WUXING[g]).length;
    const deShi = ganShi >= 2;
    let isStrong;
    let wangShuaiDesc;
    if (deLing && (deDi || deShi)) {
        isStrong = true;
        wangShuaiDesc = "身旺";
    }
    else if (!deLing && !deDi && !deShi) {
        isStrong = false;
        wangShuaiDesc = "身弱";
    }
    else if (deLing) {
        isStrong = true;
        wangShuaiDesc = "偏旺";
    }
    else {
        isStrong = false;
        wangShuaiDesc = "偏弱";
    }
    // ==============================================
    // 【古法从格】严格判断
    // ==============================================
    const isCongGe = !deDi && !deLing;
    const isZhuanWang = deLing && deDi && ganShi >= 3;
    const isCongWang = isCongGe && allWuXing.filter(wx => wx === riWuXing).length >= 4;
    const isCongRuo = isCongGe && allWuXing.filter(wx => wx !== riWuXing).length >= 6;
    // ==============================================
    // 【古法格局】
    // ==============================================
    let geJu = "普通格局";
    if (isZhuanWang) {
        geJu = "专旺格";
    }
    else if (isCongWang) {
        geJu = "从旺格";
    }
    else if (isCongRuo) {
        geJu = "从弱格";
    }
    else if (tiaoHouJi && !hasTiaoHou) {
        geJu = "调候为急格";
    }
    else if (tiaoHouJi && hasTiaoHou) {
        geJu = "调候成格";
    }
    else {
        geJu = "普通扶抑格";
    }
    // ==============================================
    // 【穷通宝鉴 · 全日主通用】调候用神（自动适配所有八字）
    // ==============================================
    function getTiaoHouYongShen(riGan, monthZhi) {
        const isSpring = ['寅', '卯', '辰'].includes(monthZhi);
        const isSummer = ['巳', '午', '未'].includes(monthZhi);
        const isAutumn = ['申', '酉', '戌'].includes(monthZhi);
        const isWinter = ['亥', '子', '丑'].includes(monthZhi);
        switch (riGan) {
            // 金：庚辛
            case '庚':
            case '辛':
                if (isWinter)
                    return '水';
                if (isSummer)
                    return '水';
                if (isSpring)
                    return '金';
                if (isAutumn)
                    return '水';
                return '水';
            // 木：甲乙
            case '甲':
            case '乙':
                if (isWinter)
                    return '火';
                if (isSummer)
                    return '水';
                if (isSpring)
                    return '金';
                if (isAutumn)
                    return '水';
                return '水';
            // 火：丙丁
            case '丙':
            case '丁':
                if (isWinter)
                    return '木';
                if (isSummer)
                    return '水';
                if (isSpring)
                    return '金';
                if (isAutumn)
                    return '木';
                return '水';
            // 水：壬癸
            case '壬':
            case '癸':
                if (isWinter)
                    return '木';
                if (isSummer)
                    return '金';
                if (isSpring)
                    return '金';
                if (isAutumn)
                    return '木';
                return '金';
            // 土：戊己
            case '戊':
            case '己':
                if (isWinter)
                    return '火';
                if (isSummer)
                    return '水';
                if (isSpring)
                    return '火';
                if (isAutumn)
                    return '金';
                return '火';
            default:
                return '火';
        }
    }
    // 自动取用神
    const yongShen = getTiaoHouYongShen(riZhu, monthZhi);
    // ================= 核心修复 =================
    // 喜神 = 生用神的五行（正确逻辑）
    const WUXING_SHENG_BY = {
        '金': '土', '水': '金', '木': '水', '火': '木', '土': '火'
    };
    const xiShen = [WUXING_SHENG_BY[yongShen]];
    // 忌神 = 克用神的五行
    const jiShen = [WUXING_KE[yongShen]];
    const wuXingBalance = getWuXingBalance(wuXingCount);
    const suggestions = generateSuggestions(wuXingCount, isStrong, yongShen, xiShen, jiShen);
    return {
        bazi: `${yearZhu} ${monthZhu} ${dayZhu} ${hourZhu}`,
        yearZhu, monthZhu, dayZhu, hourZhu,
        shichen: hourZhi + '时',
        wuXing: {
            year: GAN_WUXING[yearGan],
            month: GAN_WUXING[monthGan],
            day: riWuXing,
            hour: GAN_WUXING[hourGan]
        },
        wuXingCount,
        wuXingBalance,
        riZhu,
        riWuXing,
        riShengXiao: getShengXiao(yearZhi),
        wangShuai: {
            isStrong,
            description: wangShuaiDesc,
            deLing,
            deDi,
            deShi
        },
        yongShen,
        xiShen,
        jiShen,
        geJu,
        suggestions
    };
}
/**
 * 获取生肖
 */
function getShengXiao(zhi) {
    const shengXiaoMap = {
        '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
        '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
        '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
    };
    return shengXiaoMap[zhi] || '未知';
}
/**
 * 获取五行平衡描述
 */
function getWuXingBalance(count) {
    const maxVal = Math.max(...Object.values(count));
    const minVal = Math.min(...Object.values(count));
    const maxWx = Object.entries(count).find(([k, v]) => v === maxVal)?.[0] || '土';
    const minWx = Object.entries(count).find(([k, v]) => v === minVal)?.[0] || '水';
    return `${maxWx}旺，${minWx}弱`;
}
/**
 * 生成生活建议
 */
function generateSuggestions(wuXingCount, isStrong, yongShen, xiShen, jiShen) {
    // 幸运方位
    const directionMap = {
        '木': { lucky: ['东方', '东南'], avoid: ['西方', '西北'] },
        '火': { lucky: ['南方', '东南'], avoid: ['北方', '东北'] },
        '土': { lucky: ['西南', '东北', '南方'], avoid: ['东方', '东南'] },
        '金': { lucky: ['西方', '西北', '北方'], avoid: ['南方', '东方'] },
        '水': { lucky: ['北方', '西北'], avoid: ['南方', '西南'] }
    };
    const dirInfo = directionMap[yongShen] || { lucky: ['东方'], avoid: ['西方'] };
    // 幸运颜色
    const colorMap = {
        '木': { lucky: ['绿色', '青色', '墨绿', '蓝色'], avoid: ['白色', '金色', '银色'] },
        '火': { lucky: ['红色', '紫色', '橙色', '暖色'], avoid: ['黑色', '深蓝色'] },
        '土': { lucky: ['黄色', '棕色', '咖啡色', '米色'], avoid: ['绿色', '青色'] },
        '金': { lucky: ['白色', '金色', '银色', '灰色'], avoid: ['红色', '紫色'] },
        '水': { lucky: ['黑色', '深蓝色', '灰色', '白色'], avoid: ['黄色', '棕色'] }
    };
    const colorInfo = colorMap[yongShen] || { lucky: ['黑色'], avoid: ['白色'] };
    // 适合行业
    const industryMap = {
        '木': ['教育', '文化', '出版', '绿植', '木材', '服装', '健康养生', '心理咨询'],
        '火': ['餐饮', '电力', '照明', '美妆', '自媒体', '娱乐', '能源'],
        '土': ['房地产', '建筑', '矿产', '陶瓷', '农业', '畜牧业'],
        '金': ['金融', '银行', '金属加工', '五金', '汽车', '法律', '政府机构'],
        '水': ['物流', '贸易', '运输', '水产', '饮品', '美容', '旅游', '互联网', '传媒']
    };
    const industries = industryMap[yongShen] || ['服务业'];
    // 日常习惯建议
    const habits = [];
    if (yongShen === '水') {
        habits.push('多喝水，保持身体湿润');
        habits.push('多去河边、海边散步');
        habits.push('多运动出汗');
    }
    else if (yongShen === '木') {
        habits.push('多接触绿植、森林');
        habits.push('早起早睡，顺应木的生发之气');
        habits.push('多学习、多表达');
    }
    else if (yongShen === '火') {
        habits.push('保持环境明亮温暖');
        habits.push('多晒太阳');
        habits.push('积极社交，多表达热情');
    }
    else if (yongShen === '土') {
        habits.push('保持居住环境干燥整洁');
        habits.push('适当运动，不要久坐');
        habits.push('少思虑，多行动');
    }
    else if (yongShen === '金') {
        habits.push('多接触金属物品（首饰等）');
        habits.push('保持整洁有序');
        habits.push('做事果断，不要犹豫不决');
    }
    return {
        luckyDirections: dirInfo.lucky,
        avoidDirections: dirInfo.avoid,
        luckyColors: colorInfo.lucky,
        avoidColors: colorInfo.avoid,
        suitableIndustries: industries,
        dailyHabits: habits
    };
}
/**
 * 格式化八字分析输出
 */
export function formatBaziAnalysis(analysis) {
    const lines = [];
    lines.push(`📅 **八字分析报告**`);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`**八字**：${analysis.bazi}`);
    lines.push(`**日主**：${analysis.riZhu}（${analysis.riWuXing}）`);
    lines.push(`**生肖**：${analysis.riShengXiao}`);
    lines.push(`**格局**：${analysis.geJu}`);
    lines.push(`**旺衰**：${analysis.wangShuai.description}`);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`**五行统计**：`);
    lines.push(`• 木：${analysis.wuXingCount['木']}个`);
    lines.push(`• 火：${analysis.wuXingCount['火']}个`);
    lines.push(`• 土：${analysis.wuXingCount['土']}个`);
    lines.push(`• 金：${analysis.wuXingCount['金']}个`);
    lines.push(`• 水：${analysis.wuXingCount['水']}个`);
    lines.push(`**五行平衡**：${analysis.wuXingBalance}`);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`**用神喜神忌神**`);
    lines.push(`• **用神**：${analysis.yongShen}（主）`);
    lines.push(`• **喜神**：${analysis.xiShen.join('、')}（辅）`);
    lines.push(`• **忌神**：${analysis.jiShen.join('、')}`);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`**幸运方位**：${analysis.suggestions.luckyDirections.join('、')}`);
    lines.push(`**忌讳方位**：${analysis.suggestions.avoidDirections.join('、')}`);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`**幸运颜色**`);
    lines.push(`${analysis.suggestions.luckyColors.join('、')}`);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`**适合行业**`);
    lines.push(`${analysis.suggestions.suitableIndustries.join('、')}`);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`**日常建议**`);
    analysis.suggestions.dailyHabits.forEach((h, i) => {
        lines.push(`${i + 1}. ${h}`);
    });
    lines.push(`━━━━━━━━━━━━━━━`);
    return lines.join('\n');
}
/**
 * 计算天干索引（60甲子循环）
 */
function getYearGanIndex(year) {
    return (year - 4) % 10;
}
/**
 * 计算地支索引（60甲子循环）
 */
function getYearZhiIndex(year) {
    return (year - 4) % 12;
}
/**
 * 计算年柱
 */
export function getYearZhu(year) {
    const ganIndex = getYearGanIndex(year);
    const zhiIndex = getYearZhiIndex(year);
    return TIANGAN[ganIndex] + DIZHI[zhiIndex];
}
/**
 * 根据年份获取年干
 */
export function getYearGan(year) {
    return TIANGAN[getYearGanIndex(year)];
}
/**
 * 计算月柱（基于年干的口诀计算）
 */
export function getMonthZhu(year, month) {
    const yearGan = getYearGan(year);
    const startGanIndex = YUE_JIA_KOUJUE[yearGan];
    const monthGanIndex = (startGanIndex + month - 1) % 10;
    const monthZhiIndex = (month + 1) % 12;
    return TIANGAN[monthGanIndex] + DIZHI[monthZhiIndex];
}
/**
 * 计算八字中的月份地支
 */
export function getMonthZhi(month) {
    return DIZHI[(month + 1) % 12];
}
/**
 * 将小时转换为时辰索引
 */
function getShichenIndex(hour) {
    if (hour >= 23 || hour < 1)
        return 0; // 子时
    return Math.floor((hour + 1) / 2);
}
/**
 * 根据小时获取时辰名称
 */
export function getShichenName(hour) {
    const index = getShichenIndex(hour);
    return SHICHEN_DIZHI[index] + '时';
}
/**
 * 计算完整八字（使用 lunar-javascript 库，最精确的日柱计算）
 */
export function getBazi(year, month, day, hour) {
    const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
    const lunar = solar.getLunar();
    const yearZhu = lunar.getYearInGanZhi();
    const monthZhu = lunar.getMonthInGanZhi();
    const dayZhu = lunar.getDayInGanZhi();
    const shiZhu = lunar.getTimeInGanZhi();
    const shiZhi = shiZhu.charAt(1);
    const shichenName = shiZhi + '时';
    return {
        year: yearZhu,
        month: monthZhu,
        day: dayZhu,
        hour: shiZhu,
        bazi: `${yearZhu} ${monthZhu} ${dayZhu} ${shiZhu}`,
        shichen: shichenName,
        birthTime: `${hour}时`,
        yearGan: yearZhu.charAt(0),
        yearZhi: yearZhu.charAt(1),
        monthGan: monthZhu.charAt(0),
        monthZhi: monthZhu.charAt(1),
        dayGan: dayZhu.charAt(0),
        dayZhi: dayZhu.charAt(1),
        hourGan: shiZhu.charAt(0),
        hourZhi: shiZhu.charAt(1),
    };
}
/**
 * 计算农历生日的八字
 */
export function getBaziFromLunar(year, month, day, hour, isLeapMonth = false) {
    const lunar = Lunar.fromYmdHms(year, month, day, hour, 0, 0, isLeapMonth);
    const solar = lunar.getSolar();
    const yearZhu = lunar.getYearInGanZhi();
    const monthZhu = lunar.getMonthInGanZhi();
    const dayZhu = lunar.getDayInGanZhi();
    const shiZhu = lunar.getTimeInGanZhi();
    const shiZhi = shiZhu.charAt(1);
    const shichenName = shiZhi + '时';
    return {
        year: yearZhu,
        month: monthZhu,
        day: dayZhu,
        hour: shiZhu,
        bazi: `${yearZhu} ${monthZhu} ${dayZhu} ${shiZhu}`,
        shichen: shichenName,
        birthTime: `${hour}时`,
        lunarYear: year,
        lunarMonth: month,
        lunarDay: day,
        solarDate: `${solar.getYear()}-${solar.getMonth()}-${solar.getDay()}`,
        yearGan: yearZhu.charAt(0),
        yearZhi: yearZhu.charAt(1),
        monthGan: monthZhu.charAt(0),
        monthZhi: monthZhu.charAt(1),
        dayGan: dayZhu.charAt(0),
        dayZhi: dayZhu.charAt(1),
        hourGan: shiZhu.charAt(0),
        hourZhi: shiZhu.charAt(1),
    };
}
/**
 * 解析日期时间字符串
 */
export function parseDateTime(input) {
    let year, month = 1, day = 1, hour = 0;
    let valid = false;
    const cleaned = input.trim();
    const digitsOnly = cleaned.replace(/[-\s:./]/g, '');
    if (/^\d+$/.test(digitsOnly)) {
        if (digitsOnly.length >= 4) {
            year = parseInt(digitsOnly.substring(0, 4));
            valid = true;
        }
        if (digitsOnly.length >= 6)
            month = parseInt(digitsOnly.substring(4, 6));
        if (digitsOnly.length >= 8)
            day = parseInt(digitsOnly.substring(6, 8));
        if (digitsOnly.length >= 10)
            hour = parseInt(digitsOnly.substring(8, 10));
    }
    if (valid) {
        if (year < 1900 || year > 2100)
            valid = false;
        if (month < 1 || month > 12)
            valid = false;
        if (day < 1 || day > 31)
            valid = false;
        if (hour < 0 || hour > 23)
            valid = false;
    }
    return { year, month, day, hour, valid };
}
// ==================== 今日黄历算法 ====================
/**
 * 获取今日黄历信息
 */
export function getHuangLi(year, month, day) {
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    const nineStar = lunar.getDayNineStar();
    const dayYi = lunar.getDayYi() || [];
    const dayJi = lunar.getDayJi() || [];
    const dayTianShen = lunar.getDayTianShen();
    const dayTianShenType = lunar.getDayTianShenType();
    const dayPositionTai = lunar.getDayPositionTai();
    const festivals = lunar.getFestivals() || [];
    const pengZuGan = lunar.getPengZuGan();
    const pengZuZhi = lunar.getPengZuZhi();
    const chong = lunar.getChong();
    const chongDesc = lunar.getChongDesc();
    const sha = lunar.getSha();
    const xiu = lunar.getXiu();
    const xiuLuck = lunar.getXiuLuck();
    const positionXi = lunar.getPositionXi();
    const positionXiDesc = lunar.getPositionXiDesc();
    const positionFu = lunar.getPositionFu();
    const positionFuDesc = lunar.getPositionFuDesc();
    const positionCai = lunar.getPositionCai();
    const positionCaiDesc = lunar.getPositionCaiDesc();
    const positionYangGui = lunar.getPositionYangGui();
    const positionYangGuiDesc = lunar.getPositionYangGuiDesc();
    const positionYinGui = lunar.getPositionYinGui();
    const positionYinGuiDesc = lunar.getPositionYinGuiDesc();
    const yearNaYin = lunar.getYearNaYin();
    const monthNaYin = lunar.getMonthNaYin();
    const dayNaYin = lunar.getDayNaYin();
    const jie = lunar.getJie();
    const qi = lunar.getQi();
    const yueXiang = lunar.getYueXiang();
    const week = lunar.getWeek();
    const weekInChinese = lunar.getWeekInChinese();
    const yearShengXiao = lunar.getYearShengXiao();
    const monthShengXiao = lunar.getMonthShengXiao();
    const dayShengXiao = lunar.getDayShengXiao();
    const dayXunKong = lunar.getDayXunKong();
    const dayXun = lunar.getDayXun();
    const zodiac = solar.getXingZuo();
    return {
        solar: {
            year: solar.getYear(),
            month: solar.getMonth(),
            day: solar.getDay(),
            week: week,
            weekName: weekInChinese,
            zodiac: zodiac,
            fullString: solar.toFullString(),
        },
        lunar: {
            year: lunar.getYearInChinese(),
            month: lunar.getMonthInChinese(),
            day: lunar.getDayInChinese(),
            yearGanZhi: lunar.getYearInGanZhi(),
            monthGanZhi: lunar.getMonthInGanZhi(),
            dayGanZhi: lunar.getDayInGanZhi(),
            yearShengXiao,
            monthShengXiao,
            dayShengXiao,
            fullString: lunar.toFullString(),
        },
        ganZhi: {
            year: lunar.getYearInGanZhi(),
            month: lunar.getMonthInGanZhi(),
            day: lunar.getDayInGanZhi(),
        },
        naYin: {
            year: yearNaYin,
            month: monthNaYin,
            day: dayNaYin,
        },
        pengZu: {
            gan: pengZuGan,
            zhi: pengZuZhi,
        },
        jiShen: {
            xi: { position: positionXi, desc: positionXiDesc },
            fu: { position: positionFu, desc: positionFuDesc },
            cai: { position: positionCai, desc: positionCaiDesc },
            yangGui: { position: positionYangGui, desc: positionYangGuiDesc },
            yinGui: { position: positionYinGui, desc: positionYinGuiDesc },
        },
        chongSha: {
            chong: chong,
            chongDesc: chongDesc,
            sha: sha,
        },
        xiu: {
            name: xiu,
            luck: xiuLuck,
        },
        dayYiJi: {
            yi: dayYi,
            ji: dayJi,
        },
        tianShen: {
            name: dayTianShen,
            type: dayTianShenType,
        },
        nineStar: {
            number: nineStar.getNumber(),
            color: nineStar.getColor(),
            wuXing: nineStar.getWuXing(),
            positionDesc: nineStar.getPositionDesc(),
        },
        jieQi: {
            jie: jie,
            qi: qi,
        },
        yueXiang: yueXiang,
        xunKong: {
            day: dayXunKong,
            dayXun: dayXun,
        },
        festivals: {
            main: festivals,
        },
    };
}
/**
 * 格式化黄历输出为美观的字符串
 */
export function formatHuangLi(huangLi) {
    const { solar, lunar, ganZhi, naYin, pengZu, chongSha, xiu, dayYiJi, tianShen, nineStar, jieQi, yueXiang, xunKong, festivals, jiShen } = huangLi;
    const lines = [];
    lines.push(`📅 **今日黄历**`);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`**公历日期**：${solar.year}年${solar.month}月${solar.day}日 ${solar.weekName} ${solar.zodiac}`);
    lines.push(`**农历日期**：${lunar.year} ${lunar.month} ${lunar.day}`);
    if (festivals.main && festivals.main.length > 0) {
        lines.push(`**今日节日**：${festivals.main.join(' ')}`);
    }
    if (jieQi.jie || jieQi.qi) {
        lines.push(`**节气**：${jieQi.jie || ''} ${jieQi.qi || ''}`.trim());
    }
    lines.push(`**干支**：${ganZhi.year}年 ${ganZhi.month}月 ${ganZhi.day}日`);
    lines.push(`**生肖**：${lunar.yearShengXiao}年 ${lunar.monthShengXiao}月 ${lunar.dayShengXiao}日`);
    lines.push(`**纳音五行**：${naYin.year} ${naYin.month} ${naYin.day}`);
    lines.push(`━━━━━━━━━━━━━━━`);
    if (pengZu.gan) {
        lines.push(`**彭祖百忌**：${pengZu.gan} ${pengZu.zhi}`);
    }
    if (chongSha.chong) {
        lines.push(`**冲煞**：${chongSha.chong} ${chongSha.chongDesc} 煞${chongSha.sha}`);
    }
    lines.push(`**日旬空亡**：${xunKong.day} ${xunKong.dayXun}`);
    lines.push(`**九星**：${nineStar.number} ${nineStar.color} ${nineStar.wuXing} ${nineStar.positionDesc}方`);
    if (yueXiang) {
        lines.push(`**月相**：${yueXiang}`);
    }
    if (tianShen.name) {
        lines.push(`**日神**：${tianShen.name}（${tianShen.type}）`);
    }
    lines.push(`**星宿**：${xiu.name}（${xiu.luck}）`);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`**吉神方位**`);
    lines.push(`• 喜神：${jiShen.xi.position} ${jiShen.xi.desc}`);
    lines.push(`• 福神：${jiShen.fu.position} ${jiShen.fu.desc}`);
    lines.push(`• 财神：${jiShen.cai.position} ${jiShen.cai.desc}`);
    lines.push(`• 阳贵神：${jiShen.yangGui.position} ${jiShen.yangGui.desc}`);
    lines.push(`• 阴贵神：${jiShen.yinGui.position} ${jiShen.yinGui.desc}`);
    lines.push(`━━━━━━━━━━━━━━━`);
    if (dayYiJi.yi && dayYiJi.yi.length > 0) {
        lines.push(`**今日宜**：${dayYiJi.yi.join(' ')}`);
    }
    if (dayYiJi.ji && dayYiJi.ji.length > 0) {
        lines.push(`**今日忌**：${dayYiJi.ji.join(' ')}`);
    }
    lines.push(`━━━━━━━━━━━━━━━`);
    return lines.join('\n');
}
// ==================== 六爻算法 ====================
/** 八卦二进制映射表 */
export const TRIGRAM_MAP = {
    '111': 'Qian', // 乾
    '011': 'Dui', // 兑
    '101': 'Li', // 离
    '001': 'Zhen', // 震
    '110': 'Xun', // 巽
    '010': 'Kan', // 坎
    '100': 'Gen', // 艮
    '000': 'Kun', // 坤
};
/** 64 卦索引表 (上卦+下卦 -> ID) */
export const HEXAGRAM_DB = {
    'QianQian': 1, 'KunKun': 2, 'KanZhen': 3, 'GenKan': 4,
    'KanQian': 5, 'QianKan': 6, 'KunKan': 7, 'KanKun': 8,
    'XunQian': 9, 'QianDui': 10, 'KunQian': 11, 'QianKun': 12,
    'QianLi': 13, 'LiQian': 14, 'KunGen': 15, 'ZhenKun': 16,
    'DuiZhen': 17, 'GenXun': 18, 'KunDui': 19, 'XunKun': 20,
    'LiZhen': 21, 'GenLi': 22, 'GenKun': 23, 'KunZhen': 24,
    'QianZhen': 25, 'GenQian': 26, 'GenZhen': 27, 'DuiXun': 28,
    'KanKan': 29, 'LiLi': 30, 'DuiGen': 31, 'ZhenXun': 32,
    'QianGen': 33, 'ZhenQian': 34, 'LiKun': 35, 'KunLi': 36,
    'XunLi': 37, 'LiDui': 38, 'KanGen': 39, 'ZhenKan': 40,
    'GenDui': 41, 'XunZhen': 42, 'DuiQian': 43, 'QianXun': 44,
    'DuiKun': 45, 'KunXun': 46, 'DuiKan': 47, 'KanXun': 48,
    'DuiLi': 49, 'LiXun': 50, 'ZhenZhen': 51, 'GenGen': 52,
    'XunGen': 53, 'ZhenDui': 54, 'ZhenLi': 55, 'LiGen': 56,
    'XunXun': 57, 'DuiDui': 58, 'XunKan': 59, 'KanDui': 60,
    'XunDui': 61, 'ZhenGen': 62, 'KanLi': 63, 'LiKan': 64,
};
/** 中文卦名映射 */
export const CN_NAMES = {
    'QianQian': '乾为天', 'KunKun': '坤为地', 'KanZhen': '水雷屯', 'GenKan': '山水蒙',
    'KanQian': '水天需', 'QianKan': '天水讼', 'KunKan': '地水师', 'KanKun': '水地比',
    'XunQian': '风天小畜', 'QianDui': '天泽履', 'KunQian': '地天泰', 'QianKun': '天地否',
    'QianLi': '天火同人', 'LiQian': '火天大有', 'KunGen': '地山谦', 'ZhenKun': '雷地豫',
    'DuiZhen': '泽雷随', 'GenXun': '山风蛊', 'KunDui': '地泽临', 'XunKun': '风地观',
    'LiZhen': '火雷噬嗑', 'GenLi': '山火贲', 'GenKun': '山地剥', 'KunZhen': '地雷复',
    'QianZhen': '天雷无妄', 'GenQian': '山天大畜', 'GenZhen': '山雷颐', 'DuiXun': '泽风大过',
    'KanKan': '坎为水', 'LiLi': '离为火', 'DuiGen': '泽山咸', 'ZhenXun': '雷风恒',
    'QianGen': '天山遁', 'ZhenQian': '雷天大壮', 'LiKun': '火地晋', 'KunLi': '地火明夷',
    'XunLi': '风火家人', 'LiDui': '火泽睽', 'KanGen': '水山蹇', 'ZhenKan': '雷水解',
    'GenDui': '山泽损', 'XunZhen': '风雷益', 'DuiQian': '泽天夬', 'QianXun': '天风姤',
    'DuiKun': '泽地萃', 'KunXun': '地风升', 'DuiKan': '泽水困', 'KanXun': '水风井',
    'DuiLi': '泽火革', 'LiXun': '火风鼎', 'ZhenZhen': '震为雷', 'GenGen': '艮为山',
    'XunGen': '风山渐', 'ZhenDui': '雷泽归妹', 'ZhenLi': '雷火丰', 'LiGen': '火山旅',
    'XunXun': '巽为风', 'DuiDui': '兑为泽', 'XunKan': '风水涣', 'KanDui': '水泽节',
    'XunDui': '风泽中孚', 'ZhenGen': '雷山小过', 'KanLi': '水火既济', 'LiKan': '火水未济',
};
/** 64 卦 Unicode 符号映射 */
export const GUA_SYMBOLS = {
    'QianQian': '䷀', 'KunKun': '䷁', 'KanZhen': '䷂', 'GenKan': '䷃',
    'KanQian': '䷄', 'QianKan': '䷅', 'KunKan': '䷆', 'KanKun': '䷇',
    'XunQian': '䷈', 'QianDui': '䷉', 'KunQian': '䷊', 'QianKun': '䷋',
    'QianLi': '䷌', 'LiQian': '䷍', 'KunGen': '䷎', 'ZhenKun': '䷏',
    'DuiZhen': '䷐', 'GenXun': '䷑', 'KunDui': '䷒', 'XunKun': '䷓',
    'LiZhen': '䷔', 'GenLi': '䷕', 'GenKun': '䷖', 'KunZhen': '䷗',
    'QianZhen': '䷘', 'GenQian': '䷙', 'GenZhen': '䷚', 'DuiXun': '䷛',
    'KanKan': '䷜', 'LiLi': '䷝', 'DuiGen': '䷞', 'ZhenXun': '䷟',
    'QianGen': '䷠', 'ZhenQian': '䷡', 'LiKun': '䷢', 'KunLi': '䷣',
    'XunLi': '䷤', 'LiDui': '䷥', 'KanGen': '䷦', 'ZhenKan': '䷧',
    'GenDui': '䷨', 'XunZhen': '䷩', 'DuiQian': '䷪', 'QianXun': '䷫',
    'DuiKun': '䷬', 'KunXun': '䷭', 'DuiKan': '䷮', 'KanXun': '䷯',
    'DuiLi': '䷰', 'LiXun': '䷱', 'ZhenZhen': '䷲', 'GenGen': '䷳',
    'XunGen': '䷴', 'ZhenDui': '䷵', 'ZhenLi': '䷶', 'LiGen': '䷷',
    'XunXun': '䷸', 'DuiDui': '䷹', 'XunKan': '䷺', 'KanDui': '䷻',
    'XunDui': '䷼', 'ZhenGen': '䷽', 'KanLi': '䷾', 'LiKan': '䷿',
};
/** 卦象核心含义 */
export const GUA_MEANINGS = {
    'QianQian': '天行健，君子以自强不息',
    'KunKun': '地势坤，君子以厚德载物',
    'KanZhen': '云雷屯，君子以经纶',
    'GenKan': '山下出泉，蒙君子以果行育德',
    'KanQian': '云上于天，需君子以饮食宴乐',
    'QianKan': '天与水违行，讼君子以作事谋始',
    'KunKan': '地中有水，师君子以容民畜众',
    'KanKun': '地上有水，比先王以建万国亲诸侯',
    'XunQian': '风行天上，小畜君子以懿文德',
    'QianDui': '天履，君子以辨上下定民志',
    'KunQian': '天地交泰，后以财成天地之道',
    'QianKun': '天地不交，否君子以俭德辟难',
    'QianLi': '火在天上，同人君子以类族辨物',
    'LiQian': '火在天上，大有君子以遏恶扬善',
    'KunGen': '地中有山，谦君子以裒多益寡',
    'ZhenKun': '雷出地奋，豫君子以作乐崇德',
    'DuiZhen': '泽中有雷，随君子以向晦入宴息',
    'GenXun': '山下有风，蛊君子以振民育德',
    'KunDui': '泽上有地，临君子以教思无穷',
    'XunKun': '风行地上，观先王以省方观民设教',
    'LiZhen': '电雷，噬嗑先王以明罚敕法',
    'GenLi': '山下有火，贲君子以明庶政',
    'GenKun': '山地剥，不利有攸往',
    'KunZhen': '雷在地中，复君子以见天地之心',
    'QianZhen': '天下雷行，物与无妄先王以茂对时育万物',
    'GenQian': '天在山中，大畜君子以多识前言往行',
    'GenZhen': '山下有雷，颐君子以慎言语节饮食',
    'DuiXun': '泽灭木，大过君子以独立不惧',
    'KanKan': '水洊至，习坎君子以常德行习教事',
    'LiLi': '明两作，离大人以继明照于四方',
    'DuiGen': '山上有泽，咸君子以虚受人',
    'ZhenXun': '雷风恒君子以立不易方',
    'QianGen': '天下有山，遁君子以远小人',
    'ZhenQian': '雷在天上，大壮君子以非礼勿履',
    'LiKun': '明入地中，明夷君子以莅众',
    'KunLi': '火在地中，晋君子以自昭明德',
    'XunLi': '风自火出，家人君子以言有物而行有恒',
    'LiDui': '上火下泽，睽君子以同而异',
    'KanGen': '山上有水，蹇君子以反身修德',
    'ZhenKan': '雷雨作，解君子以赦过宥罪',
    'GenDui': '山下有泽，损君子以惩忿窒欲',
    'XunZhen': '风雷益君子以见善则迁有过则改',
    'DuiQian': '泽上于天，夬君子以施禄及下',
    'QianXun': '天下有风，姤后以施命诰四方',
    'DuiKun': '泽上于地，萃君子以除戎器戒不虞',
    'KunXun': '地中升，升君子以顺德积小以成大',
    'DuiKan': '泽无水，困君子以致命遂志',
    'KanXun': '木上有水，井君子以劳民劝相',
    'DuiLi': '泽中有火，革君子以治历明时',
    'LiXun': '木上有火，鼎君子以正位凝命',
    'ZhenZhen': '雷震，君子以恐惧修省',
    'GenGen': '兼山，艮君子以思不出其位',
    'XunGen': '山上有风，渐君子以居贤德善俗',
    'ZhenDui': '泽上有雷，归妹君子以永终知敝',
    'ZhenLi': '雷电皆至，丰君子以折狱致刑',
    'LiGen': '山上有火，旅君子以明慎用刑而不留狱',
    'XunXun': '随风，巽君子以申命行事',
    'DuiDui': '丽泽，兑君子以朋友讲习',
    'XunKan': '风水涣先王以享于帝立庙',
    'KanDui': '泽上有水，节君子以制数度议德行',
    'XunDui': '泽上有风，中孚君子以议狱缓死',
    'ZhenGen': '山上有雷，小过君子以行过乎恭',
    'KanLi': '水在火上，既济君子以思患而豫防之',
    'LiKan': '火在水上，未济君子以慎辨物居方',
};
// ==================== 六爻核心算法函数 ====================
/**
 * 根据二进制数组 (初->上) 获取卦象信息
 */
export function getGuaInfo(binArray) {
    const lowerBits = `${binArray[2]}${binArray[1]}${binArray[0]}`;
    const upperBits = `${binArray[5]}${binArray[4]}${binArray[3]}`;
    const lowerName = TRIGRAM_MAP[lowerBits];
    const upperName = TRIGRAM_MAP[upperBits];
    if (!lowerName || !upperName)
        return null;
    const key = `${upperName}${lowerName}`;
    return {
        key,
        id: HEXAGRAM_DB[key] || 0,
        nameEn: key,
        nameCn: CN_NAMES[key] || '未知卦',
        symbol: GUA_SYMBOLS[key] || '䷓',
        binary: binArray,
        meaning: GUA_MEANINGS[key] || '卦象含义待释',
    };
}
/**
 * 数值转二进制 (6,8->0; 7,9->1)
 */
function toBinary(n) {
    return (n === 7 || n === 9) ? 1 : 0;
}
/**
 * 验证输入格式
 */
export function validateInput(inputStr) {
    const parts = inputStr.trim().split(/\s+/);
    if (parts.length !== 6) {
        return { valid: false, error: `需要正好 6 组数据，当前为 ${parts.length} 组` };
    }
    for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (p.length !== 3 || !/^[23]+$/.test(p)) {
            return { valid: false, error: `第 ${i + 1} 组数据格式错误，应为 3 个 2 或 3` };
        }
    }
    return { valid: true };
}
/**
 * 主处理函数：解析输入并计算五卦
 */
export function calculateFiveGua(inputStr) {
    const parts = inputStr.trim().split(/\s+/);
    if (parts.length !== 6) {
        throw new Error("格式错误：需要正好 6 组数据，每组 3 个数字。");
    }
    const sums = parts.map((p, idx) => {
        if (p.length !== 3 || !/^[23]+$/.test(p)) {
            throw new Error(`第 ${idx + 1} 组数据格式错误，应为 3 个 2 或 3。`);
        }
        return p.split('').reduce((a, b) => a + parseInt(b), 0);
    });
    const baseBin = sums.map(toBinary);
    const ben = getGuaInfo(baseBin);
    if (!ben)
        throw new Error("本卦计算失败");
    const bianBin = sums.map(n => {
        if (n === 6)
            return 1;
        if (n === 9)
            return 0;
        return toBinary(n);
    });
    const bian = getGuaInfo(bianBin);
    if (!bian)
        throw new Error("变卦计算失败");
    const huBin = [
        baseBin[1], baseBin[2], baseBin[3],
        baseBin[2], baseBin[3], baseBin[4]
    ];
    const hu = getGuaInfo(huBin);
    if (!hu)
        throw new Error("互卦计算失败");
    const zongBin = [...baseBin].reverse();
    const zong = getGuaInfo(zongBin);
    if (!zong)
        throw new Error("综卦计算失败");
    const jiaoBin = [...baseBin.slice(3, 6), ...baseBin.slice(0, 3)];
    const jiao = getGuaInfo(jiaoBin);
    if (!jiao)
        throw new Error("交卦计算失败");
    const cuoBin = baseBin.map(b => b === 1 ? 0 : 1);
    const cuo = getGuaInfo(cuoBin);
    if (!cuo)
        throw new Error("错卦计算失败");
    const lineNames = ["初", "二", "三", "四", "五", "上"];
    const movingLines = [];
    sums.forEach((sum, idx) => {
        if (sum === 6)
            movingLines.push(`${lineNames[idx]}六 (老阴)`);
        if (sum === 9)
            movingLines.push(`${lineNames[idx]}九 (老阳)`);
    });
    return {
        inputRaw: inputStr,
        sums,
        movingLines: movingLines.length > 0 ? movingLines : ["无动爻 (静卦)"],
        ben,
        bian,
        hu,
        zong,
        jiao,
        cuo,
    };
}
/**
 * 从用户输入中提取数字部分
 */
export function extractNumbers(input) {
    const match = input.match(/([23]{3}\s*){6}/);
    if (match) {
        return match[0].trim().replace(/\s+/g, ' ');
    }
    return null;
}
/**
 * 从用户输入中提取问题部分
 */
export function extractQuestion(input, numbers) {
    return input.replace(numbers, '').trim() || "综合运势";
}
