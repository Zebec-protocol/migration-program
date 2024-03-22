use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::Migrate;

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init_if_needed,   
        payer = admin,
        space = 8 + std::mem::size_of::<Migrate>(),
        seeds = [b"migrate"],
        bump
    )]
    pub migrate_pda: Box<Account<'info, Migrate>>,
    #[account(
        init_if_needed,   
        payer = admin,
        space = 8,
        seeds = [b"zbcn_mint"],
        bump
    )]
    /// CHECK:
    pub mint_authority: AccountInfo<'info>,
    pub zbc_mint: Account<'info, Mint>,
    pub zbcn_mint: Account<'info, Mint>,
    pub system_program: Program<'info,System>
}

pub fn handler(ctx: Context<InitConfig>) -> Result<()> {
    let migrate = &mut ctx.accounts.migrate_pda;
    migrate.admin = *ctx.accounts.admin.key;
    migrate.emergency_pause = false;
    migrate.zbc_mint = *ctx.accounts.zbc_mint.to_account_info().key;
    migrate.zbcn_mint = *ctx.accounts.zbcn_mint.to_account_info().key;
    migrate.transaction_count = 0;
    migrate.total_migrated = 0;
    Ok(())
}


