import React from "react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

const Index = () => {
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status == "authenticated") {
            // if the user is logged in, route to dashboard
            router.push("/dashboard");
        } else {
            // otherwise, route to the login page
            router.push("/signin");
        }
    });


    return (<></>); // TODO skeleton loader
};

export default Index;
