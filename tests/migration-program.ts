import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MigrationProgram } from "../target/types/migration_program";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import fs from "fs";
import { assert } from "chai";
import { BN } from "bn.js";

describe("migration-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .MigrationProgram as Program<MigrationProgram>;
  console.log("program:", program.programId.toString());

  const admin = Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(fs.readFileSync("./test_wallets/admin.json", "utf-8"))
    )
  );
  console.log("admin:", admin.publicKey.toString());

  const new_admin = new PublicKey(
    "3MMwMHeUDZfEzN5aiwGJsq3rAFd3r6hACc4zTuWXaPyG"
  );
  console.log("new_admin:", new_admin.toString());

  const sender = Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(fs.readFileSync("./test_wallets/sender.json", "utf-8"))
    )
  );
  console.log("sender:", sender.publicKey.toString());

  const migrate_pda_seed = "migrate";
  const mint_authority_pda_seed = "zbcn_mint";

  const [migrate_pda, __] = PublicKey.findProgramAddressSync(
    [Buffer.from(anchor.utils.bytes.utf8.encode(migrate_pda_seed))],
    program.programId
  );
  console.log("migrate_pda:", migrate_pda.toString());

  const [mint_authority, _] = PublicKey.findProgramAddressSync(
    [Buffer.from(anchor.utils.bytes.utf8.encode(mint_authority_pda_seed))],
    program.programId
  );
  console.log("mint_authority:", mint_authority.toString());

  const zbc_mint = new PublicKey(
    // "8CSvK7xceqUeqRaPr91r5kgteXGcWmBL48aoUQCtdizq"
    "ER2x6i1DGSmmSp4nyDN9AdnJNLQXW6i1P2zHzCjQK9MH"
  );
  const zbcn_mint = new PublicKey(
    "BB1MER7KXFYzKD52ehpfHCV49r7U6PnCYSE9zpFwbvP2"
  );

  const sender_zbc_ata = getAssociatedTokenAddressSync(
    zbc_mint,
    sender.publicKey
  );
  console.log("sender_zbc_ata", sender_zbc_ata.toString());

  const sender_zbcn_ata = getAssociatedTokenAddressSync(
    zbcn_mint,
    sender.publicKey
  );
  console.log("sender_zbcn_ata", sender_zbcn_ata.toString());

  it("Init Config!", async () => {
    const init_tx = await program.methods
      .initConfig()
      .accounts({
        admin: admin.publicKey,
        migratePda: migrate_pda,
        mintAuthority: mint_authority,
        zbcMint: zbc_mint,
        zbcnMint: zbcn_mint,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
    console.log("init_tx", init_tx);
  });

  it("Migrate Token!", async () => {
    const amount = 1;
    const decimals = 9;
    const amount_with_decimals = new BN(amount).mul(
      new BN(10).pow(new BN(decimals))
    );
    console.log("amount_with_decimals", amount_with_decimals.toString());
    const migrate_tx = await program.methods
      .migrateToken(amount_with_decimals)
      .accounts({
        sender: sender.publicKey,
        migratePda: migrate_pda,
        senderZbcAta: sender_zbc_ata,
        senderZbcnAta: sender_zbcn_ata,
        zbcMint: zbc_mint,
        zbcnMint: zbcn_mint,
        mintAuthority: mint_authority,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([sender])
      .rpc();
    console.log("migrate_tx", migrate_tx);

    // decode pda
    const migratePdadecoded = await program.account.migrate.fetch(migrate_pda);
    console.log(
      "transactionCount",
      migratePdadecoded.transactionCount.toString()
    );
    console.log("totalMigrated", migratePdadecoded.totalMigrated.toString());
  });

  it("Emergency Pause!", async () => {
    const emergency_tx = await program.methods
      .emergencyPause(true)
      .accounts({
        admin: admin.publicKey,
        migratePda: migrate_pda,
      })
      .signers([admin])
      .rpc();
    console.log("emergency_tx", emergency_tx);
  });

  it("Update Admin!", async () => {
    const update_admin = await program.methods
      .updateAdmin()
      .accounts({
        admin: admin.publicKey,
        migratePda: migrate_pda,
        newAdmin: new_admin,
      })
      .signers([admin])
      .rpc();
    console.log("update_admin", update_admin);
    const migratePdadecoded = await program.account.migrate.fetch(migrate_pda);
    console.log("old admin", admin.publicKey.toString());
    console.log("new admin", migratePdadecoded.admin.toString());
  });
});
