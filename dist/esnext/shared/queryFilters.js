export function startAt(query) {
    const key = query.identity.startAtKey;
    const value = query.identity.startAt;
    return (record) => {
        if (value === undefined) {
            return true;
        }
        return key ? record[key] >= value : record >= value;
    };
}
export function endAt(query) {
    const key = query.identity.endAtKey;
    const value = query.identity.endAt;
    return (record) => {
        if (value === undefined) {
            return true;
        }
        return key ? record[key] <= value : record <= value;
    };
}
/** a filter function for queries with a `equalTo` value */
export function equalTo(query) {
    const key = query.identity.equalToKey;
    const value = query.identity.equalTo;
    return (record) => {
        if (value === undefined) {
            return true;
        }
        return key ? record[key] === value : record === value;
    };
}
//# sourceMappingURL=queryFilters.js.map