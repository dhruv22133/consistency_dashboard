import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            createdAt?: string;
            hasPassword?: boolean;
            sessionToken?: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        createdAt?: string;
        hasPassword?: boolean;
        sessionToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        createdAt?: string;
        hasPassword?: boolean;
        loginTimestamp?: number;
        expiresAt?: number;
        sessionToken?: string;
        reusedJwt?: string | null;
    }
}

