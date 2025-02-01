import { HexString } from "aptos";
import keccak256 from "keccak256";
import { WhitelistRowSchema } from "../validations/whitelist.validation";

type AddressData = {
  address: string;
  amount: string;
};

export class MerkleTree {
  private leaves: HexString[] = [];
  private layers: HexString[][] = [];

  constructor(addressData?: AddressData[]) {
    if (addressData) {
      this.generateFromAddresses(addressData);
    }
  }

  public generateFromAddresses(addressData: AddressData[]): void {
    // Validate and process each address
    const validatedData = addressData.map(row => WhitelistRowSchema.parse(row));

    // Create leaf nodes by concatenating address and amount, then hashing
    this.leaves = validatedData.map(({ address, amount }) => {
      const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
      const concatenated = Buffer.concat([
        Buffer.from(cleanAddress, 'hex'),
        Buffer.from(amount.toString())
      ]);
      const hash = keccak256(concatenated);
      return new HexString(hash.toString('hex'));
    });

    // Generate layers
    this.layers = this.getLayers(this.leaves);
  }

  public addLeaf(leaf: HexString, shouldHash: boolean = false): void {
    if (shouldHash) {
      const hashBuffer = keccak256(Buffer.from(leaf.noPrefix(), 'hex'));
      this.leaves.push(new HexString(hashBuffer.toString('hex')));
    } else {
      this.leaves.push(leaf);
    }
    // Regenerate layers after adding new leaf
    this.layers = this.getLayers(this.leaves);
  }

  public addLeaves(leaves: HexString[], shouldHash: boolean = false): void {
    for (const leaf of leaves) {
      this.addLeaf(leaf, shouldHash);
    }
  }

  public getLeaves(): HexString[] {
    return this.leaves;
  }

  public getRoot(): HexString {
    if (this.layers.length === 0) return new HexString('');
    return this.layers[this.layers.length - 1][0];
  }

  public getProof(address: string, amount: string): HexString[] {
    // Create the leaf hash for the given address and amount
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
    const concatenated = Buffer.concat([
      Buffer.from(cleanAddress, 'hex'),
      Buffer.from(amount.toString())
    ]);
    const leafHash = new HexString(keccak256(concatenated).toString('hex'));

    // Find leaf index
    let index = -1;
    for (let i = 0; i < this.leaves.length; i++) {
      if (leafHash.toString() === this.leaves[i].toString()) {
        index = i;
        break;
      }
    }

    const proof: HexString[] = [];
    if (index <= -1) return proof;

    // Generate proof
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = index % 2;
      const pairIndex = isRightNode ? index - 1 : index + 1;

      if (pairIndex < layer.length) {
        proof.push(layer[pairIndex]);
      }

      index = Math.floor(index / 2);
    }

    return proof;
  }

  public verifyProof(
    address: string,
    amount: string,
    proof: HexString[]
  ): boolean {
    // Recreate the leaf hash
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
    const concatenated = Buffer.concat([
      Buffer.from(cleanAddress, 'hex'),
      Buffer.from(amount.toString())
    ]);
    let hash = keccak256(concatenated);

    // Verify the proof
    for (const proofElement of proof) {
      const proofBuffer = Buffer.from(proofElement.noPrefix(), 'hex');
      const combined = Buffer.concat([hash, proofBuffer]);
      hash = keccak256(combined);
    }

    // Compare with the root
    return hash.toString('hex') === this.getRoot().noPrefix();
  }

  private getLayers(leaves: HexString[]): HexString[][] {
    const layers: HexString[][] = [leaves];

    while (layers[layers.length - 1].length > 1) {
      layers.push(this.getNextLayer(layers[layers.length - 1]));
    }

    return layers;
  }

  private getNextLayer(nodes: HexString[]): HexString[] {
    const layerNodes: HexString[] = [];

    for (let i = 0; i < nodes.length; i += 2) {
      if (i + 1 === nodes.length) {
        layerNodes.push(nodes[i]);
      } else {
        const left = Buffer.from(nodes[i].noPrefix(), 'hex');
        const right = Buffer.from(nodes[i + 1].noPrefix(), 'hex');
        const combined = keccak256(Buffer.concat([left, right]));
        layerNodes.push(new HexString(combined.toString('hex')));
      }
    }

    return layerNodes;
  }
}
