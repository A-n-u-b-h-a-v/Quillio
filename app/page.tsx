'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 2000); // waits 2s before redirect

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="  flex h-screen w-screen items-center justify-center bg-slate-50 overflow-hidden">
      <div className={styles.body}>
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <div className={styles.base}>
          <span></span>
          <div className={styles.face}></div>
        </div>
      </div>

      <div className={styles.longfazers}>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <h1 className="absolute top-[58%] left-1/2 -ml-5 text-xs font-semibold uppercase font-sans">
        Redirecting
      </h1>
    </div>
  );
}
