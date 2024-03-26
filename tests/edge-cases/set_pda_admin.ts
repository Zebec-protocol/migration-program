import dotenv from 'dotenv';

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  Keypair,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';

import { MigrationProgram } from '../../target/types/migration_program';
import {
  airdrop,
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
	console.log("sender:", senderKeypair.publicKey.toString());
	const newAdminKeypair = Keypair.generate();
	console.log("newAdmin:", newAdminKeypair.publicKey.toString());

	// Configure the client to use the local cluster.
	const provider = anchor.AnchorProvider.local();
	anchor.setProvider(provider);
	const sender = provider.publicKey;
	console.log("sender:", sender.toString());

	const program = anchor.workspace.MigrationProgram as Program<MigrationProgram>;
	console.log("program:", program.programId.toString());

	const migratePda = getMigratePda(program.programId);
	const mintAuthority = getMintAuthority(program.programId);

	console.log("migratePda:", migratePda.toString());
	console.log("mintAuthority:", mintAuthority.toString());

	const zbcMint = new PublicKey("8xjRmeGptLGMbRj3P6ubm6GmDRJ2pWDez61Bqo9aQ6F1");
	const zbcnMint = new PublicKey("CgCHU2WQnLUqnvPcp9EvDqELPikd2gYJj1hZtP7bQGZn");

	before(async () => {
		// airdrop new admin keypair
		const tx = await airdrop(provider.connection, newAdminKeypair.publicKey, 100);
		console.log("airdrop tx:", tx);
	});

	beforeEach(async () => {
		// call initConfig method to initialize or reset migratePda state
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

	it("updates onCurve address as new admin", async () => {
		const update_admin = await program.methods
			.updateAdmin()
			.accounts({
				admin: adminKeypair.publicKey,
				migratePda,
				newAdmin: newAdminKeypair.publicKey,
			})
			.signers([adminKeypair])
			.rpc();
		console.log("update_admin", update_admin);
		const migratePdadecoded = await program.account.migrate.fetch(migratePda);
		console.log("new admin", migratePdadecoded.admin.toString());
	});

	it("updates onCurve address as new admin", async () => {
		const [newAdmin] = PublicKey.findProgramAddressSync(
			[Buffer.from(anchor.utils.bytes.utf8.encode("some_random"))],
			adminKeypair.publicKey,
		);
		const update_admin = await program.methods
			.updateAdmin()
			.accounts({
				admin: adminKeypair.publicKey,
				migratePda,
				newAdmin,
			})
			.signers([adminKeypair])
			.rpc();
		console.log("update_admin", update_admin);
		const migratePdadecoded = await program.account.migrate.fetch(migratePda);
		console.log("new admin", migratePdadecoded.admin.toString());
	});
});
