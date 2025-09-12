export interface PaymentDashboardStats {
    totalTransactions: {
        today: number;
        week: number;
        month: number;
    };
    totalVolume: {
        today: number;
        week: number;
        month: number;
    };
    successRate: {
        today: number;
        week: number;
        month: number;
    };
    failureAnalysis: {
        networkErrors: number;
        cardErrors: number;
        insufficientFunds: number;
        merchantErrors: number;
        systemErrors: number;
    };
    activeCards: number;
    activeMerchants: number;
    averageTransactionTime: number;
}
export interface TransactionFilter {
    status?: string;
    merchantId?: string;
    userId?: string;
    cardId?: string;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    paymentMethod?: string;
}
export declare class AdminService {
    getPaymentDashboard(): Promise<PaymentDashboardStats>;
    private getTransactionStats;
    private getFailureAnalysis;
    private getAverageTransactionTime;
    getTransactions(filter: TransactionFilter, page?: number, limit?: number): Promise<{
        transactions: (import("mongoose").FlattenMaps<import("../models/Transaction.model").ITransaction> & Required<{
            _id: import("mongoose").FlattenMaps<unknown>;
        }> & {
            __v: number;
        })[];
        total: number;
        pages: number;
        currentPage: number;
    }>;
    getTransactionById(transactionId: string): Promise<import("mongoose").FlattenMaps<import("../models/Transaction.model").ITransaction> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    }>;
    forceRefundTransaction(transactionId: string, reason: string, adminId: string): Promise<{
        originalTransaction: import("mongoose").Document<unknown, {}, import("../models/Transaction.model").ITransaction, {}, {}> & import("../models/Transaction.model").ITransaction & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
        refundTransaction: import("mongoose").Document<unknown, {}, import("../models/Transaction.model").ITransaction, {}, {}> & import("../models/Transaction.model").ITransaction & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
        refundAmount: number;
    }>;
    updateTransactionStatus(transactionId: string, newStatus: string, reason?: string, adminId?: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Transaction.model").ITransaction, {}, {}> & import("../models/Transaction.model").ITransaction & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getCardHealthStatus(): Promise<{
        cardStats: any;
        problematicCards: any[];
    }>;
    getCardById(cardId: string): Promise<{
        recentTransactions: (import("mongoose").FlattenMaps<import("../models/Transaction.model").ITransaction> & Required<{
            _id: import("mongoose").FlattenMaps<unknown>;
        }> & {
            __v: number;
        })[];
        cardUuid: string;
        userId: import("mongoose").Types.ObjectId;
        cardType: "standard" | "premium" | "corporate" | "virtual" | "physical" | "test";
        cardNumber: string;
        isActive: boolean;
        isPrimary: boolean;
        issueDate: Date;
        expiryDate: Date;
        lastUsed?: Date | undefined;
        usageCount: number;
        dailySpent: number;
        monthlySpent: number;
        dailyLimit: number;
        monthlyLimit: number;
        singleTransactionLimit: number;
        lastResetDate: Date;
        blockedAt?: Date | undefined;
        blockedReason?: string | undefined;
        metadata?: import("mongoose").FlattenMaps<Record<string, any>> | undefined;
        createdAt: Date;
        updatedAt: Date;
        isExpired: boolean;
        _id: import("mongoose").FlattenMaps<unknown>;
        $assertPopulated: <Paths = {}>(path: string | string[], values?: Partial<Paths> | undefined) => Omit<import("../models/Card.model").ICard, keyof Paths> & Paths;
        $clearModifiedPaths: () => import("../models/Card.model").ICard;
        $clone: () => import("../models/Card.model").ICard;
        $createModifiedPathsSnapshot: () => import("mongoose").ModifiedPathsSnapshot;
        $getAllSubdocs: () => import("mongoose").Document[];
        $ignore: (path: string) => void;
        $isDefault: (path?: string) => boolean;
        $isDeleted: (val?: boolean) => boolean;
        $getPopulatedDocs: () => import("mongoose").Document[];
        $inc: (path: string | string[], val?: number) => import("../models/Card.model").ICard;
        $isEmpty: (path: string) => boolean;
        $isValid: (path: string) => boolean;
        $locals: import("mongoose").FlattenMaps<Record<string, unknown>>;
        $markValid: (path: string) => void;
        $model: {
            <ModelType = import("mongoose").Model<unknown, {}, {}, {}, import("mongoose").Document<unknown, {}, unknown, {}, {}> & {
                _id: import("mongoose").Types.ObjectId;
            } & {
                __v: number;
            }, any>>(name: string): ModelType;
            <ModelType = import("mongoose").Model<any, {}, {}, {}, any, any>>(): ModelType;
        };
        $op: "save" | "validate" | "remove" | null;
        $restoreModifiedPathsSnapshot: (snapshot: import("mongoose").ModifiedPathsSnapshot) => import("../models/Card.model").ICard;
        $session: (session?: import("mongoose").ClientSession | null) => import("mongoose").ClientSession | null;
        $set: {
            (path: string | Record<string, any>, val: any, type: any, options?: import("mongoose").DocumentSetOptions): import("../models/Card.model").ICard;
            (path: string | Record<string, any>, val: any, options?: import("mongoose").DocumentSetOptions): import("../models/Card.model").ICard;
            (value: string | Record<string, any>): import("../models/Card.model").ICard;
        };
        $where: import("mongoose").FlattenMaps<Record<string, unknown>>;
        baseModelName?: string | undefined;
        collection: import("mongoose").FlattenMaps<import("mongoose").Collection<import("bson").Document>>;
        db: import("mongoose").FlattenMaps<import("mongoose").Connection>;
        deleteOne: (options?: import("mongoose").QueryOptions) => any;
        depopulate: <Paths = {}>(path?: string | string[]) => import("mongoose").MergeType<import("../models/Card.model").ICard, Paths>;
        directModifiedPaths: () => Array<string>;
        equals: (doc: import("mongoose").Document<unknown, any, any, Record<string, any>, {}>) => boolean;
        errors?: import("mongoose").Error.ValidationError | undefined;
        get: {
            <T extends string | number | symbol>(path: T, type?: any, options?: any): any;
            (path: string, type?: any, options?: any): any;
        };
        getChanges: () => import("mongoose").UpdateQuery<import("../models/Card.model").ICard>;
        id?: any;
        increment: () => import("../models/Card.model").ICard;
        init: (obj: import("mongoose").AnyObject, opts?: import("mongoose").AnyObject) => import("../models/Card.model").ICard;
        invalidate: {
            <T extends string | number | symbol>(path: T, errorMsg: string | NativeError, value?: any, kind?: string): NativeError | null;
            (path: string, errorMsg: string | NativeError, value?: any, kind?: string): NativeError | null;
        };
        isDirectModified: {
            <T extends string | number | symbol>(path: T | T[]): boolean;
            (path: string | Array<string>): boolean;
        };
        isDirectSelected: {
            <T extends string | number | symbol>(path: T): boolean;
            (path: string): boolean;
        };
        isInit: {
            <T extends string | number | symbol>(path: T): boolean;
            (path: string): boolean;
        };
        isModified: {
            <T extends string | number | symbol>(path?: T | T[] | undefined, options?: {
                ignoreAtomics?: boolean;
            } | null): boolean;
            (path?: string | Array<string>, options?: {
                ignoreAtomics?: boolean;
            } | null): boolean;
        };
        isNew: boolean;
        isSelected: {
            <T extends string | number | symbol>(path: T): boolean;
            (path: string): boolean;
        };
        markModified: {
            <T extends string | number | symbol>(path: T, scope?: any): void;
            (path: string, scope?: any): void;
        };
        model: {
            <ModelType = import("mongoose").Model<unknown, {}, {}, {}, import("mongoose").Document<unknown, {}, unknown, {}, {}> & {
                _id: import("mongoose").Types.ObjectId;
            } & {
                __v: number;
            }, any>>(name: string): ModelType;
            <ModelType = import("mongoose").Model<any, {}, {}, {}, any, any>>(): ModelType;
        };
        modifiedPaths: (options?: {
            includeChildren?: boolean;
        }) => Array<string>;
        overwrite: (obj: import("mongoose").AnyObject) => import("../models/Card.model").ICard;
        $parent: () => import("mongoose").Document | undefined;
        populate: {
            <Paths = {}>(path: string | import("mongoose").PopulateOptions | (string | import("mongoose").PopulateOptions)[]): Promise<import("mongoose").MergeType<import("../models/Card.model").ICard, Paths>>;
            <Paths = {}>(path: string, select?: string | import("mongoose").AnyObject, model?: import("mongoose").Model<any>, match?: import("mongoose").AnyObject, options?: import("mongoose").PopulateOptions): Promise<import("mongoose").MergeType<import("../models/Card.model").ICard, Paths>>;
        };
        populated: (path: string) => any;
        replaceOne: (replacement?: import("mongoose").AnyObject, options?: import("mongoose").QueryOptions | null) => import("mongoose").Query<any, import("../models/Card.model").ICard, {}, unknown, "find", Record<string, never>>;
        save: (options?: import("mongoose").SaveOptions) => Promise<import("../models/Card.model").ICard>;
        schema: import("mongoose").FlattenMaps<import("mongoose").Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
            [x: string]: unknown;
        }, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
            [x: string]: unknown;
        }>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
            [x: string]: unknown;
        }> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }>>;
        set: {
            <T extends string | number | symbol>(path: T, val: any, type: any, options?: import("mongoose").DocumentSetOptions): import("../models/Card.model").ICard;
            (path: string | Record<string, any>, val: any, type: any, options?: import("mongoose").DocumentSetOptions): import("../models/Card.model").ICard;
            (path: string | Record<string, any>, val: any, options?: import("mongoose").DocumentSetOptions): import("../models/Card.model").ICard;
            (value: string | Record<string, any>): import("../models/Card.model").ICard;
        };
        toJSON: {
            (options: import("mongoose").ToObjectOptions & {
                versionKey: false;
                virtuals: true;
                flattenObjectIds: true;
            }): Omit<{
                [x: string]: any;
            }, "__v">;
            (options: import("mongoose").ToObjectOptions & {
                virtuals: true;
                flattenObjectIds: true;
            }): {
                [x: string]: any;
            };
            (options: import("mongoose").ToObjectOptions & {
                versionKey: false;
                virtuals: true;
            }): Omit<any, "__v">;
            (options: import("mongoose").ToObjectOptions & {
                versionKey: false;
                flattenObjectIds: true;
            }): {
                [x: string]: any;
                [x: number]: any;
                [x: symbol]: any;
            };
            (options: import("mongoose").ToObjectOptions & {
                virtuals: true;
            }): any;
            (options: import("mongoose").ToObjectOptions & {
                versionKey: false;
            }): Omit<any, "__v">;
            (options?: import("mongoose").ToObjectOptions & {
                flattenMaps?: true;
                flattenObjectIds?: false;
            }): import("mongoose").FlattenMaps<any>;
            (options: import("mongoose").ToObjectOptions & {
                flattenObjectIds: false;
            }): import("mongoose").FlattenMaps<any>;
            (options: import("mongoose").ToObjectOptions & {
                flattenObjectIds: true;
            }): {
                [x: string]: any;
            };
            (options: import("mongoose").ToObjectOptions & {
                flattenMaps: false;
            }): any;
            (options: import("mongoose").ToObjectOptions & {
                flattenMaps: false;
                flattenObjectIds: true;
            }): any;
            <T = any>(options?: import("mongoose").ToObjectOptions & {
                flattenMaps?: true;
                flattenObjectIds?: false;
            }): import("mongoose").FlattenMaps<T>;
            <T = any>(options: import("mongoose").ToObjectOptions & {
                flattenObjectIds: false;
            }): import("mongoose").FlattenMaps<T>;
            <T = any>(options: import("mongoose").ToObjectOptions & {
                flattenObjectIds: true;
            }): import("mongoose").ObjectIdToString<import("mongoose").FlattenMaps<T>>;
            <T = any>(options: import("mongoose").ToObjectOptions & {
                flattenMaps: false;
            }): T;
            <T = any>(options: import("mongoose").ToObjectOptions & {
                flattenMaps: false;
                flattenObjectIds: true;
            }): import("mongoose").ObjectIdToString<T>;
        };
        toObject: {
            (options: import("mongoose").ToObjectOptions & {
                versionKey: false;
                virtuals: true;
                flattenObjectIds: true;
            }): Omit<any, "__v">;
            (options: import("mongoose").ToObjectOptions & {
                virtuals: true;
                flattenObjectIds: true;
            }): any;
            (options: import("mongoose").ToObjectOptions & {
                versionKey: false;
                flattenObjectIds: true;
            }): Omit<any, "__v">;
            (options: import("mongoose").ToObjectOptions & {
                versionKey: false;
                virtuals: true;
            }): Omit<any, "__v">;
            (options: import("mongoose").ToObjectOptions & {
                virtuals: true;
            }): any;
            (options: import("mongoose").ToObjectOptions & {
                versionKey: false;
            }): Omit<any, "__v">;
            (options: import("mongoose").ToObjectOptions & {
                flattenObjectIds: true;
            }): any;
            (options?: import("mongoose").ToObjectOptions): any;
            <T>(options?: import("mongoose").ToObjectOptions): import("mongoose").Require_id<T> & {
                __v: number;
            };
        };
        unmarkModified: {
            <T extends string | number | symbol>(path: T): void;
            (path: string): void;
        };
        updateOne: (update?: import("mongoose").UpdateWithAggregationPipeline | import("mongoose").UpdateQuery<import("../models/Card.model").ICard> | undefined, options?: import("mongoose").QueryOptions | null) => import("mongoose").Query<any, import("../models/Card.model").ICard, {}, unknown, "find", Record<string, never>>;
        validate: {
            <T extends string | number | symbol>(pathsToValidate?: T | T[] | undefined, options?: import("mongoose").AnyObject): Promise<void>;
            (pathsToValidate?: import("mongoose").pathsToValidate, options?: import("mongoose").AnyObject): Promise<void>;
            (options: {
                pathsToSkip?: import("mongoose").pathsToSkip;
            }): Promise<void>;
        };
        validateSync: {
            (options: {
                pathsToSkip?: import("mongoose").pathsToSkip;
                [k: string]: any;
            }): import("mongoose").Error.ValidationError | null;
            <T extends string | number | symbol>(pathsToValidate?: T | T[] | undefined, options?: import("mongoose").AnyObject): import("mongoose").Error.ValidationError | null;
            (pathsToValidate?: import("mongoose").pathsToValidate, options?: import("mongoose").AnyObject): import("mongoose").Error.ValidationError | null;
        };
        __v: number;
    }>;
    blockCard(cardId: string, reason: string, adminId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Card.model").ICard, {}, {}> & import("../models/Card.model").ICard & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    unblockCard(cardId: string, adminId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Card.model").ICard, {}, {}> & import("../models/Card.model").ICard & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getSystemHealthMetrics(): Promise<{
        transactionMetrics: any[];
        errorMetrics: any[];
        performanceMetrics: any;
        systemStatus: {
            activeUsers: number;
            activeMerchants: number;
            activeCards: number;
            databaseStatus: string;
            cacheStatus: string;
            queueStatus: string;
        };
        timestamp: Date;
    }>;
    private getTransactionMetrics;
    private getErrorMetrics;
    private getPerformanceMetrics;
    private getSystemStatus;
    getMerchantPaymentHealth(merchantId?: string): Promise<{
        merchantId: any;
        merchantName: any;
        totalTransactions: any;
        successRate: number;
        failedTransactions: any;
        totalVolume: any;
        avgTransactionAmount: number;
        isHealthy: boolean;
    }[]>;
}
export declare const adminService: AdminService;
//# sourceMappingURL=admin.service.d.ts.map