/**
 * Get stats from html body
 * @param {string} body
 * @param {string} href
 * @param {{ username: string, monthDiff: number, numGame: number, month: number }} data
 * @returns {import('./').StatsResponse}
 */
export function stats(body: string, href: string, { username, monthDiff, numGame, month }: {
    username: string;
    monthDiff: number;
    numGame: number;
    month: number;
}): import('./').StatsResponse;
/**
 * Get all stats from html body
 * @param {string} body
 * @param {string} href
 * @param {{ username: string }} data
 * @returns {import('./').AllStatsResponse}
 */
export function allStats(body: string, href: string, { username }: {
    username: string;
}): import('./').AllStatsResponse;
/**
 * Get infos from html body
 * @param {string} body
 * @param {string} href
 * @param {{ username: string }} data
 * @returns {import('./').InfosResponse}
 */
export function infos(body: string, href: string, { username }: {
    username: string;
}): import('./').InfosResponse;
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
 * @param {{ period: string, game: string }} data
 * @returns {{
 *   code: number,
 *   error: string,
 *   table: import('./').StatsResponse[]
 * }}
 */
export function table(body: string, { period, game }: {
    period: string;
    game: string;
}): {
    code: number;
    error: string;
    table: import('./').StatsResponse[];
};
/**
 * Get head fril html body
 * @param {string} body
 * @param {{ username: string }} data
 * @returns {{
 *   code: number,
 *   error: string,
 *   head: string
 * }}
 */
export function head(body: string, { username }: {
    username: string;
}): {
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
