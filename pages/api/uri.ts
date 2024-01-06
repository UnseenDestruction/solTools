import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { Keypair, Connection } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  console.log(req.body);
  const payer = Keypair.fromSecretKey(
    Buffer.from([
      6, 169, 211, 187, 40, 215, 220, 146, 253, 82, 32, 168, 137, 224, 94, 158,
      207, 188, 196, 46, 196, 67, 118, 220, 73, 7, 102, 59, 50, 255, 90, 252,
      73, 129, 84, 172, 236, 248, 217, 99, 7, 55, 230, 149, 76, 27, 243, 136,
      162, 181, 6, 92, 35, 85, 111, 219, 42, 71, 10, 135, 202, 188, 163, 143,
    ])
  );

  const SOLANA_CONNECTION = new Connection(
    "https://innocent-arly-fast-mainnet.helius-rpc.com/",
    "confirmed"
  );
  const metaplex = Metaplex.make(SOLANA_CONNECTION)
    .use(keypairIdentity(payer))
    .use(bundlrStorage());
  console.log(req.body.image);
  const uploadImage = async (): Promise<string> => {
    const imgBuffer = Buffer.from(req.body.image, "base64");

    const imgMetaplexFile = toMetaplexFile(imgBuffer, "image");
    const imgUri = await metaplex.storage().upload(imgMetaplexFile);
    console.log(`   Image URI:`, imgUri);
    return imgUri;
  };
  const imgUri = await uploadImage();
  const uri = uploadMetadata(imgUri);
  async function uploadMetadata(imgUri: string) {
    console.log(`Step 2 - Uploading Metadata`);
    const payer = Keypair.fromSecretKey(
      Buffer.from([
        6, 169, 211, 187, 40, 215, 220, 146, 253, 82, 32, 168, 137, 224, 94,
        158, 207, 188, 196, 46, 196, 67, 118, 220, 73, 7, 102, 59, 50, 255, 90,
        252, 73, 129, 84, 172, 236, 248, 217, 99, 7, 55, 230, 149, 76, 27, 243,
        136, 162, 181, 6, 92, 35, 85, 111, 219, 42, 71, 10, 135, 202, 188, 163,
        143,
      ])
    );

    const { uri } = await metaplex.nfts().uploadMetadata({
      name: req.body.name,
      symbol: req.body.symbol,
      description: req.body.description,
      image: imgUri,
    });
    console.log("   Metadata URI:", uri);
    res.status(200).json(uri);
  }
  return uri;
}
