import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import { comparePassword } from "@/lib/password-utils"

export const { handlers, auth, signIn, signOut } = NextAuth({
  useSecureCookies : process.env.NODE_ENV === "production",
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
        name: 'credentials',
        credentials: {
            email: {
                label: "이메일",
                type: "email",
                placeholder: "이메일 입력",
            },
            password: {
                label: "비밀번호",
                type: "password"
            }
        },
        async authorize(credentials){
            if (!credentials || !credentials.email || !credentials.password){
                throw new Error ("이메일과 비밀번호를 입력해주세요")
            }

            const user = await prisma.user.findUnique({
                where: {
                    email: credentials.email
                }
            })

            if (!user) {
                throw new Error ("존재하지 않는 이메일")
            }

            const passwordMatch = comparePassword(credentials.password as string, user.hashedPassword)

            if (!passwordMatch) {
                throw new Error ("비밀번호 틀림")
            }
            return user
        }

    })
  ],
  session : {
    strategy: "jwt"
  },
  
})