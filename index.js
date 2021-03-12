const request = require('request');
const HTMLParser = require("node-html-parser");


/**
 * @typedef {{
 *   code: number,
 *   error: string,
 *   userId: string,
 *   username: string,
 *   month?: number,
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


const games = ['rush_retro', 'rush_mdt', 'hikabrain', 'skywars', 'octogone', 'shootcraft', 'infected', 'survival', 'blitz', 'pvpsmash', 'landrush'];
const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const gameAliases = {
	"infecte": "infected",
	"shoot": "shootcraft",
	"land": "landrush",
	"mma": "octogone",
	"pvp": "pvpsmash",
	"hika": "hikabrain",
	"sky": "skywars",
	"rush": "rush_mdt"
};
const monthAliases = {
	'janvier': 'january',
	'fevrier': 'february',
	'mars': 'march',
	'avril': 'april',
	'mai': 'may',
	'juin': 'june',
	'juillet': 'july',
	'aout': 'august',
	'septembre': 'september',
	'octobre': 'october',
	'novembre': 'november',
	'decembre': 'december'
};

/**
 * Get stats for a player, for a game in a specific period
 * @param {string} period 
 * @param {string} game 
 * @param {string} username 
 * @returns {Promise.<StatsResponse>}
 */
function stats(period, game, username) {
	return new Promise((resolve, reject) => {
		period = period.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		game = game.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		username = username.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		const month = getMonth(period);
		const monthDiff = parseMonth(month);
		if (monthDiff === undefined || monthDiff > 4)
			return reject({ error: "Specified period is incorrect.", code: 2 });
		const numGame = getGame(game);
		if (numGame === undefined)
			return reject({ error: "Specified game is incorrect.", code: 3 });
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(username), async (err, res, body) => {
			if (err)
				return reject({ error: "Unable to connect to funcraft.net.", code: 9 });
			try {
				const stats = parseStats(body, res.request.uri.href, { username, monthDiff, numGame, month });
				if (stats.code === 0)
					resolve(stats);
				else
					reject(stats);
			}
			catch (e) {
				reject({ error: "Unable to connect to funcraft.net.", code: 9 });
			}
		});
	});
}
/**
 * Get stats from html body
 * @param {string} body 
 * @param {string} href 
 * @param {object} data 
 * @returns {StatsResponse}
 */
function parseStats(body, href, { username, monthDiff, numGame, month }) {
	const dom = HTMLParser.parse(body);

	const usernameChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
	if (!usernameChildren)
		return { error: 'Player "' + username + '" doesn\'t exists.', code: 4 };

	const rows = dom.querySelector('#player-stats').childNodes[5].childNodes[numGame * 2 + 1].childNodes[1].childNodes[3].childNodes;
	const datas = [];
	for (let i = 3; i < rows.length; i++) {
		const row = rows[i];
		if (row.childNodes.length > 0) {
			let contentRow;
			if (monthDiff !== 0)
				contentRow = row.childNodes[5].childNodes[monthDiff * 2 - 1].text;
			else
				contentRow = row.childNodes[3].text
			if (contentRow.trim().replace("-", "") == '')
				datas.push(0);
			else if (contentRow.trim().match(/\d+[a-z]\s+\d+[a-z]/mi)) {
				const elems = contentRow.trim().match(/(\d+)[a-z]\s+(\d+)[a-z]/mi);
				datas.push(parseInt(elems[1], 10) * 60 + parseInt(elems[2], 10));
			}
			else
				datas.push(parseInt(contentRow.trim().replace(/\s+/gi, ""), 10));
		}
	}
	if (datas[2] === 0)
		return { error: "Non-existent statistics for this period.", code: 1 };

	const stats = {};
	stats.code = 0;
	stats.error = null;

	let playerUsername = usernameChildren.childNodes[1].childNodes[usernameChildren.childNodes[1].childNodes.length - 2].text.trim();
	while (playerUsername.includes(' ')) {
		playerUsername = playerUsername.split(' ')[1];
	}
	stats.username = playerUsername;

	statsFromData(stats, datas, month, numGame);

	// stats.skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].attributes.src;
	stats.skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].rawAttrs.match(/^src="(.*)"$/)[1];
	stats.userId = href.match(/^https?:\/\/(www\.)?funcraft\.\w{1,3}(\/\w+){2}\/(\d+)\/\w+$/i)[3];

	return stats;
}
function getMonth(period) {
	if (period.match(/^\d+$/) && parseInt(period) <= 12 && parseInt(period) >= 0)
		return parseInt(period);
	if (months.includes(period))
		return months.indexOf(period) + 1;
	if (Object.keys(monthAliases).includes(period))
		return months.indexOf(monthAliases[period]) + 1;
	if (period === "month" || period === "mois")
		return (new Date()).getMonth() + 1;
	if (period === "always" || period === "toujours")
		return 0;
}
function parseMonth(month) {
	if (month === undefined)
		return;
	else if (month === 0)
		return 0;
	let numMonth = (new Date()).getMonth() + 1 - month;
	if (numMonth < 0)
		numMonth = 12 + numMonth;
	return numMonth + 1;
}
function getGame(game) {
	game = game.replace(/[\s-]+/g, '_');
	if (Object.keys(gameAliases).includes(game))
		game = gameAliases[game];
	if (games.includes(game))
		return games.indexOf(game);
}

