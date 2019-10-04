"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-implicit-dependencies
const common_types_1 = require("common-types");
const lodash_set_1 = __importDefault(require("lodash.set"));
const lodash_get_1 = __importDefault(require("lodash.get"));
const firebase_key_1 = require("firebase-key");
const fast_equals_1 = require("fast-equals");
const fast_copy_1 = __importDefault(require("fast-copy"));
const util_1 = require("./util");
const index_1 = require("./index");
const auth_1 = require("./auth");
const deepmerge_1 = __importDefault(require("deepmerge"));
exports.db = [];
let _listeners = [];
let _silenceEvents = false;
/**
 * silences the database from sending events;
 * this is not typically done but can be done
 * as part of the Mocking process to reduce noise
 */
function silenceEvents() {
    _silenceEvents = true;
}
exports.silenceEvents = silenceEvents;
/**
 * returns the database to its default state of sending
 * events out.
 */
function restoreEvents() {
    _silenceEvents = false;
}
exports.restoreEvents = restoreEvents;
function shouldSendEvents() {
    return !_silenceEvents;
}
exports.shouldSendEvents = shouldSendEvents;
function clearDatabase() {
    exports.db = {};
}
exports.clearDatabase = clearDatabase;
function updateDatabase(state) {
    exports.db = deepmerge_1.default(exports.db, state);
}
exports.updateDatabase = updateDatabase;
async function auth() {
    return auth_1.auth();
}
exports.auth = auth;
function getDb(path) {
    return lodash_get_1.default(exports.db, dotify(path));
}
exports.getDb = getDb;
/**
 * **setDB**
 *
 * sets the database at a given path
 */
function setDB(path, value, silent = false) {
    const dotPath = util_1.join(path);
    const oldRef = lodash_get_1.default(exports.db, dotPath);
    const oldValue = typeof oldRef === "object" ? Object.assign(Object.assign({}, oldRef), {}) : oldRef;
    const isReference = ["object", "array"].includes(typeof value);
    const dbSnapshot = fast_copy_1.default(Object.assign({}, exports.db));
    // ignore if no change
    if ((isReference && fast_equals_1.deepEqual(oldValue, value)) ||
        (!isReference && oldValue === value)) {
        return;
    }
    if (value === null) {
        const parentValue = lodash_get_1.default(exports.db, util_1.getParent(dotPath));
        if (typeof parentValue === "object") {
            delete parentValue[util_1.getKey(dotPath)];
            lodash_set_1.default(exports.db, util_1.getParent(dotPath), parentValue);
        }
        else {
            lodash_set_1.default(exports.db, dotPath, undefined);
        }
    }
    else {
        lodash_set_1.default(exports.db, dotPath, value);
    }
    if (!silent) {
        notify({ [dotPath]: value }, dbSnapshot);
    }
}
exports.setDB = setDB;
/**
 * **updateDB**
 *
 * single-path, non-destructive update to database
 */
function updateDB(path, value) {
    const dotPath = util_1.join(path);
    const oldValue = lodash_get_1.default(exports.db, dotPath);
    let changed = true;
    if (typeof value === "object" &&
        Object.keys(value).every(k => (oldValue ? oldValue[k] : null) ===
            value[k])) {
        changed = false;
    }
    if (typeof value !== "object" && value === oldValue) {
        changed = false;
    }
    if (!changed) {
        return;
    }
    const newValue = typeof oldValue === "object" ? Object.assign(Object.assign({}, oldValue), value) : value;
    setDB(dotPath, newValue);
}
exports.updateDB = updateDB;
/**
 * **multiPathUpdateDB**
 *
 * Emulates a Firebase multi-path update. The keys of the dictionary
 * are _paths_ in the DB, the value is the value to set at that path.
 *
 * **Note:** dispatch notifations must not be done at _path_ level but
 * instead grouped up by _watcher_ level.
 */
