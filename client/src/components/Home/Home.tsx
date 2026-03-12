import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../..";
import styles from "./Home.module.scss";
import { EmptyUser, User } from "../Profile/Profile";
import { fetchCalendar, fetchUserByID, fetchPopularCalendarIDs, fetchUserByEmail } from "../../services/fetchData";
import { CalendarDetails, DayWithIndex, showCurrentDay } from "../Calendar/Calendar";
import Calendar from "../Calendar/Calendar";
import { getDayOfWeek } from "../../utils/CalendarUtils";

export enum MenuDisplay {
    FEED = 0,
    TRENDING = 1,
}

export default function Home() {
    function showDiet() {
        if (userDetails.loading) {
            return (<div className={styles.loading}>Loading...</div>);
        } else if (userDetails.user === null) {
            return (<div className={styles.noContent}>Login to see your current diet!</div>);
        } else if (calendar === null) {
            return (<div className={styles.noContent}>Choose a diet to start tracking!</div>);
        } else {
            return (
                <div>
                    {showCurrentDay(user.followsDiet?.dietStarted as Date, calendar.days)}
                </div>
            );
        }
    }

    function showFeed() {
        switch (display) {
            case MenuDisplay.FEED:
                if (feed.loading) {
                    return <div className="loading">Loading...</div>;
                } else {
                    return (
                        <>
                            {feed.feed.map((item, idx) => (
                                <div className={`${styles.day}`} key={idx}>
                                    <p>{`User: ${item.user.username}`}</p>
                                    <p>{`Day ${item.index + 1}`}</p>
                                    <p>{getDayOfWeek(new Date())}</p>
                                    <p>{item?.descriptor ?? "No overview provided."}</p>
                                    {item?.mealEntries.map((mealEntry, idx) => (
                                        <div key={idx}>
                                            <h3>{mealEntry.name}</h3>
                                            <p>{`Time of day: ${mealEntry.time}`}</p>
                                            {!!mealEntry.description && <p>{mealEntry.description}</p>}
                                            {!!mealEntry.link && <a href={mealEntry.link}>Source</a>}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </>
                    );
                }
    
            case MenuDisplay.TRENDING:
                return (
                    <>
                        <h2>Popular Diets:</h2>
                        {popularCalendarIDs?.map((id, idx) => (
                            <div className={styles.popularCalDiv} key={idx}>
                                <Calendar personalizeUser={null} currentUser={user} calendarId={id} updateUser={setUser}/>
                            </div>
                        ))}
                    </>
                );
        }
    }
    
    const userDetails = useContext(AuthContext);
    const [user, setUser] = useState<User>(EmptyUser);
    const [calendar, setCalendar] = useState<CalendarDetails | null>(null);
    const [popularCalendarIDs, setPopularCalendarIDs] = useState<string[] | null>([]);
    const [feed, setFeed] = useState<{loading: boolean, feed: DayWithIndex[]}>({
        loading: true,
        feed: [],
    });
    const [display] = useState<MenuDisplay>(MenuDisplay.TRENDING);

    console.log("Home:", userDetails);

    useEffect(() => {
        async function fetcher() {
            console.log(userDetails.user?.email)
            if (!!userDetails.user?.email) {
                const result = await fetchUserByEmail(userDetails.user?.email);
                console.log(result)
                if (result !== null && !!result.followsDiet) {
                    const calendarResult = await fetchCalendar(result.followsDiet.diet as string);
                    setCalendar(calendarResult);
                }
                if (result !== null){
                    setUser(result);
                }
            }
        };
        fetcher();
        
    }, [userDetails]);

    // TODO - fix popular calendars to grab all public calendars
    useEffect(() => {
        async function fetchPopCalendars() {
            const popCalendarIDs = await fetchPopularCalendarIDs();
            setPopularCalendarIDs(popCalendarIDs);
        }
        if (display === MenuDisplay.TRENDING) {
            fetchPopCalendars();
        }
    }, [display]);

    useEffect(() => {
        async function fetchDayFromUser(userId: string) {
            const result = await fetchUserByID(userId);
            if (result !== null && result.followsDiet?.diet) {
                //If user exists and follows diet, fetch calendar
                const calendarResult = await fetchCalendar(result.followsDiet?.diet);
                if (calendarResult !== null) {
                    //Store user's current day into the feed
                    const currentTime = new Date();
                    const currentDayIndex = Math.floor(((Math.floor(currentTime.getTime() / 86400000) * 86400000) - (Math.floor(result.followsDiet?.dietStarted.getTime() / 86400000) * 86400000)) / 86400000);
                    return {index: currentDayIndex % calendarResult.days.length, user: result, ...calendarResult.days[currentDayIndex % calendarResult.days.length]};
                }
            }
            return null;
        }
        async function fetchAllDays() {
            var newFeed: DayWithIndex[] = [];
            console.log("Fetching current days of users:", user.following);
            for (const userId of user.following) {
                const feedItem = await fetchDayFromUser(userId);
                if (feedItem !== null) {
                    newFeed.push(feedItem);
                }
            }
            setFeed({loading: false, feed: newFeed});
        }
        if (display === MenuDisplay.FEED) {
            fetchAllDays();
        }
    }, [user.following, display, user]);

    return (
        <div className={styles.layout}>
            {/* {<div className={styles.menu}>
                <div onClick={() => setDisplay(MenuDisplay.FEED)}>Feed</div>
                <div onClick={() => setDisplay(MenuDisplay.TRENDING)}>Trending Diets</div>
            </div>} */}
            <div className={styles.feed}>
                {showFeed()}
            </div>
            <div className={styles.diet}>
                <h2>Today's Menu</h2>
                {showDiet()}
            </div>
        </div>
    );
}