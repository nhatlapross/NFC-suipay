module nfc_payment::payment_system {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::object::{Self, UID};
    use std::string::String;
    
    /// Payment record structure
    struct PaymentRecord has key, store {
        id: UID,
        payer: address,
        recipient: address,
        amount: u64,
        timestamp: u64,
        merchant_name: String,
        transaction_id: String,
    }
    
    /// Wallet structure with limits
    struct UserWallet has key, store {
        id: UID,
        owner: address,
        daily_limit: u64,
        daily_spent: u64,
        last_reset_day: u64,
        is_active: bool,
    }
    
    /// Process payment
    public entry fun process_payment(
        wallet: &mut UserWallet,
        payment: Coin<SUI>,
        recipient: address,
        merchant_name: String,
        transaction_id: String,
        ctx: &mut TxContext
    ) {
        assert!(wallet.is_active, 1); // Wallet must be active
        
        let amount = coin::value(&payment);
        assert!(wallet.daily_spent + amount <= wallet.daily_limit, 2); // Check daily limit
        
        wallet.daily_spent = wallet.daily_spent + amount;
        
        // Transfer payment
        transfer::public_transfer(payment, recipient);
        
        // Create payment record
        let record = PaymentRecord {
            id: object::new(ctx),
            payer: tx_context::sender(ctx),
            recipient,
            amount,
            timestamp: tx_context::epoch(ctx),
            merchant_name,
            transaction_id,
        };
        
        transfer::share_object(record);
    }
    
    /// Create new wallet
    public entry fun create_wallet(
        daily_limit: u64,
        ctx: &mut TxContext
    ) {
        let wallet = UserWallet {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            daily_limit,
            daily_spent: 0,
            last_reset_day: tx_context::epoch(ctx),
            is_active: true,
        };
        
        transfer::share_object(wallet);
    }
    
    /// Emergency pause wallet
    public entry fun pause_wallet(
        wallet: &mut UserWallet,
        ctx: &TxContext
    ) {
        assert!(wallet.owner == tx_context::sender(ctx), 3); // Only owner can pause
        wallet.is_active = false;
    }
}