function multiPathUpdateDB(data) {
    const snapshot = fast_copy_1.default(exports.db);
    Object.keys(data).map(key => {
        const value = data[key];
        const path = key;
        if (lodash_get_1.default(exports.db, path) !== value) {
            // silent sets
            setDB(path, value, true);
        }
    });
    notify(data, snapshot);
}
exports.multiPathUpdateDB = multiPathUpdateDB;
const dotify = (path) => {
    const dotPath = path.replace(/[\\\/]/g, ".");
    return removeDotsAtExtremes(dotPath.slice(0, 1) === "." ? dotPath.slice(1) : dotPath);
};
function dotifyKeys(obj) {
    const result = {};
    Object.keys(obj).forEach(key => {
        result[dotify(key)] = obj[key];
    });
    return result;
}
function removeDotsAtExtremes(path) {
    const front = path.slice(0, 1) === "." ? path.slice(1) : path;
    return front.slice(-1) === "." ? front.slice(0, front.length - 1) : front;
}
const slashify = (path) => {
    const slashPath = path.replace(/\./g, "/");
    return slashPath.slice(0, 1) === "/" ? slashPath.slice(1) : slashPath;
};
/**
 * Will aggregate the data passed in to dictionary objects of paths
 * which fire at the root of the listeners/watchers that are currently
 * on the database.
 *
 * **Note:** if there was NO actual change between old and new values
 * there will be no notification sent
 */
function groupEventsByWatcher(data, dbSnapshot) {
    data = dotifyKeys(data);
    const getFromSnapshot = (path) => lodash_get_1.default(dbSnapshot, dotify(path));
    const ignoreUnchanged = (path) => data[path] !== getFromSnapshot(path);
    const eventPaths = Object.keys(data)
        .filter(ignoreUnchanged)
        .map(i => dotify(i));
    const response = [];
    const relativePath = (full, partial) => {
        return full.replace(partial, "");
    };
    const justKey = (obj) => (obj ? Object.keys(obj)[0] : null);
    const justValue = (obj) => justKey(obj) ? obj[justKey(obj)] : null;
    getListeners().forEach(l => {
        const eventPathsUnderListener = eventPaths.filter(e => e.includes(l.path));
        if (eventPathsUnderListener.length === 0) {
            return;
        }
        const paths = [];
        const changeObject = eventPathsUnderListener.reduce((changes, path) => {
            paths.push(path);
            if (l.path === path) {
                changes = data[path];
            }
            else {
                lodash_set_1.default(changes, dotify(relativePath(path, l.path)), data[path]);
            }
            return changes;
        }, {});
        const key = l.eventType === "value"
            ? changeObject
                ? justKey(changeObject)
                : l.path.split(".").pop()
            : dotify(common_types_1.pathJoin(slashify(l.path), justKey(changeObject)));
        const newResponse = {
            listenerId: l.id,
            listenerPath: l.path,
            listenerEvent: l.eventType,
            callback: l.callback,
            eventPaths: paths,
            key,
            changes: justValue(changeObject),
            value: l.eventType === "value" ? getDb(l.path) : getDb(key),
            priorValue: l.eventType === "value"
                ? lodash_get_1.default(dbSnapshot, l.path)
                : justValue(lodash_get_1.default(dbSnapshot, l.path))
        };
        response.push(newResponse);
    });
    return response;
}
function removeDB(path) {
    if (!getDb(path)) {
        return;
    }
    setDB(path, null);
}
exports.removeDB = removeDB;
/**
 * **pushDB**
 *
 * Push a new record into the mock database. Uses the
 * `firebase-key` library to generate the key which
 * attempts to use the same algorithm as Firebase
 * itself.
 */
function pushDB(path, value) {
    const pushId = firebase_key_1.key();
    const fullPath = util_1.join(path, pushId);
    const valuePlusId = typeof value === "object" ? Object.assign(Object.assign({}, value), { id: pushId }) : value;
    setDB(fullPath, valuePlusId);
    return pushId;
}
exports.pushDB = pushDB;
/**
 * **addListener**
 *
 * Adds a listener for watched events; setup by
 * the `query.on()` API call.
 *
 * This listener is
 * pushed onto a private stack but can be interogated
 * with a call to `getListeners()` or if you're only
 * interested in the _paths_ which are being watched
 * you can call `listenerPaths()`.
 */
