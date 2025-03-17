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
import { Poppins} from "next/font/google";

const myFont = Poppins({
  weight:['400'],
  subsets: ['latin']
})


const Home = () => {
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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 "></div>
      </div>
    );
  }

  return (
    <main className={`relative flex bg-[url('/assets/texture.jpg')] flex-col items-center min-h-screen p-8 ${myFont.className}`}>
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
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          {/* Welcome Header */}
          <header className="w-full max-w-4xl text-center mb-12">
            <h1 className="text-5xl font-extrabold text-green-2000 mb-4 animate-fade-in">
              welcome to mood to meal
            </h1>
            <p className="text-gray-900 text-2xl animate-slide-up">
              Select your mood and preferences to discover tailored recipes.
            </p>
          </header>

          {/* Sign-In Button */}
          <button
            onClick={signInWithGoogle}
            className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-lg hover:bg-green-600 transition-transform transform hover:scale-105 animate-bounce-once"

          >
            Sign in with Google
          </button>

          <img src="/assets/sticker1.png" className="absolute bottom-35 left-24 right-20 w-40 rotate-6 drop-shadow-lg" />
          <img src="/assets/sticker2.png" className="absolute top-40 right-20 w-44 -rotate-12 drop-shadow-lg" />
          <img src="/assets/sticker3.png" className="absolute bottom-20 left-32 w-36 rotate-3 drop-shadow-lg" />
          <img src="/assets/sticker4.png" className="absolute top-30 bottom-20 right-10 h-20 -rotate-6 drop-shadow-lg" />
          <img src="/assets/sticker5.png" className="absolute bottom-25 right-12 h-24 -rotate-6 drop-shadow-lg" />





          {/* Tailwind Animations */}
  <style jsx>{`
    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    .animate-fade-in {
      animation: fade-in 1.2s ease-out;
    }

    @keyframes slide-up {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    .animate-slide-up {
      animation: slide-up 1s ease-out;
    }

    @keyframes bounce-once {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
      }
    }
    .animate-bounce-once {
      animation: bounce-once 0.5s ease-in-out;
    }
  `}</style>



  
        </div>
      )}
    </main>
  );
}

export default Home;
