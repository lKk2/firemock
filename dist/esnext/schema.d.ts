import { IDictionary } from "common-types";
import SchemaHelper from "./schema-helper";
export interface ISchema {
    id: string;
    /** path to the database which is the root for given schema list */
    path: () => string;
    prefix?: string;
    /** mock generator function */
    fn: () => IDictionary;
    /**
     * the name of the entity being mocked, if not set then schema name
     * is assume to equal model name
     */
    modelName?: string;
}
/**
 * A higher level function which receives a schema-helper and then
 * waits for lazy evaluation.
 */
export declare type SchemaCallback = (helper: SchemaHelper) => any;
/**
 * The property that exists on the source scheme as a FK reference
 * to the external schema/entity.
 */
export declare type SourceProperty = string;
export default class Schema<T = any> {
    schemaId: string;
    private _schemas;
    private _relationships;
    private _prefix;
    constructor(schemaId: string);
    /**
     * Add a mocking function to be used to generate the schema in mock DB
     */
    mock(cb: SchemaCallback): this;
    /**
     * There are times where it's appropriate to have multiple schemas for
     * the same entity/model, in this case you'll want to state what model
     * your schema is emulating. If you don't state this property it assumes
     * the schema name IS the model name
     */
    modelName(value: string): this;
    /** prefixes a static path to the beginning of the  */
    pathPrefix(prefix: string): this;
    /**
     * The default pluralizer is quite simple so if you find that
     * it is pluralizing incorrectly then you can manually state
     * the plural name.
     */
    pluralName(plural: string): this;
    /**
     * Configures a "belongsTo" relationship with another schema/entity
     */
    belongsTo(target: string, sourceProperty?: SourceProperty): this;
    /**
     * Configures a "hasMany" relationship with another schema/entity
     */
    hasMany(target: string, sourceProperty?: SourceProperty): this;
    /** Add another schema */
    addSchema<D>(schema: string, mock?: SchemaCallback): Schema<D>;
}
