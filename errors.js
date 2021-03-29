const none = () => ({ code: 0, error: null });
const incorrectGame = () => ({ code: 1, error: "Specified game is incorrect." });
const incorrectPeriod = () => ({ code: 2, error: "Specified period is incorrect." });
const unknownPlayer = (username) => ({ code: 3, error: `Player ${username ? username + ' ' : ''}doesn't exists.` });
const noStatistics = () => ({ code: 4, error: "No statistics for this period." });
const connectionError = () => ({ code: 5, error: "Unable to connect to funcraft.net." });

const errors = {
	stats: { none, incorrectGame, incorrectPeriod, unknownPlayer, noStatistics, connectionError },
	allStats: { none, unknownPlayer, connectionError },
	infos: { none, unknownPlayer, connectionError },
	friends: { none, unknownPlayer, connectionError },
	table: { none, incorrectGame, noStatistics, connectionError },
	head: { none, unknownPlayer, connectionError }
};

module.exports = errors;