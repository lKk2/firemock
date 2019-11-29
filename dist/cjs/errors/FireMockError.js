"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FireMockError extends Error {
    constructor(message, name = "firemock/error") {
        super(message);
        this.firemodel = true;
        this.code = name;
    }
}
exports.FireMockError = FireMockError;
//# sourceMappingURL=FireMockError.js.map