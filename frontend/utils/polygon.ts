import { BrowserProvider, ethers } from 'ethers';

const AMOY_CONFIG = {
    chainId: '0x13882', // 80002 in hex
    chainName: 'Polygon Amoy Testnet',
    nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
    },
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: ['https://amoy.polygonscan.com']
};

export async function connectWallet(): Promise<string | null> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
        return null;
    }

    try {
        const provider = new BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        
        // Ensure we are on Amoy
        const { chainId } = await provider.getNetwork();
        if (chainId !== BigInt(80002)) {
            try {
                await (window as any).ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: AMOY_CONFIG.chainId }],
                });
            } catch (switchError: any) {
                if (switchError.code === 4902) {
                    await (window as any).ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [AMOY_CONFIG],
                    });
                }
            }
        }
        
        return accounts[0];
    } catch (error) {
        console.error("Wallet connection failed:", error);
        return null;
    }
}

/**
 * Anchors a SHA-256 hash to the Polygon blockchain.
 * Sends a 0-value transaction to the user's own address with the hash in the 'data' field.
 */
export async function anchorHashToPolygon(hash: string): Promise<string | null> {
    if (typeof window === 'undefined' || !(window as any).ethereum) return null;

    try {
        const provider = new BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        // Convert the hash string to hex if it isn't already, 
        // but typically SHA-256 strings from SubtleCrypto are hex.
        // We prefix with 0x for the data field.
        const data = ethers.hexlify(ethers.toUtf8Bytes(`MITTI-AUDIT:${hash}`));

        console.log("[Polygon] Anchoring hash:", hash);
        
        const tx = await signer.sendTransaction({
            to: address,
            value: 0,
            data: data
        });

        console.log("[Polygon] Transaction sent:", tx.hash);
        return tx.hash;
    } catch (error: any) {
        console.error("[Polygon] Anchoring failed:", error);
        return null;
    }
}

export function getExplorerUrl(txHash: string): string {
    return `https://amoy.polygonscan.com/tx/${txHash}`;
}
