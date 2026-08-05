import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

export default function Lobby() {

    const [challenges, setChallenges] = useState([]);
    const [waiting, setWaiting] = useState(false);

    const navigate = useNavigate();
    const username = localStorage.getItem("username") || "Player";

    useEffect(() => {

        // 🔥 REQUEST LOBBY DATA (future API/socket)
        socket.emit("getLobby");

        const onLobbyData = (data) => {
            setChallenges(data || []);
        };

        // 🟢 ROOM CREATED (host)
        const onRoomCreated = (roomId) => {
            setWaiting(false);
            navigate(`/game/${roomId}`);
        };

        // 🟢 JOINED ROOM (guest)
        const onJoinedRoom = ({ roomId }) => {
            navigate(`/game/${roomId}`);
        };

        // 🟡 WAITING STATE
        const onWaiting = () => {
            setWaiting(true);
        };

        // ❌ ERROR HANDLING
        const onError = (msg) => {
            alert(msg || "Something went wrong");
            setWaiting(false);
        };

        // ❌ DISCONNECT SAFETY
        const onDisconnect = () => {
            setWaiting(false);
            navigate("/");
        };

        // 🔥 SOCKET EVENTS
        socket.on("lobbyData", onLobbyData);
        socket.on("roomCreated", onRoomCreated);
        socket.on("joinedRoom", onJoinedRoom);
        socket.on("waiting", onWaiting);
        socket.on("error", onError);
        socket.on("disconnect", onDisconnect);

        return () => {
            socket.off("lobbyData", onLobbyData);
            socket.off("roomCreated", onRoomCreated);
            socket.off("joinedRoom", onJoinedRoom);
            socket.off("waiting", onWaiting);
            socket.off("error", onError);
            socket.off("disconnect", onDisconnect);
        };

    }, [navigate]);

    // 🎮 CREATE MATCH (QUEUE SYSTEM READY)
    const createRoom = (amount) => {

        setWaiting(true);

        socket.emit("joinQueue", {
            username,
            amount
        });

        // backend will match opponent automatically
    };

    // 🎯 JOIN MATCHMAKING (NO FAKE ROOM ID)
    const joinMatch = (amount) => {

        setWaiting(true);

        socket.emit("joinQueue", {
            username,
            amount
        });

    };

    return (
        <div className="page-container" style={{ paddingTop: '80px' }}>

            {/* HEADER */}
            <div className="divider-title">
                Live Matchmaking
            </div>

            {/* WAITING UI */}
            {waiting && (
                <div style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    fontWeight: "600",
                    textAlign: "center"
                }}>
                    ⏳ Searching for opponent...
                </div>
            )}

            {/* ONLINE USERS */}
            <div className="box-card" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <h4>Players Online</h4>
                    <span>{challenges.length} Online</span>
                </div>
            </div>

            {/* CHALLENGES LIST */}
            <div className="challenges-list">

                {challenges.map(ch => (

                    <div className="challenge-card" key={ch.id}>

                        <div className="challenge-header">
                            Challenge from {ch.creatorName}
                        </div>

                        <div className="challenge-body">

                            <div>
                                Entry: ₹{ch.amount}
                            </div>

                            {/* REAL MATCHMAKING JOIN */}
                            <button
                                className="btn-play"
                                onClick={() => joinMatch(ch.amount)}
                                disabled={waiting}
                            >
                                Play
                            </button>

                            <div>
                                Win: ₹{Math.floor(ch.amount * 1.9)}
                            </div>

                        </div>

                    </div>

                ))}

            </div>

            {/* CREATE MATCH */}
            <div className="box-card" style={{ textAlign: 'center' }}>

                <h4>Create Match</h4>

                <button
                    onClick={() => createRoom(100)}
                    disabled={waiting}
                >
                    ₹100 Match
                </button>

                <button
                    onClick={() => createRoom(250)}
                    disabled={waiting}
                    style={{ marginLeft: 10 }}
                >
                    ₹250 Match
                </button>

            </div>

        </div>
    );
}