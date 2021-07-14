const request = require('request');
const parsers = require('./parsers');
const errors = require('./errors');
const utils = require('./utils');

const {
	stats: parseStats,
	allStats: parseAllStats,
	infos: parseInfos,
	friends: parseFriends,
	table: parseTable,
	head: parseHead
} = parsers;
const {
	Round,
	removeAccents,
	getMonth,
	parseMonth,
	getGame,
	vGetGame,
	data
} = utils;


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
 *   inscription: Date,
 *   lastConnection: Date,
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
 * @typedef {{
 *   code: number,
 *   error: string,
 *   infos: {
 *     username: string,
 *     skin: string,
 *     userId: string
 *   },
 *   [game: string]: (
 *     number | string | {
 *       [period: string]: StatsResponse
 *       always?: StatsResponse
 *     } | {
 *       username: string,
 *       skin: string,
 *       userId: string
 *     }
 *   )
 * }} AllStatsResponse
 */




/**
 * Get stats for a player, for a game in a specific period
 * @param {string} period 
 * @param {string} game 
 * @param {string} username 
 * @returns {Promise<StatsResponse>}
 */
function stats(period, game, username) {
	return new Promise((resolve, reject) => {
		period = removeAccents(period.trim().toLowerCase());
		game = removeAccents(game.trim().toLowerCase());
		username = removeAccents(username.trim());
		const month = getMonth(period);
		const monthDiff = parseMonth(month);
		if (monthDiff === undefined || monthDiff > 4)
			return reject(errors.stats.incorrectPeriod());
		const numGame = getGame(game);
		if (numGame === undefined)
			return reject(errors.stats.incorrectGame());
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(username), async (err, res, body) => {
			if (err)
				return reject(errors.stats.connectionError());
			try {
				const stats = parseStats(body, res.request.uri.href, { username, monthDiff, numGame, month });
				if (stats.code === 0)
					resolve(stats);
				else
					reject(stats);
			}
			catch (e) {
				reject(errors.stats.connectionError());
			}
		});
	});
}

/**
 * Get all stats of a player
 * @param {string} username 
 * @returns {Promise<AllStatsResponse>}
 */
function allStats(username) {
	return new Promise((resolve, reject) => {
		username = removeAccents(username.trim());
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(username), (err, res, body) => {
			if (err)
				return reject(errors.allStats.connectionError());
			try {
				const stats = parseAllStats(body, res.request.uri.href, { username });
				if (stats.code === 0)
					resolve(stats);
				else
					reject(stats);
			}
			catch (e) {
				return reject(errors.allStats.connectionError());
			}
		});
	});
}

/**
 * Get infos about a player
 * @param {string} username 
 * @returns {Promise<InfosResponse>}
 */
function infos(username, fetchFriends = true) {
	return new Promise((resolve, reject) => {
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(username), (err, res, body) => {
			if (err)
				return reject(errors.infos.connectionError());
			
			try {
				const infos = parseInfos(body, res.request.uri.href, { username });
				if (infos.code !== 0)
					return reject(infos);
				else if (fetchFriends) {
					request('https://www.funcraft.net/fr/joueur/' + encodeURIComponent(infos.userId) + '?sendFriends=1', (fErr, fRes, fBody) => {
						if (fErr)
							return reject(errors.infos.connectionError());
						try {
							const friends = parseFriends(fBody);
							if (friends.code !== 0)
								return reject(friends);
							infos.friends = friends.friends;
							resolve(infos);
						}
						catch (e) {
							return reject(errors.infos.connectionError());
						}
					});
				}
				else
					return resolve(infos);
			}
			catch (e) {
				return reject(errors.infos.connectionError());
			}
		});
	});
}

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
function friends(userId) {
	return new Promise((resolve, reject) => {
		request('https://www.funcraft.net/fr/joueur/' + encodeURIComponent(userId) + '?sendFriends=1', (err, res, body) => {
			if (err)
				return reject(errors.friends.connectionError());
			try {
				const friends = parseFriends(body);
				if (friends.code !== 0)
					return reject(friends);
				resolve(friends);
			}
			catch (e) {
				return reject(errors.friends.connectionError());
			}
		});
	})
}

/**
 * Get head of a player
 * @param {string} username 
 * @returns {Promise<string>}
 */
function head(username) {
	return new Promise((resolve, reject) => {
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(username), (err, res, body) => {
			if (err)
				return reject(errors.head.connectionError());

			try {
				const head = parseHead(body, { username });
				if (head.code === 0)
					resolve(head.head);
				else
					reject(head);
			}
			catch (e) {
				return reject(errors.head.connectionError());
			}
		});
	});
}


/**
 * Get stats table of a game
 * @param {string} period 
 * @param {string} game 
 * @returns {Promise<StatsResponse[]>}
 */
