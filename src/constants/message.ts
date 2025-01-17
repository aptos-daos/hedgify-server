interface VerifyMessageParams {
    address: string;
    URI: string;
    API_VERSION: string;
    NETWORK: string;
    nonce: string;
    issuedAt: string;
    RESOURCES: any[];
}

export function createVerifyMessage(params: VerifyMessageParams): string {
    const {
        address,
        URI,
        API_VERSION,
        NETWORK,
        nonce,
        issuedAt,
        RESOURCES
    } = params;

    return `hedify.money wants you to sign in with your Aptos account:
${address}
Please confirm
URI: ${URI}
Version: ${API_VERSION}
Network: ${NETWORK}
Nonce: ${nonce}
Issued At: ${issuedAt}
Resources: ${JSON.stringify(RESOURCES)}`;
}