export type StatsResponse = {
    code: number;
    error: string;
    userId: string;
    username: string;
    month: number;
    monthName: string;
    game: string;
    rank: number;
    skin?: string;
    data: {
        points: number;
        gameCount: number;
        winCount: number;
        defeatCount: number;
        gameTime: number;
        kills: number;
        deathCount: number;
    };
    stats: {
        winrate: number;
        kd: number;
        ragequit?: number;
        killsPerGame: number;
        deathsPerGame: number;
        pointsPerGame: number;
        timePerGame?: number;
        killsPerMinute?: number;
        secondsPerKill?: number;
        bedsPerGame?: number;
        nexusPerGame?: number;
        damagePerGame?: number;
    };
};
export type InfosResponse = {
    code: number;
    error: string;
    grade: string;
    username: string;
    userId: string;
    skin: string;
    inscription: string;
    lastConnection: string;
    gloires: number;
    gameCount: number;
    points: number;
    winCount: number;
    defeatCount: number;
    gameTime: number;
    kills: number;
    deathCount: number;
    friends?: {
        nom: string;
        skin: string;
    }[];
    ban: ("TEMP" | "DEF" | "NONE");
};
/**
 * @typedef {{
 *   code: number,
 *   error: string,
 *   userId: string,
 *   username: string,
 *   month: number,
 *   monthName: string,
 *   game: string,
 *   rank: number,
 *   skin?: string,
 *   data: {
 *     points: number,
 *     gameCount: number,
 *     winCount: number,
 *     defeatCount: number,
 *     gameTime: number,
 *     kills: number,
 *     deathCount: number
 *   },
 *   stats: {
 *     winrate: number,
 *     kd: number,
 *     ragequit?: number,
 *     killsPerGame: number,
 *     deathsPerGame: number,
 *     pointsPerGame: number,
 *     timePerGame?: number,
 *     killsPerMinute?: number,
 *     secondsPerKill?: number,
 *     bedsPerGame?: number,
 *     nexusPerGame?: number,
 *     damagePerGame?: number
 *   }
 * }} StatsResponse
 */
/**
 * @typedef {{
 *   code: number,
 *   error: string,
 *   grade: string,
 *   username: string,
 *   userId: string,
 *   skin: string,
 *   inscription: string,
 *   lastConnection: string,
 *   gloires: number,
 *   gameCount: number,
 *   points: number,
 *   winCount: number,
 *   defeatCount: number,
 *   gameTime: number,
 *   kills: number,
 *   deathCount: number,
 *   friends?:  {
 *     nom: string,
 *     skin: string
 *   }[],
 *   ban: ("TEMP"|"DEF"|"NONE")
 * }} InfosResponse
 */
/**
 * Get stats for a player, for a game in a specific period
 * @param {string} period
 * @param {string} game
 * @param {string} username
 * @returns {Promise<StatsResponse>}
 */
export function stats(period: string, game: string, username: string): Promise<StatsResponse>;
/**
 * Get all stats of a player
 * @param {string} username
 * @returns {Promise<{
 *   code: number,
 *   error: string,
 *   infos: {
 *     username: string,
 *     skin: string,
 *     userId: string
 *   },
 *   [game: string]: {
 *     [period: string]: StatsResponse
 *     always?: StatsResponse
 *   }
 * }>}
 */
export function allStats(username: string): Promise<{
    [game: string]: {
        [period: string]: StatsResponse;
        always?: StatsResponse;
    };
    code: number;
    error: string;
    infos: {
        username: string;
        skin: string;
        userId: string;
    };
}>;
/**
 * Get infos about a player
 * @param {string} username
 * @returns {Promise<InfosResponse>}
 */
export function infos(username: string, fetchFriends?: boolean): Promise<InfosResponse>;
/**
 * Get friends from a player id
 * @param {string} userId
 * @returns {Promise<{
 *   code: number,
 *   error: string,
 *   friends: {
 *     nom: string,
 *     skin: string
 *   }[]
 * }>}
 */
export function friends(userId: string): Promise<{
    code: number;
    error: string;
    friends: {
        nom: string;
        skin: string;
    }[];
}>;
/**
 * Get head of a player
 * @param {string} username
 * @returns {Promise<string>}
 */
export function head(username: string): Promise<string>;
/**
 * Get stats table of a game
 * @param {string} period
 * @param {string} game
 * @returns {Promise<StatsResponse[]>}
 */
export function table(period: string, game: string): Promise<StatsResponse[]>;
/**
 * Compute some stats properties
 * @param {object} stats
 * @param {boolean} data
 * @returns {object}
 */
export function computeStats(stats: object, data?: boolean): object;
import parsers = require("./parsers");
import errors = require("./errors");
import utils = require("./utils");
export const data: {
    games: string[];
    months: string[];
    gameAliases: {
        infecte: string;
        shoot: string;
        land: string;
        mma: string;
        pvp: string;
        hika: string;
        sky: string;
        rush: string;
    };
    monthAliases: {
        janvier: string;
        fevrier: string;
        mars: string;
        avril: string;
        mai: string;
        juin: string;
        juillet: string;
        aout: string;
        septembre: string;
        octobre: string;
        novembre: string;
        decembre: string;
    };
};
export { parsers, errors, utils };