function statsFromData(stats, datas, month, numGame) {
	if (month !== null && month !== undefined) {
		stats.month = month;
		stats.monthName = month === 0 ? 'always' : months[month - 1];
	}
	stats.game = games[numGame];
	stats.rank = datas[0];
	stats.data = {};

	let valColumn = 1;
	stats.data.points = datas[valColumn++];
	stats.data.gameCount = datas[valColumn++];
	stats.data.winCount = datas[valColumn++];
	if (games[numGame] == 'survival' || games[numGame] == 'skywars' || games[numGame] == 'pvpsmash' || games[numGame] == 'octogone' || games[numGame] == 'shootcraft' || games[numGame] == 'infecte')
		stats.data.defeatCount = stats.data.gameCount - stats.data.winCount;
	else
		stats.data.defeatCount = datas[valColumn++];
	stats.data.gameTime = datas[valColumn++];
	stats.data.kills = datas[valColumn++];
	stats.data.deathCount = datas[valColumn++];
	if (games[numGame] == 'rush_mdt' || games[numGame] == 'rush_retro' || games[numGame] == 'landrush')
		stats.data.lits_detruits = datas[valColumn++];
	if (games[numGame] == 'blitz')
		stats.data.degats_nexus = datas[valColumn++];
	if (games[numGame] == 'pvpsmash' || games[numGame] == 'octogone')
		stats.data.degats = datas[valColumn++];

	stats.stats = {};
	if (stats.data.gameCount == 0)
		stats.stats.winrate = 0;
	else if (stats.data.winCount == 0 && stats.data.defeatCount == 0)
		stats.stats.winrate = Round((stats.data.winCount / stats.data.gameCount) * 100, 3);
	else
		stats.stats.winrate = Round((stats.data.winCount / (stats.data.winCount + stats.data.defeatCount)) * 100, 3);
	if (stats.data.deathCount == 0)
		stats.stats.kd = stats.data.kills;
	else
		stats.stats.kd = Round(stats.data.kills / stats.data.deathCount, 3);
	if (games[numGame] == 'shootcraft') {
		if (stats.data.gameCount == 0)
			stats.stats.ragequit = 0;
		else
			stats.stats.ragequit = Round((((stats.data.gameTime / stats.data.gameCount) / 5) - 1) * (-100), 3);
	}
	if (stats.data.gameCount == 0)
		stats.stats.killsPerGame = 0;
	else
		stats.stats.killsPerGame = Round(stats.data.kills / stats.data.gameCount, 3);
	if (stats.data.gameCount == 0)
		stats.stats.deathsPerGame = 0;
	else
		stats.stats.deathsPerGame = Round(stats.data.deathCount / stats.data.gameCount, 3);
	if (stats.data.gameCount == 0)
		stats.stats.pointsPerGame = 0;
	else
		stats.stats.pointsPerGame = Round(stats.data.points / stats.data.gameCount, 3);
	if (games[numGame] != 'shootcraft') {
		if (stats.data.gameCount == 0)
			stats.stats.timePerGame = 0;
		else
			stats.stats.timePerGame = Round(stats.data.gameTime * 60 / stats.data.gameCount, 3);
	}
	if (stats.data.gameCount == 0)
		stats.stats.killsPerMinute = 0;
	else {
		if (games[numGame] == 'shootcraft')
			stats.stats.killsPerMinute = Round(stats.data.kills / (stats.data.gameCount * 5), 3);
		else
			stats.stats.killsPerMinute = Round(stats.stats.killsPerGame / (stats.stats.timePerGame / 60), 3);
	}
	if (games[numGame] == 'shootcraft') {
		if (stats.data.kills == 0)
			stats.stats.secondsPerKill = 0;
		else
			stats.stats.secondsPerKill = Round((stats.data.gameTime * 60) / stats.data.kills, 3);
	}
	if (games[numGame] == 'rush_mdt' || games[numGame] == 'rush_retro' || games[numGame] == 'landrush') {
		if (stats.data.gameCount == 0)
			stats.stats.bedsPerGame = 0;
		else
			stats.stats.bedsPerGame = Round(stats.data.lits_detruits / stats.data.gameCount, 3);
	}
	if (games[numGame] == 'blitz') {
		if (stats.data.gameCount == 0)
			stats.stats.nexusPerGame = 0;
		else
			stats.stats.nexusPerGame = Round(stats.data.degats_nexus / stats.data.gameCount, 3);
	}
	if (games[numGame] == 'pvpsmash' || games[numGame] == 'octogone') {
		if (stats.data.gameCount == 0)
			stats.stats.damagePerGame = 0;
		else
			stats.stats.damagePerGame = Round(stats.data.degats / stats.data.gameCount, 3);
	}

	return stats;
}

