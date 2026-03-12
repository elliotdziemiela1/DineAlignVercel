/*
 * Connect all of your endpoints together here.
 */
import { Application, Router } from 'express';
import usersRouter from './users'; // Import the users router
import calendarsRouter from './calendars'; // Import the calendars router

module.exports = function (app: Application) {
    // Create separate router instances
    const userRouter = Router();
    const calendarRouter = Router();

    // Mount the routers on distinct API paths
    app.use('/api/users', usersRouter(userRouter));
    app.use('/api/calendars', calendarsRouter(calendarRouter));
};