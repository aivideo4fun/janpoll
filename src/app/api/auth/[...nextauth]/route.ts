import NextAuth from "next-auth";
import { googleAuthOptions } from "@/lib/google-auth";

const handler = NextAuth(googleAuthOptions);

export { handler as GET, handler as POST };