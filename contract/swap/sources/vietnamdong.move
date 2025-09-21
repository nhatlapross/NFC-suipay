
/// Module: my_coin
module swap::VND;

use sui::coin::{TreasuryCap};
use sui::coin;
use sui::tx_context;
use sui::transfer;
use sui::url::{Self, Url};
use std::option::{Self, Option};

// one time witness
public struct VND has drop {}

fun init (witness: VND, ctx: &mut TxContext) {

    let (treasury_cap, coin_metadata) = coin::create_currency(
        witness,
        9,
        b"sVND",
        b"Viet Nam Dong",
        b"native vietnamese currency",
        option::some(url::new_unsafe_from_bytes(b"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIy3vv5ohxUW1qiaNWKnaHW0iZatYn6OYCfw&s")),
        ctx
    );

    transfer::public_freeze_object(coin_metadata);
    transfer::public_transfer(treasury_cap, ctx.sender());

}

entry fun mint_token (treasury_cap: &mut TreasuryCap<VND>, ctx: &mut TxContext) {
    let coin_obj = coin::mint(treasury_cap, 1000000000000000, ctx);
    transfer::public_transfer(coin_obj, ctx.sender());
}


