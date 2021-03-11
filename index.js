const request = require('request');
const HTMLParser = require("node-html-parser");


/**
 * @typedef {{
 *   exit_code: number,
 *   error: string,
 *   pseudo: string,
 *   num_mois?: number,
 *   nom_mois: string,
 *   mode_jeu: string,
 *   rang: number,
 *   data: {
 *     points: number,
 *     parties: number,
 *     victoires: number,
 *     defaites: number,
 *     temps_jeu: number,
 *     kills: number,
 *     morts: number
 *   },
 *   stats: {
 *     winrate: number,
 *     kd: number,
 *     ragequit: number,
 *     kills_game: number,
 *     morts_game: number,
 *     points_game: number,
 *     temps_partie?: number,
 *     kills_minute?: number,
 *     seconde_kill?: number,
 *     lits_partie?: number,
 *     nexus_partie?: number,
 *     degats_partie?: number
 *   },
 *   skin?: string,
 *   'player-id': string
 * }} StatsResponse
 */


const modes = ['rush_retro', 'rush_mdt', 'hikabrain', 'skywars', 'octogone', 'shootcraft', 'infecte', 'survival', 'blitz', 'pvpsmash', 'landrush'];
const months = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
const aliases = {
	"infected": "infecte",
	"shoot": "shootcraft",
	"land": "landrush",
	"mma": "octogone",
	"pvp": "pvpsmash",
	"hika": "hikabrain",
	"sky": "skywars",
	"rush": "rush_mdt"
};

/**
 * Get stats for a player, for a game in a specific period
 * @param {string} period 
 * @param {string} mode 
 * @param {string} pseudo 
 * @returns {Promise.<StatsResponse>}
 */