function addListener(path, eventType, callback, cancelCallbackOrContext, context) {
    _listeners.push({
        id: Math.random()
            .toString(36)
            .substr(2, 10),
        path: util_1.join(path),
        eventType,
        callback,
        cancelCallbackOrContext,
        context
    });
}
exports.addListener = addListener;
/**
 * **removeListener**
 *
 * Removes an active listener (or multiple if the info provided matches more
 * than one).
 *
 * If you provide the `context` property it will use this to identify
 * the listener, if not then it will use `eventType` (if available) as
 * well as `callback` (if available) to identify the callback(s)
 */
function removeListener(eventType, callback, context) {
    if (!eventType) {
        return removeAllListeners();
    }
    if (!callback) {
        const removed = _listeners.filter(l => l.eventType === eventType);
        _listeners = _listeners.filter(l => l.eventType !== eventType);
        return cancelCallback(removed);
    }
    if (!context) {
        // use eventType and callback to identify
        const removed = _listeners
            .filter(l => l.callback === callback)
            .filter(l => l.eventType === eventType);
        _listeners = _listeners.filter(l => l.eventType !== eventType || l.callback !== callback);
        return cancelCallback(removed);
    }
    else {
        // if we have context then we can ignore other params
        const removed = _listeners
            .filter(l => l.callback === callback)
            .filter(l => l.eventType === eventType)
            .filter(l => l.context === context);
        _listeners = _listeners.filter(l => l.context !== context ||
            l.callback !== callback ||
            l.eventType !== eventType);
        return cancelCallback(removed);
    }
}
exports.removeListener = removeListener;
/**
 * internal function responsible for the actual removal of
 * a listener.
 */
function cancelCallback(removed) {
    let count = 0;
    removed.forEach(l => {
        if (typeof l.cancelCallbackOrContext === "function") {
            l.cancelCallbackOrContext();
            count++;
        }
    });
    return count;
}
function removeAllListeners() {
    const howMany = cancelCallback(_listeners);
    _listeners = [];
    return howMany;
}
exports.removeAllListeners = removeAllListeners;
/**
 * **listenerCount**
 *
 * Provides a numberic count of listeners on the database.
 * Optionally you can state the `EventType` and get a count
 * of only this type of event.
 */
function listenerCount(type) {
    return type
        ? _listeners.filter(l => l.eventType === type).length
        : _listeners.length;
}
exports.listenerCount = listenerCount;
/**
 * **listenerPaths**
 *
 * Provides a list of _paths_ in the database which have listeners
 * attached to them. Optionally you can state the `EventType` and filter down to
 * only this type of event or "set of events".
 *
 * You can also just state "child" as the event and it will resolve to all child
 * events: `[ 'child_added', 'child_changed', 'child_removed', 'child_moved' ]`
 */
function listenerPaths(lookFor) {
    if (lookFor && !Array.isArray(lookFor)) {
        lookFor =
            lookFor === "child"
                ? ["child_added", "child_changed", "child_removed", "child_moved"]
                : [lookFor];
    }
    return lookFor
        ? _listeners.filter(l => lookFor.includes(l.eventType)).map(l => l.path)
        : _listeners.map(l => l.path);
}
exports.listenerPaths = listenerPaths;
/**
 * **getListeners**
 *
 * Returns the list of listeners.Optionally you can state the `EventType` and
 * filter down to only this type of event or "set of events".
 *
 * You can also just state "child" as the event and it will resolve to all child
 * events: `[ 'child_added', 'child_changed', 'child_removed', 'child_moved' ]`
 */
function getListeners(lookFor) {
    const childEvents = [
        "child_added",
        "child_changed",
        "child_removed",
        "child_moved"
    ];
    const allEvents = childEvents.concat(["value"]);
    const events = !lookFor
        ? allEvents
        : lookFor === "child"
            ? childEvents
            : lookFor;
    return _listeners.filter(l => events.includes(l.eventType));
}
exports.getListeners = getListeners;
function keyDidNotPreviouslyExist(e, dbSnapshot) {
    return lodash_get_1.default(dbSnapshot, e.key) === undefined ? true : false;
}
/**
 * **notify**
 *
 * Based on a dictionary of paths/values it reduces this to events to
 * send to zero or more listeners.
 */
