declare function none(): {
    code: number;
    error: any;
};
declare function incorrectGame(): {
    code: number;
    error: string;
};
declare function incorrectPeriod(): {
    code: number;
    error: string;
};
/** @param {string} username */
declare function unknownPlayer(username: string): {
    code: number;
    error: string;
};
declare function noStatistics(): {
    code: number;
    error: string;
};
declare function connectionError(): {
    code: number;
    error: string;
};
export namespace stats {
    export { none };
    export { incorrectGame };
    export { incorrectPeriod };
    export { unknownPlayer };
    export { noStatistics };
    export { connectionError };
}
export namespace allStats {
    export { none };
    export { unknownPlayer };
    export { connectionError };
}
export namespace infos {
    export { none };
    export { unknownPlayer };
    export { connectionError };
}
export namespace friends {
    export { none };
    export { unknownPlayer };
    export { connectionError };
}
export namespace table {
    export { none };
    export { incorrectGame };
    export { noStatistics };
    export { connectionError };
}
export namespace head {
    export { none };
    export { unknownPlayer };
    export { connectionError };
}
export {};