function table(period, game) {
	return new Promise((resolve, reject) => {
		game = removeAccents(game.trim().toLowerCase());
		game = vGetGame(game);
		if (game === undefined)
			return reject(errors.table.incorrectGame());
		const gameUrl = game.replace(/^rush_retro$/, 'rushretro').replace(/^rush_mdt$/, 'rush').replace(/^octogone$/, 'mma');
		request('https://www.funcraft.net/fr/classement/' + encodeURIComponent(gameUrl) + '/' + encodeURIComponent(period) + '?sendData=1&_=' + Date.now(), (err, res, body) => {
			if (err)
				return reject(errors.table.connectionError());

			try {
				const table = parseTable(body, { period, game });
				if (table.code === 0)
					resolve(table.table);
				else
					reject(table);
			}
			catch (e) {
				return reject(errors.table.connectionError());
			}
		});
	});
}


/**
 * Compute some stats properties
 * @param {StatsResponse} stats 
 * @param {boolean} onlyHat 
 * @param {boolean} data 
 * @returns {StatsResponse}
 */
function computeStats(stats, onlyHat = false, data = false) {
	if (data && !onlyHat)
		stats.data.gameTime = (stats.data.gameTime - (stats.data.gameTime % 60)) / 60 + 'h' + ('0'.repeat(2 - (stats.data.gameTime % 60).toString().length) + (stats.data.gameTime % 60)) + 'min';
	else {
		if (stats.game === 'shootcraft' && !onlyHat)
			stats.stats.ragequit += '%';
		else if (!onlyHat)
			stats.stats.timePerGame = ((stats.stats.timePerGame - (stats.stats.timePerGame % 60)) / 60) + ':' + Round(stats.stats.timePerGame % 60, 3);

		const WR = stats.stats.winrate / 100;
		const KD = stats.stats.kd ? stats.stats.kd : stats.data.kills;
		const VH = stats.data.winCount / (stats.data.gameTime / 60);
		const KG = stats.stats.killsPerGame;
		const KM = stats.stats.killsPerMinute;
		const NG = stats.stats.nexusPerGame;
		if (stats.game === 'rush_retro')
			stats.stats.HAT = Round(10 * Math.pow(WR, 3/2)  +  10 / (1 + Math.exp(-2 * Math.log(1/2 * (KD) + 0.000001))), 3);
		else if (stats.game === 'rush_mdt')
			stats.stats.HAT = Round(10 * Math.pow(WR, 2)  +  10 / (1 + Math.exp(-1.5 * ((KD) - 2))), 3);
		else if (stats.game === 'hikabrain')
			stats.stats.HAT = Round((38/3) * Math.pow(WR, 3)  +  (8/3) / (1 + Math.exp(-0.25 * ((VH) - 20))) + (14/3)/(1 + Math.exp(-3 * ((KD) - 1.5))), 3);
		else if (stats.game === 'skywars')
			stats.stats.HAT = Round(13 * Math.pow(WR, 1/2) + 7 / (1 + Math.exp(-2 * Math.log(1/4 * (KD) + 0.000001))), 3);
		else if (stats.game === 'octogone')
			stats.stats.HAT = Round(10 * Math.pow(WR, 1/2)  +  10 / (1 + Math.exp(-4 * ((KG) - 2.2 ))), 3);
		else if (stats.game === 'shootcraft')
			stats.stats.HAT = Round(8 * Math.pow(WR, 2/3)  +  4 / (1 + Math.exp(-2 * ((KD) - 2 )))  +  8 / (1 + Math.exp(-0.5 * ((KM) - 10))), 3);
		else if (stats.game === 'survival')
			stats.stats.HAT = Round(13 * Math.pow(WR, 3/2)  +  7 / (1 + Math.exp(-2 * Math.log(1/10 * (KD) + 0.000001))), 3);
		else if (stats.game === 'blitz')
			stats.stats.HAT = Round(10 * Math.pow(WR, 2)  +  2 / (1 + Math.exp(-5 * ((NG) - 0.75)))  +  8 / (1 + Math.exp(-2 * ((KD) - 1.8))), 3);
		else if (stats.game === 'pvpsmash')
			stats.stats.HAT = Round(10 * Math.pow(WR, 1/3)  +  10 / (1 + Math.exp(-2 * Math.log(1/2 * (KD) + 0.000001))), 3);
		else if (stats.game === 'landrush')
			stats.stats.HAT = Round(10 * Math.pow(WR, 1/3)  +  10 / (1 + Math.exp(-2 * Math.log(1/2 * (KD) + 0.000001))), 3);

		if (!onlyHat)
			stats.stats.winrate += '%';
	}
	return stats;
}


module.exports = {
	stats,
	allStats,
	infos,
	friends,
	head,
	table,
	computeStats,
	parsers,
	errors,
	utils,
	data
};