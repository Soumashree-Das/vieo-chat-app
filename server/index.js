import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import bodyParser from 'body-parser';

const app = express();
// const httpServer = createServer(app);
const io = new Server({
    cors: {
        origin: "*",
        methods: ["POST", "GET"]
    }
});

app.use(bodyParser.json());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", socket => {
    console.log("New client connected:", socket.id);

    socket.on("join-room", (data) => {
        const { roomId, emailId } = data;
        console.log("User", emailId, "joined room:", roomId);

        emailToSocketMapping.set(emailId, socket.id);
        socketToEmailMapping.set(socket.id, emailId);

        socket.join(roomId);
        socket.emit("joined-room", { roomId })
        socket.broadcast.to(roomId).emit("user-joined", { emailId })
    });

    socket.on('call-user', async (data) => {
        console.log("call-user event received:", data); // Debugging
        const { emailId, offer } = data;

        if (!emailId) {
            console.error("Email ID is undefined in call-user event");
            return;
        } else {
            console.log(`emailId found as ${emailId}`)
        }

        const socketId = await emailToSocketMapping.get(emailId);
        const fromEmail = await socketToEmailMapping.get(socket.id);


        console.log("emailToSocketMapping:", Array.from(emailToSocketMapping.entries())); // Debugging
        console.log("socketToEmailMapping:", Array.from(socketToEmailMapping.entries()));

        if (socketId) {
            socket.broadcast.to(socketId).emit('incoming-call', { fromEmail, offer });

            console.log(`Incoming call sent to socket: ${socketId}`);
        } else {
            console.error("No socket found for email:", emailId);
        }
    });

    socket.on('call-accepted', async (data) => {
        console.log("call-accepted event received:", data); // Debugging
        const { emailId, ans } = data;
        const socketId = await emailToSocketMapping.get(emailId);

        if (socketId) {
            console.log(`SOcket ${socketId} found for email ${emailId}`)
            socket.to(socketId).emit('call-accepted', { emailId, ans });
        } else {
            console.error("No socket found for email:", emailId);
        }
    });
})


app.listen(8001, console.log(`Server running at http://localhost:8001`));
io.listen(8000);

