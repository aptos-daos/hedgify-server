import { randomBytes } from "crypto";
import {
  AnyNumber,
  AccountAddress,
  Aptos,
  Ed25519PrivateKey,
  Ed25519PublicKey,
  Ed25519Signature,
  Serializer,
  Account,
} from "@aptos-labs/ts-sdk";
import { AptosAccount } from "aptos";
import { createVerifyMessage } from "../constants/message";
import { Claim } from "../libs/claim";

const NETWORK = "testnet";
const API_VERSION = "1";
const URI = "https://arupbasak.xyz/";
const RESOURCES = ["https://docs.moralis.io/"];

const generateNonce = (): string => randomBytes(16).toString("base64");

export const aptos = new Aptos();

const initializeAdminAccount = (): AptosAccount => {
  const privateKeyStr = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKeyStr) {
    throw new Error("Admin private key not found in environment variables");
  }

  const privateKey = new Ed25519PrivateKey(privateKeyStr);
  return new AptosAccount(privateKey.toUint8Array());
};

export const ADMIN_ACCOUNT = initializeAdminAccount();

export class AptosVerificationService {
  private static createMessage(
    address: string,
    nonce: string,
    issuedAt: string
  ): string {
    return createVerifyMessage({
      NETWORK,
      API_VERSION,
      URI,
      RESOURCES,
      address,
      nonce,
      issuedAt,
    });
  }

  public requestMessage(address: string): { message: string; nonce: string } {
    try {
      if (!address) {
        throw new Error("Address is required");
      }

      const nonce = generateNonce();
      const issuedAt = new Date().toISOString();
      const message = AptosVerificationService.createMessage(
        address,
        nonce,
        issuedAt
      );

      return { message, nonce };
    } catch (error) {
      console.error("Error in requestMessage:", error);
      throw error; // Better to throw than return empty strings
    }
  }

  public verifySignature = (
    message: string,
    signature: string,
    publicKey: string
  ): boolean => {
    const verify = new Ed25519PublicKey(publicKey).verifySignature({
      message: message,
      signature: new Ed25519Signature(signature),
    });
    return verify;
  };

  public adminSignature = (
    contractAddress: AccountAddress,
    sender: AccountAddress,
    receiver: AccountAddress,
    claimNumber: AnyNumber
  ) => {
    try {
      const admin = Account.generate(); // TODO: CHANGE IT
      // Create new claim instance
      const claim = new Claim({
        contractAddress,
        sender,
        receiver,
        claimNumber,
      });

      // Initialize serializer and serialize the claim
      const serializer = new Serializer();
      serializer.serialize(claim);

      // Sign the serialized data
      const signature = admin.sign(serializer.toUint8Array());

      return signature;
    } catch (error: any) {
      console.error("Error generating admin signature:", error);
      throw new Error(`Failed to generate admin signature: ${error.message}`);
    }
  };
}
