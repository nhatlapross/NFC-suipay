export interface CreateCardData {
    cardType: "virtual" | "physical";
    cardName?: string;
    limits?: {
        daily?: number;
        monthly?: number;
    };
}
export interface CardResponse {
    id: string;
    cardUuid: string;
    cardType: string;
    isActive: boolean;
    isPrimary: boolean;
    dailyLimit: number;
    monthlyLimit: number;
    dailySpent: number;
    monthlySpent: number;
    singleTransactionLimit: number;
    issueDate: Date;
    expiryDate: Date;
    usageCount: number;
    lastUsed?: Date;
    blockedAt?: Date;
    blockedReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CardService {
    createCard(userId: string, cardData: CreateCardData): Promise<CardResponse>;
    getUserCards(userId: string, filters?: {
        status?: string;
        type?: string;
    }): Promise<CardResponse[]>;
    getCardById(cardId: string, userId?: string): Promise<CardResponse>;
    updateCard(cardId: string, userId: string, updateData: any): Promise<CardResponse>;
    deleteCard(cardId: string, userId: string): Promise<void>;
    setPrimaryCard(cardId: string, userId: string): Promise<CardResponse>;
    private generateCardNumber;
    private formatCardResponse;
}
export declare const cardService: CardService;
//# sourceMappingURL=card.service.d.ts.map