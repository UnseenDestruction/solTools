import { BsDiscord } from "react-icons/bs";
import { FaTwitter } from "react-icons/fa";

const Footer = () => {

    return(
        <div className="display flex justify-between items-center bg-black p-10 ">   
           <h1>Copyright @Pondini Development, 2023</h1>  
           <div className="text-lg display flex gap-4">    
           <a href="" className="hover:-translate-y-2 duration-300"><BsDiscord /></a>
           <a href="" className="hover:-translate-y-2 duration-300"><FaTwitter /></a>
           </div>
        </div>
    )
}

export default Footer;