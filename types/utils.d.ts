declare const games: string[];
declare const months: string[];
declare namespace gameAliases {
    const infecte: string;
    const shoot: string;
    const land: string;
    const mma: string;
    const pvp: string;
    const hika: string;
    const sky: string;
    const rush: string;
}
declare namespace monthAliases {
    const janvier: string;
    const fevrier: string;
    const mars: string;
    const avril: string;
    const mai: string;
    const juin: string;
    const juillet: string;
    const aout: string;
    const septembre: string;
    const octobre: string;
    const novembre: string;
    const decembre: string;
}
/**
 * Round a number with a decimal count
 * @param {string} number
 * @param {number} decimalCount
 * @returns {number}
 */
export function Round(number: string, decimalCount?: number): number;
/**
 * Parse a FunCraft number field
 * @param {string} value
 * @returns {number}
 */
export function parseFCInt(value: string): number;
/**
 * Remove all accents from a string
 * @param {string} string
 * @returns {string}
 */
export function removeAccents(string: string): string;
/**
 * Parse a FunCraft date
 * @param {string} value
 * @param {string} utc
 * @returns {Date}
 */
export function parseFCDate(value: string, utc?: string): Date;
/**
 * @param {string} period
 * @returns {number}
 */
export function getMonth(period: string): number;
/**
 * @param {string} month
 * @returns {number}
 */
export function parseMonth(month: string): number;
/**
 * @param {string} game
 * @returns {string}
 */
export function getGame(game: string): string;
/**
 * Determine whether a string is a valid period
 * @param {string} period
 * @returns {string}
 */
export function vGetPeriod(period: string, strict?: boolean): string;
/**
 * Determine whether a string is a valid game
 * @param {string} game
 * @returns {string}
 */
export function vGetGame(game: string): string;
export declare namespace data {
    export { games };
    export { months };
    export { gameAliases };
    export { monthAliases };
}
export {};
