import { Router, Request, Response } from 'express';
import User from "../models/user";
import mongoose, { isValidObjectId, mongo } from 'mongoose';

const usersRouter = (router:Router) => {
    router.get('/', async (req: Request, res: Response) =>{
        const session = await mongoose.startSession();
        session.startTransaction();
        try{
            const query = User.find({}).session(session);
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

    router.post('/', async (req: Request, res: Response): Promise<void> => {
        const session = await mongoose.startSession();
        session.startTransaction();

        const { username, password, email, bio, age, gender, location } = req.body;
    
        // Validate username, password, and email
        if (!username || !password || !email) {
            res.status(400).json({ message: "Username, password, and email are required", data: {} });
            await session.abortTransaction();
            session.endSession();
            return;
        }
        try {
            // Check for duplicates
            const existingUser = await User.findOne({ $or: [{ username }, { email }] }).session(session);
            if (existingUser) {
                await session.abortTransaction();
                res.status(400).json({ message: "Username or email already exists", data: existingUser });
                session.endSession();
                return;
            }
    
            // Create new user
            const newUser = new User({
                username,
                password,
                email,
                bio,
                age,
                gender,
                location,
            });
    
            // Save user to database
            const savedUser = await newUser.save({ session });
            await session.commitTransaction();
            res.status(201).json({ message: `User "${username}" created`, data: savedUser });
        } 
        catch (err) {
            await session.abortTransaction();
            res.status(500).json({ message: "Internal Server Error", data: err });
        }

        session.endSession();
    });

    router.get('/:id',async (req: Request, res: Response) => {
        const id = req.params.id; // id is either id or email
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let user;

            // if search by id
            if (mongoose.Types.ObjectId.isValid(id)) {
                user = await User.findById(id).session(session);
            }

            // if search by email
            else if (/\S+@\S+\.\S+/.test(id)) {
                user = await User.findOne({ email: id }).session(session);
            }
            // not a valid searchable id
            else {
                await session.abortTransaction();
                res.status(400).json({ message: "Invalid id or email" });
                session.endSession();
                return; // Stops execution of post
            }

            if (!user) {
                await session.abortTransaction();
                res.status(404).json({ messege: "User not found" });
            }
            else{
                await session.commitTransaction();
                res.status(200).json({ message: "Valid response", data: user });
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
        if (req.body === undefined){
            res.status(400).json({ message: "Missing Request Data", data: {}});
            return;
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let user;
            // if update by id
            if (mongoose.Types.ObjectId.isValid(id)) {
                user = await User.findById(id).session(session);
            }

            // if update by email
            else if (/\S+@\S+\.\S+/.test(id)) {
                user = await User.findOne({ email: id }).session(session);
            }

            else {
                await session.abortTransaction();
                res.status(400).json({ messege: "Invalid id or email", data: {} });
                session.endSession();
                return;
            }

            if(!user) {
                await session.abortTransaction();
                res.status(404).json({ messsage: "User not found", data: {} });
            }
            else{
                // Update all user attributes slated in updates
                Object.keys(updates).forEach((key) => {
                    if(key in user && updates[key] !== undefined) {
                        (user as any)[key] = updates[key];
                    }

                });
                // save updated user
                const updatedUser = await user.save({ session });
                await session.commitTransaction();
                res.status(200).json({ message: "User updated", data: updatedUser });
            }
        } 
        catch (err) {
            await session.abortTransaction();
            res.status(500).json({ message: "Internal Server Error", data: err });
        }
        session.endSession();
    });

    router.delete('/:id', async (req: Request, res: Response) => {
        const id = req.params.id;
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let result;
            // Delete by ID
            if (mongoose.Types.ObjectId.isValid(id)) {
                result = await User.findByIdAndDelete(id).session(session);
            }

            // Delete by email
            else if (/\S+@\S+\.\S+/.test(id)) {
                result = await User.findOneAndDelete({ email: id }).session(session);
            }
            else {
                await session.abortTransaction();
                res.status(400).json({ message: "Invalid id or email", data: {} });
                session.endSession();
                return;
            }

            if (!result) {
                await session.abortTransaction();
                res.status(404).json({ message: "User not found", data:{} });
            }
            else{
                await session.commitTransaction();
                res.status(200).json({ message: "User deleted", data: result });
            }
        } 
        catch (err) {
            await session.abortTransaction();
            res.status(500).json({ message:"Internal server error - FIND / DELETE", data:err });
        }
        session.endSession();
    });

    return router;
};

export default usersRouter;
