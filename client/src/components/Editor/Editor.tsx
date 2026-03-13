import React, { useContext, useEffect, useState } from "react";
import { CalendarDetails, EmptyCalendar, Meal, Privacy } from "../Calendar/Calendar";
import style from "./Editor.module.scss";
import { fetchCalendar, fetchUserByEmail } from "../../services/fetchData";
import { AuthContext } from "../..";
import { EmptyUser, User } from "../Profile/Profile";
import { displayPrivacy, switchPrivacyOption } from "../../utils/CalendarUtils";
import { createCalendar } from "../../services/postData";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../types";

interface DayEditorProps {
    calendar: CalendarDetails;
    setCalendar: React.Dispatch<React.SetStateAction<CalendarDetails>>;
}

interface TagEditorProps {
    calendar: CalendarDetails;
    setCalendar: React.Dispatch<React.SetStateAction<CalendarDetails>>;
}

interface MealEditorProps {
    day: TentativeDay;
    setDay: React.Dispatch<React.SetStateAction<TentativeDay>>;
}

interface TentativeDay {
    open: boolean;
    index: number;
    description: string;
    mealEntries: Meal[];
}

enum FetchResult {
    LOADING=0,
    SUCCESS=1,
    FAIL=2,
}

// If null, creating a new calendar, else, updating an existing calendar id if the owner matches the current owner
// Otherwise, a copy is created under the new owner
// Assume the existing calendar id exists 
export default function Editor() {
    async function publishCalendar() {
        console.log("Current calendar:", calendar);
        if (calendar.days.length === 0) {
            setError("Calendar is missing days!");
        } else {
            const result = await createCalendar(calendar);
            if (!result.success) {
                setError("An error occurred while handling the calendar:" + result.err);
                return;
            }
            // If calendar does not contain an id, this means calendar created under user
            if (!calendar._id) {
                user.dietsCreated = [...user.dietsCreated, result.data?._id as string];
                await axios.put(serverURL + "/api/users/" + user._id, user);
            }
            console.log("Result:", result);
            navigator("/calendar/" + result.data?._id);
        }
    }

    const params = useParams();
    const existingCalendarId = params.id ?? null;
    const userDetails = useContext(AuthContext);
    const navigator = useNavigate();

    const [calendar, setCalendar] = useState<CalendarDetails>(EmptyCalendar);
    const [user, setUser] = useState<User>(EmptyUser);
    const [fetchResult, setFetchResult] = useState<FetchResult>(FetchResult.LOADING);
    const [error, setError] = useState("");
    

    useEffect(() => {
        async function fetcher() {
            var userResult: User | null = null;
            var currentUser: User = EmptyUser;
            if (userDetails.user !== null) {
                userResult = await fetchUserByEmail(userDetails.user.email as string);
                if (userResult !== null) {
                    console.log("Fetched user.");
                    currentUser = userResult;
                    setUser(userResult);
                } else {
                    setFetchResult(FetchResult.FAIL);
                    return;
                }
            } else {
                setFetchResult(FetchResult.FAIL);
                return;
            }

            // User must exist past this point
            if (existingCalendarId !== null) {
                var calendarResult = await fetchCalendar(existingCalendarId as string, currentUser._id);
                if (calendarResult !== null) {
                    console.log("Fetched existing calendar to edit");
                    // If the user is the owner of the calendar, let the calendar result id stay
                    // If the user is not the owner of the calendar but the calendar is public, remove the calendar id to clone a new calendar
                    // If the user is not the owner and the calendar is private, do not set the calendar
                    if (currentUser._id !== calendarResult.owner && calendarResult.privacy === Privacy.PRIVATE) {
                        setFetchResult(FetchResult.FAIL);
                        return;
                    } else if (currentUser._id !== calendarResult.owner && calendarResult.privacy !== Privacy.PRIVATE) {
                        console.log("Cloning calendar!");
                        calendarResult.owner = currentUser._id;
                        calendarResult.followedBy = [];
                        calendarResult.ratings = [];
                        delete calendarResult._id;
                    }
                    setCalendar(calendarResult);
                    setFetchResult(FetchResult.SUCCESS);
                } else {
                    setFetchResult(FetchResult.FAIL);
                }
            } else {
                // Make a blank calendar
                setCalendar(c => ({...c, owner: userResult?._id ?? ''}));
                setFetchResult(FetchResult.SUCCESS);
            }
        }
        fetcher();
    }, [existingCalendarId, userDetails.user]);

    if (userDetails.loading || fetchResult === FetchResult.LOADING) {
        return (
            <div className={style.loading}>
                Loading...
            </div>
        )
    } else if (fetchResult === FetchResult.FAIL) {
        return (
            <div className={style.error}>
                This user has privated their calendar, or the calendar does not exist!
                <Link to="/home">Go home.</Link>
            </div>
        )
    }
    return (
        <div className={style.calendar}>
            <h1 className={style.name}>
                <p>Name:&nbsp;</p>
                <input value={calendar.name} onChange={(e) => setCalendar({...calendar, name: e.target.value})}/>
            </h1>
            <h2 className={style.creator}>Creator: {user.username ?? "Loading..."}</h2>
            <div className={style.privacy}>
                <p>Privacy:&nbsp;</p>
                <span className={style.privacy_option} onClick={() => setCalendar({...calendar, privacy: switchPrivacyOption(calendar.privacy)})}>
                    {displayPrivacy(calendar.privacy)}
                </span>
            </div>
            <div className={style.description}>
                <p>Description:</p>
                <textarea value={calendar.description} onChange={(e) => setCalendar({...calendar, description: e.target.value})}></textarea>
            </div>
            <TagEditor calendar={calendar} setCalendar={setCalendar}/>
            <DayEditor calendar={calendar} setCalendar={setCalendar}/>
            
            <input type="button" onClick={() => publishCalendar()} value="Submit"/>
            <div className={`${error === '' ? style.modalClosed : style.modalOpen}`}>
                <div className={style.errorDisplay}>
                    {error}
                    <button type="button" onClick={() => setError('')}>OK!</button>
                </div>
            </div>
        </div>
    );
}

