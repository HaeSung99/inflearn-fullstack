"use server"

import { cookies } from "next/headers"
import { getCookie } from "cookies-next/server"

/**
 * 인증 쿠키 이름을 환경(프로덕션/개발)에 따라 분기합니다.
 * - 프로덕션: 보안 쿠키(__Secure-*)를 사용해 브라우저에서 접근 불가(HttpOnly)
 * - 개발: 일반 쿠키명 사용
 */
const AUTH_COOKIE_NAME = process.env.NODE_ENV === "production" ?
'__Secure-authjs.session-token':
"authjs.session-token"

/**
 * 백엔드 API의 기본 URL을 한 곳에서 관리합니다.
 * - 기본값은 Nest 서버가 동작 중인 3001 포트
 * - 배포/로컬 전환 시 .env의 API_URL로 손쉽게 변경
 */
const API_URL = process.env.API_URL || "http://localhost:3001"

/**
 * 공통 API 호출 유틸리티
 * - 공통 헤더/토큰/캐시/에러/파싱 규칙을 표준화합니다.
 * - 제네릭 T로 응답 타입을 명시해 타입 안전성 확보
 * @param endpoint 예: "/user-test"
 * @param options fetch 옵션(메서드, 헤더, body 등)
 * @param token Bearer 인증 토큰 (없으면 쿠키에서 읽는 유틸 사용)
 */
async function fetchApi<T = unknown>(endpoint:string, options: RequestInit={}, token?: string): Promise<T> {
    const headers = {
        "Content-Type": 'application/json',
        ...(options.headers || {})
    } as Record<string, string>
    // 서버/클라이언트 공통으로 토큰을 Authorization 헤더에 부착
    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }

    // 공통 fetch 설정: 캐시는 사용하지 않음(no-store)
    const config: RequestInit = {
        ...options,
        headers,
        cache: "no-store"
    }

    // body가 객체이면 JSON 문자열로 직렬화
    if (options.body && typeof options.body !== "string"){
        config.body = JSON.stringify(options.body)
    }

    const response = await fetch(`${API_URL}${endpoint}`, config)
    
    // HTTP 에러 상태 코드는 예외로 처리해 호출부에서 명확히 핸들링
    if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`)
    }

    // 응답의 Content-Type에 따라 결과를 다르게 처리합니다.
    const contentType = response.headers.get("content-type") || "";

    // JSON 응답: 타입 파라미터 T로 반환
    if (contentType.includes("application/json")) {
        return response.json() as Promise<T>;
    // 텍스트 응답: 문자열로 반환
    } else if (contentType.includes("text/")) {
        return response.text() as Promise<T>;
    } else {
        // 그 외의 경우에는 Blob으로 반환
        return response.blob() as Promise<T>;
    }
}

/**
 * 샘플 API 호출: 서버/클라이언트 모두에서 사용 가능
 * - 토큰 미지정 시 서버 환경에서는 쿠키에서 토큰을 읽어 붙임
 * - 응답을 문자열로 기대
 */
export async function getUserTest(token?: string) {
    if (!token || typeof window === "undefined") {
        // 서버 환경이거나 토큰이 없으면 쿠키에서 토큰을 가져옵니다.
        const cookieVal = await getCookie(AUTH_COOKIE_NAME, { cookies });
        token = typeof cookieVal === 'string' ? cookieVal : undefined;
    }
    return fetchApi<string>("/user-test", {}, token)
}

/** ------------------------------
 * 아래는 다양한 상황의 예시 API 래퍼들입니다.
 * 필요한 곳에서 import 하여 사용하세요.
 * -------------------------------- */

// 1) 단순 GET: 쿼리스트링 포함
export type User = { id: string; email: string; name?: string };
export async function getUserById(userId: string, token?: string) {
    const qs = new URLSearchParams({ id: userId }).toString()
    return fetchApi<User>(`/users?${qs}`, {}, token)
}

// 2) 목록 GET: 페이지네이션/검색
export type ListParams = { page?: number; pageSize?: number; q?: string };
export type PagedResult<T> = { items: T[]; total: number; page: number; pageSize: number };
export async function listUsers(params: ListParams = {}, token?: string) {
    const qs = new URLSearchParams({
        page: String(params.page ?? 1),
        pageSize: String(params.pageSize ?? 20),
        ...(params.q ? { q: params.q } : {})
    }).toString()
    return fetchApi<PagedResult<User>>(`/users?${qs}`, {}, token)
}

// 3) 생성 POST: JSON Body 전송
export type CreateUserInput = { email: string; password: string; name?: string };
export async function createUser(input: CreateUserInput, token?: string) {
    return fetchApi<User>(`/users`, { method: 'POST', body: input as unknown as BodyInit }, token)
}

// 4) 수정 PUT: 전체 수정
export type UpdateUserInput = { email?: string; name?: string };
export async function updateUser(userId: string, input: UpdateUserInput, token?: string) {
    return fetchApi<User>(`/users/${userId}`, { method: 'PUT', body: input as unknown as BodyInit }, token)
}

// 5) 부분 수정 PATCH
export async function patchUser(userId: string, input: Partial<UpdateUserInput>, token?: string) {
    return fetchApi<User>(`/users/${userId}`, { method: 'PATCH', body: input as unknown as BodyInit }, token)
}

// 6) 삭제 DELETE
export async function deleteUser(userId: string, token?: string) {
    await fetchApi<void>(`/users/${userId}`, { method: 'DELETE' }, token)
}

// 7) 파일 업로드: multipart/form-data (fetchApi JSON 직렬화 우회를 위해 직접 구현)
export async function uploadAvatar(userId: string, file: File, token?: string) {
    const formData = new FormData()
    formData.append('file', file)

    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_URL}/users/${userId}/avatar`, {
        method: 'POST',
        headers, // Content-Type 생략: 브라우저가 boundary 포함해 자동 지정
        body: formData,
        cache: 'no-store'
    })
    if (!res.ok) throw new Error(`업로드 실패: ${res.status}`)
    return res.json() as Promise<{ url: string }>
}

// 8) 응답 스키마 검증(Zod 등) 필요 시
// 필요 시 설치: npm i zod
// import { z } from 'zod'
// const MeSchema = z.object({ id: z.string(), email: z.string().email() })
// export async function getMe(token?: string) {
//     const data = await fetchApi<unknown>('/me', {}, token)
//     return MeSchema.parse(data)
// }