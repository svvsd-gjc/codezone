import NextAuth, { NextAuthOptions } from "next-auth";
import { prisma, log } from "../../../src/db";
import CredentialsProvider from "next-auth/providers/credentials";
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
            async authorize(credentials) {
                const user = await prisma.user.findUnique({
                    where: {
                        name: credentials?.username,
                    }
                });

                if (!user) {
                    return null;
                }

                if (user.password == credentials?.password) {
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
    session: {
        strategy: "jwt",
    },
    logger: {
        error(code, meta) {
            log.error(code, meta);
        },
        debug(code, meta) {
            log.debug(code, meta);
        },
        warn(code) {
            log.warn(code);
        },
    }
}

const auth: NextApiHandler = (req, res) => {
    return NextAuth(req, res, options);
};
export default auth;
