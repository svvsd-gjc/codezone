import RedirectButton from "../components/button";
import sha256 from "crypto-js/sha256";
import { signIn } from "next-auth/react";

export async function getServerSideProps({ query }: { query: any }) {
    const { error } = query;
    return {
        props: { err: error ? error : null }
    };
}

const Signin = ({ err }: { err: any }) => {

    const handleSignup = async (e: any) => {
        e.preventDefault();

        const username = e.target[0].value;
        const password = sha256(e.target[1].value).toString();

        signIn("credentials", {
            username: username,
            password: password,
            callbackUrl: "/dashboard"
        });
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-800">
                <div className="w-full max-w-xs">
                    <form className="bg-white dark:bg-gray-900 shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSignup}>
                        <input type="text" placeholder="username" className="w-full my-2 p-2 bg-gray-200 dark:bg-gray-300"></input>
                        <input type="password" placeholder="password" className="w-full my-2 p-2 bg-gray-200 dark:bg-gray-300"></input>
                        <button className="w-full p-2 my-3 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded" type="submit">Sign in</button>
                    </form>
                    <RedirectButton href="/signup">Or sign up!</RedirectButton>
                    {err ? <span className="bg-red-400 rounded p-1">Error: {err}</span> : null}
                </div>
            </div>
        </>
    );
};

export default Signin;
