/**
 * 六爻易经 - 核心算法引擎
 * 基于《周易》六爻占卜法，计算本卦、变卦、互卦、综卦、交卦、错卦
 */
// --- 1. 数据字典 ---
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
// --- 3. 核心算法函数 ---
/**
 * 根据二进制数组 (初->上) 获取卦象信息
 */
export function getGuaInfo(binArray) {
    // 下卦：初(0), 二(1), 三(2) -> 对应 Trigram 的 下,中,上 -> 索引反转: [2][1][0]
    const lowerBits = `${binArray[2]}${binArray[1]}${binArray[0]}`;
    // 上卦：四(3), 五(4), 上(5) -> 对应 Trigram 的 下,中,上 -> 索引反转: [5][4][3]
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
    // 1. 计算每爻的和 (6, 7, 8, 9)
    const sums = parts.map((p, idx) => {
        if (p.length !== 3 || !/^[23]+$/.test(p)) {
            throw new Error(`第 ${idx + 1} 组数据格式错误，应为 3 个 2 或 3。`);
        }
        // 修复：明确初始值为 0，TypeScript 会推断 a 为 number
        // a 是累加和 (number), b 是当前字符 (string)
        return p.split('').reduce((a, b) => a + parseInt(b), 0);
    });
    // 2. 辅助：数值转二进制
    const baseBin = sums.map(toBinary);
    // --- A. 本卦 ---
    const ben = getGuaInfo(baseBin);
    if (!ben)
        throw new Error("本卦计算失败");
    // --- B. 变卦 (6->7(1), 9->8(0), 7->1, 8->0) ---
    const bianBin = sums.map(n => {
        if (n === 6)
            return 1; // 老阴变阳
        if (n === 9)
            return 0; // 老阳变阴
        return toBinary(n);
    });
    const bian = getGuaInfo(bianBin);
    if (!bian)
        throw new Error("变卦计算失败");
    // --- C. 互卦 (取 1,2,3,2,3,4 索引) ---
    const huBin = [
        baseBin[1], baseBin[2], baseBin[3],
        baseBin[2], baseBin[3], baseBin[4]
    ];
    const hu = getGuaInfo(huBin);
    if (!hu)
        throw new Error("互卦计算失败");
    // --- D. 综卦 (反转) ---
    const zongBin = [...baseBin].reverse();
    const zong = getGuaInfo(zongBin);
    if (!zong)
        throw new Error("综卦计算失败");
    // --- E. 交卦 (上下卦互换) ---
    // 原下卦(索引0,1,2)移到上方，原上卦(索引3,4,5)移到下方
    const jiaoBin = [...baseBin.slice(3, 6), ...baseBin.slice(0, 3)];
    const jiao = getGuaInfo(jiaoBin);
    if (!jiao)
        throw new Error("交卦计算失败");
    // --- F. 错卦 (取反) ---
    const cuoBin = baseBin.map(b => b === 1 ? 0 : 1);
    const cuo = getGuaInfo(cuoBin);
    if (!cuo)
        throw new Error("错卦计算失败");
    // 3. 提取动爻信息
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
