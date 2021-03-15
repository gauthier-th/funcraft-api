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
	vGetPeriod,
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
 *   amis:  {
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
 * @returns {Promise.<StatsResponse>}
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
 * @returns {Promise.<{
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
 * @returns {Promise.<InfosResponse>}
 */
function infos(username) {
	return new Promise((resolve, reject) => {
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(username), (err, res, body) => {
			if (err)
				return reject(errors.infos.connectionError());
			
			try {
				const infos = parseInfos(body, res.request.uri.href, { username });
				if (infos.code !== 0)
					return reject(infos);
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
 * @returns {Promise.<string>}
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
		const gameUrl = game.replace(/^rush_retro$/, 'rushretro').replace(/^rush_mdt$/, 'rush');
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
 * @param {object} stats 
 * @param {boolean} data 
 */
function computeStats(stats, data = false) {
	if (data)
		stats.data.gameTime = (stats.data.gameTime - (stats.data.gameTime % 60)) / 60 + 'h' + stats.data.gameTime % 60 + 'min';
	else {
		if (stats.game === 'shootcraft') {
			stats.stats.ragequit += '%';
			stats.stats.HAT = Round(Math.sqrt(Math.pow(stats.stats.winrate/100+1, 2.5)*(stats.stats.killsPerMinute / 5)*((stats.stats.killsPerMinute * 5)/(stats.stats.deathsPerGame * 5) + 2))*60, 3);
		}
		else
			stats.stats.timePerGame = ((stats.stats.timePerGame - (stats.stats.timePerGame % 60)) / 60) + ':' + Round(stats.stats.timePerGame % 60, 3);

		if (stats.game === 'rush_mdt' || stats.game === 'rush_retro')
			stats.stats.HAT = Round(Math.sqrt(stats.data.gameCount/stats.data.gameTime*60 + stats.stats.winrate/100*38 + Math.sqrt(stats.stats.kd*300)) * 100, 3);
		else if (stats.game === 'hikabrain')
			stats.stats.HAT = Round(Math.sqrt(stats.stats.winrate/100*25 + stats.data.gameCount/stats.data.gameTime*60 + stats.stats.kd * 8) * 100, 3);
		else if (stats.game === 'skywars')
			stats.stats.HAT = Round(Math.sqrt(stats.stats.winrate/100*45 + Math.sqrt(stats.stats.kd*25)) * 100, 3);
		else if (stats.game === 'survival')
			stats.stats.HAT = Round(Math.sqrt(stats.stats.winrate/100*30 + Math.sqrt(stats.stats.kd * 8)) * 100, 3);
		else if (stats.game === 'pvpsmash')
			stats.stats.HAT = Round(Math.sqrt(stats.stats.winrate/100*20 + Math.sqrt(stats.stats.kd * 8)) * 100, 3);
		else if (stats.game === 'blitz')
			stats.stats.HAT = Round(Math.sqrt(stats.stats.winrate/100*10 + 2*stats.stats.nexusPerGame + Math.sqrt(stats.stats.kd * 30)) * 100, 3);

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