/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { RadioGroup } from "@headlessui/react";
import { DexInstructions, Market } from "@project-serum/serum";
import {
  ACCOUNT_SIZE,
  createInitializeAccountInstruction,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token-2";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import { useRouter } from "next/router";
import { ReactNode, useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import TransactionToast from "../../../components/common/Toasts/TransactionToast";
import CreateMintOption from "../../../components/createMarket/CreateMintOption";
import ExistingMintForm from "../../../components/createMarket/ExistingMintForm";
import TickerForm from "../../../components/createMarket/TickerForm";
import { getHeaderLayout } from "../../../components/layouts/HeaderLayout";
import { useSerum } from "../../../context";
import {
  getVaultOwnerAndNonce,
} from "../../../utils/serum";
import {
  sendSignedTransaction,
  signTransactions,
  TransactionWithSigners,
} from "../../../utils/transaction";
import useSerumMarketAccountSizes from "../../../hooks/useSerumMarketAccountSizes";

const TRANSACTION_MESSAGES = [
  {
    sendingMessage: "Creating mints.",
    successMessage: "Created mints successfully.",
  },
  {
    sendingMessage: "Creating vaults.",
    successMessage: "Created vaults successfully.",
  },
  {
    sendingMessage: "Creating market.",
    successMessage: "Created market successfully.",
  },
];

type NewMintFormValues = {
  baseDecimals: number;
  quoteDecimals: number;
  baseAuthority: string;
  quoteAuthority: string;
};

type ExistingMintFormValues = {
  baseMint: string;
  quoteMint: string;
};

export type CreateMarketFormValues = {
  createMint: boolean;
  newMints?: NewMintFormValues;
  existingMints?: ExistingMintFormValues;
  lotSize: number;
  tickSize: number;
  eventQueueLength: number;
  requestQueueLength: number;
  orderbookLength: number;
};

const CreateMarket = () => {
  const router = useRouter();

  const { connection } = useConnection();
  const wallet = useWallet();

  const { programID } = useSerum();

  const { register, handleSubmit, watch, setValue, formState, clearErrors } =
    useForm<CreateMarketFormValues>({
      defaultValues: {
        createMint: true,
      },
    });

  const createMint = watch("createMint");

  const eventQueueLength = watch("eventQueueLength");
  const requestQueueLength = watch("requestQueueLength");
  const orderbookLength = watch("orderbookLength");


  const {
    totalEventQueueSize,
    totalOrderbookSize,
    totalRequestQueueSize,
  } = useSerumMarketAccountSizes({
    eventQueueLength,
    requestQueueLength,
    orderbookLength,
  });

 
  useEffect(() => {
    if (createMint) {
      setValue("existingMints", undefined);
      clearErrors("existingMints");
    } else {
      setValue("newMints", undefined);
      clearErrors("newMints");
    }
  }, [createMint, setValue, clearErrors]);

  const handleCreateMarket: SubmitHandler<CreateMarketFormValues> = async (
    data
  ) => {
    if (!wallet || !wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }

    let baseMintKeypair: Keypair | undefined;
    let baseMint: PublicKey;
    let baseMintDecimals: number;

    let quoteMintKeypair: Keypair | undefined;
    let quoteMint: PublicKey;
    let quoteMintDecimals: number;

    const mintInstructions: TransactionInstruction[] = [];
    const mintSigners: Keypair[] = [];

    const vaultInstructions: TransactionInstruction[] = [];
    const vaultSigners: Keypair[] = [];

    const marketInstructions: TransactionInstruction[] = [];
    const marketSigners: Keypair[] = [];

    // validate existing mints
    if (!createMint) {
      try {
        const baseMintInfo = await getMint(
          connection,
          new PublicKey(data.existingMints!.baseMint)
        );
        baseMint = baseMintInfo.address;
        baseMintDecimals = baseMintInfo.decimals;

        const quoteMintInfo = await getMint(
          connection,
          new PublicKey(data.existingMints!.quoteMint)
        );
        quoteMint = quoteMintInfo.address;
        quoteMintDecimals = quoteMintInfo.decimals;
      } catch (e) {
        toast.error("Invalid mints provided.");
        return;
      }
    }
    // create new mints
    else {
      const lamports = await getMinimumBalanceForRentExemptMint(connection);

      baseMintKeypair = Keypair.generate();
      baseMint = baseMintKeypair.publicKey;
      baseMintDecimals = data.newMints!.baseDecimals;

      quoteMintKeypair = Keypair.generate();
      quoteMint = quoteMintKeypair.publicKey;
      quoteMintDecimals = data.newMints!.quoteDecimals;

      mintInstructions.push(
        ...[
          SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: baseMintKeypair.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
          }),
          SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: quoteMintKeypair.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
          }),
        ]
      );

      mintInstructions.push(
        ...[
          createInitializeMintInstruction(
            baseMint,
            data.newMints!.baseDecimals,
            new PublicKey(data.newMints!.baseAuthority),
            new PublicKey(data.newMints!.baseAuthority)
          ),
          createInitializeMintInstruction(
            quoteMint,
            data.newMints!.quoteDecimals,
            new PublicKey(data.newMints!.quoteAuthority),
            new PublicKey(data.newMints!.quoteAuthority)
          ),
        ]
      );

      mintSigners.push(baseMintKeypair, quoteMintKeypair);
    }

    const marketAccounts = {
      market: Keypair.generate(),
      requestQueue: Keypair.generate(),
      eventQueue: Keypair.generate(),
      bids: Keypair.generate(),
      asks: Keypair.generate(),
      baseVault: Keypair.generate(),
      quoteVault: Keypair.generate(),
    };

    const [vaultOwner, vaultOwnerNonce] = await getVaultOwnerAndNonce(
      marketAccounts.market.publicKey,
      programID
    );

    // create vaults
    vaultInstructions.push(
      ...[
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: marketAccounts.baseVault.publicKey,
          lamports: await connection.getMinimumBalanceForRentExemption(
            ACCOUNT_SIZE
          ),
          space: ACCOUNT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: marketAccounts.quoteVault.publicKey,
          lamports: await connection.getMinimumBalanceForRentExemption(
            ACCOUNT_SIZE
          ),
          space: ACCOUNT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeAccountInstruction(
          marketAccounts.baseVault.publicKey,
          baseMint,
          vaultOwner
        ),
        createInitializeAccountInstruction(
          marketAccounts.quoteVault.publicKey,
          quoteMint,
          vaultOwner
        ),
      ]
    );

    vaultSigners.push(marketAccounts.baseVault, marketAccounts.quoteVault);

    // tickSize and lotSize here are the 1e^(-x) values, so no check for ><= 0
    const baseLotSize = Math.round(
      10 ** baseMintDecimals * Math.pow(10, -1 * data.lotSize)
    );
    const quoteLotSize = Math.round(
      10 ** quoteMintDecimals *
        Math.pow(10, -1 * data.lotSize) *
        Math.pow(10, -1 * data.tickSize)
    );

    // create market account
    marketInstructions.push(
      SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.market.publicKey,
        fromPubkey: wallet.publicKey,
        space: Market.getLayout(programID).span,
        lamports: await connection.getMinimumBalanceForRentExemption(
          Market.getLayout(programID).span
        ),
        programId: programID,
      })
    );

    // create request queue
    marketInstructions.push(
      SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.requestQueue.publicKey,
        fromPubkey: wallet.publicKey,
        space: totalRequestQueueSize,
        lamports: await connection.getMinimumBalanceForRentExemption(
          totalRequestQueueSize
        ),
        programId: programID,
      })
    );

    // create event queue
    marketInstructions.push(
      SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.eventQueue.publicKey,
        fromPubkey: wallet.publicKey,
        space: totalEventQueueSize,
        lamports: await connection.getMinimumBalanceForRentExemption(
          totalEventQueueSize
        ),
        programId: programID,
      })
    );

    const orderBookRentExempt =
      await connection.getMinimumBalanceForRentExemption(totalOrderbookSize);

    // create bids
    marketInstructions.push(
      SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.bids.publicKey,
        fromPubkey: wallet.publicKey,
        space: totalOrderbookSize,
        lamports: orderBookRentExempt,
        programId: programID,
      })
    );

    // create asks
    marketInstructions.push(
      SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.asks.publicKey,
        fromPubkey: wallet.publicKey,
        space: totalOrderbookSize,
        lamports: orderBookRentExempt,
        programId: programID,
      })
    );

    marketSigners.push(
      marketAccounts.market,
      marketAccounts.requestQueue,
      marketAccounts.eventQueue,
      marketAccounts.bids,
      marketAccounts.asks
    );

    marketInstructions.push(
      DexInstructions.initializeMarket({
        market: marketAccounts.market.publicKey,
        requestQueue: marketAccounts.requestQueue.publicKey,
        eventQueue: marketAccounts.eventQueue.publicKey,
        bids: marketAccounts.bids.publicKey,
        asks: marketAccounts.asks.publicKey,
        baseVault: marketAccounts.baseVault.publicKey,
        quoteVault: marketAccounts.quoteVault.publicKey,
        baseMint,
        quoteMint,
        baseLotSize: new BN(baseLotSize),
        quoteLotSize: new BN(quoteLotSize),
        feeRateBps: 150, // Unused in v3
        quoteDustThreshold: new BN(500), // Unused in v3
        vaultSignerNonce: vaultOwnerNonce,
        programId: programID,
      })
    );

    const transactionWithSigners: TransactionWithSigners[] = [];
    if (mintInstructions.length > 0) {
      transactionWithSigners.push({
        transaction: new Transaction().add(...mintInstructions),
        signers: mintSigners,
      });
    }
    transactionWithSigners.push(
      {
        transaction: new Transaction().add(...vaultInstructions),
        signers: vaultSigners,
      },
      {
        transaction: new Transaction().add(...marketInstructions),
        signers: marketSigners,
      }
    );

    try {
      const signedTransactions = await signTransactions({
        transactionsAndSigners: transactionWithSigners,
        wallet,
        connection,
      });

      // looping creates weird indexing issue with transactionMessages
      await sendSignedTransaction({
        signedTransaction: signedTransactions[0],
        connection,
        skipPreflight: false,
        successCallback: async (txSig) => {
          toast(
            () => (
              <TransactionToast
                txSig={txSig}
                message={
                  signedTransactions.length > 2
                    ? TRANSACTION_MESSAGES[0].successMessage
                    : TRANSACTION_MESSAGES[1].successMessage
                }
              />
            ),
            { autoClose: 5000 }
          );
        },
        sendingCallback: async () => {
          toast.info(
            signedTransactions.length > 2
              ? TRANSACTION_MESSAGES[0].sendingMessage
              : TRANSACTION_MESSAGES[1].sendingMessage,
            {
              autoClose: 2000,
            }
          );
        },
      });
      await sendSignedTransaction({
        signedTransaction: signedTransactions[1],
        connection,
        skipPreflight: false,
        successCallback: async (txSig) => {
          toast(
            () => (
              <TransactionToast
                txSig={txSig}
                message={
                  signedTransactions.length > 2
                    ? TRANSACTION_MESSAGES[1].successMessage
                    : TRANSACTION_MESSAGES[2].successMessage
                }
              />
            ),
            { autoClose: 5000 }
          );
        },
        sendingCallback: async () => {
          toast.info(
            signedTransactions.length > 2
              ? TRANSACTION_MESSAGES[1].sendingMessage
              : TRANSACTION_MESSAGES[2].sendingMessage,
            {
              autoClose: 2000,
            }
          );
        },
      });

      if (signedTransactions.length > 2) {
        await sendSignedTransaction({
          signedTransaction: signedTransactions[2],
          connection,
          skipPreflight: false,
          successCallback: async (txSig) => {
            toast(
              () => (
                <TransactionToast
                  txSig={txSig}
                  message={TRANSACTION_MESSAGES[2].successMessage}
                />
              ),
              { autoClose: 5000 }
            );
          },
          sendingCallback: async () => {
            toast.info(TRANSACTION_MESSAGES[2].sendingMessage, {
              autoClose: 2000,
            });
          },
        });
      }

      router.push({
        pathname: `${marketAccounts.market.publicKey.toBase58()}`,
        query: router.query,
      });
    } catch (e) {
      console.error("[explorer]: ", e);
      toast.error("Failed to create market.");
    }
  };

  return (
    <div className="grid">
      <div>
        <div>
          <h1 className="text-2xl  text-center mb-4">Create Market</h1>
        </div>
        <form onSubmit={handleSubmit(handleCreateMarket)}>
          <div className="space-y-4">
            <div className="bg-[rgba(13,25,39,255)]  px-4 py-5 shadow rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-purple-500">
                    Mints
                  </h3>
                  <p className="mt-1 text-sm text-purple-400">
                    Configure the mints for the tokens you want to create a
                    market for.
                  </p>
                </div>
                <div className="mt-5 space-y-4 md:col-span-2 md:mt-0">
                  <div>
                    <RadioGroup
                      value={createMint}
                      onChange={(value: boolean) =>
                        setValue("createMint", value)
                      }
                    >
                      <RadioGroup.Label className="sr-only">
                        Create Mint
                      </RadioGroup.Label>
                      <div className="flex items-center space-x-2">
                        <RadioGroup.Option
                          value={true}
                          className="flex-1 focus-style rounded-md"
                        >
                          {({ active, checked }) => (
                            <CreateMintOption active={active} checked={checked}>
                              <p>Existing</p>
                            </CreateMintOption>
                          )}
                        </RadioGroup.Option>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    {createMint ? (
                       <ExistingMintForm
                        register={register}
                        formState={formState}
                      />
                    ) : (
                      null
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[rgba(13,25,39,255)]  px-4 py-5 shadow rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-purple-500">
                    Tickers
                  </h3>
                  <p className="mt-1 text-sm text-purple-400">
                    Configure the tick sizes, or lowest representable quantities
                    of base and quote tokens.
                  </p>
                </div>
                <div className="mt-5 space-y-4 md:col-span-2 md:mt-0">
                  <TickerForm register={register} />
                </div>
              </div>
            </div>
            <div className="flex justify-end w-full">
              <button className="w-full md:max-w-xs rounded-xl p-2 bg-purple-500 hover:-translate-y-2 duration-300 disabled:opacity-20">
                Create
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateMarket.getLayout = (page: ReactNode) =>
  getHeaderLayout(page, "Create Market");

export default CreateMarket;
