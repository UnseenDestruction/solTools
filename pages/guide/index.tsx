import { useState } from "react";
import Link from "next/link";
import { HeaderLayout } from "../../components/layouts/HeaderLayout";
import Footer from "../../components/common/Footer";

interface Provider {
    Name: string;
    Link: string;
    Instructions: string;
}

interface StepData {
    Image?: string;
    Name?: string;
    Symbol?: string;
    Description?: string;
    Supply?: string;
    Decimals?: string;
    RevokeMintAuthority?: string;
    RevokeFreezeAuthority?: string;
    Mints?: string;
    BaseMint?: string;
    QuoteMint?: string;
    Tickers?: string;
    Minordersize?: string;
    PriceTick?: string;
    LiquidityManager?: string;
    Providers?: Provider[];
}

interface Section {
    section: string;
    content: string;
    stepData?: StepData;
}


const Guide = () => {
    const [showAnswers, setShowAnswers] = useState<boolean[]>(Array(3).fill(false));

    const guideData: Section[] = [
        {
            section: "Disclaimer:",
            content: "This guide is only written by the knowledge that I am aware of. I am sure there are many other ways to go about this, however this is what I have found to be the easiest way for people to create tokens on the solana network. If you follow this guide top-to-bottom, you will be able to launch a coin successfully! If there are any errors, please contact us at the discord server!",
        },
        {
            section: "Step 1: Create the token",
            content: "In this step, you can go to the token creator and create the token with a specific image, name, description, symbol, decimal place, and maximum supply...",
            stepData: {
                Image: "This will be the icon of your token. Pretty straightforward",
                Name: "This will be the name of the token that appears beside your trading pair. So for example WIF/SOL - dogwifhat. dogwifhat will be the name.",
                Symbol: "This will be what people use to identify the token quickly, for example SOL, BTC, ETH, etc. Keep this short and simple to remember!",
                Description: "You can set the description of the token here! Most people put in their socials to the coin, or just give an explanation of what the token utility is",
                Supply: "You can specify the number of tokens to create initially. Supply cannot exceed u64 maximum",
                Decimals: "You can specify the number of decimals the token should have. You can enter a valid range between 0 to 9",
                RevokeMintAuthority: "Mint authority is the ability for you to create more tokens at any point in time. People often revoke mint authority to show interested buyers that you will not be minting any more tokens, thus building trust. It's a good idea to revoke this if you want to build up your token!",
                RevokeFreezeAuthority: "Freeze authority is the ability for you to freeze usability of your tokens. People won't be able to do anything with them. It's also a good idea to revoke this to build trust in your community!",
            },
        },
        {
            section: "Step 2: Create a market",
            content: "Now we have to create a market in order to allow the token to be available on swapping platforms like raydium...",
            stepData: {
                Mints: " Here, you can configure how you want your trading pair to be setup. This would let you decide if you want the trading pair to be YOUR_TOKEN/USDC or YOUR_TOKEN/SOL , etc. ",
                BaseMint: "This will be your token contract address",
                QuoteMint: "This will be the token you want to exchange with. If it's SOL the address is So11111111111111111111111111111111111111112 . If it's USDC, it's EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v. You can always double check these addresses on solscan!",
                Tickers: "Here, you can configure two things",
                Minordersize: "Determines the minimum quantity of tokens required to buy a token. Usually, people put it as 1!",
                PriceTick: "It is the price display digits. Again, people usually put 1 here too"
            },
        },
        {
            section: "Step 3: Time to add liquidity",
            content: "This is the final step to making your token tradeable. We are working on a liquidity manager on the website...",
            stepData: {
                LiquidityManager: "We are working on a liquidity manager on the website...",
                Providers: [
                    {
                        Name: "Raydium",
                        Link: "https://raydium.io/liquidity/add/",
                        Instructions: "Click 'Create pool' and paste in the market ID when it asks for OpenBook Market ID, then you may add liquidity",
                    },
                ],
            },
        },
    ];

    const showClick = (index: number) => {
        const newShowAnswers = [...showAnswers];
        newShowAnswers[index] = !newShowAnswers[index];
        setShowAnswers(newShowAnswers);
    };

    return (
        <div className="overflow-hidden">
            <HeaderLayout > </HeaderLayout>
            <div className="w-[50%] relative left-[25%]  top-[-700px]">
                <div className="display grid gap-5">
                    <h1 className="text-4xl text-center">Guide</h1>
                    {guideData.map((section, index) => (
                        <div
                            key={index}
                            className="bg-purple-500 rounded-xl p-5 cursor-pointer hover:-translate-y-2 duration-300"
                            onClick={() => showClick(index)}
                        >
                            <h1 className="display flex justify-between items-center">
                                {section.section}
                                <span className="text-2xl">{showAnswers[index] ? '-' : '+'}</span>
                            </h1>
                            <p className={showAnswers[index] ? '' : 'hidden'}>{section.content}</p>
                            {section.stepData && showAnswers[index] && (
                                <div className="display grid gap-4">
                                    {Object.entries(section.stepData).map(([key, value]) => (
                                        <div key={key}>
                                            {key === 'Providers' ? (
                                                <div>
                                                    <strong>{key}:</strong>
                                                    {value.map((provider: Provider, providerIndex: number) => (
                                                        <div key={providerIndex}>
                                                            <p>
                                                                <strong>Name:</strong> {provider.Name}
                                                            </p>
                                                            <p>
                                                                <strong>Link:</strong> {provider.Link}
                                                            </p>
                                                            <p>
                                                                <strong>Instructions:</strong> {provider.Instructions}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p>
                                                    <strong>{key}:</strong> {`${value}`}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="text-center relative bottom-[-30px] ">
                        <Link href="" passHref className="text-blue-500 underline">
                            Read our Guide for more information
                        </Link>
                    </div>
                </div>
            </div>
            <div className="relative ">
                <Footer />
            </div>
        </div>
    );
};

export default Guide;
