"use client";
import { useState, useEffect } from "react";
import app from "@/auth/firebase";
import { getAuth } from "@firebase/auth";
import { useRouter } from "next/router";
import { signInWithPopup, GoogleAuthProvider } from "@firebase/auth";
import PostLoginReal from "./logout";



// import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
// import dotenv from "dotenv";
// import { Inter } from "next/font/google";
// import { unsubscribe } from "diagnostics_channel";



const Home = () => {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() =>{
        const auth = getAuth(app);
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if(user){
                setUser(user);
            }
            else{
                setUser(null);
            }
        });

        return () => unsubscribe();

    }, [])

    const signInWithGoogle = async() => {
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        try{
            await signInWithPopup(auth, provider);
            router.push("/logout"); 
        } catch(error){
        console.log("error signing in with google!") 
        }
    }
    return (
        <main className={`flex flex-col items-center min-h-screen p-8 `}>
            {user ? (
                <PostLoginReal/>
            ):(
                <div>
                    <header className="w-full max-w-5xl text-center mb-12">
                    <h1 className="text-4xl font-bold text-blue-600 mb-4">Welcome to Mood to Meal</h1>
                    <p className="text-gray-700 text-lg">
                    Select your mood and preferences to discover tailored recipes. Sign in and get started.
                    </p>
                    </header>


                    <button onClick={signInWithGoogle}>
                        Sign in with Google
                    </button>

                </div>
            )
            } 


           
        </main>
    )

}

    

export default Home;
