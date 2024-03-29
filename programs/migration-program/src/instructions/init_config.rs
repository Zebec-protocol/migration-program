use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::Migrate;

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,   
        payer = admin,
        space = 8 + std::mem::size_of::<Migrate>(),
        seeds = [b"migrate"],
        bump
    )]
    /// PDA that stores the migration state and authority.
    pub migrate_pda: Box<Account<'info, Migrate>>,
    #[account(
        init,   
        payer = admin,
        space = 8,
        seeds = [b"zbcn_mint"],
        bump
    )]
    /// CHECK: seeds has been checked
    /// This account has mint authority for ZBCN tokens.
    pub mint_authority: AccountInfo<'info>, 
    /// ZBC (new) mint account.
    pub zbc_mint: Account<'info, Mint>,
    /// ZBCN (old) mint account.
    #[account(mint::authority = mint_authority)]
    pub zbcn_mint: Account<'info, Mint>,
    pub system_program: Program<'info,System>
}

/// This function initializes the migration program with the necessary configuration.
pub fn handler(ctx: Context<InitConfig>) -> Result<()> {
    let migrate = &mut ctx.accounts.migrate_pda;
    migrate.admin = *ctx.accounts.admin.key; // Set admin key.
    migrate.emergency_pause = false; // initial emergency pause status
    migrate.zbc_mint = *ctx.accounts.zbc_mint.to_account_info().key; // Set ZBC mint key.
    migrate.zbcn_mint = *ctx.accounts.zbcn_mint.to_account_info().key; // Set ZBCN mint key.
    migrate.transaction_count = 0; // initial transaction count
    migrate.total_migrated = 0; // initial total migrated tokens
    Ok(())
}


