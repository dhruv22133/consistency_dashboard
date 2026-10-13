import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { encode as defaultEncode, decode as defaultDecode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import GoogleProvider from "next-auth/providers/google";

const THREE_DAYS_IN_SECONDS = 3 * 24 * 60 * 60; // 259,200 seconds (Hard 3-day token lifetime)

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,

    session: {
        strategy: "jwt",
        maxAge: THREE_DAYS_IN_SECONDS,    // Token expires after 3 days
        updateAge: THREE_DAYS_IN_SECONDS, // No sliding window refresh within the 3 days
    },

    jwt: {
        maxAge: THREE_DAYS_IN_SECONDS,

        // Custom encode: ensures every Gmail has strictly ONE JWT and reuses previous active JWT on re-login
        async encode(params) {
            const { token, secret } = params;
            if (!token || !token.id) {
                return await defaultEncode(params);
            }

            const userId = token.id as string;
            const now = new Date();

            // Check if user already has an active, unexpired session for this Gmail in the database
            const existingSession = await prisma.session.findFirst({
                where: {
                    userId,
                    expires: { gt: now },
                },
                orderBy: { expires: "desc" },
            });

            if (existingSession && existingSession.sessionToken) {
                // Decode the existing session token to check if claims (specifically hasPassword) match
                const decodedExisting = await defaultDecode({ token: existingSession.sessionToken, secret });

                // If password status has NOT changed, reuse previous JWT!
                if (decodedExisting && Boolean(decodedExisting.hasPassword) === Boolean(token.hasPassword)) {
                    return existingSession.sessionToken;
                }

                // If password status changed (e.g. user just set their password!), update the JWT
                // while strictly preserving the original 3-day expiration deadline!
                const targetExpiresAt = Math.floor(existingSession.expires.getTime() / 1000);
                const remainingSeconds = Math.max(1, targetExpiresAt - Math.floor(Date.now() / 1000));

                const updatedJwt = await defaultEncode({
                    ...params,
                    maxAge: remainingSeconds,
                });

                await prisma.session.update({
                    where: { id: existingSession.id },
                    data: { sessionToken: updatedJwt },
                });

                return updatedJwt;
            }

            // No active unexpired session exists.
            // Clean up old expired sessions while keeping other active devices logged in
            await prisma.session.deleteMany({
                where: { userId, expires: { lte: now } },
            });

            // Calculate remaining lifetime up to the 3-day mark
            const targetExpiresAt = token.expiresAt
                ? (token.expiresAt as number)
                : Math.floor(Date.now() / 1000) + THREE_DAYS_IN_SECONDS;

            const remainingSeconds = Math.max(1, targetExpiresAt - Math.floor(Date.now() / 1000));

            // Issue the single new JWT with the exact remaining time
            const newJwt = await defaultEncode({
                ...params,
                maxAge: remainingSeconds,
            });

            // Store this exact JWT in the database Session table as the single active session for this Gmail
            await prisma.session.create({
                data: {
                    userId,
                    sessionToken: newJwt,
                    expires: new Date(targetExpiresAt * 1000),
                },
            });

            return newJwt;
        },

        async decode(params) {
            const { token, secret } = params;
            if (!token) return null;
            try {
                return await defaultDecode({ token, secret });
            } catch {
                return null;
            }
        },
    },

    pages: {
        signIn: "/login",
    },

    providers: [
        // 1. Email & Password Provider
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials);
                if (!parsed.success) {
                    throw new Error("Invalid email or password format");
                }

                const { email, password } = parsed.data;

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    throw new Error("No account found with this email. New accounts must register with Google.");
                }

                if (!user.password) {
                    throw new Error("This account was created with Google but has no password set yet. Please sign in with Google to set your password.");
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    throw new Error("Incorrect password");
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    hasPassword: true,
                    createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
                };
            },
        }),

        // 2. Google OAuth Provider (Always shows account selector to choose between device Gmail accounts)
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                GoogleProvider({
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    authorization: {
                        params: {
                            prompt: "select_account",
                            access_type: "offline",
                            response_type: "code",
                            scope: "openid email profile",
                        },
                    },
                    allowDangerousEmailAccountLinking: true,
                }),
            ]
            : []),

        // 3. GitHub OAuth Provider (Optional)
        ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
            ? [
                GithubProvider({
                    clientId: process.env.GITHUB_ID,
                    clientSecret: process.env.GITHUB_SECRET,
                }),
            ]
            : []),
    ],

    callbacks: {
        async jwt({ token, user, account }) {
            const nowSeconds = Math.floor(Date.now() / 1000);

            // On user sign-in: either reuse existing active session for this Gmail or create one
            if (user) {
                token.id = user.id;

                const userCreated = (user as any).createdAt;
                if (userCreated) {
                    token.createdAt = typeof userCreated === "string"
                        ? userCreated
                        : (userCreated instanceof Date ? userCreated.toISOString() : String(userCreated));
                }

                // Check if user is already registered and if they already have an active unexpired session for this Gmail
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: {
                        accounts: true,
                        sessions: {
                            where: { expires: { gt: new Date() } },
                            orderBy: { expires: "desc" },
                        },
                    },
                });

                if (dbUser) {
                    token.hasPassword = Boolean(dbUser.password && dbUser.password.length > 0);
                    if (!token.createdAt && dbUser.createdAt) {
                        token.createdAt = dbUser.createdAt.toISOString();
                    }

                    const existingSession = dbUser.sessions[0];
                    if (existingSession) {
                        // User already registered with active session: Reuse previous session & original 3-day countdown!
                        token.sessionToken = existingSession.sessionToken;
                        token.expiresAt = Math.floor(existingSession.expires.getTime() / 1000);
                        token.loginTimestamp = token.expiresAt - THREE_DAYS_IN_SECONDS;
                        token.reusedJwt = existingSession.sessionToken;
                    } else {
                        // Purge expired sessions while keeping other active devices logged in
                        await prisma.session.deleteMany({
                            where: { userId: user.id, expires: { lte: new Date() } },
                        });

                        token.expiresAt = nowSeconds + THREE_DAYS_IN_SECONDS;
                        token.loginTimestamp = nowSeconds;
                        token.reusedJwt = null;
                    }
                }
            }

            // Check hard 3-day expiration (no sliding window extension)
            if (token.expiresAt && nowSeconds >= (token.expiresAt as number)) {
                return null as any;
            }

            // On subsequent requests, verify that the session is still active in the database
            if (!user && token.id) {
                const activeSession = await prisma.session.findFirst({
                    where: {
                        userId: token.id as string,
                        expires: { gt: new Date() },
                    },
                    orderBy: { expires: "desc" },
                });

                if (!activeSession) {
                    return null as any;
                }

                // Sync password status if changed
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { password: true, createdAt: true },
                });
                if (dbUser) {
                    token.hasPassword = Boolean(dbUser.password && dbUser.password.length > 0);
                    if (!token.createdAt && dbUser.createdAt) {
                        token.createdAt = dbUser.createdAt.toISOString();
                    }
                }
            }

            return token;
        },

        async session({ session, token }) {
            const nowSeconds = Math.floor(Date.now() / 1000);

            // Invalidate session if token is expired past 3 days or invalid
            if (!token || !token.id || (token.expiresAt && nowSeconds >= (token.expiresAt as number))) {
                return null as any;
            }

            if (session.user && token.id) {
                session.user.id = token.id as string;
                if (token.createdAt) {
                    session.user.createdAt = token.createdAt as string;
                }
                session.user.hasPassword = Boolean(token.hasPassword);
                session.user.sessionToken = (token.sessionToken || "") as string;
            }
            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};
