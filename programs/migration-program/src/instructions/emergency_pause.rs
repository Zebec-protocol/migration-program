use anchor_lang::prelude::*;

use crate::{state::Migrate, MigrationError};

#[derive(Accounts)]
pub struct EmergencyPause<'info> {
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"migrate"],
        bump
    )]
    pub migrate_pda: Box<Account<'info, Migrate>>,
}

/// Function for handling pausing or resuming migration.
/// This function can only be called by the admin in case of any emergency malfunction.
/// This will halt the migration process.
pub fn handler(ctx: Context<EmergencyPause>, pause: bool) -> Result<()> {
    let migrate = &mut ctx.accounts.migrate_pda;

    // Check if the caller is authorized to pause or resume the migration
    require!(
        ctx.accounts.admin.key == &migrate.admin,
        MigrationError::Unauthorized
    );
    migrate.emergency_pause = pause;
    Ok(())
}
