"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../auth");
let authConfig = {
    allowAnonymous: true
};
let ANONYMOUS_USER_ID = "123456";
exports.authAdminApi = {
    configureAuth(config) {
        authConfig = Object.assign({}, authConfig, config);
    },
    getValidEmails() {
        return authConfig.validEmailLogins || [];
    },
    getAuthConfig() {
        return authConfig;
    },
    setAnonymousUser(uid) {
        ANONYMOUS_USER_ID = uid;
        return auth_1.authApi;
    },
    getAnonymousUid() {
        return ANONYMOUS_USER_ID;
    }
};
//# sourceMappingURL=authAdmin.js.map