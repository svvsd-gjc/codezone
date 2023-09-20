import RedirectButton from "../components/button";
import sha256 from "crypto-js/sha256";
import { signIn } from "next-auth/react";

export async function getServerSideProps({ query }: { query: any }) {
    const { error } = query;
    return {
        props: { err: error ? error : null }
    };
}

const Signup = ({ err }: { err: any }) => {

    const handleSignup = async (e: any) => {
        e.preventDefault();

        const username = e.target[0].value;
        const password = sha256(e.target[1].value).toString();

        // create the account via API
        const response = await fetch("/api/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        // sign into the newly created account with next-auth
        signIn("credentials", {
            username: username,
            password: password,
            callbackUrl: "/",
        });
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center h-screen bg-gray-200 dark:bg-gray-800">
                <div className="w-full max-w-xs">
                    <form className="rounded-sm nm-flat-gray-200-lg dark:nm-flat-gray-800-lg px-8 pt-6 pb-8 mb-4" onSubmit={handleSignup}>
                        <input type="text" placeholder="username" className="w-full my-2 p-2 rounded-lg nm-inset-gray-200 dark:nm-inset-gray-800"></input>
                        <input type="password" placeholder="password" className="w-full my-2 p-2 rounded-lg nm-inset-gray-200 dark:nm-inset-gray-800"></input>
                        <button className="w-full p-2 my-3 nm-convex-gray-200-lg dark:nm-convex-gray-800-lg dark:text-white font-bold rounded-lg" type="submit">Sign up</button>
                    </form>
                    <RedirectButton href="/signin">Or log in!</RedirectButton>
                    {err ? <span className="bg-red-400 rounded p-1">Error: {err}</span> : null}
                </div>
            </div>
        </>
    );
};

export default Signup;
