/// Struct representing the account for migration data.
use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct Migrate {
    /// admin Pubkey
    pub admin: Pubkey,

    /// Flag indicating emergency pause status.
    pub emergency_pause: bool,

    /// ZBC(old) mint key
    pub zbc_mint: Pubkey,

    /// ZBCN mint key
    pub zbcn_mint: Pubkey,

    /// Number of transactions processed by the program.
    pub transaction_count: u64,

    /// Total number of tokens migrated.
    pub total_migrated: u64,
}
