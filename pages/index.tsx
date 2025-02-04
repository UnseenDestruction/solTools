import Header from "../components/common/Header";
import Faq from "../components/common/Faq";
import Footer from "../components/common/Footer";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  toBigNumber,
} from "@metaplex-foundation/js";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token-2";
import {
  createCreateMetadataAccountInstruction,
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import * as fs from "fs";

import { FC, useCallback, useState } from "react";
import { notify } from "../utils/notifications";
import { ClipLoader } from "react-spinners";
import { useNetworkConfiguration } from "../context/NetworkConfigurationProvider";
import axios from "axios";




const WalletNotConnectedMessage = () => (
  <div
    className="bg-red-100 border w-[50%] border-red-400 text-red-700 px-4 py-3 rounded relative left-[25%]"
    role="alert"
  >
    <strong className="font-bold">Wallet not connected!</strong>
    <span className="block sm:inline">
      {" "}
      Please connect your wallet to create a token.
    </span>
  </div>
);

const CreateToken: FC = () => {
  const [imageFile, setImageFile] = useState<any>();
  const [tokenDescription, setTokenDescription] = useState("");
  const [isFreezeToggled, setFreezeToggle] = useState(false);
  const [isRevokeToggled, setRevokeToggle] = useState(false);
    
  const { connection } = useConnection();

  const { publicKey, sendTransaction, connected, signTransaction } =
    useWallet();
  const { networkConfiguration } = useNetworkConfiguration();

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenUri, setTokenUri] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState("9");
  const [tokenMintAddress, setTokenMintAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const FreezeToggler = () => {
    setFreezeToggle(!isFreezeToggled);
  };

  const RevokeToggler = () => {
    setRevokeToggle(!isRevokeToggled);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // reader.result contains the Base64 string of the image
        const base64String = reader.result;
        setImageFile(base64String); // Storing Base64 string
      };
      const base64 = reader.readAsDataURL(file); // Converts the image to Base64
      setImageFile(base64);
    }
  };

  const createUploadToken = useCallback(async (e) => {
    e.preventDefault();

      if (!connected) {
        setIsLoading(false);
        return;
      }
      console.log(tokenSymbol);

      try {
        const mintKeypair = Keypair.generate();
        // FIRST GET URI
        let txResult: string = await fetcher("/api/uri", {
          method: "POST",
          body: JSON.stringify({
            image: imageFile,

            name: tokenName,
            symbol: tokenSymbol,
            description: tokenDescription,
          }),
          headers: { "Content-type": "application/json; charset=UTF-8" },
        });
        console.log(txResult);
        const createMintAccountInstruction = SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: await connection.getMinimumBalanceForRentExemption(
            MINT_SIZE
          ),
          programId: TOKEN_PROGRAM_ID,
        });

        const initializeMintInstruction = createInitializeMint2Instruction(
          mintKeypair.publicKey,
          6,
          publicKey,
          publicKey
        );
        const metadataAccount = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            METADATA_PROGRAM_ID.toBuffer(),
            mintKeypair.publicKey.toBuffer(),
          ],
          METADATA_PROGRAM_ID
        )[0];

        console.log("Metadata address:", metadataAccount.toBase58());

        const createMetadataInstruction =
          createCreateMetadataAccountV3Instruction(
            {
              metadata: metadataAccount,
              mint: mintKeypair.publicKey,
              mintAuthority: publicKey,
              payer: publicKey,
              updateAuthority: publicKey,
            },
            {
              createMetadataAccountArgsV3: {
                data: {
                  creators: null,
                  name: tokenName,
                  symbol: tokenSymbol,
                  uri: txResult,
                  sellerFeeBasisPoints: 0,
                  collection: null,
                  uses: null,
                },
                // `collectionDetails` - for non-nft type tokens, normally set to `null` to not have a value set
                collectionDetails: null,
                // should the metadata be updatable?
                isMutable: true,
              },
            }
          );
        const tx = await buildTransaction({
          connection,
          payer: publicKey,
          signers: [mintKeypair],
          instructions: [
            createMintAccountInstruction,
            initializeMintInstruction,
            createMetadataInstruction,
          ],
        });
        const signedTx = await signTransaction(tx);
        const signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );
        await connection.confirmTransaction(signature, "finalized");
        setTokenMintAddress(mintKeypair.publicKey.toString());
        notify({
          type: "success",
          message: "Token creation successful",
          txid: signature,
        });
      } catch (error) {
        console.error("Token creation failed:", error);
        notify({ type: "error", message: "Token creation failed" });
      } finally {
        setIsLoading(false);
      }
    },
    [
      publicKey,
      connection,
      tokenDecimals,
      tokenName,
      tokenSymbol,
      tokenUri,
      imageFile,
      sendTransaction,
    ]
  );

  return (
    <div className="grid gap-4 font-sans">
      <Header />
      <h1 className="text-center text-4xl">
        SOLANA <span className="text-purple-500 ">TOKEN</span> CREATOR
      </h1>
      {isLoading && (
        <div className="absolute top-0 left-0 z-50 flex h-screen w-full items-center justify-center bg-black/[.3] backdrop-blur-[10px]">
          <ClipLoader />
        </div>
      )}
      {!connected && <WalletNotConnectedMessage />}
      {!tokenMintAddress ? (
        <form>
          <div className="bg-[rgba(13,25,39,255)] rounded-xl w-[50%] relative left-[25%] p-5 shadow-xl">
            <div className=" flex items-center justify-center gap-4 p-2">
              <div className="w-full">
                <label htmlFor="" className="grid gap-1">
                  Token Name:
                  <input
                    className="rounded border w-full py-1 text-xl font-normal text-gray-700 focus:border-blue-600 focus:outline-none p-2"
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="Type Your Token Name Here"
                  />
                </label>
              </div>
              <div className="w-full">
                <label htmlFor="" className="grid gap-1 ">
                  Token Symbol:
                  <input
                    className="rounded border py-1 w-full text-xl font-normal text-gray-700 focus:border-blue-600 focus:outline-none p-2"
                    placeholder="3-4 Letter like SOL"
                    onChange={(e) => setTokenSymbol(e.target.value)}
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-between items-center p-2">
              <div className="w-full">
                <div className="grid w-full">
                  <label htmlFor="" className="grid w-full text-lg gap-1">
                    Token Supply:
                    <input
                      className="rounded border px-4 py-2 text-xl font-normal  text-gray-700 focus:border-blue-600 focus:outline-none"
                      min={0}
                      type="number"
                      placeholder="Set Your Token Supply Here"
                    />
                  </label>
                </div>
                <div className="grid w-full">
                  <label htmlFor="" className="grid w-full text-lg gap-1">
                    Token Decimals:
                    <input
                      className="rounded border px-4 py-2 text-xl font-normal  text-gray-700 focus:border-blue-600 focus:outline-none"
                      type={"number"}
                      min={0}
                      value={tokenDecimals}
                      onChange={(e) => setTokenDecimals(e.target.value)}
                    />
                  </label>
                </div>
              </div>
              <div className="mt-4 grid sm:gap-4 w-full">
                <div className="m-auto p-2">
                  <div className="text-xl font-normal">Token Icon</div>
                  <p>Image file of your future token.</p>
                </div>

                <div className="flex p-2">
                  <div className="m-auto rounded border border-dashed border-white px-2">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <label className="cursor-pointer font-medium text-purple-500 hover:text-indigo-500">
                      <span>Upload an image</span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={handleImageChange}
                      />
                    </label>
                    {!imageFile ? null : (
                      <p className="text-gray-500">{imageFile.name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-around items-center">
              <div className="grid gap-1">
                <p className="text-sm">Freeze Mint Authority:</p>
                <label className="relative inline-block w-24 h-6">
                  <input
                    type="checkbox"
                    checked={isFreezeToggled}
                    onChange={FreezeToggler}
                    className="opacity-0 w-0 h-0"
                  />
                  <span className="absolute top-0 left-0 right-0 bottom-0 cursor-pointer bg-purple-700 rounded-full transition-colors duration-300" />
                  <span
                    className={`absolute h-5 w-12 rounded-full bg-white transition-transform duration-300 transform ${
                      isFreezeToggled ? "translate-x-full" : "translate-x-0"
                    }`}
                  />
                </label>
              </div>
              <div className="grid gap-1">
                <p className="text-sm">Revoke Authority:</p>
                <label className="relative inline-block w-24 h-5.5 ">
                  <input
                    type="checkbox"
                    checked={isRevokeToggled}
                    onChange={RevokeToggler}
                    className="opacity-0 w-0 h-0"
                  />
                  <span className="absolute top-0 left-0 right-0 bottom-0 cursor-pointer bg-purple-700 rounded-full transition-colors duration-300" />
                  <span
                    className={`absolute h-5 w-12 rounded-full bg-white transition-transform duration-300 transform ${
                      isRevokeToggled ? "translate-x-full" : "translate-x-0"
                    }`}
                  />
                </label>
              </div>
            </div>

            <div className="">
              <label htmlFor="" className="grid gap-1 p-2">
                Token Discription:
                <textarea
                  className="rounded border px-4 py-2 text-xl font-normal text-gray-700 focus:border-blue-600 focus:outline-none"
                  onChange={(e) => setTokenDescription(e.target.value)}
                  placeholder="Type Your Description Here:"
                />
              </label>
            </div>

            <div className="mt-4">
              <button
                className={`... btn m-2 animate-pulse bg-purple-500 rounded-xl p-4 hover:-translate-y-2 duration-300 cursor-pointer ${
                  !connected ? "" : "null"
                }`}
                onClick={createUploadToken}
                disabled={!connected}
              >
                Create token
              </button>
            </div>
            <p onChange={() => setTokenUri((e) => e)}>{tokenUri}</p>
          </div>
        </form>
      ) : (
        <div className="mt-4 break-words">
          <p className="font-medium">Link to your new token.</p>
          <a
            className="cursor-pointer font-medium text-purple-500 hover:text-indigo-500"
            href={`https://explorer.solana.com/address/${tokenMintAddress}?cluster=${networkConfiguration}`}
            target="_blank"
            rel="noreferrer"
          >
            {tokenMintAddress}
          </a>
        </div>
      )}
      <Faq />
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default CreateToken;
