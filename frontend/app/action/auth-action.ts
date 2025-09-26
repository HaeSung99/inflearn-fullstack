'use server'

import { prisma } from "@/prisma"
import { saltAndHashPassword } from "@/lib/password-utils"
import { redirect } from "next/navigation"

export async function signUp({email, password}: {email:string, password:string}) {
    try {
        const existuser = await prisma.user.findUnique({
            where : {
                email
            }
        })

        if (existuser) {
            return {status:"error" , message : "이미회원가입된아이디가있음"}
        }

        const user = await prisma.user.create({
            data: {
                email,
                hashedPassword: saltAndHashPassword(password)
            }
        })
        if (user) {
            return {status:"ok"}
        }
    }
    catch (error) {
        return {status:"error" , message : "회원가입실패"}
    }
}