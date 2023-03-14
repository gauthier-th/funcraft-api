const games = ['rush_mdt', 'hikabrain', 'skywars', 'octogone', 'shootcraft', 'infected', 'blitz', 'pvpsmash', 'survival', 'rush_retro', 'landrush'];
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
 * Round a number with a decimal count
 * @param {string} number 
 * @param {number} decimalCount 
 * @returns {number}
 */
function Round(number, decimalCount = 0) {
	return Math.round(number * Math.pow(10, decimalCount)) / Math.pow(10, decimalCount);
}

/**
 * Parse a FunCraft number field
 * @param {string} value 
 * @returns {number}
 */
function parseFCInt(value) {
	if (value.trim().replace(/\s+/ig, "") === "" || Number.isNaN(parseInt(value, 10)))
		return 0;
	else
		return parseInt(value, 10);
}

/**
 * Remove all accents from a string
 * @param {string} string 
 * @returns {string}
 */
function removeAccents(string) {
	return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Parse a FunCraft date
 * @param {string} value 
 * @param {string} utc 
 * @returns {Date}
 */
function parseFCDate(value, utc = 'UTC+01') {
	const monthAliases = {
		'janvier': 'Jan',
		'fevrier': 'Feb',
		'mars': 'Mar',
		'avril': 'Apr',
		'mai': 'May',
		'juin': 'Jun',
		'juillet': 'Jul',
		'aout': 'Aug',
		'septembre': 'Sep',
		'octobre': 'Oct',
		'novembre': 'Nov',
		'decembre': 'Dec'
	};
	value = removeAccents(value).replace(/, (\d{2})h(\d{2})$/, ' $1:$2:00 ' + utc);
	for (let month of Object.keys(monthAliases)) {
		value = value.replace(month, monthAliases[month]);
	}
	return new Date(value);
}


/**
 * @param {string} period 
 * @returns {number}
 */
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
/**
 * @param {string} month 
 * @returns {number}
 */
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
/**
 * @param {string} game 
 * @returns {string}
 */
function getGame(game) {
	game = game.replace(/[\s-]+/g, '_');
	if (Object.keys(gameAliases).includes(game))
		game = gameAliases[game];
	if (games.includes(game))
		return games.indexOf(game);
}


/**
 * Determine whether a string is a valid period
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
 * Determine whether a string is a valid game
 * @param {string} game 
 * @returns {string}
 */
function vGetGame(game) {
	let m = getGame(game.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
	if (m !== undefined)
		m = games[m];
	return m;
}

module.exports = {
	data: {
		games,
		months,
		gameAliases,
		monthAliases
	},
	Round,
	parseFCInt,
	removeAccents,
	parseFCDate,
	getMonth,
	parseMonth,
	getGame,
	vGetPeriod,
	vGetGame
};
