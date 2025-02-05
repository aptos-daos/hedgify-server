import {
  AccountAddress,
  AnyNumber,
  MoveString,
  Serializable,
  Serializer,
  U64,
} from "@aptos-labs/ts-sdk";

export class Claim extends Serializable {
  public readonly contractAddress: AccountAddress;
  public readonly moduleName: MoveString = new MoveString("claims");
  public readonly structName: MoveString = new MoveString("Claim");
  public readonly sender: AccountAddress;
  public readonly receiver: AccountAddress;
  public readonly claimNumber: U64;

  constructor(args: {
    contractAddress: AccountAddress;
    sender: AccountAddress;
    receiver: AccountAddress;
    claimNumber: AnyNumber;
  }) {
    super();
    this.contractAddress = args.contractAddress;
    this.sender = args.sender;
    this.receiver = args.receiver;
    this.claimNumber = new U64(args.claimNumber);
  }

  serialize(serializer: Serializer): void {
    serializer.serialize(this.contractAddress);
    serializer.serialize(this.moduleName);
    serializer.serialize(this.structName);
    serializer.serialize(this.sender);
    serializer.serialize(this.receiver);
    serializer.serialize(this.claimNumber);
  }
}
