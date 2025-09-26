import { auth, signOut } from "@/auth";
import Link from "next/link";

export default async function Home() {

  const session = await auth();

  return (
    <div>
      <p>현재 로그인한 아이디 :  {session?.user?.email}</p>
      {session?.user ? (
              <form action={async () =>{
                "use server"; // 유틸로 분리해서 import한다음에 함수만 사용할수도 있을듯
                await signOut();
              }}>
                <button type="submit">로그아웃</button>
              </form>
      ) : <Link href="/signin"></Link>}

      </div>
  );
}