function stats(period, mode, pseudo) {
	return new Promise((resolve, reject) => {
		period = period.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		mode = mode.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		pseudo = pseudo.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		const month = getMonth(period);
		const monthDiff = parseMonth(month);
		if (monthDiff === undefined || monthDiff > 4)
			return reject({ error: "Specified period is incorrect.", exit_code: 2 });
		const numMode = getMode(mode);
		if (numMode === undefined)
			return reject({ error: "Specified mode is incorrect.", exit_code: 3 });
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(pseudo), (err, res, body) => {
			if (err)
				return reject({ error: "Unable to connect to funcraft.net.", exit_code: 9 });
			try {
				const dom = HTMLParser.parse(body);

				const pseudoChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
				if (!pseudoChildren)
					return reject({ error: 'Player "' + pseudo + '" doesn\'t exists.', exit_code: 4 })

				const rows = dom.querySelector('#player-stats').childNodes[5].childNodes[numMode * 2 + 1].childNodes[1].childNodes[3].childNodes;
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
					return reject({ error: "Non-existent statistics for this period.", exit_code: 1 });

				const stats = {};
				stats.exit_code = 0;
				stats.error = null;

				let playerUsername = pseudoChildren.childNodes[1].childNodes[pseudoChildren.childNodes[1].childNodes.length - 2].text.trim();
				while (playerUsername.includes(' ')) {
					playerUsername = playerUsername.split(' ')[1];
				}
				stats.pseudo = playerUsername;

				statsFromData(stats, datas, month, numMode);
				
				// stats.skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].attributes.src;
				stats.skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].rawAttrs.match(/^src="(.*)"$/)[1];
				stats['player-id'] = res.request.uri.href.match(/^https?:\/\/(www\.)?funcraft\.\w{1,3}(\/\w+){2}\/(\d+)\/\w+$/i)[3];

				resolve(stats);
			}
			catch (e) {
				reject({ error: "Unable to connect to funcraft.net.", exit_code: 9 });
			}
		});
	});
}
function getMonth(period) {
	if (period.match(/^\d+$/) && parseInt(period) <= 12 && parseInt(period) >= 0)
		return parseInt(period);
	if (months.includes(period))
		return months.indexOf(period) + 1;
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
function getMode(mode) {
	if (mode in aliases)
		mode = aliases[mode];
	else if (mode.replace(/\s+/g, '_') in aliases)
		mode = aliases[mode.replace(/\s+/g, '_')];
	if (modes.includes(mode))
		return modes.indexOf(mode);
}

function statsFromData(stats, datas, month, numMode) {
	if (month !== null && month !== undefined) {
		stats.num_mois = month;
		stats.nom_mois = month === 0 ? 'toujours' : months[month - 1];
	}
	stats.mode_jeu = modes[numMode];
	stats.rang = datas[0];
	stats.data = {};

	let valColumn = 1;
	stats.data.points = datas[valColumn++];
	stats.data.parties = datas[valColumn++];
	stats.data.victoires = datas[valColumn++];
	if (modes[numMode] == 'survival' || modes[numMode] == 'skywars' || modes[numMode] == 'pvpsmash' || modes[numMode] == 'octogone' || modes[numMode] == 'shootcraft' || modes[numMode] == 'infecte')
		stats.data.defaites = stats.data.parties - stats.data.victoires;
	else
		stats.data.defaites = datas[valColumn++];
	stats.data.temps_jeu = datas[valColumn++];
	stats.data.kills = datas[valColumn++];
	stats.data.morts = datas[valColumn++];
	if (modes[numMode] == 'rush_mdt' || modes[numMode] == 'rush_retro' || modes[numMode] == 'landrush')
		stats.data.lits_detruits = datas[valColumn++];
	if (modes[numMode] == 'blitz')
		stats.data.degats_nexus = datas[valColumn++];
	if (modes[numMode] == 'pvpsmash' || modes[numMode] == 'octogone')
		stats.data.degats = datas[valColumn++];

	stats.stats = {};
	if (stats.data.parties == 0)
		stats.stats.winrate = 0;
	else if (stats.data.victoires == 0 && stats.data.defaites == 0)
		stats.stats.winrate = Round((stats.data.victoires / stats.data.parties) * 100, 3);
	else
		stats.stats.winrate = Round((stats.data.victoires / (stats.data.victoires + stats.data.defaites)) * 100, 3);
	if (stats.data.morts == 0)
		stats.stats.kd = stats.data.kills;
	else
		stats.stats.kd = Round(stats.data.kills / stats.data.morts, 3);
	if (modes[numMode] == 'shootcraft') {
		if (stats.data.parties == 0)
			stats.stats.ragequit = 0;
		else
			stats.stats.ragequit = Round((((stats.data.temps_jeu / stats.data.parties) / 5) - 1) * (-100), 3);
	}
	if (stats.data.parties == 0)
		stats.stats.kills_game = 0;
	else
		stats.stats.kills_game = Round(stats.data.kills / stats.data.parties, 3);
	if (stats.data.parties == 0)
		stats.stats.morts_game = 0;
	else
		stats.stats.morts_game = Round(stats.data.morts / stats.data.parties, 3);
	if (stats.data.parties == 0)
		stats.stats.points_game = 0;
	else
		stats.stats.points_game = Round(stats.data.points / stats.data.parties, 3);
	if (modes[numMode] != 'shootcraft') {
		if (stats.data.parties == 0)
			stats.stats.temps_partie = 0;
		else
			stats.stats.temps_partie = Round(stats.data.temps_jeu * 60 / stats.data.parties, 3);
	}
	if (stats.data.parties == 0)
		stats.stats.kills_minute = 0;
	else {
		if (modes[numMode] == 'shootcraft')
			stats.stats.kills_minute = Round(stats.data.kills / (stats.data.parties * 5), 3);
		else
			stats.stats.kills_minute = Round(stats.stats.kills_game / (stats.stats.temps_partie / 60), 3);
	}
	if (modes[numMode] == 'shootcraft') {
		if (stats.data.kills == 0)
			stats.stats.seconde_kill = 0;
		else
			stats.stats.seconde_kill = Round((stats.data.temps_jeu * 60) / stats.data.kills, 3);
	}
	if (modes[numMode] == 'rush_mdt' || modes[numMode] == 'rush_retro' || modes[numMode] == 'landrush') {
		if (stats.data.parties == 0)
			stats.stats.lits_partie = 0;
		else
			stats.stats.lits_partie = Round(stats.data.lits_detruits / stats.data.parties, 3);
	}
	if (modes[numMode] == 'blitz') {
		if (stats.data.parties == 0)
			stats.stats.nexus_partie = 0;
		else
			stats.stats.nexus_partie = Round(stats.data.degats_nexus / stats.data.parties, 3);
	}
	if (modes[numMode] == 'pvpsmash' || modes[numMode] == 'octogone') {
		if (stats.data.parties == 0)
			stats.stats.degats_partie = 0;
		else
			stats.stats.degats_partie = Round(stats.data.degats / stats.data.parties, 3);
	}

	return stats;
}

/**
 * Get all stats of a player
 * @param {string} pseudo 
 * @returns {Promise.<{
 *   [mode: string]: {
 *     [period: string]: StatsResponse
 *     toujours?: StatsResponse
 *   },
 *   infos: {
 *     pseudo: string,
 *     skin: string,
 *     'player-id': string
 *   }
 * }>}
 */
function allStats(pseudo) {
	return new Promise((resolve, reject) => {
		pseudo = pseudo.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(pseudo), (err, res, body) => {
			if (err)
				return reject({ error: "Unable to connect to funcraft.net.", exit_code: 9 });
			try {
				const dom = HTMLParser.parse(body);

				const pseudoChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
				if (!pseudoChildren)
					return reject({ error: 'Player "' + pseudo + '" doesn\'t exists.', exit_code: 4 })
					
				let playerUsername = pseudoChildren.childNodes[1].childNodes[pseudoChildren.childNodes[1].childNodes.length - 2].text.trim();
				while (playerUsername.includes(' ')) {
					playerUsername = playerUsername.split(' ')[1];
				}

				// const skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].attributes.src;
				const skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].rawAttrs.match(/^src="(.*)"$/)[1];
				const playerId = res.request.uri.href.match(/^https?:\/\/(www\.)?funcraft\.\w{1,3}(\/\w+){2}\/(\d+)\/\w+$/i)[3];


				const allStats = {};
				allStats.infos = {};
				allStats.infos.pseudo = playerUsername;
				allStats.infos.skin = skin;
				allStats.infos["player-id"] = playerId;

				for (let numMode = 0; numMode < 10; numMode++) {
					const modeName = modes[numMode];
					const rows = dom.querySelector('#player-stats').childNodes[5].childNodes[numMode * 2 + 1].childNodes[1].childNodes[3].childNodes;
					allStats[modeName] = {};
					for (let monthDiff = 0; monthDiff < 5; monthDiff++) {
						const month = monthDiff === 0 ? 0 : (((new Date()).getMonth() - monthDiff + 1) < 0 ? 12 + ((new Date()).getMonth() - monthDiff + 1) : ((new Date()).getMonth() - monthDiff + 1)) % 12 + 1;
						const monthName = month === 0 ? 'toujours' : months[month - 1];
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
							allStats[modeName][monthName] = null;
						else {
							const stats = {};
							stats.exit_code = 0;
							stats.error = null;
	
							stats.pseudo = playerUsername;

							statsFromData(stats, datas, month, numMode);
							
							stats.skin = skin;
							stats['player-id'] = playerId;
		
							allStats[modeName][monthName] = stats;
						}
					}
				}

				resolve(allStats);
			}
			catch (e) {
				return reject({ error: "Unable to connect to funcraft.net.", exit_code: 9 });
			}
		});
	});
}