// This is analogous to the detailed day but will handle creating or editing a day
// TODO
function DayEditor({calendar, setCalendar}: DayEditorProps) {
    function modifyDays() {
        var newDays = [...calendar.days];
        // Push new day
        if (day.index === calendar.days.length) {
            newDays.push({descriptor: day.description, mealEntries: day.mealEntries});
        // Else modify the existing day
        } else {
            newDays[day.index].descriptor = day.description;
            newDays[day.index].mealEntries = day.mealEntries;
        }
        setCalendar({...calendar, days: newDays});
    }

    function updateEditor(index: number) {
        setDay({
            open: index >= 0,
            index: index,
            description: calendar.days[index]?.descriptor ?? '',
            mealEntries: calendar.days[index]?.mealEntries ?? [],
        });
    }
    const [day, setDay] = useState<TentativeDay>({open: false, index: -1, description: '', mealEntries: []});
    

    return (
        <>
            <div className={style.diet}>
                <p>Diet:&nbsp;</p>
                <div className={style.add_day} onClick={() => updateEditor(calendar.days.length)}>Add Day</div>
            </div>
            
            <div className={`${calendar.days.length === 0 ? undefined : style.calendarBody}`}>
                {calendar.days.length === 0 ? 'No days added. Use the button to add days to your diet!' : calendar.days?.map((day, idx) =>
                    <div className={style.day} key={idx} onClick={() => updateEditor(idx)}>
                        <p>{`Day ${idx + 1}`}</p>
                        <p>{day.descriptor}</p>
                    </div>
                )}
            </div>
            
            <div className={`${style.modal} ${day.open ? style.modalOpen : style.modalClosed}`}>
                <div className={style.exitModal} onClick={() => updateEditor(-1)}></div>
                <div className={style.dayEditor}>
                    <p>Day {day.index + 1}</p>
                    <p>Description:&nbsp;</p>
                    <input value={day.description} onChange={(e) => setDay({...day, description: e.target.value})}/>
                    <MealEditor day={day} setDay={setDay}/>
                
                    <input type="button" onClick={() => {setDay({...day, open: false}); modifyDays(); console.log("Day is:", day)}} value="Create day"/>
                </div>
            </div>
        </>
        
    );
}

