module swap::custom_oracle {
    use sui::tx_context::TxContext;
    use sui::object::{Self, UID};
    use sui::transfer;

    public struct Price has key {
        id: UID,
        value: u64, // giá USD/VND, ví dụ: 24500
        timestamp: u64,
    }

    /// Khởi tạo Price object với giá từ backend
    entry fun create_price(initial_value: u64, initial_timestamp: u64, ctx: &mut TxContext) {
        let price = Price {
            id: object::new(ctx),
            value: initial_value, // Giá từ backend (CoinGecko)
            timestamp: initial_timestamp, // Timestamp từ backend
        };
        transfer::share_object(price);
    }

    entry fun update_price(price: &mut Price, new_value: u64, new_timestamp: u64 , ctx: &mut TxContext) {
        price.value = new_value;
        price.timestamp = new_timestamp;
    }

    public fun get_price(price: &Price): u64 {
        price.value
    }
}