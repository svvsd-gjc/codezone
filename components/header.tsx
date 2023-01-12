import { useSession } from "next-auth/react";
import RedirectButton from "./button";
const config = require("../code-comp.json");

function Header() {

    const session = useSession();

    return (
        <div className="flex-col w-screen">
            <div className="text-size-4 bg-gray-300 text-black hover:bg-gray-600 hover:text-white transition-all p-2">
                <span className="px-6">CODE_ZONE</span>
                {/* Buttons */}
                <RedirectButton href="/leaderboard">leaderboard</RedirectButton>
                <RedirectButton href="/">problems</RedirectButton>
                {
                    session.status == "authenticated"
                        ?
                        <RedirectButton href="/signout">logout <span className="text-white">({session.data.user.name})</span></RedirectButton>
                        :
                        <RedirectButton href="/signin">login{config["allow-signups"] ? <>/signup</> : <></>}</RedirectButton>
                }
            </div>
        </div>
    );
}

export default Header;
