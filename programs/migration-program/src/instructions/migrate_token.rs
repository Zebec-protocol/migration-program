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
    /// PDA that stores the migration state and authority.
    pub migrate_pda: Box<Account<'info, Migrate>>,
    #[account(
        mut,
        associated_token::mint = zbc_mint,
        associated_token::authority = sender
    )]
    /// ZBC (old) token account of the sender.
    pub sender_zbc_ata: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = zbcn_mint,
        associated_token::authority = sender
    )]
    /// ZBCN (new) token account of the sender.
    pub sender_zbcn_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    /// ZBC (old) mint account.
    pub zbc_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        mint::authority = mint_authority,
    )]
    /// ZBCN (new) mint account.
    pub zbcn_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"zbcn_mint"],
        bump
    )]
    /// CHECK: seeds has been checked
    /// This account has mint authority for ZBCN tokens.
    pub mint_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

/// Main function for migrating ZBC tokens to ZBCN tokens.
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
    let zbc_decimals = zbc_mint.decimals;

    // convert ZBC to ZBCN. 1 ZBC = 10 ZBCN
    let transfer_amount =
        (amount as f64 / 10f64.powf(zbc_decimals as f64 - zbcn_decimals as f64)) as u64 * 10;

    // Check if the ZBC mint account matches with the PDA's stored mint.
    require!(
        zbc_mint.key() == migrate_pda.zbc_mint,
        MigrationError::ZbcMintMismatch
    );

    // Check if the ZBCN mint account matches with the PDA's stored mint.
    require!(
        zbcn_mint.key() == migrate_pda.zbcn_mint,
        MigrationError::ZbcnMintMismatch
    );

    // Check if the migration program is not paused.
    require!(
        migrate_pda.emergency_pause == false,
        MigrationError::ProgramPaused
    );

    // The migration program is one way ZBC -> ZBCN. The migration program will stop once 100,000,000,000 ZBCN tokens are minted.
    require!(
        migrate_pda.total_migrated + transfer_amount
            <= 100_000_000_000 * 10u64.pow(zbcn_decimals as u32),
        MigrationError::MaxMigrationReached
    );

    let burn_zbc = Burn {
        mint: zbc_mint.to_account_info(),
        from: sender_zbc_ata.to_account_info(),
        authority: sender.to_account_info(),
    };

    let burn_ctx = CpiContext::new(token_program.to_account_info(), burn_zbc);
    // Burn ZBC tokens.
    burn(burn_ctx, amount)?;

    let (_, bump_seed) = Pubkey::find_program_address(&["zbcn_mint".as_bytes()], ctx.program_id);
    let mint_authority_seed: &[&[&[_]]] = &[&["zbcn_mint".as_bytes(), &[bump_seed]]];

    let mint_zbcn = MintTo {
        mint: zbcn_mint.to_account_info(),
        to: sender_zbcn_ata.to_account_info(),
        authority: mint_authority.to_account_info(),
    };

    let mint_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        mint_zbcn,
        mint_authority_seed,
    );
    // Mint equivalent ZBCN tokens that were burned.
    mint_to(mint_ctx, transfer_amount)?;

    // Update the migration PDA's transaction count and total migrated amount.
    migrate_pda.transaction_count += 1;
    migrate_pda.total_migrated += transfer_amount;

    Ok(())
}
