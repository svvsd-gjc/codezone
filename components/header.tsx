import { signOut, useSession } from "next-auth/react";
import RedirectButton from "./button";
const config = require("../code-comp.json");

function Header() {

    const session = useSession();

    return (
        <div className="flex-col w-screen">
            <div className="text-size-4 bg-gray-300 text-black hover:bg-gray-600 hover:text-white dark:bg-gray-700 transition-all p-2">
                <span className="px-6 dark:text-white">CODE_ZONE</span>
                {/* Buttons */}
                <RedirectButton href="/leaderboard">Leaderboard</RedirectButton>
                <RedirectButton href="/">Problems</RedirectButton>
                {
                    session.status == "loading" ? <RedirectButton>loading...</RedirectButton> : null
                }
                {
                    session.status == "authenticated"
                        ?
                        <RedirectButton href="/" onClick={() => signOut({ callbackUrl: "/signin" })}>Log Out <span className="text-white">({session.data.user?.name})</span></RedirectButton>
                        :
                        <RedirectButton href="/signin">Log in{config["allow-signups"] ? <>/Sign up</> : <></>}</RedirectButton>
                }
            </div>
        </div>
    );
}

export default Header;
