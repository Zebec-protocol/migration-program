import * as fs from 'fs';

import { utils } from '@coral-xyz/anchor';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';

export function getAdminKeypair() {
	return Keypair.fromSecretKey(
		Buffer.from(JSON.parse(fs.readFileSync("./test_wallets/admin.json", "utf-8"))),
	);
}

export function getSenderKeypair() {
	return Keypair.fromSecretKey(
		Buffer.from(JSON.parse(fs.readFileSync("./test_wallets/sender.json", "utf-8"))),
	);
}

export async function airdrop(connection: Connection, address: PublicKey, amount: number) {
	return connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL);
}

const SEEDS = {
	migrate: "migrate",
	mintAuthority: "zbcn_mint",
};

export function getMigratePda(programId: PublicKey) {
	const [address] = PublicKey.findProgramAddressSync(
		[Buffer.from(utils.bytes.utf8.encode(SEEDS.migrate))],
		programId,
	);
	return address;
}

export function getMintAuthority(programId: PublicKey) {
	const [address] = PublicKey.findProgramAddressSync(
		[Buffer.from(utils.bytes.utf8.encode(SEEDS.mintAuthority))],
		programId,
	);
	return address;
}
