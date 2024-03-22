use anchor_lang::prelude::*;
mod instructions;
mod state;

use instructions::*;

mod error;
use error::*;
use solana_security_txt::security_txt;

declare_id!("GaK9khMjEUcFszCnL2AsueRgdT2JYU1yK3tj9RHETpi4");

#[program]
pub mod migration_program {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>) -> Result<()> {
        init_config::handler(ctx)
    }

    pub fn migrate_token(ctx: Context<MigrateToken>, amount: u64) -> Result<()> {
        migrate_token::handler(ctx, amount)
    }

    pub fn emergency_pause(ctx: Context<EmergencyPause>, pause: bool) -> Result<()> {
        emergency_pause::handler(ctx, pause)
    }

    pub fn update_admin(ctx: Context<UpdateAdmin>) -> Result<()> {
        update_admin::handler(ctx)
    }
}

security_txt! {
    name: "Zebec Network",
    project_url: "https://zebec.io/",
    contacts: "email:security@zebec.io",
    policy: "https://docs.zebec.io/",
    preferred_languages: "en",
    source_code: "https://github.com/Zebec-protocol/migration-program.git",
    acknowledgements: "Try to break it!"
}
