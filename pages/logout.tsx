"use client";
import React, {use, useEffect, useState} from "react";
import { getAuth, signOut, onAuthStateChanged } from "@firebase/auth";
import { useRouter } from "next/router";
import app from "@/auth/firebase";

const PostLoginReal = () => {
    const auth = getAuth(app);
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(()=>{
        const unsubscribe = onAuthStateChanged(auth, (user)=>{
            if(user){
                setUser(user)
            } else{
                router.push("/start")
            }
        });

        return () => unsubscribe();

    }, [auth, router])

    const handleLogOut = async () => {
        try{
            await signOut(auth);
            router.push("/start")
        } catch (error){
            console.log("error: ", error.message)
        }
    };

    
    return(
        <div>
            <main className={`flex flex-col items-center min-h-screen p-8 `}>
                <header className="w-full max-w-5xl text-center mb-12">
                    <h1 className="text-4xl font-bold text-blue-600 mb-4">Welcome to Mood to Meal</h1>
                    <p className="text-gray-700 text-lg">
                        Thanks for signing in!
                    </p>
                </header>


                <button onClick={handleLogOut}>
                    LOG OUT 
                </button>
          </main>
        </div>
    )
};




export default PostLoginReal;
