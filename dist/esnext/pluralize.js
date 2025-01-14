const exceptions = {
    child: 'children',
    man: 'men',
    woman: 'women',
    tooth: 'teeth',
    foot: 'feet',
    mouse: 'mice',
    person: 'people',
    company: 'companies'
};
/**
 * Exceptions when moving from plural to singular
 */
const singularExceptions = () => {
    return Object.keys(pluralize).reduce((agg, k) => agg[exceptions[k]] = k, new Object());
};
export default function pluralize(singular) {
    const rules = [
        { find: /(.*)(ch|sh|ax|ss)$/, replace: '$1$2es' },
        { find: /(.*)(fe|f)$/, replace: '$1ves' },
        { find: /(.*)us$/, replace: '$1i' }
    ];
    for (const r of rules) {
        if (r.find.test(singular)) {
            return singular.replace(r.find, r.replace);
        }
    }
    return exceptions[singular] ? exceptions[singular] : `${singular}s`;
}
;
export const addException = (singular, plural) => {
    exceptions[singular] = plural;
};
export const singularize = (plural) => {
    //
};
//# sourceMappingURL=pluralize.js.map