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

pub fn handler(ctx: Context<EmergencyPause>, pause: bool) -> Result<()> {
    let migrate = &mut ctx.accounts.migrate_pda;
    require!(
        ctx.accounts.admin.key == &migrate.admin,
        MigrationError::Unauthorized
    );
    migrate.emergency_pause = pause;
    Ok(())
}
