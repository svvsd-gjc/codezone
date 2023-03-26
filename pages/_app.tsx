import React, { useEffect } from 'react';
import Header from '../components/header';
import { SessionProvider } from "next-auth/react";
import '../styles/globals.css';
import { AppProps } from 'next/app';
import Head from 'next/head';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {

    useEffect(() => {
        // TODO i'd really like to find a less ugly solution to this issue
        // in order to add a style to the body, this is the only way i've found
        // however, if it's possible, doing it in globals.css would be ideal
        document.body.classList.add("dark:bg-gray-800");
        document.body.classList.add("h-screen");
        document.body.classList.add("w-screen");
    });

    return <SessionProvider session={session}>
        <Header />
        <Head>
            <title>CodeZone</title>
        </Head>
        <Component {...pageProps} />
    </SessionProvider>;
}

export default MyApp;
