use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{burn, mint_to, Burn, Mint, MintTo, Token, TokenAccount},
};

use crate::{state::Migrate, MigrationError};

#[derive(Accounts)]
pub struct MigrateToken<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(
        mut,
        seeds = [b"migrate"],
        bump
    )]
    pub migrate_pda: Box<Account<'info, Migrate>>,
    #[account(
        mut,
        associated_token::mint = zbc_mint,
        associated_token::authority = sender
    )]
    pub sender_zbc_ata: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = zbcn_mint,
        associated_token::authority = sender
    )]
    pub sender_zbcn_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub zbc_mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub zbcn_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"zbcn_mint"],
        bump
    )]
    /// CHECK:
    pub mint_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler(ctx: Context<MigrateToken>, amount: u64) -> Result<()> {
    let sender = &mut ctx.accounts.sender;
    let sender_zbc_ata = &mut ctx.accounts.sender_zbc_ata;
    let sender_zbcn_ata = &mut ctx.accounts.sender_zbcn_ata;
    let mint_authority = &mut ctx.accounts.mint_authority;
    let zbc_mint = &ctx.accounts.zbc_mint;
    let zbcn_mint = &ctx.accounts.zbcn_mint;
    let token_program = &ctx.accounts.token_program;
    let migrate_pda = &mut ctx.accounts.migrate_pda;
    let zbcn_decimals = zbcn_mint.decimals;

    require!(
        zbc_mint.key() == migrate_pda.zbc_mint,
        MigrationError::ZbcMintMismatch
    );
    require!(
        zbcn_mint.key() == migrate_pda.zbcn_mint,
        MigrationError::ZbcnMintMismatch
    );
    require!(
        migrate_pda.emergency_pause == false,
        MigrationError::ProgramPaused
    );

    require!(
        migrate_pda.total_migrated + amount <= 10_000_000_000 * 10u64.pow(zbcn_decimals as u32),
        MigrationError::MaxMigrationReached
    );

    let burn_zbc = Burn {
        mint: zbc_mint.to_account_info(),
        from: sender_zbc_ata.to_account_info(),
        authority: sender.to_account_info(),
    };

    let burn_ctx = CpiContext::new(token_program.to_account_info(), burn_zbc);
    burn(burn_ctx, amount)?;

    let (_, bump_seed) = Pubkey::find_program_address(&["zbcn_mint".as_bytes()], ctx.program_id);
    let mint_authority_seed: &[&[&[_]]] = &[&["zbcn_mint".as_bytes(), &[bump_seed]]];

    let mint_zbc = MintTo {
        mint: zbcn_mint.to_account_info(),
        to: sender_zbcn_ata.to_account_info(),
        authority: mint_authority.to_account_info(),
    };

    let mint_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        mint_zbc,
        mint_authority_seed,
    );
    mint_to(mint_ctx, amount)?;

    migrate_pda.transaction_count += 1;
    migrate_pda.total_migrated += amount;

    Ok(())
}