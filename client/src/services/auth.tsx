import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '..';
import axios from 'axios';
import { serverURL } from '../types';


const firebaseConfig = {
    apiKey: "AIzaSyD6YA5Y68wuc9XFT8qzvRtoLRRgNZ73YvI",
    authDomain: "dinealign-auth.firebaseapp.com",
    projectId: "dinealign-auth",
    storageBucket: "dinealign-auth.firebasestorage.app",
    messagingSenderId: "669287388418",
    appId: "1:669287388418:web:f16bf6a147f187a9c2de1b",
    measurementId: "G-YVK1BXQLKH"
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export interface AuthenticationResult {
    success: boolean;
    user?: UserCredential;
    error?: {
        code: string,
        message: string,
    }
}
// TODO - move auth to backend to better guarantee atomicity and idempotency whatever when creating users
export async function signUp(username: string, email: string, password: string): Promise<AuthenticationResult> {
    var result: AuthenticationResult = {
        success: true,
    }
    try {
        result.user = await createUserWithEmailAndPassword(auth, email, password);
        const token = await result.user.user.getIdToken();
        sessionStorage.setItem("accessToken", token);
        await axios.post(serverURL + "/api/users", {"username": username, "email": email, "password": password})
    } catch (err: any) {
        result.success = false;
        result.error = {
            code: err.code,
            message: err.message,
        }
    }
    return result;
}

export async function signIn(email: string, password: string): Promise<AuthenticationResult> {
    var result: AuthenticationResult = {
        success: true,
    };
    try {
        result.user = await signInWithEmailAndPassword(auth, email, password);
        const token = await result.user.user.getIdToken();
        sessionStorage.setItem("accessToken", token);
    } catch (err: any) {
        result.success = false;
        result.error = {
            code: err.code,
            message: err.message,
        }
    }
    return result;
}

export async function signOut() {
    auth.signOut();
}

// Wrapper to act as middleware 
// Since contexts trigger re-renders, if the context is still loading, display a loading ui until the context updates
// Once the auth state has resolved, loading will be false, and the final component will be loaded
export function Authorize({ component }: {component: React.JSX.Element}) {
    const user = useContext(AuthContext);
    if (user.user === null && user.loading === false) {
        return (
            <Navigate to="/login"/>
        )
    } else if (user.loading) {
        return (
            <div>Loading...</div>
        )
    }
    return (
        component
    );
}