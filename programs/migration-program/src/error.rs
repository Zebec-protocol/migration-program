use anchor_lang::error_code;

#[error_code]
pub enum MigrationError {
    #[msg("The ZBC mint does not match the expected mint")]
    ZbcMintMismatch,
    #[msg("The ZBCN mint does not match the expected mint")]
    ZbcnMintMismatch,
    #[msg("The migration program is paused")]
    ProgramPaused,
    #[msg("The signer is unauthorized")]
    Unauthorized,
    #[msg("The maximum migration limit has been reached")]
    MaxMigrationReached,
}
