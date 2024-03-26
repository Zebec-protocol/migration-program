import dotenv from 'dotenv';

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

import { MigrationProgram } from '../../target/types/migration_program';
import {
  getAdminKeypair,
  getMigratePda,
  getMintAuthority,
  getSenderKeypair,
} from '../utils';

dotenv.config();

describe("set pda address as new admin", () => {
	const adminKeypair = getAdminKeypair();
	console.log("admin:", adminKeypair.publicKey.toString());
	const senderKeypair = getSenderKeypair();
	const sender = senderKeypair.publicKey;
	console.log("sender:", sender.toString());

	// Configure the client to use the local cluster.
	const provider = anchor.AnchorProvider.local();
	anchor.setProvider(provider);

	const program = anchor.workspace.MigrationProgram as Program<MigrationProgram>;
	console.log("program:", program.programId.toString());

	const migratePda = getMigratePda(program.programId);
	const mintAuthority = getMintAuthority(program.programId);

	console.log("migratePda:", migratePda.toString());
	console.log("mintAuthority:", mintAuthority.toString());

	const zbcMint = new PublicKey("8xjRmeGptLGMbRj3P6ubm6GmDRJ2pWDez61Bqo9aQ6F1"); // 9 decimals
	const zbcnMint = new PublicKey("CgCHU2WQnLUqnvPcp9EvDqELPikd2gYJj1hZtP7bQGZn"); // 9 decimals

	const senderZbcAta = getAssociatedTokenAddressSync(zbcMint, sender);
	console.log("senderZbcAccount", senderZbcAta.toString());

	const senderZbcnAta = getAssociatedTokenAddressSync(zbcnMint, sender);
	console.log("sender_zbcn_ata", senderZbcnAta.toString());

	before(async () => {
		// re-initialize to reset migratePda
		const init_tx = await program.methods
			.initConfig()
			.accounts({
				admin: adminKeypair.publicKey,
				migratePda,
				mintAuthority,
				zbcMint,
				zbcnMint,
				systemProgram: SystemProgram.programId,
			})
			.signers([adminKeypair])
			.rpc();
		console.log("init_tx", init_tx);
	});

	it("migrates zbc more than the max amount", async () => {
		const amount = new anchor.BN("11000000000").mul(new anchor.BN("1000000000"));

		const txId = await program.methods
			.migrateToken(amount)
			.accounts({
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				migratePda,
				mintAuthority,
				sender: senderKeypair.publicKey,
				senderZbcAta,
				senderZbcnAta,
				systemProgram: SystemProgram.programId,
				tokenProgram: TOKEN_PROGRAM_ID,
				zbcMint,
				zbcnMint,
			})
			.signers([senderKeypair])
			.rpc();

		console.log("migrateTokenTxId", txId);
	});
});