/**
 * Get all stats of a player
 * @param {string} username 
 * @returns {Promise.<{
 *   [game: string]: {
 *     [period: string]: StatsResponse
 *     always?: StatsResponse
 *   },
 *   infos: {
 *     username: string,
 *     skin: string,
 *     userId: string
 *   }
 * }>}
 */
function allStats(username) {
	return new Promise((resolve, reject) => {
		username = username.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(username), (err, res, body) => {
			if (err)
				return reject({ error: "Unable to connect to funcraft.net.", code: 9 });
			try {
				const stats = parseAllStats(body, res.request.uri.href, { username });
				if (stats.code === 0)
					resolve(stats);
				else
					reject(stats);
			}
			catch (e) {
				return reject({ error: "Unable to connect to funcraft.net.", code: 9 });
			}
		});
	});
}
/**
 * Get all stats from html body
 * @param {string} body 
 * @param {string} href 
 * @param {object} data 
 * @returns {{
 *   [game: string]: {
 *     [period: string]: StatsResponse
 *     always?: StatsResponse
 *   },
 *   infos: {
 *     username: string,
 *     skin: string,
 *     userId: string
 *   }
 * }}
 */
function parseAllStats(body, href, { username }) {
	const dom = HTMLParser.parse(body);

	const usernameChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
	if (!usernameChildren)
		return { error: 'Player "' + username + '" doesn\'t exists.', code: 4 };
		
	let playerUsername = usernameChildren.childNodes[1].childNodes[usernameChildren.childNodes[1].childNodes.length - 2].text.trim();
	while (playerUsername.includes(' ')) {
		playerUsername = playerUsername.split(' ')[1];
	}

	// const skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].attributes.src;
	const skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].rawAttrs.match(/^src="(.*)"$/)[1];
	const playerId = href.match(/^https?:\/\/(www\.)?funcraft\.\w{1,3}(\/\w+){2}\/(\d+)\/\w+$/i)[3];


	const allStats = {};
	allStats.infos = {};
	allStats.infos.username = playerUsername;
	allStats.infos.skin = skin;
	allStats.infos.userId = playerId;

	for (let numGame = 0; numGame < 10; numGame++) {
		const gameName = games[numGame];
		const rows = dom.querySelector('#player-stats').childNodes[5].childNodes[numGame * 2 + 1].childNodes[1].childNodes[3].childNodes;
		allStats[gameName] = {};
		for (let monthDiff = 0; monthDiff < 5; monthDiff++) {
			const month = monthDiff === 0 ? 0 : (((new Date()).getMonth() - monthDiff + 1) < 0 ? 12 + ((new Date()).getMonth() - monthDiff + 1) : ((new Date()).getMonth() - monthDiff + 1)) % 12 + 1;
			const monthName = month === 0 ? 'always' : months[month - 1];
			const datas = [];
			for (let i = 3; i < rows.length; i++) {
				const row = rows[i];
				if (row.childNodes.length > 0) {
					let contentRow;
					if (monthDiff !== 0)
						contentRow = row.childNodes[5].childNodes[monthDiff * 2 - 1].text;
					else
						contentRow = row.childNodes[3].text
					if (contentRow.trim().replace("-", "") == '')
						datas.push(0);
					else if (contentRow.trim().match(/\d+[a-z]\s+\d+[a-z]/mi)) {
						const elems = contentRow.trim().match(/(\d+)[a-z]\s+(\d+)[a-z]/mi);
						datas.push(parseInt(elems[1], 10) * 60 + parseInt(elems[2], 10));
					}
					else
						datas.push(parseInt(contentRow.trim().replace(/\s+/gi, ""), 10));
				}
			}
			
			if (datas[2] === 0)
				allStats[gameName][monthName] = null;
			else {
				const stats = {};
				stats.code = 0;
				stats.error = null;

				stats.username = playerUsername;

				statsFromData(stats, datas, month, numGame);
				
				stats.skin = skin;
				stats.userId = playerId;

				allStats[gameName][monthName] = stats;
			}
		}
	}

	return allStats;
}