function TagEditor({calendar, setCalendar}: TagEditorProps) {
    function deleteTag(index: number) {
        var newTags = calendar.tags;
        newTags.splice(index, 1);
        setCalendar({...calendar, tags: newTags});
    }

    const [modal, setModal] = useState(false);
    const [tagName, setTagName] = useState('');

    return (
        <>
            <div className={style.tags}>
                <div className={style.tag_header}>
                    <p>Tags:&nbsp;</p>
                    <div className={style.add_tag} onClick={() => setModal(true)}>Add Tag</div>
                </div>
                <div className={style.tag_list}>
                    {calendar.tags?.map((t, idx) => <p className={style.tag} key={idx} onClick={() => deleteTag(idx)}>{t}</p>)}
                </div>
                
            </div>
            <div className={`${style.modal} ${modal ? style.modalOpen : style.modalClosed}`}>
                <div className={style.exitModal} onClick={() => setModal(false)}></div>
                <div className={style.tagEditor}>
                    <p>Tag name:&nbsp;</p>
                    <input value={tagName} onChange={(e) => setTagName(e.target.value)}/>
                    <input type="button" onClick={() => {setModal(false); setCalendar({...calendar, tags: [...calendar.tags, tagName]})}} value="Create Tag"/>
                </div>
            </div>
        </>
        
    )
}

function MealEditor({day, setDay}: MealEditorProps) {
    function validateMeal() {
        if ((Object.hasOwn(meal, 'description') && meal.description === '') && (Object.hasOwn(meal, 'link') && meal.link === '')) {
            //TODO - change to error dialog
            console.log("Meal is not valid. Requires at least one source (description or link)");
        } else {
            setModal(false);
            var prunedMeal = {...meal};
            if (Object.hasOwn(prunedMeal, 'description') && prunedMeal.description === '') {
                delete prunedMeal.description;
            } else if (Object.hasOwn(prunedMeal, 'link') && prunedMeal.link === '') {
                delete prunedMeal.link;
            }

            setDay({...day, mealEntries: [...day.mealEntries, prunedMeal]})
        }
    }
    const [modal, setModal] = useState(false);
    const [meal, setMeal] = useState<Meal>({time: '', name: '', description: '', link: ''});

    return (
        <>
            <div className={style.addMealEntry} onClick={() => setModal(true)}>Add meal entry</div>
            <p>Meals:&nbsp;</p>
            <div className={style.meals}>
                {day.mealEntries.map((mealEntry, idx) => {
                    return (
                        <div className={style.mealEntry}key={idx}>
                            <h3>{mealEntry.name}</h3>
                            <p>{`Time of day: ${mealEntry.time}`}</p>
                            {!!mealEntry.description && <p>{`Description: ${mealEntry.description}`}</p>}
                            {!!mealEntry.link && <a href={mealEntry.link}>Source</a>}
                        </div>
                    )
                })}
            </div>
            
            <div className={`${style.modal} ${modal ? style.modalOpen : style.modalClosed}`}>
                <div className={style.exitModal} onClick={() => setModal(false)}></div>
                <div className={style.mealEditor}>
                    <p>Meal name:&nbsp;</p>
                    <input value={meal.name} onChange={(e) => setMeal({...meal, name: e.target.value})}/>
                    <p>Meal time:&nbsp;</p>
                    <input value={meal.time} onChange={(e) => setMeal({...meal, time: e.target.value})}/>
                    <p>Description:&nbsp;</p>
                    <input value={meal.description} onChange={(e) => setMeal({...meal, description: e.target.value})}/>
                    <p>Link:&nbsp;</p>
                    <input value={meal.link} onChange={(e) => setMeal({...meal, link: e.target.value})}/>
                    <input type="button" onClick={() => validateMeal()} value="Create Meal"/>
                </div>
            </div>
        </>
        
    )
}