// pages/index.tsx
import type { NextPage } from "next";
import Head from "next/head";
import Earth from "~/components/Earth";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Next.js Orbital Background Example</title>
        <meta name="description" content="Next.js Orbital Background Example" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="h-screen w-screen">
        <Earth />
      </main>
    </div>
  );
};

export default Home;
