import React from "react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { getSession, useSession } from "next-auth/react";

export async function getServerSideProps(ctx) {
    const session = await getSession();
    if (!session) {
        return { redirect: { destination: "/signin" } };
    } else {
        return { redirect: { destination: "/dashboard" } };
    }
}

const Index = () => {
    return (<></>); // TODO skeleton loader
};

export default Index;