/**
 * Get infos about a player
 * @param {string} username 
 * @returns {Promise.<{
 *   code: number,
 *   error: string,
 *   grade: string,
 *   username: string,
 *   userId: string,
 *   skin: string,
 *   inscription: string,
 *   'last-connection': string,
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
 * }>}
 */
function infos(username) {
	return new Promise((resolve, reject) => {
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(username), (err, res, body) => {
			if (err)
				return reject({ error: "Unable to connect to funcraft.net.", code: 6 });
			
			try {
				const infos = parseInfos(body, res.request.uri.href, { username });
				if (infos.code !== 0)
					reject(infos);
				request('https://www.funcraft.net/fr/joueur/' + encodeURIComponent(infos.userId) + '?sendFriends=1', (fErr, fRes, fBody) => {
					if (fErr)
						return { error: "Unable to connect to funcraft.net.", code: 6 };
					try {
						const friends = parseFriends(fBody);
						infos.amis = friends;
						resolve(infos);
					}
					catch (e) {
						return reject({ error: "Unable to connect to funcraft.net.", code: 6 });
					}
				});
			}
			catch (e) {
				return reject({ error: "Unable to connect to funcraft.net.", code: 6 });
			}
		});
	});
}
/**
 * Get infos from html body
 * @param {string} username 
 * @param {string} href 
 * @param {object} data 
 * @returns {{
 *   code: number,
 *   error: string,
 *   grade: string,
 *   username: string,
 *   userId: string,
 *   skin: string,
 *   inscription: string,
 *   'last-connection': string,
 *   gloires: number,
 *   gameCount: number,
 *   points: number,
 *   winCount: number,
 *   defeatCount: number,
 *   gameTime: number,
 *   kills: number,
 *   deathCount: number,
 *   ban: ("TEMP"|"DEF"|"NONE")
 * }}
 */
