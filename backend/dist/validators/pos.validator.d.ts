export declare const posValidators: {
    /**
     * Validation for POS session initiation
     * POST /pos/initiate
     */
    initiatePOSSession: import("express-validator").ValidationChain[];
    /**
     * Validation for POS authentication
     * POST /pos/authenticate
     */
    authenticatePOS: import("express-validator").ValidationChain[];
    /**
     * Validation for getting POS session
     * GET /pos/session/:sessionId
     */
    getPOSSession: import("express-validator").ValidationChain[];
    /**
     * Validation for cancelling POS session
     * DELETE /pos/session/:sessionId
     */
    cancelPOSSession: import("express-validator").ValidationChain[];
    /**
     * Validation for registering POS terminal
     * POST /pos/terminal/register
     */
    registerTerminal: import("express-validator").ValidationChain[];
    /**
     * Validation for getting terminal info
     * GET /pos/terminal/:terminalId
     */
    getTerminal: import("express-validator").ValidationChain[];
    /**
     * Validation for updating terminal
     * PUT /pos/terminal/:terminalId
     */
    updateTerminal: import("express-validator").ValidationChain[];
    /**
     * Validation for deactivating terminal
     * DELETE /pos/terminal/:terminalId
     */
    deactivateTerminal: import("express-validator").ValidationChain[];
    /**
     * Validation for getting POS transactions
     * GET /pos/transactions
     */
    getPOSTransactions: import("express-validator").ValidationChain[];
    /**
     * Validation for PIN verification
     * POST /pos/verify-pin
     */
    verifyPIN: import("express-validator").ValidationChain[];
    /**
     * Validation for signature verification
     * POST /pos/verify-signature
     */
    verifySignature: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=pos.validator.d.ts.map