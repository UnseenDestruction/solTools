"use client"
import Link from "next/link";
import { useState } from "react";

const Faq = () => {
    const [showAnswers, setShowAnswers] = useState(Array(5).fill(false)); // Assuming 5 questions

    const faqData = [
        {
            question: "What is this Website?",
            answer: "This website is a token creator, token manager, and market creator website! We noticed that people often struggle trying to figure out all the different things to do to make a token on the solana network, so we've made it easy for you where it's all available to you in one convenient website! Read our <guide link> for learning about all the steps to launch a token!",
        },
        {
            question: "I Want To Launch A Token But I Don't Know How!",
            answer: "Please read our Guide Page to learn and understand how you can create a solana token and make it ready to trade on the market from start to finish!",
        },
        {
            question: "Are my coins safe/Is this website safe?",
            answer: "Yes, this is a dApp and does only ensures you are the token owner, mint and freeze authority, and so on. Reviews left on our discord server(links) as well can show you that we are not here to scam!",
        },
        {
            question: "What is the fee for using your platform?",
            answer: "We charge a flat rate fee of 0.1 solana for token creation. We charge a flat rate fee of 0.5 solana for market creation. Market creation is often deemed to cost 3 sol, but it really doesn't have to be! Our market creation system uses custom values that reduces the cost on your end. We do NOT charge anything for revoking mint authority and freeze authority! We're just cool like that",
        },
        {
            question: "What wallets can I use?",
            answer: "You can use any connected wallet like solflare, phantom, etc. to create your token.",
        },
    ];

    const showClick = (index: number) => {
        const newShowAnswers = [...showAnswers];
        newShowAnswers[index] = !newShowAnswers[index];
        setShowAnswers(newShowAnswers);
    };

    return (
        <div className="relative left-[25%]  p-10 bg-[rgba(13,25,39,255)] rounded-xl w-[50%]">
            <div className="display grid gap-5">
                <h1 className="text-4xl text-center">FAQ</h1>
                {faqData.map((faq, index) => (
                    <div
                        key={index}
                        className="bg-purple-500 rounded-xl p-5 cursor-pointer hover:-translate-y-2 duration-300" 
                        onClick={() => showClick(index)}
                    >
                        <h1 className="display flex justify-between items-center">
                            {faq.question}
                            <span className="text-2xl">{showAnswers[index] ? '-' : '+'}</span>
                        </h1>
                        <p className={showAnswers[index] ? '' : 'hidden'}>{faq.answer}</p>
                    </div>
                ))}
                <div className="text-center mt-4">
                    <Link href="pages/guide" className="text-blue-500 underline">
                        Read our Guide for more information
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Faq;
