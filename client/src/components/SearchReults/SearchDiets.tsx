import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchAllCalendars} from "../../services/fetchData";
import styles from "./SearchDiets.module.scss"
import dietIconImg from "./dietIcon.png"
import { CalendarDetails } from "../Calendar/Calendar";


export default function SearchDiets () {
    const { query } = useParams();
    const [allDiets, setAllDiets] = useState<CalendarDetails []>([]);

    useEffect(() => {
        async function fetcher () {
            const result = await fetchAllCalendars();
            if (result != null){
                setAllDiets(result);
            }
        }
        fetcher();
    }, []);

    var sortedDiets;
    if (!!query){
        sortedDiets = allDiets.filter((diet) => diet.name.toLowerCase().includes(query.toLowerCase()))
    }

    return (
    <div className={styles.container}>
        <h1>Search Query: {query}</h1>
        <ul>
            {sortedDiets?.map((d, idx) => 
            <li key={idx}>
                <div className={styles.dietIcon}>
                    <img src={dietIconImg} alt="Diet"/>
                </div>
                <div className={styles.dietInfo}>
                    <div className={styles.dietText}>
                        <h1>{d.name}</h1>
                        {d.owner}
                        <div className={styles.tagBoxGroup}>
                            {d.tags?.map((t) => (
                                <div className={styles.tagBox}>
                                    <p>{t}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.dietRedirect}>
                    <Link to={`/calendar/${d._id}`} className={styles.dietRedirectButton}>View Calendar</Link>    
                    </div>
                </div>
            </li>)}
        </ul>
        
    </div>
    )
}