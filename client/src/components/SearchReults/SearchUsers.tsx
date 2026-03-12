import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { User } from "../Profile/Profile";
import { fetchAllUsers } from "../../services/fetchData";
import defaultPfp from "../Profile/DefaultPFP.jpg"
import mapPin from "./mapPin.png"
import styles from "./SearchUsers.module.scss"


export default function SearchUsers () {
    const { query } = useParams();
    const [allUsers, setAllUsers] = useState<User []>([]);

    useEffect(() => {
        async function fetcher () {
            const result = await fetchAllUsers();
            if (result != null){
                setAllUsers(result);
            }
        }
        fetcher();
    }, []);

    var sortedUsers;
    if (!!query){
        sortedUsers = allUsers.filter((user) => user.username.toLowerCase().includes(query.toLowerCase()))
    }

    return (
    <div className={styles.container}>
        <h1>Search Users for: "{query}"</h1>
        <ul>
            {sortedUsers?.map((u, idx) => 
            <li key={idx}>
                <div className={styles.userIcon}>
                    <img src={defaultPfp} alt="Profile"/>
                </div>
                <div className={styles.userInfo}>
                    <div className={styles.userText}>
                        <h1>{u.username}</h1>
                        <div className={styles.locationInfo}>
                            <img src={mapPin} alt="Location: "/> {u.location}
                        </div>
                    </div>
                    <div className={styles.profileRedirect}>
                        <Link to={`/profile/${u._id}`} className={styles.profileRedirectButton}>View Profile</Link>
                    </div>
                </div>
            </li>)}
        </ul>
        
    </div>
    )
}