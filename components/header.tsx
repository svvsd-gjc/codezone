import { signOut, useSession } from "next-auth/react";
import RedirectButton from "./button";
const config = require("../code-comp.json");

function Header() {

    const session = useSession();

    return (
        <div className="flex-col w-screen">
            <div className="text-size-4 bg-gray-300 text-black hover:bg-gray-400 hover:text-white dark:hover:bg-gray-600 dark:bg-gray-700 transition-all p-2">
                <span className="px-6 dark:text-white tracking-widest italic">
                    <span className="bg-gradient-to-r from-blue-800 to-cyan-900 dark:from-blue-200 dark:to-cyan-300 text-transparent bg-clip-text drop-shadow-lg">
                        CodeZone V{require("../package.json").version}
                    </span>
                </span>
                {/* Buttons */}
                <RedirectButton href="/leaderboard">leaderboard</RedirectButton>
                <RedirectButton href="/">problems</RedirectButton>
                {
                    session.status == "loading" ? <RedirectButton>loading...</RedirectButton> : null
                }
                {
                    session.status == "authenticated"
                        ?
                        <RedirectButton href="/" onClick={() => signOut({ callbackUrl: "/signin" })}>logout <span className="text-white">({session.data.user?.name})</span></RedirectButton>
                        :
                        <RedirectButton href="/signin">login{config["allow-signups"] ? <>/signup</> : <></>}</RedirectButton>
                }
            </div>
        </div>
    );
}

export default Header;
