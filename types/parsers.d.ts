/**
 * Get stats from html body
 * @param {string} body
 * @param {string} href
 * @param {object} data
 * @returns {import('./').StatsResponse}
 */
export function stats(body: string, href: string, { username, monthDiff, numGame, month }: object): import('./').StatsResponse;
/**
 * Get all stats from html body
 * @param {string} body
 * @param {string} href
 * @param {object} data
 * @returns {{
 *   [game: string]: {
 *     [period: string]: import('./').StatsResponse
 *     always?: import('./').StatsResponse
 *   },
 *   infos: {
 *     username: string,
 *     skin: string,
 *     userId: string
 *   }
 * }}
 */
export function allStats(body: string, href: string, { username }: object): {
    [game: string]: {
        [period: string]: import("./").StatsResponse;
        always?: import('./').StatsResponse;
    };
    infos: {
        username: string;
        skin: string;
        userId: string;
    };
};
/**
 * Get infos from html body
 * @param {string} body
 * @param {string} href
 * @param {object} data
 * @returns {import('./').InfosResponse}
 */
export function infos(body: string, href: string, { username }: object): import('./').InfosResponse;
/**
 * Get friends from html body
 * @param {string} body
 * @returns {{
 *   code: number,
 *   error: string,
 *   friends: {
 *     nom: string,
 *     skin: string
 *   }[]
 * }}
 */
export function friends(body: string): {
    code: number;
    error: string;
    friends: {
        nom: string;
        skin: string;
    }[];
};
/**
 * Get stats table from html body
 * @param {string} body
 * @param {object} data
 * @returns {{
 *   code: number,
 *   error: string,
 *   table: import('./').StatsResponse[]
 * }}
 */
export function table(body: string, { period, game }: object): {
    code: number;
    error: string;
    table: import('./').StatsResponse[];
};
/**
 * Get head fril html body
 * @param {string} body
 * @param {object} data
 * @returns {{
 *   code: number,
 *   error: string,
 *   head: string
 * }}
 */
export function head(body: string, { username }: object): {
    code: number;
    error: string;
    head: string;
};
/**
 *
 * @param {object} stats
 * @param {object} datas
 * @param {number} month
 * @param {number} numGame
 * @returns {object}
 */
export function statsFromData(stats: object, datas: object, month: number, numGame: number): object;
