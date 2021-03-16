const incorrectGame = () => ({ code: 1, error: "Specified game is incorrect." });
const incorrectPeriod = () => ({ code: 2, error: "Specified period is incorrect." });
const unknownPlayer = (username) => ({ code: 3, error: `Player ${username ? username + ' ' : ''}doesn't exists.` });
const noStatistics = () => ({ code: 4, error: "No statistics for this period." });
const connectionError = () => ({ code: 5, error: "Unable to connect to funcraft.net." });
const serverApiError = () => ({ code: 5, error: "Unable to connect to API server." });

const errors = {
	stats: { incorrectGame, incorrectPeriod, unknownPlayer, noStatistics, connectionError, serverApiError },
	allStats: { unknownPlayer, connectionError, serverApiError },
	infos: { unknownPlayer, connectionError, serverApiError },
	friends: { unknownPlayer, connectionError, serverApiError },
	table: { incorrectGame, noStatistics, connectionError, serverApiError },
	head: { unknownPlayer, connectionError, serverApiError }
};

module.exports = errors;