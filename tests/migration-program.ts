import { BN } from 'bn.js';

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';

import { MigrationProgram } from '../target/types/migration_program';
import {
  getAdminKeypair,
  getMigratePda,
  getMintAuthority,
  getSenderKeypair,
} from './utils';

describe("migration-program", () => {
	// Configure the client to use the local cluster.
	anchor.setProvider(anchor.AnchorProvider.env());

	const program = anchor.workspace.MigrationProgram as Program<MigrationProgram>;
	console.log("program:", program.programId.toString());

	const admin = getAdminKeypair();
	console.log("admin:", admin.publicKey.toString());

	const new_admin = new PublicKey("3MMwMHeUDZfEzN5aiwGJsq3rAFd3r6hACc4zTuWXaPyG");
	console.log("new_admin:", new_admin.toString());

	const sender = getSenderKeypair();
	console.log("sender:", sender.publicKey.toString());

	const migratePda = getMigratePda(program.programId);
	console.log("migratePda:", migratePda.toString());

	const mintAuthority = getMintAuthority(program.programId);
	console.log("mintAuthority:", mintAuthority.toString());

	const zbcMint = new PublicKey(
		// "8CSvK7xceqUeqRaPr91r5kgteXGcWmBL48aoUQCtdizq"
		"ER2x6i1DGSmmSp4nyDN9AdnJNLQXW6i1P2zHzCjQK9MH",
	);
	const zbcnMint = new PublicKey("BB1MER7KXFYzKD52ehpfHCV49r7U6PnCYSE9zpFwbvP2");

	const senderZbcAta = getAssociatedTokenAddressSync(zbcMint, sender.publicKey);
	console.log("senderZbcAta", senderZbcAta.toString());

	const senderZbcnAta = getAssociatedTokenAddressSync(zbcnMint, sender.publicKey);
	console.log("senderZbcnAta", senderZbcnAta.toString());

	it("Init Config!", async () => {
		const init_tx = await program.methods
			.initConfig()
			.accounts({
				admin: admin.publicKey,
				migratePda: migratePda,
				mintAuthority: mintAuthority,
				zbcMint: zbcMint,
				zbcnMint: zbcnMint,
				systemProgram: SystemProgram.programId,
			})
			.signers([admin])
			.rpc();
		console.log("init_tx", init_tx);
	});

	it("Migrate Token!", async () => {
		const amount = 1;
		const decimals = 9;
		const amount_with_decimals = new BN(amount).mul(new BN(10).pow(new BN(decimals)));
		console.log("amount_with_decimals", amount_with_decimals.toString());
		const migrate_tx = await program.methods
			.migrateToken(amount_with_decimals)
			.accounts({
				sender: sender.publicKey,
				migratePda: migratePda,
				senderZbcAta: senderZbcAta,
				senderZbcnAta: senderZbcnAta,
				zbcMint: zbcMint,
				zbcnMint: zbcnMint,
				mintAuthority: mintAuthority,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			})
			.signers([sender])
			.rpc();
		console.log("migrate_tx", migrate_tx);

		// decode pda
		const migratePdadecoded = await program.account.migrate.fetch(migratePda);
		console.log("transactionCount", migratePdadecoded.transactionCount.toString());
		console.log("totalMigrated", migratePdadecoded.totalMigrated.toString());
	});

	it("Emergency Pause!", async () => {
		const emergency_tx = await program.methods
			.emergencyPause(true)
			.accounts({
				admin: admin.publicKey,
				migratePda: migratePda,
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
				migratePda: migratePda,
				newAdmin: new_admin,
			})
			.signers([admin])
			.rpc();
		console.log("update_admin", update_admin);
		const migratePdadecoded = await program.account.migrate.fetch(migratePda);
		console.log("old admin", admin.publicKey.toString());
		console.log("new admin", migratePdadecoded.admin.toString());
	});
});
