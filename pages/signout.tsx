import { signOut, useSession } from "next-auth/react";

const Signout = () => {
    signOut({ callbackUrl: "/signin" });
    return (<></>);
}

export default Signout;
