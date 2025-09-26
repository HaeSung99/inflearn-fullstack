"use client"

import { useApi } from "@/hooks/useApi"
import { useQuery } from "@tanstack/react-query"

export default function ClientTest() {
    const api = useApi()

    const { data, error, isLoading } = useQuery({
        queryKey: ["user-test"],
        queryFn: () => api.getUserTest()
    })

    if (isLoading) {
        return <div>로딩중 ...</div>
    }

    return (
        <div>
        <h1>백엔드 API 테스트</h1>

        <h2>클라이언트 컴포넌트 API 테스트 결과</h2>
        <pre>{data}</pre>
        </div>
    )
}