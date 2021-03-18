const none = () => ({ code: 0, error: null });
const incorrectGame = () => ({ code: 1, error: "Specified game is incorrect." });
const incorrectPeriod = () => ({ code: 2, error: "Specified period is incorrect." });
const unknownPlayer = (username) => ({ code: 3, error: `Player ${username ? username + ' ' : ''}doesn't exists.` });
const noStatistics = () => ({ code: 4, error: "No statistics for this period." });
const connectionError = () => ({ code: 5, error: "Unable to connect to funcraft.net." });
const serverApiError = () => ({ code: 6, error: "Unable to connect to API server." });
const unauthorized = () => ({ code: 7, error: "Unauthorized request." });

const errors = {
	stats: { none, incorrectGame, incorrectPeriod, unknownPlayer, noStatistics, connectionError, serverApiError, unauthorized },
	allStats: { none, unknownPlayer, connectionError, serverApiError, unauthorized },
	infos: { none, unknownPlayer, connectionError, serverApiError, unauthorized },
	friends: { none, unknownPlayer, connectionError, serverApiError, unauthorized },
	table: { none, incorrectGame, noStatistics, connectionError, serverApiError, unauthorized },
	head: { none, unknownPlayer, connectionError, serverApiError, unauthorized }
};

module.exports = errors;