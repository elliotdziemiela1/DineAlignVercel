import React, { ReactNode } from 'react';
import style from './Day.module.scss';
import { CalendarDay, DayDetails } from './Calendar';
import { useNavigate } from 'react-router-dom';

interface DayProps {
    index: number;
    descriptor: string;
    dayOfWeek: string;
    highlighted: boolean;
    openModal: React.Dispatch<React.SetStateAction<DayDetails>>;
}

/**
 * Component to describe a day in a calendar
 * @param index - Integer that references this day's index in the calendar array (0-indexed)
 * @param descriptor - String that describes the day's overall goal and meals TODO - MAKE SURE TO APPEND day of week/day of the diet to it
 * @param mealEntries - An array of Meals that make up this day's diet
 */
export default function Day({ index, descriptor, dayOfWeek, highlighted, openModal } : DayProps) {
    return (
        <div className={`${style.day} ${highlighted && style.highlighted}`} onClick={() => openModal({isOpen: true, index: index})}>
            <p>{`Day ${index + 1}`}</p>
            <p>{dayOfWeek}</p>
            <p>{descriptor}</p>
        </div>
    );
}

export function CurrentDay({ index, day, dayOfWeek }: {index: number, day: CalendarDay, dayOfWeek: string}) {
    const navigate = useNavigate();
    return (
        <div className={`${style.day}`} onClick={() => navigate("/profile")}>
            <p>{`Day ${index + 1}`}</p>
            <p>{dayOfWeek}</p>
            <p>{day?.descriptor ?? "No overview provided."}</p>
            {day?.mealEntries.map((mealEntry, idx) => {
                return (
                    <div key={idx}>
                        <h3>{mealEntry.name}</h3>
                        <p>{`Time of day: ${mealEntry.time}`}</p>
                        {!!mealEntry.description && <p>{mealEntry.description}</p>}
                        {!!mealEntry.link && <a href={mealEntry.link}>Source</a>}
                    </div>
                );
            })}
        </div>
    );
}

export function DetailedDay({ isOpen, details, setDetails }: {isOpen: boolean, details?: CalendarDay, setDetails: React.Dispatch<React.SetStateAction<DayDetails>>}) {
    function displayDiet(): ReactNode {
        if (details === undefined) {
            return (
                <>
                    <p>No meal plan was found for this day.</p>
                </>
            );
        } else {
            return (
                <>
                    <h1>{details.descriptor}</h1>
                    {details.mealEntries.map((mealEntry, idx) => {
                        return (
                            <div key={idx}>
                                <h3>{mealEntry.name}</h3>
                                <p>{`Time of day: ${mealEntry.time}`}</p>
                                {!!mealEntry.description && <p>{mealEntry.description}</p>}
                                {!!mealEntry.link && <a href={mealEntry.link}  target="_blank" rel="noreferrer">Source</a>}
                            </div>
                        )
                    })}
                </>
            );
        }
        
    }

    return (
        <div className={`${style.modal} ${isOpen ? style.modalOpen : style.modalClosed}`}>
            <div className={style.exitModal} onClick={() => setDetails({isOpen: false, index: -1})}></div>
            <div className={style.dayContent}>
                {displayDiet()}
            </div>
        </div>
    );
}