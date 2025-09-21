
/// Module: my_coin
module swap::USD;

use sui::coin::{TreasuryCap};
use sui::coin;
use sui::tx_context;
use sui::transfer;
use sui::url::{Self, Url};
use std::option::{Self, Option};

// one time witness
public struct USD has drop {}

fun init (witness: USD, ctx: &mut TxContext) {

    let (treasury_cap, coin_metadata) = coin::create_currency(
        witness,
        9,
        b"sUSD",
        b"Synthetic USD",
        b"stablecoin",
        option::some(url::new_unsafe_from_bytes(b"https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-usd-coin-usdc-digital-stablecoin-icon-technology-pay-web-vector-png-image_37843734.png")),
        ctx
    );

    transfer::public_freeze_object(coin_metadata);
    transfer::public_transfer(treasury_cap, ctx.sender());

}

entry fun mint_token (treasury_cap: &mut TreasuryCap<USD>, ctx: &mut TxContext) {
    let coin_obj = coin::mint(treasury_cap, 1000000000000000, ctx);
    transfer::public_transfer(coin_obj, ctx.sender());
}


