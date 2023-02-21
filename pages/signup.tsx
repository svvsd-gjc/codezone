import RedirectButton from "../components/button";
import sha256 from "crypto-js/sha256";
import { signIn } from "next-auth/react";

export async function getServerSideProps({ query }: { query: any }) {
    const { error } = query;
    return {
        props: { err: error ? error : null }
    }
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
        })
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <div className="w-full max-w-xs">
                    <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSignup}>
                        <input type="text" placeholder="username" className="bg-gray-200"></input>
                        <input type="password" placeholder="password" className="bg-gray-200"></input>
                        <div className="p-2">
                            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">Sign up</button>
                        </div>
                    </form>
                    <RedirectButton href="/signin">Or log in!</RedirectButton>
                    {err ? <span className="bg-red-400 rounded p-1">Error: {err}</span> : null}
                </div>
            </div>
        </>
    );
};

export default Signup;