function parseInfos(body, href, { username }) {
	const dom = HTMLParser.parse(body);

	const infos = {};
	infos.code = 0;
	infos.error = null;

	const usernameChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
	if (!usernameChildren)
		return { error: 'Player "' + username + '" doesn\'t exists.', code: 1 };
	infos.grade = usernameChildren.childNodes[1].text.trim().split(/\s+/gi)[0];

	let playerUsername = usernameChildren.childNodes[1].childNodes[usernameChildren.childNodes[1].childNodes.length - 2].text.trim();
	while (playerUsername.includes(' ')) {
		playerUsername = playerUsername.split(' ')[1];
	}
	infos.username = playerUsername;
	
	infos.userId = href.match(/^https?:\/\/(www\.)?funcraft\.\w{1,3}(\/\w+){2}\/(\d+)\/\w+$/i)[3];
	// infos.skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].attributes.src;
	infos.skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].rawAttrs.match(/^src="(.*)"$/)[1];
	
	// infos.inscription = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[3].childNodes[1].childNodes[3].attributes.title;
	infos.inscription = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[3].childNodes[1].childNodes[3].rawAttrs.match(/(^title=|\stitle=)"([^"]*)"/)[2];
	// infos['last-connection'] = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[3].childNodes[3].childNodes[3].attributes.title;
	infos['last-connection'] = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[3].childNodes[3].childNodes[3].rawAttrs.match(/(^title=|\stitle=)"([^"]*)"/)[2];
	infos.gloires = parseFCInt(dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[5].childNodes[1].text.trim().replace(/\s+/gi, ""));
	infos.gameCount = parseFCInt(dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[5].childNodes[3].text.trim().replace(/\s+/gi, ""));

	let points = 0;
	let winCount = 0;
	let defeatCount = 0;
	let tempsJeu = 0;
	let kills = 0;
	let deathCount = 0;
	let rows = dom.querySelector('#player-stats').childNodes[5].childNodes;
	let numrow = 0;
	for (let row of rows) {
		if (row.text.trim() !== "") {
			let numcol = 1;
			points += parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
			const partie = parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
			const victoire = parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
			if (!Number.isNaN(victoire))
				winCount += victoire;
			if (numrow == 3 || numrow == 4 || numrow == 5 || numrow == 6 || numrow == 7 || numrow == 9)
				defeatCount += (partie - victoire);
			else
				defeatCount += parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
			const temps = row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, "");
			if (temps !== "-")
				tempsJeu += parseInt(temps.split("h")[0], 10) * 60 + parseInt(temps.split("h")[1].replace(/m$/g, ""), 10);
			kills += parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
			deathCount += parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
			numrow++;
		}
	}

	infos.points = points;
	infos.winCount = winCount;
	infos.defeatCount = defeatCount;
	infos.gameTime = tempsJeu;
	infos.kills = kills;
	infos.deathCount = deathCount;

	const ban = dom.querySelector("div.player-alert");
	if (ban) {
		if (ban.text.trim().match(/temporairement/mi))
			infos.ban = "TEMP";
		else
			infos.ban = "DEF";
	}
	else
		infos.ban = "NONE";

	return infos;
}
/**
 * Get friends from html body
 * @param {string} body 
 * @returns {{
 *   nom: string,
 *   skin: string
 * }[]}
 */
