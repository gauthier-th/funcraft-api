const HTMLParser = require("node-html-parser");
const errors = require('./errors');
const {
	data: { games, months, gameAliases, monthAliases },
	Round,
	parseFCInt,
	parseFCDate,
	getGame,
	getMonth
} = require('./utils');

/**
 * Get stats from html body
 * @param {string} body 
 * @param {string} href 
 * @param {object} data 
 * @returns {StatsResponse}
 */
 function stats(body, href, { username, monthDiff, numGame, month }) {
	const dom = HTMLParser.parse(body);

	const usernameChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
	if (!usernameChildren)
		return errors.stats.unknownPlayer(username);

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
		return errors.stats.noStatistics();

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
function allStats(body, href, { username }) {
	const dom = HTMLParser.parse(body);

	const usernameChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
	if (!usernameChildren)
		return errors.allStats.unknownPlayer(username);
		
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
 *   lastConnection: string,
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
function infos(body, href, { username }) {
	const dom = HTMLParser.parse(body);

	const infos = {};
	infos.code = 0;
	infos.error = null;

	const usernameChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
	if (!usernameChildren)
		return errors.infos.unknownPlayer(username);
	infos.grade = usernameChildren.childNodes[1].text.trim().split(/\s+/gi)[0];

	let playerUsername = usernameChildren.childNodes[1].childNodes[usernameChildren.childNodes[1].childNodes.length - 2].text.trim();
	while (playerUsername.includes(' ')) {
		playerUsername = playerUsername.split(' ')[1];
	}
	infos.username = playerUsername;

	infos.userId = href.match(/^https?:\/\/(www\.)?funcraft\.\w{1,3}(\/\w+){2}\/(\d+)\/\w+$/i)[3];
	infos.skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].rawAttrs.match(/^src="(.*)"$/)[1];

	infos.inscription = parseFCDate(dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[3].childNodes[1].childNodes[3].rawAttrs.match(/(^title=|\stitle=)"([^"]*)"/)[2]);
	infos.lastConnection = parseFCDate(dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[3].childNodes[3].childNodes[3].rawAttrs.match(/(^title=|\stitle=)"([^"]*)"/)[2]);
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
function friends(body) {
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
 * Get stats table from html body
 * @param {string} body 
 * @param {object} data 
 * @returns {{
 *   code: number,
 *   error: string,
 *   table: StatsResponse[]
 * }}
 */
function table(body, { period, game }) {
	const dom = HTMLParser.parse(body);
	if (!dom.querySelector('.leaderboard-table'))
		return errors.table.noStatistics();
	const usernameChildren = dom.querySelector('.leaderboard-table').childNodes[3];
	const result = [];
	for (let raw of usernameChildren.childNodes) {
		if (raw.rawTagName !== 'tr')
			continue;

		const stats = {};
		stats.code = 0;
		stats.error = null;

		stats.userId = raw.childNodes[period === 'always' ? 3 : 5].childNodes[1].rawAttrs.match(/^href="https?:\/\/(www\.)?funcraft\.\w{1,3}(\/\w+){2}\/(\d+)\/\w+"$/i)[3];

		const username = raw.childNodes[period === 'always' ? 3 : 5].childNodes[1].childNodes[0].rawText.trim();
		stats.username = username;

		const datas = [];
		for (let cell of raw.childNodes) {
			if (cell.rawTagName !== 'td')
				continue;

			const contentRow = cell.childNodes[0] ? cell.childNodes[0].rawText : '0';
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

		statsFromData(stats, datas, getMonth(period), getGame(game));

		if (stats.rank === 1 || stats.rank === 2 || stats.rank === 3)
			stats.skin = dom.querySelector('.podium-' + stats.rank).childNodes[1].childNodes[stats.rank === 1 ? 3 : 1].childNodes[1].childNodes[3].rawAttrs.match(/^src="(.*)"$/)[1];

		result.push(stats);
	}

	return {
		code: 0,
		error: null,
		table: result
	};
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
function head(body, { username }) {
	const dom = HTMLParser.parse(body);
	
	if (!dom.querySelector('#main-layout'))
		return errors.head.unknownPlayer(username);
	const usernameChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
	if (!usernameChildren)
		return errors.head.unknownPlayer(username);

	return {
		code: 0,
		error: null,
		head: dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].attributes.src
	};
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
	if (games[numGame] === 'survival' || games[numGame] === 'skywars' || games[numGame] === 'pvpsmash' || games[numGame] === 'octogone' || games[numGame] === 'shootcraft' || games[numGame] === 'infecte')
		stats.data.defeatCount = stats.data.gameCount - stats.data.winCount;
	else
		stats.data.defeatCount = datas[valColumn++];
	stats.data.gameTime = datas[valColumn++];
	stats.data.kills = datas[valColumn++];
	stats.data.deathCount = datas[valColumn++];
	if (games[numGame] === 'rush_mdt' || games[numGame] === 'rush_retro' || games[numGame] === 'landrush')
		stats.data.lits_detruits = datas[valColumn++];
	if (games[numGame] === 'blitz')
		stats.data.degats_nexus = datas[valColumn++];
	if (games[numGame] === 'pvpsmash' || games[numGame] === 'octogone')
		stats.data.degats = datas[valColumn++];

	stats.stats = {};
	if (stats.data.gameCount === 0)
		stats.stats.winrate = 0;
	else if (stats.data.winCount === 0 && stats.data.defeatCount === 0)
		stats.stats.winrate = Round((stats.data.winCount / stats.data.gameCount) * 100, 3);
	else
		stats.stats.winrate = Round((stats.data.winCount / (stats.data.winCount + stats.data.defeatCount)) * 100, 3);
	if (stats.data.deathCount === 0)
		stats.stats.kd = stats.data.kills;
	else
		stats.stats.kd = Round(stats.data.kills / stats.data.deathCount, 3);
	if (games[numGame] === 'shootcraft') {
		if (stats.data.gameCount === 0)
			stats.stats.ragequit = 0;
		else
			stats.stats.ragequit = Round((((stats.data.gameTime / stats.data.gameCount) / 5) - 1) * (-100), 3);
	}
	if (stats.data.gameCount === 0)
		stats.stats.killsPerGame = 0;
	else
		stats.stats.killsPerGame = Round(stats.data.kills / stats.data.gameCount, 3);
	if (stats.data.gameCount === 0)
		stats.stats.deathsPerGame = 0;
	else
		stats.stats.deathsPerGame = Round(stats.data.deathCount / stats.data.gameCount, 3);
	if (stats.data.gameCount === 0)
		stats.stats.pointsPerGame = 0;
	else
		stats.stats.pointsPerGame = Round(stats.data.points / stats.data.gameCount, 3);
	if (games[numGame] != 'shootcraft') {
		if (stats.data.gameCount === 0)
			stats.stats.timePerGame = 0;
		else
			stats.stats.timePerGame = Round(stats.data.gameTime * 60 / stats.data.gameCount, 3);
	}
	if (stats.data.gameCount === 0)
		stats.stats.killsPerMinute = 0;
	else {
		if (games[numGame] === 'shootcraft')
			stats.stats.killsPerMinute = Round(stats.data.kills / stats.data.gameTime, 3);
		else
			stats.stats.killsPerMinute = Round(stats.stats.killsPerGame / (stats.stats.timePerGame / 60), 3);
	}
	if (games[numGame] === 'shootcraft') {
		if (stats.data.kills === 0)
			stats.stats.secondsPerKill = 0;
		else
			stats.stats.secondsPerKill = Round((stats.data.gameTime * 60) / stats.data.kills, 3);
	}
	if (games[numGame] === 'rush_mdt' || games[numGame] === 'rush_retro' || games[numGame] === 'landrush') {
		if (stats.data.gameCount === 0)
			stats.stats.bedsPerGame = 0;
		else
			stats.stats.bedsPerGame = Round(stats.data.lits_detruits / stats.data.gameCount, 3);
	}
	if (games[numGame] === 'blitz') {
		if (stats.data.gameCount === 0)
			stats.stats.nexusPerGame = 0;
		else
			stats.stats.nexusPerGame = Round(stats.data.degats_nexus / stats.data.gameCount, 3);
	}
	if (games[numGame] === 'pvpsmash' || games[numGame] === 'octogone') {
		if (stats.data.gameCount === 0)
			stats.stats.damagePerGame = 0;
		else
			stats.stats.damagePerGame = Round(stats.data.degats / stats.data.gameCount, 3);
	}

	return stats;
}


module.exports = {
	stats,
	allStats,
	infos,
	friends,
	table,
	head,
	statsFromData
};