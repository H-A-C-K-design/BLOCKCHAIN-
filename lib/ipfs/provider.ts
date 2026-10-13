export interface IpfsUploadResult {
  success: boolean;
  cid?: string;
  gatewayUrl?: string;
  error?: string;
}

export function isIpfsConfigured(): boolean {
  return Boolean(process.env.IPFS_API_TOKEN);
}

export function getIpfsProviderName(): string {
  return process.env.IPFS_PROVIDER || "pinata";
}

/**
 * Uploads a certificate PDF to IPFS using server-side credentials (Pinata or compatible provider).
 * Never expose tokens to client-side code.
 */
export async function uploadPdfToIpfs(
  buffer: Buffer | Uint8Array,
  fileName: string,
  metadata?: Record<string, string>
): Promise<IpfsUploadResult> {
  const token = process.env.IPFS_API_TOKEN;
  if (!token) {
    return {
      success: false,
      error: "IPFS provider is not configured. IPFS_API_TOKEN is missing from server environment.",
    };
  }

  const apiUrl = (process.env.IPFS_API_URL || "https://api.pinata.cloud").replace(/\/$/, "");
  const gatewayUrl = (process.env.IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs").replace(/\/$/, "");

  try {
    const formData = new FormData();
    const blob = new Blob([buffer as unknown as BlobPart], { type: "application/pdf" });
    formData.append("file", blob, fileName);

    if (metadata) {
      formData.append(
        "pinataMetadata",
        JSON.stringify({
          name: fileName,
          keyvalues: metadata,
        })
      );
    }

    const endpoint = `${apiUrl}/pinning/pinFileToIPFS`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `IPFS upload failed (${response.status}): ${errorText}`,
      };
    }

    const data = (await response.json()) as { IpfsHash?: string };
    if (!data.IpfsHash) {
      return {
        success: false,
        error: "IPFS response did not return a valid CID (IpfsHash).",
      };
    }

    return {
      success: true,
      cid: data.IpfsHash,
      gatewayUrl: `${gatewayUrl}/${data.IpfsHash}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error during IPFS upload";
    return {
      success: false,
      error: `Network error connecting to IPFS provider: ${message}`,
    };
  }
}