function parseFriends(body) {
	const fDom = HTMLParser.parse(body);
	const heads = fDom.querySelector("div.players-heads");
	const fRows = heads ? heads.childNodes : [];
	const friends = [];
	for (let row of fRows) {
		if (row.tagName && row.childNodes[1] && row.childNodes[1].childNodes[1]) {
			friends.push({
				nom: row.rawAttrs.match(/(^title=|\stitle=)"([^"]*)"/)[2],
				skin: row.childNodes[1].childNodes[1].rawAttrs.match(/(^src=|\ssrc=)"([^"]*)"/)[2]
			});
		}
	}

	return friends;
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
				return reject({ error: "Unable to connect to funcraft.net.", code: 2 });

			try {
				const head = parseHead(body, { username });
				if (head.code === 0)
					resolve(head.head);
				else
					reject(head);
			}
			catch (e) {
				return reject({ error: "Unable to connect to funcraft.net.", code: 2 });
			}
		});
	});
}
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
function parseHead(body, { username }) {
	const dom = HTMLParser.parse(body);
	
	if (!dom.querySelector('#main-layout'))
		return { error: 'Player "' + username + '" doesn\'t exists.', code: 1 };
	const usernameChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
	if (!usernameChildren)
		return { error: 'Player "' + username + '" doesn\'t exists.', code: 1 };

	return {
		code: 0,
		error: null,
		head: dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].attributes.src
	};
}


/**
 * Get stats table of a game
 * @param {string} period 
 * @param {string} game 
 * @returns {Promise<StatsResponse[]>}
 */
function table(period, game) {
	return new Promise((resolve, reject) => {
		game = game.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		game = vGetGame(game);
		if (game === undefined)
			return reject({ error: "Specified game is incorrect.", code: 1 });
		game = game.replace(/^rush_retro$/, 'rushretro').replace(/^rush_mdt$/, 'rush');
		request('https://www.funcraft.net/fr/classement/' + encodeURIComponent(game) + '/' + encodeURIComponent(period) + '?sendData=1&_=' + Date.now(), (err, res, body) => {
			if (err)
				return reject({ error: "Unable to connect to funcraft.net.", code: 2 });

			try {
				const table = parseTable(body, { period, game });
				if (table.code === 0)
					resolve(table.table);
				else
					reject(table);
			}
			catch (e) {
				console.log(e);
				return reject({ error: "Unable to connect to funcraft.net.", code: 2 });
			}
		});
	});
}
/**
 * Get stats table from html body
 * @param {string} body 
 * @param {object} data 
 * @returns {{
 *   code: number,
 *   error: string,
 *   table: StatsResponse[]
 * }}
 */
function parseTable(body, { period, game }) {
	const dom = HTMLParser.parse(body);
	const usernameChildren = dom.querySelector('.leaderboard-table').childNodes[3];
	const result = [];
	for (let raw of usernameChildren.childNodes) {
		if (raw.rawTagName !== 'tr')
			continue;

		const stats = {};
		stats.code = 0;
		stats.error = null;

		const username = raw.childNodes[3].childNodes[1].childNodes[0].rawText.trim();
		stats.username = username;

		stats.monthName = period;

		const datas = [];
		for (let cell of raw.childNodes) {
			if (cell.rawTagName !== 'td')
				continue;

			const contentRow = cell.childNodes[0].rawText;
			if (contentRow.trim() === '')
				continue;
			else if (contentRow.trim().replace("-", "") == '')
				datas.push(0);
			else if (contentRow.trim().match(/\d+[a-z]\s+\d+[a-z]/mi)) {
				const elems = contentRow.trim().match(/(\d+)[a-z]\s+(\d+)[a-z]/mi);
				datas.push(parseInt(elems[1], 10) * 60 + parseInt(elems[2], 10));
			}
			else
				datas.push(parseInt(contentRow.trim().replace(/\s+/gi, ""), 10));
		}

		statsFromData(stats, datas, null, getGame(game));

		if (stats.rank === 1 || stats.rank === 2 || stats.rank === 3)
			stats.skin = dom.querySelector('.podium-' + stats.rank).childNodes[1].childNodes[stats.rank === 1 ? 3 : 1].childNodes[1].childNodes[3].rawAttrs.match(/^src="(.*)"$/)[1];

		stats.userId = raw.childNodes[3].childNodes[1].rawAttrs.match(/^href="https?:\/\/(www\.)?funcraft\.\w{1,3}(\/\w+){2}\/(\d+)\/\w+"$/i)[3];
		result.push(stats);
	}

	return result;
}