/**
 * Get infos about a player
 * @param {string} pseudo 
 * @returns {Promise.<{
 *   exit_code: number,
 *   error: string,
 *   grade: string,
 *   pseudo: string,
 *   'player-id': string,
 *   skin: string,
 *   inscription: string,
 *   'last-connection': string,
 *   gloires: number,
 *   parties: number,
 *   points: number,
 *   victoires: number,
 *   defaites: number,
 *   temps_jeu: number,
 *   kills: number,
 *   morts: number,
 *   amis:  {
 *     nom: string,
 *     skin: string
 *   }[],
 *   ban: ("TEMP"|"DEF"|"NONE")
 * }>}
 */
function infos(pseudo) {
	return new Promise((resolve, reject) => {
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(pseudo), (err, res, body) => {
			if (err)
				return reject({ error: "Unable to connect to funcraft.net.", exit_code: 6 });
			
			try {
				const dom = HTMLParser.parse(body);

				const infos = {};
				infos.exit_code = 0;
				infos.error = null;
	
				const pseudoChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
				if (!pseudoChildren)
					return reject({ error: 'Player "' + pseudo + '" doesn\'t exists.', exit_code: 1 })
				infos.grade = pseudoChildren.childNodes[1].text.trim().split(/\s+/gi)[0];
	
				let playerUsername = pseudoChildren.childNodes[1].childNodes[pseudoChildren.childNodes[1].childNodes.length - 2].text.trim();
				while (playerUsername.includes(' ')) {
					playerUsername = playerUsername.split(' ')[1];
				}
				infos.pseudo = playerUsername;
				
				infos['player-id'] = res.request.uri.href.match(/^https?:\/\/(www\.)?funcraft\.\w{1,3}(\/\w+){2}\/(\d+)\/\w+$/i)[3];
				// infos.skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].attributes.src;
				infos.skin = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].rawAttrs.match(/^src="(.*)"$/)[1];
				
				// infos.inscription = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[3].childNodes[1].childNodes[3].attributes.title;
				infos.inscription = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[3].childNodes[1].childNodes[3].rawAttrs.match(/(^title=|\stitle=)"([^"]*)"/)[2];
				// infos['last-connection'] = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[3].childNodes[3].childNodes[3].attributes.title;
				infos['last-connection'] = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[3].childNodes[3].childNodes[3].rawAttrs.match(/(^title=|\stitle=)"([^"]*)"/)[2];
				infos.gloires = parseFCInt(dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[5].childNodes[1].text.trim().replace(/\s+/gi, ""));
				infos.parties = parseFCInt(dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes[5].childNodes[3].text.trim().replace(/\s+/gi, ""));
	
				let points = 0;
				let victoires = 0;
				let defaites = 0;
				let tempsJeu = 0;
				let kills = 0;
				let morts = 0;
				let rows = dom.querySelector('#player-stats').childNodes[5].childNodes;
				let numrow = 0;
				for (let row of rows) {
					if (row.text.trim() !== "") {
						let numcol = 1;
						points += parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
						const partie = parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
						const victoire = parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
						if (!Number.isNaN(victoire))
							victoires += victoire;
						if (numrow == 3 || numrow == 4 || numrow == 5 || numrow == 6 || numrow == 7 || numrow == 9)
							defaites += (partie - victoire);
						else
							defaites += parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
						const temps = row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, "");
						if (temps !== "-")
							tempsJeu += parseInt(temps.split("h")[0], 10) * 60 + parseInt(temps.split("h")[1].replace(/m$/g, ""), 10);
						kills += parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
						morts += parseFCInt(row.childNodes[1].childNodes[3].childNodes[(++numcol) * 2 + 1].childNodes[3].text.trim().replace(/\s+/gi, ""));
						numrow++;
					}
				}
	
				infos.points = points;
				infos.victoires = victoires;
				infos.defaites = defaites;
				infos.temps_jeu = tempsJeu;
				infos.kills = kills;
				infos.morts = morts;
	
				request('https://www.funcraft.net/fr/joueur/' + encodeURIComponent(infos['player-id']) + '?sendFriends=1', (fErr, fRes, fBody) => {
					if (fErr)
						reject(fErr);
					const fDom = HTMLParser.parse(fBody);
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
					infos.amis = friends;
					
					const ban = dom.querySelector("div.player-alert");
					if (ban) {
						if (ban.text.trim().match(/temporairement/mi))
							infos.ban = "TEMP";
						else
							infos.ban = "DEF";
					}
					else
						infos.ban = "NONE";

					resolve(infos);
				});
			}
			catch (e) {
				return reject({ error: "Unable to connect to funcraft.net.", exit_code: 6 });
			}
		});
	});
}

