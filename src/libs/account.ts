import { Ed25519PublicKey, AuthenticationKey } from "@aptos-labs/ts-sdk";
import { HexString } from "aptos";

/**
 * Derives an Aptos account address from an Ed25519 public key.
 *
 * @param pubKeyHex - The Ed25519 public key in hexadecimal format.
 * @returns The corresponding Aptos account address in hexadecimal format.
 */
export function deriveAptosAccountAddress(pubKeyHex: string) {
  const pubKeyBytes = HexString.ensure(pubKeyHex).toUint8Array();
  const publicKey = new Ed25519PublicKey(pubKeyBytes);
  const authKey = AuthenticationKey.fromPublicKey({publicKey});
  return authKey.derivedAddress();
}

