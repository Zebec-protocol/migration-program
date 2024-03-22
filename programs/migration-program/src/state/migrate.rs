use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct Migrate {
    pub admin: Pubkey,
    pub emergency_pause: bool,
    pub zbc_mint: Pubkey,
    pub zbcn_mint: Pubkey,
    pub transaction_count: u64,
    pub total_migrated: u64,
}
