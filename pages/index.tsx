import { HeaderLayout } from "../components/layouts/HeaderLayout";
import Faq from "../components/common/Faq";
import Footer from "../components/common/Footer";
import WalletButton from "../components/common/WalletButton";
import { useState } from "react";


const Home = () => {

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      setSelectedFile(fileList[0]);
    }
  };
  


  return (
      <div className="display grid">
        <HeaderLayout > </HeaderLayout>
      <div className="display flex justify-center items-center relative top-[-700px] ">
     <div className="w-[50%] display grid gap-10">
     <h1 className="display grid text-center text-4xl">Solana Token Creator<span className="text-sm">The Perfect Tool for Creating Your solana SPL Tokens, simple and fast</span></h1>
      <form className="p-10 bg-[rgba(13,25,39,255)] display grid gap-4 shadow-2xl rounded-xl">
        <div className="display flex justify-between items-center gap-2">
        <label className="w-full">
          <h1>Name:</h1>
          <input type="text" placeholder="Name here:" required className="rounded-lg p-2 bg-slate-300 w-full text-black"></input>
        </label>
        <label className="w-full">
          <h1>Symbol:</h1>
          <input type="text" placeholder="Symbol here:"  className="rounded-lg p-2 bg-slate-300 w-full text-black" required></input>
        </label>
        </div>
        <div className="display flex justify-between item-center gap-2">
          <div className="w-full">
        <label>
          <h1>Decimals:</h1>
          <input type="text" placeholder="Decimal here:" className="rounded-lg p-2 bg-slate-300 w-full  text-black"  required></input>
        </label>
        <label >
          <h1>Supply:</h1>
          <input type="text" placeholder="Supply here:" className="rounded-lg p-2 bg-slate-300 w-full text-black" required></input>
        </label>
        </div>
        <label className="display grid w-full">
      <h1>Image:</h1>
      {selectedFile ? (
        <img
          src={URL.createObjectURL(selectedFile)}
          alt="Uploaded file"
          className="rounded-xl border-2 p-10 cursor-pointer w-full text-center border-dashed"
        />
      ) : (
        <span className="rounded-xl border-2 p-10 cursor-pointer w-full text-center border-dashed">
          Upload Image
        </span>
      )}
      <input
        type="file"
        required
        className="hidden w-full"
        accept="image/jpeg, image/png, image/jpg"
        onChange={handleFileChange}
      />
    </label>
        </div>
        <div className="display flex gap-2 ">
        <label>
          <h1>Revoke Mint Authority:</h1>
          <input  type="text" placeholder="Type here:" className="rounded-lg p-2 bg-slate-300 w-full text-black"></input>
        </label>
        <label>
          <h1>Revoke Freeze Authority:</h1>
          <input type="text" placeholder="Type here:" className="rounded-lg p-2 bg-slate-300 w-full text-black"></input>
        </label>
        </div>
        <label>
          <h1>Description:</h1>
          <textarea placeholder="Description here:" className="rounded-lg p-2 bg-slate-300 w-full h-[100px] text-black"></textarea>
        </label>
        <WalletButton />
      </form>
     </div>
     </div>
     <div className="relative top-[-500px]">
     <Faq />
     </div>
     <div className="relative">
     <Footer />
     </div>
     </div>
  );
};


export default Home;