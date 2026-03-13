import { CalendarDetails, Privacy } from "../components/Calendar/Calendar";
import { DietDetails, User } from "../components/Profile/Profile";
import axios from "axios";
import { serverURL } from "../types";

export async function fetchCalendar(id: string, userId?: string): Promise<CalendarDetails | null> {
    try {
        const response = await axios.get(serverURL + `/api/calendars/${id}`);
        const data : CalendarDetails | null = response.data.data;
        if (data !== null && data.privacy === Privacy.PRIVATE && (!userId || data.owner !== userId)) {
            throw Error("Calendar is private.");
        }
        return data;
    } catch (err: unknown) {
        console.log("Error while fetching calendar:", err);
        return null;
    }
    
}

export async function followCalendar(calId: string, user: User): Promise<DietDetails | undefined> {
    //const user = await fetchUserByEmail(userEmail);
    const calendar = await fetchCalendar(calId);
    if (user && calendar) {
        // Remove self from old calendar's followedBy if exists
        if (user.followsDiet) {
            const oldCalendar = await fetchCalendar(user.followsDiet.diet);
            if (oldCalendar) {
                oldCalendar.followedBy = oldCalendar.followedBy.filter((userId) => userId !== user._id);
                await axios.put(serverURL + "/api/calendars/" + oldCalendar._id, oldCalendar);
            }
        }

        user.followsDiet = {
            diet: calId,
            dietStarted: new Date(),
            daysCompleted: [],
            repeating: true
        };
        await axios.put(serverURL + `/api/users/${user._id}`,user);
        
        calendar.followedBy = [...calendar.followedBy, user._id];
        await axios.put(serverURL + "/api/calendars/" + calId, calendar);
        return user.followsDiet;
    } else {
        return undefined;
    }
    
}


export async function fetchUserByEmail(email: string): Promise<User | null> {
    const users = await fetchAllUsers();
    const user = users?.find((item) => item.email === email)
    return user ? parseDates(user) : null;
}

export async function fetchUserByUsername(username: string): Promise<User | null> {
    const users = await fetchAllUsers();
    const user = users?.find((item) => item.username === username)
    return user ? parseDates(user) : null;
}

export async function addRating(calId:string, review:string, thumb:number, ownerEmail:string) {
    let cal = await fetchCalendar(calId);
    let owner = await fetchUserByEmail(ownerEmail);
    if (cal?.ratings && owner?._id){
        let newRating = {
            thumb: thumb,
            review: review,
            owner: owner._id
        }
        cal.ratings.unshift(newRating)
        axios.put(serverURL + `/api/calendars/${calId}`, cal)
    }
}

function parseDates(user: User): User {
    if (user?.followsDiet?.dietStarted) {
        user.followsDiet.dietStarted = new Date(user.followsDiet.dietStarted);
    }

    return user;
}

export async function fetchUserByID(id: string): Promise<User | null> {
    const response = await axios.get(serverURL + `/api/users/${id}`);
    const user: User | null = response.data.data;

    return user ? parseDates(user) : null;
}

export async function fetchPopularCalendarIDs(): Promise<string[] | null> {
    try {
        const response = await axios.get(serverURL + `/api/calendars`);
        const data = response.data.data;
        var ids = [];
        for (const calendar of data) {
            ids.push(calendar._id);
        }
        return ids;
    } catch (err: unknown) {
        return null;
    }
}   

export async function fetchAllUsers(): Promise<User[] | null> {
    const response = await axios.get(serverURL + `/api/users`)

    return response.data.data
}   

export async function fetchAllCalendars(): Promise<CalendarDetails[] | null> {
    const response = await axios.get(serverURL + "/api/calendars");

    return response.data.data
}
