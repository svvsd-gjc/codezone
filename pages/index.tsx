import React from "react";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { useEffect } from "react";

const Index = () => {
    const [cookie] = useCookies(["user"]);
    const router = useRouter();

    useEffect(() => {
        if (cookie.user) {
            // if the user is logged in, route to dashboard
            router.push("/dashboard");
        } else {
            // otherwise, route to the login page
            router.push("/login");
        }
    });


    return (<></>); // TODO skeleton loader
}

export default Index;
