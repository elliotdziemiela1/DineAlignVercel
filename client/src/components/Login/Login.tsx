import { useState } from "react";
import { signIn, signUp } from "../../services/auth";
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../..";
import style from './Login.module.scss'

export default function Login() {
    async function login(username:string, email: string, password: string, isLogin: boolean) {
        const result = await (isLogin ? signIn(email, password) : signUp(username, email, password));
        if (result.success) {
            // setIsLoading(false);
            setSuccess(true);
        } else {
            setError(result.error as {code: string, message: string});
        }
    }

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<{code: string, message: string}>({code: "", message: ""});
    // const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [username, setUsername] = useState("")

    const user = useContext(AuthContext);

    if (success || user.user !== null) {
        return (
            <Navigate to="/home"/>
        );
    }
    return (
        <div>
            <div className={style.container}>
                <div className={style.page}>
                    <h1 className={style.pseudologo}>Dine Align</h1>
                    <p>Signup requires email, password, and unique username. <br></br> Login only requires email and password.</p>
                    <div className={style.inputBox}>
                        <label className={style.labelIndent}>Email:</label>
                        <input type="email" name="email" value={email} placeholder="example@example.com" onChange={(e) => setEmail(e.target.value)}/>
                    </div>
                    <div className={style.inputBox}>
                        <label className={style.labelIndent}>Password:</label>
                        <input type="password" name="password" value={password} placeholder="********" onChange={(e) => setPassword(e.target.value)}/>
                    </div>
                    <div className={style.inputBox}>
                        <label className={style.labelIndent}>Username:</label>
                        <input type="username" name="username" value={username} placeholder="name" onChange={(e) => setUsername(e.target.value)}/>
                    </div>   
                    <div className={style.buttonContainer}>
                        <button className={style.signInButton} type="button" onClick={(evt) => {
                            evt.preventDefault();
                            // setIsLoading(true);
                            login(username, email, password, true);
                        }}>Login</button>
                        <button className={style.signInButton} type="button" onClick={(evt) => {
                            evt.preventDefault();
                            // setIsLoading(true);
                            login(username, email, password, false);
                        }}>Sign Up</button>
                    </div>
                    {error.code !== "" && <p>{`${error.code}: ${error.message}`}</p>}
                </div>
            </div>
            
        </div>
    )
}