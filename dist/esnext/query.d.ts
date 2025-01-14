import { DataSnapshot, Query as IQuery, EventType, Reference as IReference } from "@firebase/database-types";
import SnapShot from "./snapshot";
import Reference from "./reference";
import { SerializedQuery } from "serialized-query";
import { DelayType } from "./util";
export declare type EventHandler = HandleValueEvent | HandleNewEvent | HandleRemoveEvent;
export declare type GenericEventHandler = (snap: SnapShot, key?: string) => void;
export declare type HandleValueEvent = (dataSnapShot: SnapShot) => void;
export declare type HandleNewEvent = (childSnapshot: SnapShot, prevChildKey: string) => void;
export declare type HandleRemoveEvent = (oldChildSnapshot: SnapShot) => void;
export declare type HandleMoveEvent = (childSnapshot: SnapShot, prevChildKey: string) => void;
export declare type HandleChangeEvent = (childSnapshot: SnapShot, prevChildKey: string) => void;
export declare type QueryValue = number | string | boolean | null;
export interface IListener {
    /** random string */
    id: string;
    /** the _query_ the listener is based off of */
    query: SerializedQuery;
    eventType: EventType;
    callback: (a: DataSnapshot | null, b?: string) => any;
    cancelCallbackOrContext?: object | null;
    context?: object | null;
}
export declare type IQueryFilter<T> = (resultset: T[]) => T[];
/** tslint:ignore:member-ordering */
export default class Query<T = any> implements IQuery {
    path: string;
    protected _delay: DelayType;
    /**
     * A static initializer which returns a **Firemock** `Query`
     * that has been configured with a `SerializedQuery`.
     *
     * @param query the _SerializedQuery_ to configure with
     */
    static create(query: SerializedQuery): Query<any>;
    protected _query: SerializedQuery;
    constructor(path: string, _delay?: DelayType);
    get ref(): Reference<T>;
    limitToLast(num: number): Query<T>;
    limitToFirst(num: number): Query<T>;
    equalTo(value: QueryValue, key?: Extract<keyof T, string>): Query<T>;
    /** Creates a Query with the specified starting point. */
    startAt(value: QueryValue, key?: string): Query<T>;
    endAt(value: QueryValue, key?: string): Query<T>;
    /**
     * Setup an event listener for a given eventType
     */
    on(eventType: EventType, callback: (a: DataSnapshot, b?: null | string) => any, cancelCallbackOrContext?: (err?: Error) => void | null, context?: object | null): (a: DataSnapshot, b?: null | string) => Promise<null>;
    once(eventType: "value"): Promise<DataSnapshot>;
    off(): void;
    /**
     * Returns a boolean flag based on whether the two queries --
     * _this_ query and the one passed in -- are equivalen in scope.
     */
    isEqual(other: Query): boolean;
    /**
     * When the children of a query are all objects, then you can sort them by a
     * specific property. Note: if this happens a lot then it's best to explicitly
     * index on this property in the database's config.
     */
    orderByChild(prop: string): Query<T>;
    /**
     * When the children of a query are all scalar values (string, number, boolean), you
     * can order the results by their (ascending) values
     */
    orderByValue(): Query<T>;
    /**
     * order is based on the order of the
     * "key" which is time-based if you are using Firebase's
     * _push-keys_.
     *
     * **Note:** this is the default sort if no sort is specified
     */
    orderByKey(): Query<T>;
    /** NOT IMPLEMENTED */
    orderByPriority(): Query<T>;
    toJSON(): {
        identity: string;
        query: import("serialized-query").ISerializedQueryIdentity<import("common-types").IDictionary<any>>;
    };
    toString(): string;
    /**
     * This is an undocumented API endpoint that is within the
     * typing provided by Google
     */
    protected getKey(): string | null;
    /**
     * This is an undocumented API endpoint that is within the
     * typing provided by Google
     */
    protected getParent(): IReference | null;
    /**
     * This is an undocumented API endpoint that is within the
     * typing provided by Google
     */
    protected getRoot(): IReference;
    /**
     * Reduce the dataset using _filters_ (after sorts) but do not apply sort
     * order to new SnapShot (so natural order is preserved)
     */
    private getQuerySnapShot;
}
