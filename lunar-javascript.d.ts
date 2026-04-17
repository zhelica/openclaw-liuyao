declare module 'lunar-javascript' {
    export class Solar {
        static fromYmd(year: number, month: number, day: number): Solar;
        static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
        getHour(): number;
        getMinute(): number;
        getSecond(): number;
        getWeek(): number;
        getWeekInChinese(): string;
        getXingZuo(): string;
        getLunar(): Lunar;
        toFullString(): string;
        toYmd(): string;
        toYmdHms(): string;
    }

    export class Lunar {
        static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number, isLeapMonth?: boolean): Lunar;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
        getHour(): number;
        getYearInGanZhi(): string;
        getMonthInGanZhi(): string;
        getDayInGanZhi(): string;
        getTimeInGanZhi(): string;
        getYearInChinese(): string;
        getMonthInChinese(): string;
        getDayInChinese(): string;
        getYearShengXiao(): string;
        getMonthShengXiao(): string;
        getDayShengXiao(): string;
        getYearNaYin(): string;
        getMonthNaYin(): string;
        getDayNaYin(): string;
        getPengZuGan(): string;
        getPengZuZhi(): string;
        getPositionXi(): string;
        getPositionXiDesc(): string;
        getPositionYangGui(): string;
        getPositionYangGuiDesc(): string;
        getPositionYinGui(): string;
        getPositionYinGuiDesc(): string;
        getPositionFu(): string;
        getPositionFuDesc(): string;
        getPositionCai(): string;
        getPositionCaiDesc(): string;
        getChong(): string;
        getChongDesc(): string;
        getSha(): string;
        getXiu(): string;
        getXiuLuck(): string;
        getXiuSong(): string;
        getDayYi(): string[];
        getDayJi(): string[];
        getDayTianShen(): string;
        getDayTianShenType(): string;
        getDayPositionTai(): string;
        getDayNineStar(): NineStar;
        getJie(): string;
        getQi(): string;
        getYueXiang(): string;
        getWeek(): number;
        getWeekInChinese(): string;
        getDayXunKong(): string;
        getDayXun(): string;
        getFestivals(): string[];
        getOtherFestivals(): string[];
        getSolar(): Solar;
        toFullString(): string;
    }

    export class NineStar {
        getNumber(): number;
        getColor(): string;
        getWuXing(): string;
        getPosition(): string;
        getPositionDesc(): string;
    }
}
