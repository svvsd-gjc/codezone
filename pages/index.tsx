import { useRouter } from "next/router";
import { useEffect } from "react";
import { useCookies } from "react-cookie";

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
};

export default Index;
