import {NextAuthOptions} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb-client";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";
import {MongoDBAdapter} from "@auth/mongodb-adapter";

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    session: {strategy: "jwt"},
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // ✅ Request GSC scope so users can connect Google Search Console
            authorization: {
                params: {
                    scope: [
                        "openid",
                        "email",
                        "profile",
                        "https://www.googleapis.com/auth/webmasters.readonly",
                    ].join(" "),
                    access_type: "offline",  // needed to get refresh_token
                    prompt: "consent",       // force consent screen so refresh_token is always returned
                },
            },
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    role: "user",
                    plan: "free",
                };
            },
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: {label: "Email", type: "email"},
                password: {label: "Password", type: "password"},
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }
                await connectDB();
                const user = await UserModel.findOne({email: credentials.email}).select("+password");
                if (!user) throw new Error("No account found with this email");
                if (!user.password) throw new Error("Please sign in with Google");
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) throw new Error("Incorrect password");
                if (!user.isActive) throw new Error("Account is deactivated");
                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                    plan: user.plan,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({token, user, account, trigger, session}) {
            // ✅ On initial Google sign-in, store GSC tokens in JWT temporarily
            if (account?.provider === "google" && account.access_token) {
                token.gscAccessToken = account.access_token;
                token.gscRefreshToken = account.refresh_token ?? null;
            }

            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role ?? "user";
                token.plan = (user as { plan?: string }).plan ?? "free";
            }
            if (trigger === "update" && session) {
                token.name = session.name;
                token.role = session.role;
                token.plan = session.plan;
            }
            return token;
        },
        async session({session, token}) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.plan = token.plan as string;
                // ✅ Expose GSC connection status to client (token only, not full token value)
                session.user.gscConnected = !!(token.gscAccessToken);
            }
            return session;
        },
        async signIn({user, account}) {
            if (account?.provider === "google") {
                await connectDB();
                const existingUser = await UserModel.findOne({email: user.email});
                if (!existingUser) {
                    await UserModel.create({
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        role: "user",
                        plan: "free",
                        subscriptionStatus: "inactive",
                        aiCreditsUsed: 0,
                        aiCreditsLimit: 10,
                        isActive: true,
                        emailVerified: new Date(),
                    });
                } else if (!existingUser.isActive) {
                    return false;
                }

                // ✅ Persist GSC tokens to the user document whenever they sign in with Google
                if (account.access_token) {
                    await UserModel.findOneAndUpdate(
                        {email: user.email},
                        {
                            $set: {
                                gscAccessToken: account.access_token,
                                ...(account.refresh_token && {gscRefreshToken: account.refresh_token}),
                                gscConnectedAt: new Date(),
                            },
                        }
                    );
                }
            }
            return true;
        },
    },
    events: {
        async createUser({user}) {
            await connectDB();
            await UserModel.findOneAndUpdate(
                {email: user.email},
                {
                    $setOnInsert: {
                        role: "user",
                        plan: "free",
                        subscriptionStatus: "inactive",
                        aiCreditsUsed: 0,
                        aiCreditsLimit: 10,
                        isActive: true,
                    },
                },
                {upsert: true}
            );
        },
    },
};

// ── Type augmentations ──────────────────────────────────────────────────────
declare module "next-auth" {
    interface User {
        role?: string;
        plan?: string;
    }

    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role: string;
            plan: string;
            gscConnected?: boolean;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        plan: string;
        gscAccessToken?: string | null;
        gscRefreshToken?: string | null;
    }
}

// import { NextAuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";
// import clientPromise from "@/lib/mongodb-client";
// import { connectDB } from "@/lib/db";
// import UserModel from "@/models/User";
// import bcrypt from "bcryptjs";
// import {MongoDBAdapter} from "@auth/mongodb-adapter";
//
// export const authOptions: NextAuthOptions = {
//   adapter: MongoDBAdapter(clientPromise),
//   session: { strategy: "jwt" },
//   pages: {
//     signIn: "/login",
//     error: "/login",
//   },
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//       profile(profile) {
//         return {
//           id: profile.sub,
//           name: profile.name,
//           email: profile.email,
//           image: profile.picture,
//           role: "user",
//           plan: "free",
//         };
//       },
//     }),
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           throw new Error("Email and password are required");
//         }
//         await connectDB();
//         const user = await UserModel.findOne({ email: credentials.email }).select("+password");
//         if (!user) throw new Error("No account found with this email");
//         if (!user.password) throw new Error("Please sign in with Google");
//         const isValid = await bcrypt.compare(credentials.password, user.password);
//         if (!isValid) throw new Error("Incorrect password");
//         if (!user.isActive) throw new Error("Account is deactivated");
//         return {
//           id: user._id.toString(),
//           name: user.name,
//           email: user.email,
//           image: user.image,
//           role: user.role,
//           plan: user.plan,
//         };
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user, trigger, session }) {
//       if (user) {
//         token.id = user.id;
//         token.role = (user as { role?: string }).role ?? "user";
//         token.plan = (user as { plan?: string }).plan ?? "free";
//       }
//       if (trigger === "update" && session) {
//         token.name = session.name;
//         token.role = session.role;
//         token.plan = session.plan;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.id as string;
//         session.user.role = token.role as string;
//         session.user.plan = token.plan as string;
//       }
//       return session;
//     },
//     async signIn({ user, account }) {
//       if (account?.provider === "google") {
//         await connectDB();
//         const existingUser = await UserModel.findOne({ email: user.email });
//         if (!existingUser) {
//           await UserModel.create({
//             name: user.name,
//             email: user.email,
//             image: user.image,
//             role: "user",
//             plan: "free",
//             subscriptionStatus: "inactive",
//             aiCreditsUsed: 0,
//             aiCreditsLimit: 10,
//             isActive: true,
//             emailVerified: new Date(),
//           });
//         } else if (!existingUser.isActive) {
//           return false;
//         }
//       }
//       return true;
//     },
//   },
//   events: {
//     async createUser({ user }) {
//       await connectDB();
//       await UserModel.findOneAndUpdate(
//         { email: user.email },
//         { $setOnInsert: { role: "user", plan: "free", subscriptionStatus: "inactive", aiCreditsUsed: 0, aiCreditsLimit: 10, isActive: true } },
//         { upsert: true }
//       );
//     },
//   },
// };
//
// // Extend next-auth types
// declare module "next-auth" {
//   interface User {
//     role?: string;
//     plan?: string;
//   }
//   interface Session {
//     user: {
//       id: string;
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//       role: string;
//       plan: string;
//     };
//   }
// }
//
// declare module "next-auth/jwt" {
//   interface JWT {
//     id: string;
//     role: string;
//     plan: string;
//   }
// }
