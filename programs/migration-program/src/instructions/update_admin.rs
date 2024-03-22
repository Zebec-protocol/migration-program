use anchor_lang::prelude::*;

use crate::{state::Migrate, MigrationError};

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"migrate"],
        bump
    )]
    pub migrate_pda: Box<Account<'info, Migrate>>,
    /// CHECK:
    pub new_admin: AccountInfo<'info>,
}

pub fn handler(ctx: Context<UpdateAdmin>) -> Result<()> {
    let migrate = &mut ctx.accounts.migrate_pda;
    require!(
        ctx.accounts.admin.key == &migrate.admin,
        MigrationError::Unauthorized
    );
    migrate.admin = *ctx.accounts.new_admin.key;
    Ok(())
}
