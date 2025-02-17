"use client";

import { useState, useEffect } from "react";
import { app, db } from "@/auth/firebase";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "@firebase/auth";
import { useRouter } from "next/router";
import { doc, setDoc, getDoc } from "firebase/firestore";
// import PostLoginReal from "./logout";
import Main from "./main";
import Onboarding from "@/components/Onboarding";
import { User } from "firebase/auth";

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(user);

      // Check Firestore for user preferences
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || !userSnap.data().preferences) {
        setShowOnboarding(true); // Show onboarding if preferences are missing
      } else {
        router.push("/main");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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
          preferences: null,
        });
        setShowOnboarding(true);
      } else if (!userDoc.data().preferences) {
        setShowOnboarding(true);
      } else {
        router.push("/main");
      }
    } catch (error) {
      console.log("Error signing in with Google!", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-8">
      {user ? (
        showOnboarding ? (
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        ) : (
          <>
            {/* Main Recipe Finder */}
            <Main />
          </>
        )
      ) : (
        <div className="flex flex-col items-center">
          {/* Welcome Header */}
          <header className="w-full max-w-5xl text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
              Welcome to Mood to Meal
            </h1>
            <p className="text-gray-700 text-lg">
              Select your mood and preferences to discover tailored recipes.
              Sign in and get started.
            </p>
          </header>

          {/* Sign-In Button */}
          <button
            onClick={signInWithGoogle}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
          >
            Sign in with Google
          </button>
        </div>
      )}
    </main>
  );
}

export default Home;
