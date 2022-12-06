import NextAuth, { NextAuthOptions } from "next-auth";
import { prisma } from "../../../src/db";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextApiHandler } from "next";

const options: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "credentials",
            credentials: {
                username: { label: "username", type: "text" },
                password: { label: "password", type: "password" },
            },
            async authorize(credentials, req) {
                const user = await prisma.account.findUnique({
                    where: {
                        name: credentials.username,
                    }
                });

                if (user.password == credentials.password) {
                    return user;
                } else {
                    return null;
                }
            },
        })
    ],
    pages: {
        signIn: "/signin",
        signOut: "/signout"
    },
    adapter: PrismaAdapter(prisma),
}

const auth: NextApiHandler = (req, res) => {
    return NextAuth(req, res, options);
};
export default auth;