"use client";

import { useState, useEffect } from "react";
import { app, db } from "@/auth/firebase";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "@firebase/auth";
import { useRouter } from "next/router";
import { doc, setDoc, getDoc } from "firebase/firestore";
import PostLoginReal from "./logout";
import Main from "./main";

const Home = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document already exists
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Save user data in Firestore if document does not exist
        await setDoc(userRef, {
          savedRecipes: [],
        });
      }

      router.push("/main");
    } catch (error) {
      console.log("Error signing in with Google!", error);
    }
  };

  return (
    <main className={`flex flex-col items-center min-h-screen p-8 `}>
      {user ? (
        <Main />
      ) : (
        <div>
          <header className="w-full max-w-5xl text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
              Welcome to Mood to Meal
            </h1>
            <p className="text-gray-700 text-lg">
              Select your mood and preferences to discover tailored recipes.
              Sign in and get started.
            </p>
          </header>

          <button onClick={signInWithGoogle}>Sign in with Google</button>
        </div>
      )}
    </main>
  );
};

export default Home;