/**
 * Get head of a player
 * @param {string} pseudo 
 * @returns {Promise.<string>}
 */
function head(pseudo) {
	return new Promise((resolve, reject) => {
		request('https://www.funcraft.net/fr/joueurs?q=' + encodeURIComponent(pseudo), (err, res, body) => {
			if (err)
				return reject({ error: "Unable to connect to funcraft.net.", exit_code: 2 });

			try {
				const dom = HTMLParser.parse(body);
				
				if (!dom.querySelector('#main-layout'))
					return reject({ error: 'Player "' + pseudo + '" doesn\'t exists.', exit_code: 1 });
				const pseudoChildren = dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[3];
				if (!pseudoChildren)
					return reject({ error: 'Player "' + pseudo + '" doesn\'t exists.', exit_code: 1 });
	
				resolve(dom.querySelector('#main-layout').childNodes[5].childNodes[1].childNodes[1].childNodes[1].childNodes[1].attributes.src);
			}
			catch (e) {
				return reject({ error: "Unable to connect to funcraft.net.", exit_code: 2 });
			}
		});
	});
}


/**
 * Get stats table of a game
 * @param {string} period 
 * @param {string} mode 
 * @returns {StatsResponse[]}
 */
function table(period, mode) {
	return new Promise((resolve, reject) => {
		mode = mode.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		mode = vGetMode(mode);
		if (mode === undefined)
			return reject({ error: "Specified mode is incorrect.", exit_code: 1 });
		request('https://www.funcraft.net/fr/classement/' + encodeURIComponent(mode) + '/' + encodeURIComponent(period) + '?sendData=1&_=' + Date.now(), (err, res, body) => {
			if (err)
				return reject({ error: "Unable to connect to funcraft.net.", exit_code: 2 });

			const dom = HTMLParser.parse(body);
			const pseudoChildren = dom.querySelector('.leaderboard-table').childNodes[3];
			const result = [];
			for (let raw of pseudoChildren.childNodes) {
				if (raw.rawTagName !== 'tr')
					continue;

				const stats = {};
				stats.exit_code = 0;
				stats.error = null;

				const pseudo = raw.childNodes[3].childNodes[1].childNodes[0].rawText.trim();
				stats.pseudo = pseudo;

				stats.nom_mois = period;

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

				statsFromData(stats, datas, null, getMode(mode));

				if (stats.rang === 1 || stats.rang === 2 || stats.rang === 3)
					stats.skin = dom.querySelector('.podium-' + stats.rang).childNodes[1].childNodes[stats.rang === 1 ? 3 : 1].childNodes[1].childNodes[3].rawAttrs.match(/^src="(.*)"$/)[1];

				stats['player-id'] = raw.childNodes[3].childNodes[1].rawAttrs.match(/^href="https?:\/\/(www\.)?funcraft\.\w{1,3}(\/\w+){2}\/(\d+)\/\w+"$/i)[3];
				result.push(stats);
			}
			resolve(result);
		});
	});
}


