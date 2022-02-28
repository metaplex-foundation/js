import { IdentityDriver } from "@/drivers";
import { Signer as Web3Signer } from "@solana/web3.js";

export type Signer = Web3Signer | IdentityDriver;
