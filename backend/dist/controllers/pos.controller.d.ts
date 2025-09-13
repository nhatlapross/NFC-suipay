import { Request, Response, NextFunction } from 'express';
export declare class POSController {
    /**
     * Khởi tạo POS session sau khi NFC scan thành công
     * POST /payment/pos-initiate
     */
    initiatePOSSession(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
    /**
     * Xác thực người dùng trên POS terminal (PIN/Signature)
     * POST /payment/pos-authenticate
     */
    authenticatePOS(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
    /**
     * Lấy thông tin session POS
     * GET /payment/pos-session/:sessionId
     */
    getPOSSession(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
    private verifySignature;
    private verifyBiometric;
    /**
     * Hủy POS session
     * DELETE /pos/session/:sessionId
     */
    cancelPOSSession(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
    /**
     * Lấy thông tin terminal
     * GET /pos/terminal/:terminalId
     */
    getTerminalInfo(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
    /**
     * Đăng ký terminal mới
     * POST /pos/terminal/register
     */
    registerTerminal(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
    /**
     * Cập nhật terminal
     * PUT /pos/terminal/:terminalId
     */
    updateTerminal(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
    /**
     * Vô hiệu hóa terminal
     * DELETE /pos/terminal/:terminalId
     */
    deactivateTerminal(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
    /**
     * Lấy danh sách giao dịch POS
     * GET /pos/transactions
     */
    getPOSTransactions(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
    /**
     * Lấy thống kê POS
     * GET /pos/stats
     */
    getPOSStats(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
}
export declare const posController: POSController;
//# sourceMappingURL=pos.controller.d.ts.map