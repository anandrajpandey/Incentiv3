export async function uploadToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
      pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!,
    },
    body: formData,
  });

  const data = await res.json();
  if (!data.IpfsHash) throw new Error("Pinata upload failed");

  return data.IpfsHash;
}
