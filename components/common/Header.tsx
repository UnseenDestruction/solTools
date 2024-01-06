import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { FC } from "react";
import WalletButton from "./WalletButton";
import Link from "next/link";
import { FaDiscord } from "react-icons/fa6";

const Header: FC = () => {
  const router = useRouter();

  const sanitizeQuery = (query: ParsedUrlQuery) => {
    if (query.address) {
      delete query.address;
    }
    return { ...query };
  };

  return (
      <div className="px-4 py-3 sm:px-6 md:space-x-6 space-x-2 ">
        <div className="flex justify-between items-center space-x-8">
          <button
            className="text-lg  text-white no-underline"
            onClick={() =>
              router.push({ pathname: "/", query: sanitizeQuery(router.query) })
            }
          >
            <p className="text-5xl  text-purple-500">
            <FaDiscord />
            </p>
          </button>
          <div className="space-x-4 hidden md:flex items-center">
          <Link
              passHref
              href={{
                pathname: `/`,
                query: router.query,
              }}
              className="focus-style px-1 rounded">
                <p className="text-sm text-slate-200 hover:underline focus-visible:outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-none">
                  Token Creator
                </p>
            </Link>
            <Link
              passHref
              href={{
                pathname: `/market/create`,
                query: router.query,
              }}
              className="focus-style px-1 rounded">
                <p className="text-sm text-slate-200 hover:underline focus-visible:outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-none">
                  Market Creator
                </p>
            </Link>
            <Link
              passHref
              href={{
                pathname: `/guide`,
                query: router.query,
              }}
              className="focus-style px-1 rounded" >
                <p className="text-sm text-slate-200 hover:underline focus-visible:outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-none">
                  Guide
                </p>
            </Link>
          <WalletButton />
          </div>
        </div>
      </div>
  );
};

export default Header;
