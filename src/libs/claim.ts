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
    dao_address: AccountAddress;
    joinee_address: AccountAddress;
    expire_time_in_seconds: AnyNumber;
  }) {
    super();
    this.contractAddress = args.dao_address;
    this.sender = args.dao_address;
    this.receiver = args.joinee_address;
    this.claimNumber = new U64(args.expire_time_in_seconds);
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
