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
    /// CHECK: admin should sign so that the new admin is authorized
    pub new_admin: AccountInfo<'info>,
}

/// Function for updating the admin of the migration program.
pub fn handler(ctx: Context<UpdateAdmin>) -> Result<()> {
    let migrate = &mut ctx.accounts.migrate_pda;
    // Check if the caller is authorized
    require!(
        ctx.accounts.admin.key == &migrate.admin,
        MigrationError::Unauthorized
    );
    migrate.admin = *ctx.accounts.new_admin.key;
    Ok(())
}