function notify(data, dbSnapshot) {
    if (!shouldSendEvents()) {
        return;
    }
    const events = groupEventsByWatcher(data, dbSnapshot);
    events.forEach(e => {
        const isDeleteEvent = e.value === null || e.value === undefined;
        switch (e.listenerEvent) {
            case "child_removed":
                if (isDeleteEvent) {
                    e.callback(new index_1.SnapShot(e.key, e.priorValue));
                }
                return;
            case "child_added":
                if (!isDeleteEvent && keyDidNotPreviouslyExist(e, dbSnapshot)) {
                    e.callback(new index_1.SnapShot(e.key, e.value));
                }
                return;
            case "child_changed":
                if (!isDeleteEvent) {
                    e.callback(new index_1.SnapShot(e.key, e.value));
                }
                return;
            case "child_moved":
                if (!isDeleteEvent && keyDidNotPreviouslyExist(e, dbSnapshot)) {
                    // TODO: if we implement sorting then add the previousKey value
                    e.callback(new index_1.SnapShot(e.key, e.value));
                }
                return;
            case "value":
                const snapKey = new index_1.SnapShot(e.listenerPath, e.value).key;
                if (snapKey === e.key) {
                    // root set
                    e.callback(new index_1.SnapShot(e.listenerPath, e.value === null || e.value === undefined
                        ? undefined
                        : { [e.key]: e.value }));
                }
                else {
                    // property set
                    const value = e.value === null ? getDb(e.listenerPath) : e.value;
                    e.callback(new index_1.SnapShot(e.listenerPath, value));
                }
                return;
        }
    });
}
function priorKey(path, id) {
    let previous;
    const ids = lodash_get_1.default(exports.db, path);
    if (typeof ids === "object") {
        return null;
    }
    return Object.keys(ids).reduce((acc, curr) => {
        if (previous === id) {
            return id;
        }
        else {
            previous = id;
            return acc;
        }
    }, null);
}
/**
 * **findChildListeners**
 *
 * Finds "child events" listening to a given _parent path_; optionally
 * allowing for specification of the specific `EventType` or `EventType(s)`.
 *
 * @param changePath the _parent path_ that children are detected off of
 * @param eventTypes <optional> the specific child event (or events) to filter down to; if you have more than one then you should be aware that this property is destructured so the calling function should pass in an array of parameters rather than an array as the second parameter
 */
function findChildListeners(changePath, ...eventTypes) {
    changePath = util_1.stripLeadingDot(changePath.replace(/\//g, "."));
    eventTypes =
        eventTypes.length !== 0
            ? eventTypes
            : ["child_added", "child_changed", "child_moved", "child_removed"];
    const decendants = _listeners
        .filter(l => eventTypes.includes(l.eventType))
        .filter(l => changePath.startsWith(l.path))
        .reduce((acc, listener) => {
        const id = util_1.removeDots(changePath
            .replace(listener.path, "")
            .split(".")
            .filter(i => i)[0]);
        const remainingPath = util_1.stripLeadingDot(changePath.replace(util_1.stripLeadingDot(listener.path), ""));
        const changeIsAtRoot = id === remainingPath;
        acc.push(Object.assign(Object.assign({}, listener), { id, changeIsAtRoot }));
        return acc;
    }, []);
    return decendants;
}
exports.findChildListeners = findChildListeners;
/**
 * Finds all value listeners on a given path or below.
 * Unlike child listeners, Value listeners listen to changes at
 * all points below the registered path.
 *
 * @param path path to root listening point
 */
function findValueListeners(path) {
    return _listeners.filter(l => util_1.join(path).indexOf(util_1.join(l.path)) !== -1 && l.eventType === "value");
}
exports.findValueListeners = findValueListeners;
/** Clears the DB and removes all listeners */
function reset() {
    removeAllListeners();
    clearDatabase();
}
exports.reset = reset;
//# sourceMappingURL=database.js.map