/**
 * Compute some stats properties
 * @param {object} stats 
 * @param {boolean} data 
 */
function computeStats(stats, data = false) {
	if (data) {
		stats['data']['gameTime'] = (stats['data']['gameTime'] - (stats['data']['gameTime'] % 60)) / 60 + 'h' + stats['data']['gameTime'] % 60 + 'min';
		resolve(formatStats(stats));
	}
	else {
		if (stats['game'] == 'shootcraft') {
			stats['stats']['ragequit'] += '%';
			stats['stats']['HAT'] = Round(Math.sqrt(Math.pow(stats['stats']['winrate']/100+1, 2.5)*(stats['stats']['killsPerMinute'] / 5)*((stats['stats']['killsPerMinute'] * 5)/(stats['stats']['deathsPerGame'] * 5) + 2))*60, 3);
		}
		else
			stats['stats']['timePerGame'] = ((stats['stats']['timePerGame'] - (stats['stats']['timePerGame'] % 60)) / 60) + ':' + Round(stats['stats']['timePerGame'] % 60, 3);

		if (stats['game'] == 'rush_mdt' || stats['game'] == 'rush_retro')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['data']['gameCount']/stats['data']['gameTime']*60 + stats['stats']['winrate']/100*38 + Math.sqrt(stats['stats']['kd']*300)) * 100, 3);
		else if (stats['game'] == 'hikabrain')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['stats']['winrate']/100*25 + stats['data']['gameCount']/stats['data']['gameTime']*60 + stats['stats']['kd'] * 8) * 100, 3);
		else if (stats['game'] == 'skywars')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['stats']['winrate']/100*45 + Math.sqrt(stats['stats']['kd']*25)) * 100, 3);
		else if (stats['game'] == 'survival')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['stats']['winrate']/100*30 + Math.sqrt(stats['stats']['kd'] * 8)) * 100, 3);
		else if (stats['game'] == 'pvpsmash')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['stats']['winrate']/100*20 + Math.sqrt(stats['stats']['kd'] * 8)) * 100, 3);
		else if (stats['game'] == 'blitz')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['stats']['winrate']/100*10 + 2*stats['stats']['nexusPerGame'] + Math.sqrt(stats['stats']['kd'] * 30)) * 100, 3);
		
		stats['stats']['winrate'] += '%';

		resolve(formatStats(stats));
	}
}



/**
 * Determine wether a string is a valid period
 * @param {string} period 
 * @returns {string}
 */
function vGetPeriod(period, strict = false) {
	let p;
	if (strict)
		p = parseMonth(getMonth(period.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
	else
		p = getMonth(period.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
	if (p !== undefined) {
		if (p === 0)
			p = "always";
		else
			p = months[p - 1];
	}
	return p;
}
/**
 * Determine wether a string is a valid game
 * @param {string} game 
 * @returns {string}
 */
function vGetGame(game) {
	let m = getGame(game.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
	if (m !== undefined)
		m = games[m];
	return m;
}




function Round(nbr, nbrDecimal) {
	nbrDecimal = (typeof nbrDecimal === 'undefined') ? 0 : nbrDecimal;
	return Math.round(nbr * Math.pow(10, nbrDecimal)) / Math.pow(10, nbrDecimal);
}
function parseFCInt(value) {
	if (value.trim().replace(/\s+/ig, "") === "" || Number.isNaN(parseInt(value, 10)))
		return 0;
	else
		return parseInt(value, 10);
}


module.exports = {
	allStats,
	stats,
	infos,
	head,
	table,
	computeStats,
	statsFromData,
	parsers: {
		allStats: parseAllStats,
		stats: parseStats,
		infos: parseInfos,
		head: parseHead,
		table: parseTable
	},
	validators: {
		getPeriod: vGetPeriod,
		getGame: vGetGame
	},
	data: {
		games,
		months,
		gameAliases,
		monthAliases
	}
};