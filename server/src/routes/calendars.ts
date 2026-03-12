import { Router, Request, Response } from 'express';
import { Calendar, Day, Meal } from "../models/calendar";
import mongoose from 'mongoose';
import { isValidObjectId, Types} from 'mongoose';

const calendarsRouter = (router:Router) => {
    const validPrivacy = ["unlisted", "private", "public"];

    router.get('/', async (req: Request, res: Response) =>{
        const session = await mongoose.startSession();
        session.startTransaction();
        try{
            const query = Calendar.find({privacy: 2}).session(session);
            const result = await query.exec();
            await session.commitTransaction();
            res.status(200).json({message: "Valid response", data:result});
        }
        catch (err) {
            await session.abortTransaction();
            res.status(500).json({message:"Internal server error - GET", data:err});
        }
        session.endSession();
    });

    router.post('/', async (req:Request, res:Response) => {
        console.log("Post calendar received:", req.body);
        if(!req.body || !req.body["owner"]) {
            // Validate req.body
            res.status(400).json({ message: "Invalid request body / 'ownedBy' is required", data: {} });
            return;
        }
        const ownedBy = req.body["owner"];
        if (!isValidObjectId(ownedBy)) {// Validate 'ownedBy'
            res.status(400).json({
                message: "'owner' must be a valid ObjectId.",
                data: {},
            });
            return; // Stops execution of post
        }

        const privacy = req.body["privacy"];
        if(privacy && privacy < 0 || privacy > 2) {
            res.status(400).json({ message: "Invalid privacy option", data: {} });
            return; // Stops execution of post
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Convert 'ownedBy' to ObjectId
            const owner_id = new Types.ObjectId(ownedBy);
            
            // Validate privacy
            var addedCalendar = new Calendar(req.body);
            console.log(addedCalendar);
            const result = await addedCalendar.save( {session} );

            await session.commitTransaction();
            res.status(201).json({ message: "Calendar created successfully", data: result});
        } 
        catch(err) {
            await session.abortTransaction();
            res.status(500).json({ message: "Internal Service Error", data: err });
        }
        session.endSession();
    });
    
    router.get('/:id', async (req: Request, res:Response) => {
        const id = req.params.id;

        // Validate ID
        if (!isValidObjectId(id)) {
            res.status(400).json({ message: "Invalid calendar ID" });
            return; // Stops execution of post
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const calendar = await Calendar.findById(id).session(session);
            if (!calendar) {
                await session.abortTransaction();
                res.status(404).json({ message: "Calendar not found" });
            }
            else{
                await session.commitTransaction();
                res.status(200).json({ message: "Valid response", data: calendar });
            }
        } 
        catch (err) {
            await session.abortTransaction();
            res.status(500).json({ message: "Internal Server Error", data: err });
        }
        session.endSession();
    });

    router.put('/:id', async (req: Request, res: Response) => {
        const id = req.params.id;
        const updates = req.body;

        // Validate ID
        if(!isValidObjectId(id)) {
            res.status(400).json({ message: "Invalid calendar ID", data: {} });
            return;
        }
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let calendar = await Calendar.findById(id).session(session);
            if(!calendar) {
                await session.abortTransaction();
                res.status(404).json({ message: "Calendar not found" });
            }
            else{
                // Update all calendar attributes slated in updates
                Object.keys(updates).forEach((key) => {
                    if(key in calendar && updates[key] !== undefined) {
                        (calendar as any)[key] = updates[key];
                    }
                });

                // save updated calendar
                const updatedCalendar = await calendar.save({ session });
                await session.commitTransaction();
                res.status(200).json({ message: "Calendar updated", data: updatedCalendar });
            }
        } 
        catch (err) {
            await session.abortTransaction();
            res.status(500).json({ message:"Internal server error - FIND / DELETE", data:err });
        }
        session.endSession();
    });

    router.delete('/:id', async (req: Request, res: Response) => {
        const id = req.params["id"];

        // check if ID is valid
        if(!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid calendar ID", data: {} });
            return;
        }
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const result = await Calendar.findByIdAndDelete(id).session(session);
            if (result) {
                await session.commitTransaction();
                res.status(200).json({ message: "Calendar deleted", data: result });
            }
            else {
                await session.abortTransaction();
                res.status(404).json({ message: "Calendar not found", data:{} });
            }
        } catch (err) {
            await session.abortTransaction();
            res.status(500).json({ message:"Internal server error - FIND / DELETE", data:err });
        }
        session.endSession();
    });

    return router;
};

export default calendarsRouter;
