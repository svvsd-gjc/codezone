import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

const Index = () => {
    const { push, isReady } = useRouter();
    const session = useSession();

    useEffect(() => {
        if (!isReady) return;
        if (session.status == "authenticated") {
            push("/dashboard");
        } else {
            push("/signin");
        }
    });

    return (<></>);
};

export default Index;
