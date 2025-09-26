'use client'

import Link from "next/link";
import { useState } from "react"
import { signUp } from "@/app/action/auth-action"
import { redirect } from "next/navigation";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault ();

        if (password !== passwordConfirm) {
            alert("비밀번호가 일치하지 않음")
            return
        }

        const result = await signUp({email, password})

        if (result?.status === "ok"){
            redirect('/signin')
        }

        if (result?.message) {
            alert (result.message)
        }
    }

    return (
        <div className="flex flex-col items-center justfy-center h-screen gap-4">
            <h1 className="text-3xl font-bold">회원가입</h1>
            <p className="text-gray-700">인프런에서 다양한 학습의 기회를 얻으세요</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2 min-w-[300px]">
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" name="email" placeholder="이메일" className="border-2 border-gray-400 rounded-sm p-2"></input>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" name="password" placeholder="비밀번호" className="border-2 border-gray-400 rounded-sm p-2"></input>
                <input value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} type="password" name="passwordConfirm" placeholder="비밀번호확인" className="border-2 border-gray-400 rounded-sm p-2"></input>
                <button type="submit" className="font-bold text-white text-center bg-green-400 rounded-sm p-2">회원가입</button>
                
                <Link href="/signin" className="font-bold text-white text-center bg-green-400 rounded-sm p-2">로그인</Link>
            </form>
        </div>
    )
} 