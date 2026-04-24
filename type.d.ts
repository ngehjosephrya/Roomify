interface AuthState{
    isSignedIn: boolean;
    userName: string| null,
    userId: string | null,
}

type AuthContext = {
    isSignedIn: boolean;
    refreshAuth: () => Promise<boolean>,
    signIn: () => Promise<boolean>,
    signOut: () => Promise<boolean>;
    userId: string | null;
    userName: string | null;
}