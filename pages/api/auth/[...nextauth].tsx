import { NextAuthOptions } from "next-auth";
import { prisma } from "../../../src/db";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

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
                const user = prisma.account.findUnique({
                    where: {
                        name: credentials.username,
                    }
                });

                if ((await user).password == credentials.password) {
                    return user;
                } else {
                    return null;
                }
            },
        })
    ],
    pages: {
        signIn: "/auth/signin",
        signOut: "/auth/signout"
    },
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt"
    }
}

export default options;