/**
 * Compute some stats properties
 * @param {object} stats 
 * @param {boolean} data 
 */
function computeStats(stats, data = false) {
	if (data) {
		stats['data']['temps_jeu'] = (stats['data']['temps_jeu'] - (stats['data']['temps_jeu'] % 60)) / 60 + 'h' + stats['data']['temps_jeu'] % 60 + 'min';
		resolve(formatStats(stats));
	}
	else {
		if (stats['mode_jeu'] == 'shootcraft') {
			stats['stats']['ragequit'] += '%';
			stats['stats']['HAT'] = Round(Math.sqrt(Math.pow(stats['stats']['winrate']/100+1, 2.5)*(stats['stats']['kills_minute'] / 5)*((stats['stats']['kills_minute'] * 5)/(stats['stats']['morts_game'] * 5) + 2))*60, 3);
		}
		else
			stats['stats']['temps_partie'] = ((stats['stats']['temps_partie'] - (stats['stats']['temps_partie'] % 60)) / 60) + ':' + Round(stats['stats']['temps_partie'] % 60, 3);

		if (stats['mode_jeu'] == 'rush_mdt' || stats['mode_jeu'] == 'rush_retro')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['data']['parties']/stats['data']['temps_jeu']*60 + stats['stats']['winrate']/100*38 + Math.sqrt(stats['stats']['kd']*300)) * 100, 3);
		else if (stats['mode_jeu'] == 'hikabrain')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['stats']['winrate']/100*25 + stats['data']['parties']/stats['data']['temps_jeu']*60 + stats['stats']['kd'] * 8) * 100, 3);
		else if (stats['mode_jeu'] == 'skywars')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['stats']['winrate']/100*45 + Math.sqrt(stats['stats']['kd']*25)) * 100, 3);
		else if (stats['mode_jeu'] == 'survival')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['stats']['winrate']/100*30 + Math.sqrt(stats['stats']['kd'] * 8)) * 100, 3);
		else if (stats['mode_jeu'] == 'pvpsmash')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['stats']['winrate']/100*20 + Math.sqrt(stats['stats']['kd'] * 8)) * 100, 3);
		else if (stats['mode_jeu'] == 'blitz')
			stats['stats']['HAT'] = Round(Math.sqrt(stats['stats']['winrate']/100*10 + 2*stats['stats']['nexus_partie'] + Math.sqrt(stats['stats']['kd'] * 30)) * 100, 3);
		
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
			p = "toujours";
		else
			p = months[p - 1];
	}
	return p;
}
/**
 * Determine wether a string is a valid mode
 * @param {string} mode 
 * @returns {string}
 */
function vGetMode(mode) {
	let m = getMode(mode.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
	if (m !== undefined)
		m = modes[m];
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
	validators: {
		getPeriod: vGetPeriod,
		getMode: vGetMode
	},
	data: {
		modes,
		months,
		aliases
	}
};