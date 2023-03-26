import React from 'react';
import Header from '../components/header';
import { SessionProvider } from "next-auth/react";
import '../styles/globals.css';
import { AppProps } from 'next/app';
import Head from 'next/head';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
    return <body className="h-screen dark:bg-gray-800">
        <SessionProvider session={session}>
            <Header />
            <Head>
                <title>CodeZone</title>
            </Head>
            <Component {...pageProps} />
        </SessionProvider>
    </body>;
}

export default MyApp;
