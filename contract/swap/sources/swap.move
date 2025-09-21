module swap::swap {

    use sui::balance::{Self, Balance};
    use swap::USD::USD;
    use swap::VND::VND;
    use sui::coin::{Self, Coin};
    use swap::custom_oracle::{Price, get_price};

    public struct Pool has key {
        id: UID,
        test_VND: Balance<VND>,
        test_USD: Balance<USD>
    }

    fun init (ctx: &mut TxContext){
        let pool = Pool{
            id: object::new(ctx),
            test_VND: balance::zero<VND>(),
            test_USD: balance::zero<USD>(),
        };
        transfer::share_object(pool);
    }

    #[allow(unused_function)]
    entry fun add_money_to_pool(pool: &mut Pool, test_VND: Coin<VND>, test_USD: Coin<USD>){
        pool.test_VND.join(test_VND.into_balance());
        pool.test_USD.join(test_USD.into_balance());
    }

    public entry fun deposit_VND(pool: &mut Pool, user_coin: Coin<VND>, ctx: &mut TxContext){
        coin::put(&mut pool.test_VND, user_coin);
    }

    public entry fun deposit_USD(pool: &mut Pool, user_coin: Coin<USD>, ctx: &mut TxContext){
        coin::put(&mut pool.test_USD, user_coin);
    }

    /// Swap VND sang USD theo tỉ giá từ oracle
    public entry fun swap_VND_to_USD(pool: &mut Pool, my_coin: Coin<VND>, price: &Price, ctx: &mut TxContext){
        let amount_vnd = my_coin.value();
        assert!(amount_vnd > 0, 0);

        let rate = get_price(price); // tỉ giá USD/VND, ví dụ: 24500
        assert!(rate > 0, 1);

        let amount_usd = amount_vnd / rate;
        assert!(pool.test_USD.value() >= amount_usd, 2);

        pool.test_VND.join(my_coin.into_balance());

        let output_coin = coin::take(&mut pool.test_USD, amount_usd, ctx);
        transfer::public_transfer(output_coin, ctx.sender());
    }

    /// Swap USD sang VND theo tỉ giá từ oracle
    public entry fun swap_USD_to_VND(pool: &mut Pool, my_coin: Coin<USD>, price: &Price, ctx: &mut TxContext){
        let amount_usd = my_coin.value();
        assert!(amount_usd > 0, 0);

        let rate = get_price(price); // tỉ giá USD/VND
        assert!(rate > 0, 1);

        let amount_vnd = amount_usd * rate;
        assert!(pool.test_VND.value() >= amount_vnd, 2);

        pool.test_USD.join(my_coin.into_balance());

        let output_coin = coin::take(&mut pool.test_VND, amount_vnd, ctx);
        transfer::public_transfer(output_coin, ctx.sender());
    }
}